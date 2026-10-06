import type { IncomingMessage } from 'node:http';
import { hydrateAvatarRows, originFor } from './storage-service.js';
import {
  recordSearch,
  listRecentSearches,
  clearRecentSearches,
  listSavedSearches,
  saveSearch,
  deleteSavedSearch,
  listDiscoveryCategories,
  getDiscoveryPreferences,
  updateDiscoveryPreferences,
  getDiscoveryResults,
  getDiscoveryFeed,
} from './discovery-surface-service.js';

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

/**
 * Discovery surface routes: Explore landing, global search, result tabs,
 * discovery feed, recent/saved searches, categories and privacy-aware
 * discovery preferences. History recording happens server-side only.
 */
export async function handleDiscoveryRoute(req: IncomingMessage, res: any, userId: string, path: string, url: URL) {
  if (path === '/v1/discovery/search' && req.method === 'GET') {
    const q = url.searchParams.get('q') ?? '';
    const kind = (url.searchParams.get('kind') ?? 'all') as any;
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const { searchDiscovery } = await import('./discovery-service.js');
    const r: any = await searchDiscovery(userId, q, kind, Number.isFinite(limit) ? limit : 20);
    if (q.trim()) await recordSearch(userId, q, 'all').catch(() => undefined);
    return json(res, 200, { ...r, videos: r.videos ?? [], shops: r.shops ?? [], topics: r.topics ?? [], suggestions: r.suggestions ?? [] });
  }
  if (path === '/v1/discovery/results' && req.method === 'GET') {
    const q = url.searchParams.get('q') ?? '';
    const result: any = await getDiscoveryResults(userId, url.searchParams);
    if (q.trim()) await recordSearch(userId, q, (url.searchParams.get('kind') ?? 'all') as any).catch(() => undefined);
    const origin = originFor(req.headers.host);
    for (const key of ['people', 'posts', 'videos', 'products', 'shops']) {
      if (Array.isArray(result[key])) await hydrateAvatarRows(result[key], origin, ['avatar_url', 'logo_url']);
    }
    return json(res, 200, result);
  }
  if (path === '/v1/discovery/feed' && req.method === 'GET') {
    return json(res, 200, await getDiscoveryFeed(userId, url.searchParams));
  }
  if (path === '/v1/discovery/recent-searches') {
    if (req.method === 'GET') return json(res, 200, await listRecentSearches(userId));
    if (req.method === 'DELETE') {
      await clearRecentSearches(userId);
      return json(res, 200, { ok: true });
    }
  }
  if (path === '/v1/discovery/saved-searches') {
    if (req.method === 'GET') return json(res, 200, await listSavedSearches(userId));
    if (req.method === 'POST') {
      const i = await body(req);
      const query = String(i.query ?? '').trim();
      if (!query) return json(res, 400, { error: 'Search query is required' });
      await saveSearch(userId, query, (i.kind ?? 'all') as any);
      return json(res, 201, { ok: true, ...(await listSavedSearches(userId)) });
    }
  }
  let m = path.match(/^\/v1\/discovery\/saved-searches\/([^/]+)$/);
  if (m && req.method === 'DELETE') {
    await deleteSavedSearch(userId, m[1]);
    return json(res, 200, { ok: true });
  }
  if (path === '/v1/discovery/categories' && req.method === 'GET') {
    return json(res, 200, { categories: await listDiscoveryCategories(userId) });
  }
  if (path === '/v1/discovery/preferences') {
    if (req.method === 'GET') return json(res, 200, { preferences: await getDiscoveryPreferences(userId) });
    if (req.method === 'PUT') return json(res, 200, { preferences: await updateDiscoveryPreferences(userId, await body(req)) });
  }
  return false;
}
