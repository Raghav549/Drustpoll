import type { IncomingMessage, ServerResponse } from 'node:http';
import { createUploadIntent, getMediaAsset, completeUpload, getPlaybackUrl } from './media-service.js';
import {
  isLocalDriver,
  verifyLocalContentSignature,
  putLocalObject,
  getLocalObjectStat,
  localObjectStream,
  localFilePath,
  originFor,
} from './storage-service.js';
import { MEDIA_LIMITS, sanitizeUploadFilename } from './media-policy.js';

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
 * Media pipeline routes.
 *
 * Signed content route (local driver): the API itself stores and serves object bytes
 * behind HMAC-signed, expiring URLs. Uploads are size-bounded by the signed intent and
 * completion re-verifies stored bytes before the asset may enter processing — the same
 * fail-closed contract as the S3 driver.
 */
export async function handleMediaContentRoute(req: IncomingMessage, res: ServerResponse, path: string, url: URL): Promise<boolean> {
  if (!path.startsWith('/v1/media/content/')) return false;
  if (!isLocalDriver()) {
    json(res, 404, { error: 'Not found' });
    return true;
  }
  const key = path.slice('/v1/media/content/'.length).split('/').map(decodeURIComponent).join('/');
  const exp = url.searchParams.get('exp');
  const sig = url.searchParams.get('sig');
  const method = req.method === 'PUT' ? 'PUT' : req.method === 'GET' || req.method === 'HEAD' ? 'GET' : null;
  if (!method) {
    json(res, 405, { error: 'Method not allowed' });
    return true;
  }
  const extra: Record<string,string> = method === 'PUT' ? { mime: url.searchParams.get('mime') ?? '', size: url.searchParams.get('size') ?? '' } : {};
  if (!verifyLocalContentSignature(key, method, exp, sig, extra)) {
    json(res, 403, { error: 'Signature mismatch or expired link' });
    return true;
  }
  try {
    if (method === 'PUT') {
      const maxBytes = Number(extra.size ?? 0);
      if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
        json(res, 400, { error: 'Invalid signed size' });
        return true;
      }
      const chunks: Buffer[] = [];
      let total = 0;
      for await (const chunk of req) {
        total += (chunk as Buffer).length;
        if (total > maxBytes) {
          json(res, 413, { error: 'Upload exceeds signed size' });
          return true;
        }
        chunks.push(chunk as Buffer);
      }
      if (total !== maxBytes) {
        json(res, 400, { error: 'Upload size does not match signed intent' });
        return true;
      }
      await putLocalObject(key, Buffer.concat(chunks));
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: true, bytes: total }));
      return true;
    }
    const info = await getLocalObjectStat(key);
    if (!info) {
      json(res, 404, { error: 'Object not found' });
      return true;
    }
    const range = req.headers.range;
    if (typeof range === 'string' && /^bytes=\d*-\d*$/.test(range)) {
      const [startRaw, endRaw] = range.replace('bytes=', '').split('-');
      const start = startRaw ? Number(startRaw) : 0;
      const end = endRaw ? Math.min(Number(endRaw), info.size - 1) : info.size - 1;
      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= info.size) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${info.size}`);
        res.end();
        return true;
      }
      res.statusCode = 206;
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
      res.setHeader('Content-Length', String(end - start + 1));
      if (req.method === 'HEAD') {
        res.end();
        return true;
      }
      const { createReadStream } = await import('node:fs');
      const stream = createReadStream(localFilePath(key), { start, end });
      stream.pipe(res);
      return true;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', String(info.size));
    res.setHeader('Cache-Control', 'private, max-age=300');
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    localObjectStream(key).pipe(res);
    return true;
  } catch (error) {
    json(res, 400, { error: error instanceof Error ? error.message : 'Object request failed' });
    return true;
  }
}

/** Authenticated media asset routes: upload intent, completion, status and playback. */
export async function handleMediaRoute(req: IncomingMessage, res: any, userId: string, path: string, url: URL) {
  if (path === '/v1/media/upload-intent' && req.method === 'POST') {
    const i = await body(req);
    const type = String(i.type ?? '');
    const mime = String(i.mime ?? '');
    const byteSize = Number(i.byteSize ?? 0);
    const max = MEDIA_LIMITS[type as keyof typeof MEDIA_LIMITS] ?? 0;
    if (byteSize > max) return json(res, 400, { error: `File exceeds the ${Math.floor(max / (1024 * 1024))} MB limit` });
    const intent = await createUploadIntent(userId, { type, mime, filename: sanitizeUploadFilename(String(i.filename ?? 'upload')), byteSize });
    const origin = originFor(req.headers.host);
    return json(res, 201, { ...intent, uploadUrl: intent.uploadUrl.startsWith('/') ? origin + intent.uploadUrl : intent.uploadUrl });
  }
  let m = path.match(/^\/v1\/media\/([^/]+)$/);
  if (m && req.method === 'GET') return json(res, 200, await getMediaAsset(userId, m[1]));
  m = path.match(/^\/v1\/media\/([^/]+)\/complete$/);
  if (m && req.method === 'POST') {
    const i = await body(req);
    const result = await completeUpload(userId, m[1], String(i.mime ?? ''), i.width == null ? null : Number(i.width), i.height == null ? null : Number(i.height), i.durationMs == null ? null : Number(i.durationMs));
    return json(res, 200, result);
  }
  m = path.match(/^\/v1\/media\/([^/]+)\/playback$/);
  if (m && req.method === 'GET') {
    const playback = await getPlaybackUrl(userId, m[1]);
    const origin = originFor(req.headers.host);
    return json(res, 200, { ...playback, url: playback.url.startsWith('/') ? origin + playback.url : playback.url });
  }
  return false;
}
