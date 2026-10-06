import type { IncomingMessage } from 'node:http';
import {
  getMutualContext,
  getProfileSurface,
  getCollection,
  listCollections,
  listFollowers,
  listFollowing,
  listProfilePosts,
  listProfileVideos,
  listTaggedPosts,
  listSavedPosts,
  getShopSummary,
} from './profile-surface-service.js';
import { getProfile, follow, unfollow, setFollowState } from './social-service.js';
import { mediaUri, originFor, hydrateAvatarRows } from './storage-service.js';

const json = (res: any, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};
const body = async (req: IncomingMessage) => {
  let raw = '';
  for await (const c of req) {
    raw += c;
    if (Buffer.byteLength(raw) > 300000) throw new Error('Request too large');
  }
  return raw ? JSON.parse(raw) : {};
};
const num = (v: string | null, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Hydrate post media rows with short-lived playable URIs where storage is configured. */
export async function hydratePostMedia(posts: Array<{ media?: Array<Record<string, unknown>> }>, origin?: string) {
  for (const post of posts) {
    if (!Array.isArray(post.media)) continue;
    for (const m of post.media) {
      const key = typeof m.storageKey === 'string' ? (m.storageKey as string) : null;
      if (!key) continue;
      const uri = await mediaUri(key, origin);
      if (uri) m.uri = uri;
    }
  }
  return posts;
}

/**
 * Profile surface + social-graph routes.
 * Every response is server-authoritative: visibility, blocks and pagination are
 * enforced inside profile-surface-service / social-service before data leaves the API.
 */
export async function handleProfileRoute(req: IncomingMessage, res: any, userId: string, path: string, url: URL) {
  // ---- Own profile -------------------------------------------------------
  if (req.method === 'GET' && path === '/v1/profiles/me') {
    const profile: any = await getProfileSurface(userId, userId);
    await hydrateAvatarRows([profile], originFor(req.headers.host));
    return json(res, 200, { profile });
  }
  if (req.method === 'GET' && path === '/v1/profiles/me/saved') {
    const page = await listSavedPosts(userId, num(url.searchParams.get('limit'), 30), url.searchParams.get('before') ?? undefined);
    await hydrateAvatarRows(page.posts as any, originFor(req.headers.host));
    return json(res, 200, { posts: await hydratePostMedia(page.posts as any, originFor(req.headers.host)), nextBefore: page.nextBefore });
  }
  if (req.method === 'PUT' && path === '/v1/profiles/me') {
    // Profile extras (creator/seller/location metadata) are explicit, opt-in fields.
    const i = await body(req);
    const { updateProfileExtras } = await import('./profile-surface-service.js');
    return json(res, 200, await updateProfileExtras(userId, i ?? {}));
  }

  // ---- Profile collections ---------------------------------------------
  let m = path.match(/^\/v1\/profile-collections\/([^/]+)$/);
  if (m && req.method === 'GET') {
    const page = await getCollection(userId, m[1], num(url.searchParams.get('limit'), 30), url.searchParams.get('before') ?? undefined);
    await hydratePostMedia(page.posts as any, originFor(req.headers.host));
    await hydrateAvatarRows(page.posts as any, originFor(req.headers.host));
    return json(res, 200, page);
  }

  // ---- Another profile (or own via id) ----------------------------------
  m = path.match(/^\/v1\/profiles\/([^/]+)$/);
  if (m && req.method === 'GET') {
    const profile: any = await getProfileSurface(userId, m[1] === 'me' ? userId : m[1]);
    await hydrateAvatarRows([profile], originFor(req.headers.host));
    return json(res, 200, { profile });
  }

  m = path.match(/^\/v1\/profiles\/([^/]+)\/(followers|following|mutuals|posts|videos|tagged|collections|shop)$/);
  if (m && req.method === 'GET') {
    const [, targetRaw, tab] = m;
    const target = targetRaw === 'me' ? userId : targetRaw;
    const limit = num(url.searchParams.get('limit'), 50);
    const before = url.searchParams.get('before') ?? undefined;
    const origin = originFor(req.headers.host);
    if (tab === 'followers') return json(res, 200, await hydrateAvatarRows((await listFollowers(userId, target, limit, before)).people as any, origin).then((people) => ({ people })));
    if (tab === 'following') return json(res, 200, await hydrateAvatarRows((await listFollowing(userId, target, limit, before)).people as any, origin).then((people) => ({ people })));
    if (tab === 'mutuals') {
      const mutuals: any = await getMutualContext(userId, target);
      await hydrateAvatarRows((mutuals.people ?? []) as any, origin);
      return json(res, 200, mutuals);
    }
    if (tab === 'collections') return json(res, 200, await listCollections(userId, target));
    if (tab === 'shop') return json(res, 200, { shop: await getShopSummary(userId, target) });
    const page =
      tab === 'posts'
        ? await listProfilePosts(userId, target, limit, before)
        : tab === 'videos'
          ? await listProfileVideos(userId, target, limit, before)
          : await listTaggedPosts(userId, target, limit, before);
    await hydrateAvatarRows(page.posts as any, origin);
    return json(res, 200, { posts: await hydratePostMedia(page.posts as any, origin), nextBefore: page.nextBefore });
  }

  //---- Social graph ------------------------------------------------------
  if (path === '/v1/social/follow') {
    const i = await body(req);
    const target = String(i.targetUserId ?? '');
    if (!target) return json(res, 400, { error: 'targetUserId is required' });
    if (req.method === 'POST') return json(res, 200, await follow(userId, target));
    if (req.method === 'DELETE') return json(res, 200, await unfollow(userId, target));
  }
  if (req.method === 'POST' && path === '/v1/social/relationship') {
    const i = await body(req);
    const target = String(i.targetUserId ?? '');
    const state = String(i.state ?? 'none');
    if (!target) return json(res, 400, { error: 'targetUserId is required' });
    if (!['following', 'requested', 'blocked', 'none'].includes(state)) return json(res, 400, { error: 'Invalid relationship state' });
    return json(res, 200, await setFollowState(userId, target, state as any));
  }
  if (req.method === 'GET' && path === '/v1/social/me/profile') {
    const profile: any = await getProfile(userId);
    await hydrateAvatarRows(profile ? [profile] : [], originFor(req.headers.host));
    return json(res, 200, { profile });
  }
  m = path.match(/^\/v1\/social\/profiles\/([^/]+)$/);
  if (m && req.method === 'GET') {
    const profile: any = await getProfile(m[1] === 'me' ? userId : m[1]);
    await hydrateAvatarRows(profile ? [profile] : [], originFor(req.headers.host));
    return json(res, 200, { profile });
  }

  return false;
}
