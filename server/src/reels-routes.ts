import type { IncomingMessage } from 'node:http';
import { getReelPreferences, updateReelPreferences, setReelCreatorFeedback, getReelAudio, getRelatedReels } from './reel-surface-service.js';
import { mediaUri, originFor } from './storage-service.js';

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

/** Reels surface extras: playback preferences, related videos, creator feedback, audio catalog. */
export async function handleReelsRoute(req: IncomingMessage, res: any, userId: string, path: string, url: URL) {
  if (path === '/v1/reels/preferences') {
    if (req.method === 'GET') return json(res, 200, { preferences: await getReelPreferences(userId) });
    if (req.method === 'PUT') return json(res, 200, { preferences: await updateReelPreferences(userId, await body(req)) });
  }
  if (path === '/v1/reels/related' && req.method === 'GET') {
    const postId = url.searchParams.get('postId') ?? '';
    if (!postId) return json(res, 400, { error: 'postId is required' });
    const items = await getRelatedReels(userId, postId);
    const origin = originFor(req.headers.host);
    for (const item of items as Array<Record<string, unknown>>) {
      const key = typeof item.storage_key === 'string' ? item.storage_key : null;
      if (!key) continue;
      const uri = await mediaUri(key, origin);
      if (uri) item.videoUrl = uri;
    }
    return json(res, 200, { items });
  }
  let m = path.match(/^\/v1\/reels\/creators\/([^/]+)\/feedback$/);
  if (m && req.method === 'POST') {
    const i = await body(req);
    return json(res, 200, await setReelCreatorFeedback(userId, m[1], String(i.signal ?? '')));
  }
  if (path === '/v1/reels/audio' && req.method === 'GET') {
    const items = await getReelAudio(url.searchParams.get('q') ?? '');
    return json(res, 200, { items });
  }
  return false;
}
