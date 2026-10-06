import type { IncomingMessage } from 'node:http';
import { recordRecommendationExposure } from './recommendation-experiment-service.js';
import { recordFeedEvents } from './feed-events-service.js';
import { recordUiMeasurements } from './measurement-service.js';

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
 * Measurement routes (privacy-aware, per the UX measurement contract):
 *  - recommendation exposure recording for ranking feedback;
 *  - durable feed events (impression/interaction) with client event dedupe;
 *  - UI value/latency/task measurements with client event dedupe.
 */
export async function handleEngagementRoute(req: IncomingMessage, res: any, userId: string, path: string) {
  if (path === '/v1/recommendation/exposure' && req.method === 'POST') {
    const i = await body(req);
    const items = Array.isArray(i.items) ? i.items : [];
    const exposure = await recordRecommendationExposure(userId, items, typeof i.source === 'string' ? i.source : undefined);
    const events = Array.isArray(i.events) ? i.events : [];
    const feed = events.length ? await recordFeedEvents(userId, events) : { accepted: 0, acceptedClientEventIds: [] as string[] };
    return json(res, 200, { ...exposure, feed, accepted: (exposure.accepted ?? 0) + (feed.accepted ?? 0) });
  }
  if (path === '/v1/feed/events' && req.method === 'POST') {
    const i = await body(req);
    const events = Array.isArray(i.events) ? i.events : [];
    return json(res, 200, await recordFeedEvents(userId, events));
  }
  if (path === '/v1/measurements/ui' && req.method === 'POST') {
    const i = await body(req);
    const events = Array.isArray(i.events) ? i.events : [];
    return json(res, 200, await recordUiMeasurements(userId, events));
  }
  return false;
}
