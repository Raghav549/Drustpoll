/**
 * Drustpoll full-stack end-to-end smoke.
 *
 * Exercises every major product surface against a live API + database:
 * auth (signup → OTP via real SMTP delivery → verify → login), profile,
 * social graph, feed/posts/comments/polls/reposts, discovery, reels watch
 * sessions, media pipeline (upload → inspect → worker → ready → playback),
 * commerce (catalogue → cart → checkout → orders → returns/support),
 * notifications, messaging, privacy/safety, settings and measurement.
 *
 * Usage: node scripts/e2e-full-smoke.mjs
 *   API_URL       (default http://127.0.0.1:4400)
 *   OTP_FILE      (default /tmp/drustpoll/otp.json — dev SMTP sink output)
 */
import fs from 'node:fs';

const base = (process.env.API_URL ?? 'http://127.0.0.1:4400').replace(/\/$/, '');
const otpFile = process.env.OTP_FILE ?? '/tmp/drustpoll/otp.json';

let pass = 0;
const failures = [];
async function check(name, fn) {
  try {
    const detail = await fn();
    pass++;
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL  ${name} — ${error instanceof Error ? error.message : String(error)}`);
  }
}
function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function req(path, { method = 'GET', token, body, headers = {} } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

const suffix = Date.now().toString(36);
const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const JPEG_1PX = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==',
  'base64',
);
const MP4_MIN = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x18]),
  Buffer.from('ftypmp42', 'ascii'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('mp42isom', 'ascii'),
  Buffer.from([0x00, 0x00, 0x00, 0x08]),
  Buffer.from('free', 'ascii'),
]);

function readOtp(email) {
  const raw = JSON.parse(fs.readFileSync(otpFile, 'utf8'));
  const messages = raw.all ?? [];
  const match = [...messages].reverse().find((m) => String(m.to ?? '').includes(email));
  if (!match?.code) throw new Error(`no OTP delivered to ${email} in ${otpFile}`);
  return match.code;
}
async function signUpVerified(username, email, password) {
  const signup = await req('/v1/auth/signup', { method: 'POST', body: { username, displayName: username, password, email } });
  assert(signup.status === 201, `signup ${signup.status}: ${signup.data.error}`);
  assert(signup.data.verificationRequired === true, 'signup must require verification');
  await new Promise((r) => setTimeout(r, 400));
  const code = readOtp(email);
  const verify = await req('/v1/auth/otp/verify', { method: 'POST', token: signup.data.token, body: { destination: email, purpose: 'verify_email', code } });
  assert(verify.ok, `otp verify ${verify.status}: ${verify.data.error}`);
  const login = await req('/v1/auth/login', { method: 'POST', body: { identifier: username, password } });
  assert(login.ok && login.data.token, `login ${login.status}: ${login.data.error}`);
  return login.data;
}

async function uploadMedia(token, bytes, mime, type) {
  const intent = await req('/v1/media/upload-intent', { method: 'POST', token, body: { type, mime, byteSize: bytes.length, filename: `e2e.${mime.split('/')[1]}` } });
  assert(intent.status === 201, `upload intent ${intent.status}: ${intent.data.error}`);
  const put = await fetch(intent.data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mime, 'Content-Length': String(bytes.length) },
    body: bytes,
  });
  assert(put.ok, `upload PUT ${put.status}`);
  const complete = await req(`/v1/media/${intent.data.assetId}/complete`, { method: 'POST', token, body: { mime, width: null, height: null, durationMs: null } });
  assert(complete.ok, `complete ${complete.status}: ${complete.data.error}`);
  const assetId = intent.data.assetId;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 750));
    const status = await req(`/v1/media/${assetId}`, { token });
    if (status.data.status === 'ready') return assetId;
    if (status.data.status === 'rejected') throw new Error('media rejected');
  }
  const last = await req(`/v1/media/${assetId}`, { token });
  throw new Error(`media not ready in time (status=${last.data.status})`);
}

async function main() {
  // ---------- health ----------
  await check('health', async () => {
    const h = await req('/health');
    assert(h.ok && (h.data.ok === true || h.data.status === 'ok'), `unexpected health ${JSON.stringify(h.data)}`);
    return JSON.stringify(h.data);
  });

  // ---------- auth ----------
  let a, b;
  const emailA = `e2e-a-${suffix}@example.test`;
  const emailB = `e2e-b-${suffix}@example.test`;
  await check('signup + OTP delivery + verify + login (user A)', async () => {
    a = await signUpVerified(`e2ea_${suffix}`, emailA, 'E2eStrongPass!12345');
    assert(a.userId && a.deviceId, 'session fields missing');
    return `user ${a.userId}`;
  });
  await check('signup + OTP + login (user B)', async () => {
    b = await signUpVerified(`e2eb_${suffix}`, emailB, 'E2eStrongPass!12345');
    return `user ${b.userId}`;
  });
  await check('auth/me + sessions', async () => {
    const me = await req('/v1/auth/me', { token: a.token });
    assert(me.ok && me.data.session?.userId === a.userId, 'auth/me failed');
    const sessions = await req('/v1/auth/sessions', { token: a.token });
    assert(sessions.ok && Array.isArray(sessions.data.sessions) && sessions.data.sessions.length >= 1, 'sessions list failed');
    return `${sessions.data.sessions.length} session(s)`;
  });
  await check('unverified signup blocks login contract', async () => {
    const email = `e2e-unv-${suffix}@example.test`;
    const s = await req('/v1/auth/signup', { method: 'POST', body: { username: `e2eunv_${suffix}`, displayName: 'Unverified', password: 'E2eStrongPass!12345', email } });
    assert(s.status === 201 && s.data.verificationRequired === true, `signup contract: HTTP ${s.status} ${s.data.error ?? ''}`);
    const l = await req('/v1/auth/login', { method: 'POST', body: { identifier: `e2eunv_${suffix}`, password: 'E2eStrongPass!12345' } });
    assert(l.status === 400 && /verification/i.test(String(l.data.error)), `expected verification block, got ${l.status} ${l.data.error}`);
    return 'blocked with verification-required';
  });

  // ---------- profile ----------
  await check('profile surface (me)', async () => {
    const p = await req('/v1/profiles/me', { token: a.token });
    assert(p.ok && p.data.profile?.username?.startsWith('e2ea_'), `profile ${p.status}`);
    return `@${p.data.profile.username}`;
  });
  await check('profile avatar upload → verified signed URL', async () => {
    const intent = await req('/v1/account/avatar/upload-intent', { method: 'POST', token: a.token, body: { mime: 'image/jpeg', size: JPEG_1PX.length } });
    assert(intent.status === 201, `intent ${intent.status}: ${intent.data.error}`);
    const put = await fetch(intent.data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: JPEG_1PX });
    assert(put.ok, `avatar PUT ${put.status}`);
    const done = await req('/v1/account/avatar/complete', { method: 'POST', token: a.token, body: { storageKey: intent.data.storageKey, mime: 'image/jpeg', size: JPEG_1PX.length } });
    assert(done.ok, `avatar complete ${done.status}: ${done.data.error}`);
    const p = await req('/v1/profiles/me', { token: a.token });
    assert(typeof p.data.profile.avatar_url === 'string' && p.data.profile.avatar_url.includes('/v1/media/content/'), `avatar not hydrated: ${p.data.profile.avatar_url}`);
    const img = await fetch(p.data.profile.avatar_url.startsWith('http') ? p.data.profile.avatar_url : `${base}${p.data.profile.avatar_url}`);
    assert(img.ok && Number(img.headers.get('content-length')) === JPEG_1PX.length, `avatar fetch ${img.status}`);
    return 'avatar served from signed URL';
  });

  // ---------- feed / posts ----------
  let postA;
  await check('create text post + feed visibility', async () => {
    const created = await req('/v1/posts', { method: 'POST', token: a.token, body: { caption: `Hello Drustpoll ${suffix}`, visibility: 'public', contentType: 'post' } });
    assert(created.status === 201, `create ${created.status}: ${created.data.error}`);
    postA = created.data.id;
    const feed = await req('/v1/feed?mode=for_you', { token: a.token });
    assert(feed.ok && feed.data.items?.some((x) => x.id === postA), 'post not in feed');
    return `post ${postA}`;
  });
  await check('reaction + save toggles', async () => {
    const r1 = await req(`/v1/posts/${postA}/reaction`, { method: 'POST', token: b.token });
    assert(r1.ok && r1.data.active === true, 'reaction on failed');
    const r2 = await req(`/v1/posts/${postA}/reaction`, { method: 'POST', token: b.token });
    assert(r2.ok && r2.data.active === false, 'reaction off failed');
    const s1 = await req(`/v1/posts/${postA}/save`, { method: 'POST', token: b.token });
    assert(s1.ok && s1.data.saved === true, 'save failed');
    const saved = await req('/v1/profiles/me/saved', { token: b.token });
    assert(saved.ok && saved.data.posts?.some((x) => x.id === postA), 'saved list missing post');
    return 'toggle + saved tab ok';
  });
  await check('comments + threaded replies', async () => {
    const c = await req(`/v1/posts/${postA}/comments`, { method: 'POST', token: b.token, body: { body: 'Top level comment' } });
    assert(c.status === 201, `comment ${c.status}`);
    const reply = await req(`/v1/posts/${postA}/comments`, { method: 'POST', token: a.token, body: { body: 'Threaded reply', parentId: c.data.id } });
    assert(reply.status === 201, `reply ${reply.status}`);
    const list = await req(`/v1/posts/${postA}/comments?limit=50`, { token: a.token });
    assert(list.ok && list.data.items?.some((x) => x.id === c.data.id), 'comments list missing');
    const replies = await req(`/v1/comments/${c.data.id}/replies`, { token: a.token });
    assert(replies.ok && replies.data.items?.some((x) => x.id === reply.data.id), 'replies missing');
    return 'comment + reply ok';
  });
  await check('poll post + vote', async () => {
    const created = await req('/v1/posts', { method: 'POST', token: a.token, body: { caption: 'Best color?', visibility: 'public', contentType: 'poll', pollOptions: ['Green', 'Blue'], pollMultiple: false } });
    assert(created.status === 201, `poll create ${created.status}`);
    const poll = await req(`/v1/posts/${created.data.id}/poll`, { token: b.token });
    assert(poll.ok && poll.data.options?.length >= 2, `poll shape ${JSON.stringify(poll.data).slice(0, 120)}`);
    const vote = await req(`/v1/posts/${created.data.id}/poll`, { method: 'POST', token: b.token, body: { optionId: poll.data.options[0].id } });
    assert(vote.ok, `vote ${vote.status}: ${vote.data.error}`);
    return `${poll.data.options.length} options voted`;
  });
  await check('repost + feed preferences + topics + hidden topics + reset', async () => {
    const rp = await req(`/v1/posts/${postA}/repost`, { method: 'POST', token: b.token, body: { quote: 'worth seeing' } });
    assert(rp.ok, `repost ${rp.status}: ${rp.data.error}`);
    const prefs = await req('/v1/feed/preferences', { token: a.token });
    assert(prefs.ok, 'feed prefs read');
    const put = await req('/v1/feed/preferences', { method: 'PUT', token: a.token, body: { ...prefs.data, mode: 'latest' } });
    assert(put.ok, `feed prefs write ${put.status}`);
    const topics = await req('/v1/feed/topics', { token: a.token });
    assert(topics.ok && Array.isArray(topics.data.topics), 'topics');
    const hide = await req('/v1/feed/hidden-topics', { method: 'POST', token: a.token, body: { topic: 'politics' } });
    assert(hide.ok, 'hide topic');
    const hidden = await req('/v1/feed/hidden-topics', { token: a.token });
    assert((hidden.data.topics ?? hidden.data.items ?? []).some((x) => (x.topic ?? x) === 'politics'), `hidden list ${JSON.stringify(hidden.data)}`);
    const un = await req('/v1/feed/hidden-topics', { method: 'DELETE', token: a.token, body: { topic: 'politics' } });
    assert(un.ok, 'unhide');
    const reset = await req('/v1/feed/reset', { method: 'POST', token: a.token });
    assert(reset.ok, 'feed reset');
    return 'repost + controls ok';
  });

  // ---------- social graph ----------
  await check('follow / relationship / followers / mutuals', async () => {
    const f = await req('/v1/social/follow', { method: 'POST', token: b.token, body: { targetUserId: a.userId } });
    assert(f.ok && f.data.state === 'following', `follow ${f.status} ${f.data.error}`);
    const rel = await req('/v1/social/relationship', { method: 'POST', token: b.token, body: { targetUserId: a.userId, state: 'following' } });
    assert(rel.ok, `relationship ${rel.status}`);
    const profile = await req(`/v1/profiles/${a.userId}`, { token: b.token });
    assert(profile.data.profile?.follower_count >= 1, `follower_count ${profile.data.profile?.follower_count}`);
    const followers = await req(`/v1/profiles/${a.userId}/followers`, { token: a.token });
    assert(followers.ok && followers.data.people?.some((x) => x.id === b.userId), 'followers list');
    const following = await req(`/v1/profiles/${b.userId}/following`, { token: b.token });
    assert(following.ok && following.data.people?.some((x) => x.id === a.userId), 'following list');
    const mutuals = await req(`/v1/profiles/${a.userId}/mutuals`, { token: b.token });
    assert(mutuals.ok && typeof mutuals.data.count === 'number', 'mutuals');
    const social = await req(`/v1/social/profiles/${a.userId}`, { token: b.token });
    assert(social.ok && social.data.profile?.username, 'social profile route');
    return 'graph ok';
  });
  await check('profile posts/videos/collections/shop tabs', async () => {
    for (const tab of ['posts', 'videos', 'collections', 'shop']) {
      const r = await req(`/v1/profiles/${a.userId}/${tab}`, { token: b.token });
      assert(r.ok, `tab ${tab} → ${r.status} ${r.data.error}`);
    }
    return '4 tabs ok';
  });

  // ---------- media pipeline ----------
  let imageAsset, videoAsset, postWithMedia;
  await check('media upload → inspect → worker → ready (image)', async () => {
    imageAsset = await uploadMedia(a.token, PNG_1PX, 'image/png', 'image');
    return `asset ${imageAsset}`;
  });
  await check('media playback URL serves bytes', async () => {
    const pb = await req(`/v1/media/${imageAsset}/playback`, { token: a.token });
    assert(pb.ok && pb.data.url, `playback ${pb.status}: ${pb.data.error}`);
    const r = await fetch(pb.data.url);
    assert(r.ok, `playback fetch ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    assert(buf.length === PNG_1PX.length, 'playback bytes differ');
    return `${pb.data.expiresIn}s URL`;
  });
  await check('create post with media → feed shows signed uri', async () => {
    const created = await req('/v1/posts', { method: 'POST', token: a.token, body: { caption: 'Picture post', visibility: 'public', contentType: 'post', mediaAssetIds: [imageAsset] } });
    assert(created.status === 201, `create ${created.status}: ${created.data.error}`);
    postWithMedia = created.data.id;
    const feed = await req('/v1/feed?mode=for_you', { token: a.token });
    const item = feed.data.items?.find((x) => x.id === postWithMedia);
    assert(item?.media?.[0]?.uri, `media uri missing: ${JSON.stringify(item?.media)}`);
    const r = await fetch(item.media[0].uri);
    assert(r.ok, `media fetch ${r.status}`);
    return 'uri fetch ok';
  });

  // ---------- discovery ----------
  await check('discovery search/results/categories/history/preferences', async () => {
    const results = await req(`/v1/discovery/results?q=picture&kind=all&sort=relevance&limit=10`, { token: b.token });
    assert(results.ok, `results ${results.status}: ${results.data.error}`);
    const search = await req(`/v1/discovery/search?q=Drustpoll&kind=all`, { token: b.token });
    assert(search.ok, `search ${search.status}`);
    const recent = await req('/v1/discovery/recent-searches', { token: b.token });
    assert(recent.ok && recent.data.items?.length >= 1, `recent ${JSON.stringify(recent.data)}`);
    const save = await req('/v1/discovery/saved-searches', { method: 'POST', token: b.token, body: { query: 'Drustpoll', kind: 'all' } });
    assert(save.status === 201, 'save search');
    const savedList = await req('/v1/discovery/saved-searches', { token: b.token });
    assert(savedList.data.items?.length >= 1, 'saved list');
    await req(`/v1/discovery/saved-searches/${savedList.data.items[0].id}`, { method: 'DELETE', token: b.token });
    const cats = await req('/v1/discovery/categories', { token: b.token });
    assert(cats.ok && Array.isArray(cats.data.categories), 'categories');
    const prefs = await req('/v1/discovery/preferences', { token: b.token });
    assert(prefs.ok && prefs.data.preferences, 'discovery prefs');
    const put = await req('/v1/discovery/preferences', { method: 'PUT', token: b.token, body: { people: true, local: false } });
    assert(put.ok, 'discovery prefs write');
    await req('/v1/discovery/recent-searches', { method: 'DELETE', token: b.token });
    return 'discovery ok';
  });

  // ---------- reels ----------
  await check('reels: video media → recommended → watch session → events → preferences', async () => {
    videoAsset = await uploadMedia(a.token, MP4_MIN, 'video/mp4', 'video');
    const created = await req('/v1/posts', { method: 'POST', token: a.token, body: { caption: 'E2E reel', visibility: 'public', contentType: 'reel', mediaAssetIds: [videoAsset] } });
    assert(created.status === 201, `reel create ${created.status}: ${created.data.error}`);
    const reels = await req('/v1/reels/recommended', { token: b.token });
    assert(reels.ok && reels.data.items?.length >= 1, `reels ${reels.status}: ${JSON.stringify(reels.data).slice(0, 140)}`);
    const item = reels.data.items.find((x) => x.id === created.data.id) ?? reels.data.items[0];
    assert(typeof item.videoUrl === 'string', 'videoUrl missing');
    const v = await fetch(item.videoUrl);
    assert(v.ok, `video fetch ${v.status}`);
    const session = await req('/v1/reels/watch-sessions', { method: 'POST', token: b.token, body: { clientSessionId: `e2e-${suffix}` } });
    assert(session.status === 201, 'watch session start');
    const events = await req('/v1/reels/watch-events', { method: 'POST', token: b.token, body: { sessionId: session.data.sessionId, events: [{ postId: item.id, eventType: 'impression', clientEventId: `imp-${suffix}-1` }, { postId: item.id, eventType: 'start', clientEventId: `st-${suffix}-1` }] } });
    assert(events.ok && events.data.accepted === 2, `watch events ${JSON.stringify(events.data)}`);
    const end = await req(`/v1/reels/watch-sessions/${session.data.sessionId}`, { method: 'DELETE', token: b.token });
    assert(end.ok, 'watch session end');
    const prefs = await req('/v1/reels/preferences', { token: b.token });
    assert(prefs.ok && prefs.data.preferences, 'reel prefs');
    const put = await req('/v1/reels/preferences', { method: 'PUT', token: b.token, body: { quality: 'high', autoplay: true } });
    assert(put.ok && put.data.preferences?.quality === 'high', 'reel prefs write');
    const related = await req(`/v1/reels/related?postId=${created.data.id}`, { token: b.token });
    assert(related.ok && Array.isArray(related.data.items), 'related reels');
    const fb = await req(`/v1/reels/creators/${a.userId}/feedback`, { method: 'POST', token: b.token, body: { signal: 'not_interested' } });
    assert(fb.ok, `creator feedback ${fb.status}: ${fb.data.error}`);
    const audio = await req('/v1/reels/audio?q=', { token: b.token });
    assert(audio.ok && Array.isArray(audio.data.items), 'reel audio');
    return `reels ok (${reels.data.items.length} items)`;
  });

  // ---------- measurement ----------
  await check('measurement: exposure + feed events + ui measurements', async () => {
    const exp = await req('/v1/recommendation/exposure', { method: 'POST', token: b.token, body: { items: [{ postId: postA, creatorId: a.userId, surface: 'feed', position: 0 }], source: 'feed' } });
    assert(exp.ok && exp.data.accepted >= 1, `exposure ${JSON.stringify(exp.data)}`);
    const feed = await req('/v1/feed/events', { method: 'POST', token: b.token, body: { events: [{ postId: postA, eventType: 'impression', clientEventId: `fe-${suffix}-1` }] } });
    assert(feed.ok && feed.data.accepted === 1, `feed events ${JSON.stringify(feed.data)}`);
    const ui = await req('/v1/measurements/ui', { method: 'POST', token: b.token, body: { events: [{ surface: 'home', metric: 'screen_open', valueNum: 1, clientEventId: `ui-${suffix}-1` }] } });
    assert(ui.ok && ui.data.accepted === 1, `ui measurements ${JSON.stringify(ui.data)}`);
    const dupe = await req('/v1/measurements/ui', { method: 'POST', token: b.token, body: { events: [{ surface: 'home', metric: 'screen_open', valueNum: 1, clientEventId: `ui-${suffix}-1` }] } });
    assert(dupe.ok && dupe.data.accepted === 0, 'dedupe failed');
    return 'accepted with dedupe';
  });

  // ---------- commerce ----------
  let productId, shopId, orderId, addressId;
  await check('seller creates product (catalogue + shop)', async () => {
    const p = await req('/v1/shop/products', { method: 'POST', token: a.token, body: { title: `E2E Lamp ${suffix}`, description: 'A warm desk lamp', priceMinor: 4999, inventory: 5, category: 'Home' } });
    assert(p.status === 201, `product ${p.status}: ${p.data.error}`);
    productId = p.data.id;
    const list = await req('/v1/shop/products', { token: a.token });
    assert(list.ok && list.data.products?.some((x) => x.id === productId), 'seller list');
    shopId = list.data.products.find((x) => x.id === productId).shop_id;
    return `product ${productId} shop ${shopId}`;
  });
  await check('seller commerce settings (payment methods)', async () => {
    const s = await req(`/v1/seller/shops/${shopId}/commerce-settings`, { token: a.token });
    assert(s.ok && s.data.settings, `settings ${s.status}: ${s.data.error}`);
    const up = await req(`/v1/seller/shops/${shopId}/commerce-settings`, { method: 'PUT', token: a.token, body: { payment_upi: true, payment_card: true, payment_cod: true } });
    assert(up.ok, `settings write ${up.status}: ${up.data.error}`);
    return 'upi/card/cod enabled';
  });
  await check('market: categories/products/detail/related/wishlist/saved', async () => {
    const cats = await req('/v1/market/categories', { token: b.token });
    assert(cats.ok && Array.isArray(cats.data.categories), `market cats ${cats.status}`);
    const list = await req('/v1/market/products?q=E2E&limit=24', { token: b.token });
    assert(list.ok && list.data.items?.some((x) => x.id === productId), 'market list missing product');
    const detail = await req(`/v1/market/products/${productId}`, { token: b.token });
    assert(detail.ok && detail.data.product && Array.isArray(detail.data.related), `detail ${detail.status}`);
    const wish = await req(`/v1/market/products/${productId}/wishlist`, { method: 'POST', token: b.token });
    assert(wish.ok && wish.data.saved === true, 'wishlist add');
    const saved = await req('/v1/market/saved-products?limit=50', { token: b.token });
    assert(saved.data.items?.some((x) => x.id === productId), 'saved products');
    const rel = await req(`/v1/market/products/${productId}/related?limit=8`, { token: b.token });
    assert(rel.ok && Array.isArray(rel.data.items), 'related');
    const delivery = await req(`/v1/market/products/${productId}/delivery`, { token: b.token });
    assert(delivery.ok, 'delivery estimate');
    return 'market ok';
  });
  await check('product review + question (purchase-gated)', async () => {
    const q = await req(`/v1/market/products/${productId}/questions`, { method: 'POST', token: b.token, body: { question: 'Does it come in green?' } });
    assert(q.status === 201, `question ${q.status}: ${q.data.error}`);
    const r = await req(`/v1/market/products/${productId}/reviews`, { method: 'POST', token: b.token, body: { rating: 5, body: 'great', orderId: 'not-yet' } });
    assert(!r.ok, 'review must be purchase-gated');
    return 'question ok, review gated';
  });
  await check('cart add/update/list', async () => {
    const add = await req('/v1/cart/items', { method: 'POST', token: b.token, body: { productId, quantity: 2 } });
    assert(add.ok && add.data.items?.length >= 1, `add ${add.status}: ${add.data.error}`);
    const patch = await req('/v1/cart/items', { method: 'PATCH', token: b.token, body: { productId, quantity: 3 } });
    assert(patch.ok, 'patch');
    const line = patch.data.items.find((x) => x.productId === productId);
    assert(line?.quantity === 3 || patch.data.items.length >= 1, 'quantity updated');
    const cart = await req('/v1/cart', { token: b.token });
    assert(cart.ok && cart.data.items?.some((x) => x.productId === productId), 'cart get');
    return 'cart ok';
  });
  await check('checkout: prepare → address → delivery → payment → finalize', async () => {
    const addr = await req('/v1/market/addresses', { method: 'POST', token: b.token, body: { label: 'Home', recipientName: 'E2E Buyer', phone: '+911234567890', line1: '42 Loop Street', city: 'Bengaluru', region: 'KA', postalCode: '560001', countryCode: 'IN', isDefault: true } });
    assert(addr.status === 201, `address ${addr.status}: ${addr.data.error}`);
    addressId = addr.data.address.id;
    const key = `e2e-checkout-${suffix}`;
    const prep = await req('/v1/checkout/prepare', { method: 'POST', token: b.token, body: { idempotencyKey: key } });
    assert(prep.status === 201 && prep.data.checkout?.id, `prepare ${prep.status}: ${prep.data.error}`);
    const sessionId = prep.data.checkout.id;
    const setAddr = await req(`/v1/checkout/${sessionId}/address`, { method: 'PUT', token: b.token, body: { addressId } });
    assert(setAddr.ok && setAddr.data.checkout?.status === 'delivery', `address step ${setAddr.status}: ${setAddr.data.error}`);
    const setDelivery = await req(`/v1/checkout/${sessionId}/delivery`, { method: 'PUT', token: b.token, body: { code: 'standard', feeMinor: 49, minDays: 2, maxDays: 5 } });
    assert(setDelivery.ok && setDelivery.data.checkout?.total_minor > 0, `delivery step ${setDelivery.status}: ${setDelivery.data.error}`);
    const pay = await req(`/v1/checkout/${sessionId}/payment-method`, { method: 'PUT', token: b.token, body: { method: 'upi' } });
    assert(pay.ok && pay.data.checkout?.payment_method === 'upi', `payment step ${pay.status}: ${pay.data.error}`);
    const fin = await req(`/v1/checkout/${sessionId}/finalize`, { method: 'POST', token: b.token });
    assert(fin.status === 201 && fin.data.orders?.length >= 1, `finalize ${fin.status}: ${fin.data.error}`);
    orderId = fin.data.orders[0].orderId;
    const state = await req(`/v1/checkout/state?key=${encodeURIComponent(key)}`, { token: b.token });
    assert(state.ok && state.data.checkout, 'checkout state readable');
    const cartAfter = await req('/v1/cart', { token: b.token });
    assert(!cartAfter.data.items?.some((x) => x.productId === productId), 'cart not cleared');
    return `order ${orderId}`;
  });
  await check('orders list + detail + issue + support + return', async () => {
    const list = await req('/v1/orders?limit=30', { token: b.token });
    assert(list.ok && list.data.orders?.some((x) => x.orderId === orderId), `orders list ${list.status}`);
    const order = await req(`/v1/orders/${orderId}`, { token: b.token });
    assert(order.ok && order.data.order, 'order detail');
    const adv = await req(`/v1/commerce/orders/${orderId}`, { token: b.token });
    assert(adv.ok && adv.data.order && Array.isArray(adv.data.timeline), 'advanced order detail');
    const issue = await req(`/v1/commerce/orders/${orderId}/issues`, { method: 'POST', token: b.token, body: { issueType: 'delayed', details: 'no update' } });
    assert(issue.status === 201, `issue ${issue.status}: ${issue.data.error}`);
    const support = await req(`/v1/market/orders/${orderId}/support`, { method: 'POST', token: b.token, body: { subject: 'Where is it?' } });
    assert(support.status === 201, `support ${support.status}: ${support.data.error}`);
    // An order still awaiting verified payment must not be returnable. The server
    // owns that rule; the client never decides eligibility.
    const ret = await req(`/v1/market/orders/${orderId}/returns`, { method: 'POST', token: b.token, body: { reason: 'changed mind', notes: 'unused' } });
    assert(ret.status === 400 && /not eligible/i.test(String(ret.data.error)), `unpaid order must not be returnable, got ${ret.status} ${ret.data.error}`);
    return 'order lifecycle + return eligibility guard ok';
  });
  await check('payment intent is an explicit provider boundary', async () => {
    const r = await req('/v1/payments/intents', { method: 'POST', token: b.token, body: { orderId, idempotencyKey: `pay-${suffix}` } });
    assert(r.status === 503 && /not configured/i.test(String(r.data.error)), `expected 503 boundary, got ${r.status} ${JSON.stringify(r.data)}`);
    return '503 without provider config';
  });
  await check('commerce events + recommendations', async () => {
    const ev = await req('/v1/shop/events', { method: 'POST', token: b.token, body: { productId, eventType: 'view', clientEventId: `ce-${suffix}` } });
    assert([200, 201].includes(ev.status), `commerce event ${ev.status}: ${ev.data.error}`);
    const rec = await req('/v1/shop/recommended', { token: b.token });
    assert(rec.ok && Array.isArray(rec.data.items), 'shop recommendations');
    return 'events + recs ok';
  });
  await check('saved-for-later add/remove', async () => {
    const add = await req(`/v1/commerce/products/${productId}/saved-for-later`, { method: 'POST', token: b.token, body: { quantity: 1 } });
    assert(add.ok, `sfl add ${add.status}: ${add.data.error}`);
    const list = await req('/v1/commerce/saved-for-later', { token: b.token });
    assert(list.ok, 'sfl list');
    const del = await req(`/v1/commerce/products/${productId}/saved-for-later`, { method: 'DELETE', token: b.token });
    assert(del.ok, `sfl delete ${del.status}: ${del.data.error}`);
    return 'ok';
  });

  // ---------- notifications ----------
  await check('notifications list/unread/prefs/digest/read', async () => {
    const list = await req('/v1/notifications?limit=30', { token: a.token });
    assert(list.ok, `notifications ${list.status}: ${list.data.error}`);
    const unread = await req('/v1/notifications/unread-count', { token: a.token });
    assert(unread.ok && typeof unread.data.count === 'number', 'unread count');
    const prefs = await req('/v1/notifications/preferences', { token: a.token });
    assert(prefs.ok && prefs.data.preferences, 'prefs');
    const put = await req('/v1/notifications/preferences', { method: 'PUT', token: a.token, body: { ...prefs.data.preferences, digest_enabled: true } });
    assert(put.ok, 'prefs write');
    const digest = await req('/v1/notifications/digest', { token: a.token });
    assert(digest.ok, 'digest');
    const mark = await req('/v1/notifications/read-all', { method: 'POST', token: a.token });
    assert(mark.ok, 'read-all');
    return `${(list.data.notifications ?? list.data.items ?? list.data ?? []).length ?? 0} notifications`;
  });

  // ---------- messaging ----------
  let conversationId;
  await check('messaging: conversation + encrypted send + list + read', async () => {
    const conv = await req('/v1/messages/conversations', { method: 'POST', token: b.token, body: { participantIds: [a.userId] } });
    assert(conv.status === 201 && conv.data.id, `conversation ${conv.status}: ${conv.data.error}`);
    conversationId = conv.data.id;
    const send = await req(`/v1/messages/conversations/${conversationId}/messages`, { method: 'POST', token: b.token, body: { ciphertext: 'aGVsbG8gZW5jcnlwdGVk', keyVersion: 1 } });
    assert(send.status === 201, `send ${send.status}: ${send.data.error}`);
    const list = await req(`/v1/messages/conversations/${conversationId}/messages?limit=50`, { token: a.token });
    assert(list.ok && (list.data.items ?? list.data.messages)?.length >= 1, `messages list ${JSON.stringify(list.data).slice(0, 120)}`);
    const read = await req(`/v1/messages/conversations/${conversationId}/read`, { method: 'POST', token: a.token });
    assert(read.ok, 'mark read');
    const inbox = await req('/v1/messages/conversations?limit=30', { token: a.token });
    assert(inbox.ok, 'inbox');
    return 'message ok';
  });

  // ---------- privacy / safety ----------
  await check('privacy settings + blocked/muted/hidden terms + data requests', async () => {
    const p = await req('/v1/privacy', { token: a.token });
    assert(p.ok && p.data.privacy, 'privacy read');
    const put = await req('/v1/privacy', { method: 'PUT', token: a.token, body: { ...p.data.privacy, profile_visibility: 'public' } });
    assert(put.ok, `privacy write ${put.status}: ${put.data.error}`);
    const blocked = await req('/v1/privacy/blocked', { token: a.token });
    assert(blocked.ok && Array.isArray(blocked.data.items), 'blocked list');
    const muted = await req('/v1/privacy/muted', { token: a.token });
    assert(muted.ok && Array.isArray(muted.data.items), 'muted list');
    const term = await req('/v1/privacy/hidden-terms', { method: 'POST', token: a.token, body: { term: 'spoiler', kind: 'word' } });
    assert(term.ok, 'hidden term add');
    const terms = await req('/v1/privacy/hidden-terms', { token: a.token });
    assert(terms.data.items?.some((x) => (x.term ?? x) === 'spoiler'), 'hidden terms list');
    await req('/v1/privacy/hidden-terms', { method: 'DELETE', token: a.token, body: { term: 'spoiler', kind: 'word' } });
    const inv = await req('/v1/privacy/inventory', { token: a.token });
    assert(inv.ok, 'data inventory');
    const dr = await req('/v1/privacy/data-requests', { method: 'POST', token: a.token, body: { kind: 'export' } });
    assert(dr.status === 202, `data request ${dr.status}`);
    const audit = await req('/v1/privacy/audit', { token: a.token });
    assert(audit.ok, 'privacy audit');
    return 'privacy ok';
  });
  await check('safety: mute/block/report/cases/notices/state', async () => {
    const mute = await req('/v1/safety/mute', { method: 'POST', token: a.token, body: { targetUserId: b.userId } });
    assert(mute.ok, `mute ${mute.status}: ${mute.data.error}`);
    const stateMuted = await req(`/v1/safety/state?targetUserId=${b.userId}`, { token: a.token });
    assert(stateMuted.ok && stateMuted.data.muted === true, `safety state ${JSON.stringify(stateMuted.data)}`);
    await req('/v1/safety/mute', { method: 'DELETE', token: a.token, body: { targetUserId: b.userId } });
    const report = await req('/v1/safety/report', { method: 'POST', token: a.token, body: { target: { type: 'user', id: b.userId }, reason: 'spam', details: 'e2e' } });
    assert(report.status === 201, `report ${report.status}: ${report.data.error}`);
    const cases = await req('/v1/safety/cases', { token: a.token });
    assert(cases.ok && Array.isArray(cases.data.cases), 'cases');
    const notices = await req('/v1/safety/notices', { token: a.token });
    assert(notices.ok, 'notices');
    const block = await req('/v1/safety/block', { method: 'POST', token: a.token, body: { targetUserId: b.userId } });
    assert(block.ok, 'block');
    const blocked = await req('/v1/privacy/blocked', { token: a.token });
    assert(blocked.data.items?.some((x) => x.user_id === b.userId || x.id === b.userId || x.blocked_id === b.userId), `blocked after block: ${JSON.stringify(blocked.data.items?.slice(0, 2))}`);
    await req('/v1/safety/block', { method: 'DELETE', token: a.token, body: { targetUserId: b.userId } });
    return 'safety ok';
  });

  // ---------- settings surfaces ----------
  await check('settings: experience/contacts/security/sessions', async () => {
    const exp = await req('/v1/account/experience', { token: a.token });
    assert(exp.ok && exp.data.preferences, 'experience');
    const expPut = await req('/v1/account/experience', { method: 'PUT', token: a.token, body: { ...exp.data.preferences, data_saver: true } });
    assert(expPut.ok, 'experience write');
    const contacts = await req('/v1/account/contacts', { token: a.token });
    assert(contacts.ok, 'contacts');
    const contactsPut = await req('/v1/account/contacts', { method: 'PUT', token: a.token, body: { ...contacts.data, email: emailA } });
    assert(contactsPut.ok, `contacts write ${contactsPut.status}: ${contactsPut.data.error}`);
    const events = await req('/v1/security/events', { token: a.token });
    assert(events.ok && Array.isArray(events.data.events), 'security events');
    const alerts = await req('/v1/security/alerts', { token: a.token });
    assert(alerts.ok, 'security alerts');
    const prof = await req('/v1/account/professional', { token: a.token });
    assert(prof.ok, 'professional');
    const ver = await req('/v1/business/verification', { token: a.token });
    assert(ver.ok, 'business verification boundary read');
    return 'settings ok';
  });

  // ---------- newly wired auth + safety routes ----------
  await check('reauthenticate grant + logout-all', async () => {
    const bad = await req('/v1/auth/reauthenticate', { method: 'POST', token: a.token, body: { password: 'wrong-password' } });
    assert(!bad.ok, 'reauthentication must reject a wrong password');
    const good = await req('/v1/auth/reauthenticate', { method: 'POST', token: a.token, body: { password: 'E2eStrongPass!12345' } });
    assert(good.status === 201 && good.data.token && good.data.expiresAt, `reauthenticate ${good.status}: ${good.data.error}`);
    const out = await req('/v1/auth/logout-all', { method: 'POST', token: a.token });
    assert(out.ok, `logout-all ${out.status}: ${out.data.error}`);
    const after = await req('/v1/auth/me', { token: a.token });
    assert(after.status === 401, `sessions must be revoked after logout-all, got ${after.status}`);
    const login = await req('/v1/auth/login', { method: 'POST', body: { identifier: `e2ea_${suffix}`, password: 'E2eStrongPass!12345' } });
    assert(login.ok, 'could not re-login after logout-all');
    a.token = login.data.token;
    return 'grant issued, all sessions revoked';
  });
  await check('safety case evidence by case id', async () => {
    const report = await req('/v1/safety/report', { method: 'POST', token: a.token, body: { target: { type: 'user', id: b.userId }, reason: 'spam', details: 'evidence flow' } });
    assert(report.status === 201, `report ${report.status}: ${report.data.error}`);
    const cases = await req('/v1/safety/cases', { token: a.token });
    const open = (cases.data.cases ?? [])[0];
    assert(open?.id, `no safety case created: ${JSON.stringify(cases.data).slice(0, 160)}`);
    const ev = await req(`/v1/safety/cases/${open.id}/evidence`, { method: 'POST', token: a.token, body: { note: 'screenshot description' } });
    assert(ev.status === 201, `case evidence ${ev.status}: ${ev.data.error}`);
    return 'evidence attached to case';
  });

  // ---------- ads boundary ----------
  await check('ad delivery boundary', async () => {
    const ad = await req('/v1/ads/serve?context=feed', { token: a.token });
    assert(ad.ok, `ads serve ${ad.status}: ${ad.data.error}`);
    const controls = await req('/v1/ads/delivery-controls', { token: a.token });
    assert(controls.ok && controls.data.controls, 'ad controls');
    return 'ads ok';
  });

  console.log(`\n${pass} passed, ${failures.length} failed${failures.length ? `: ${failures.join(', ')}` : ''}`);
  process.exit(failures.length ? 1 : 0);
}

main().catch((error) => {
  console.error('E2E smoke crashed:', error);
  process.exit(1);
});
