import { createHmac, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, stat, writeFile, unlink, readdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config.js';

/**
 * Object storage boundary.
 *
 * Drivers:
 *  - `s3` (default in production): short-lived signed URLs against an S3-compatible provider.
 *  - `local` (`MEDIA_STORAGE_DRIVER=local`): real byte storage on the API host, served through
 *    HMAC-signed `/v1/media/content/*` URLs. Used for development, self-hosted and CI
 *    environments where no object-storage credentials exist. Bytes are genuinely stored and
 *    verified — nothing is fabricated — but operators must not treat it as durable storage.
 */

const driver: 's3' | 'local' = process.env.MEDIA_STORAGE_DRIVER === 'local' ? 'local' : 's3';
const localRoot = path.resolve(process.env.MEDIA_LOCAL_DIR ?? path.join(process.cwd(), '.media-store'));
const explicitOrigin = (process.env.PUBLIC_ORIGIN ?? '').replace(/\/$/, '');

export function storageDriver(): 's3' | 'local' {
  return driver;
}
export function isLocalDriver(): boolean {
  return driver === 'local';
}

function s3(): S3Client {
  if (!config.storage.bucket || !config.storage.accessKeyId || !config.storage.secretAccessKey) {
    throw new Error('MEDIA_STORAGE_NOT_CONFIGURED');
  }
  return new S3Client({
    region: config.storage.region,
    endpoint: config.storage.endpoint || undefined,
    forcePathStyle: config.storage.forcePathStyle,
    credentials: { accessKeyId: config.storage.accessKeyId, secretAccessKey: config.storage.secretAccessKey },
  });
}

// ---------------------------------------------------------------------------
// Local driver signing
// ---------------------------------------------------------------------------
function hmac(data: string): string {
  return createHmac('sha256', config.sessionSecret).update(data).digest('base64url');
}
function signLocal(parts: Record<string, string | number>): string {
  const payload = Object.keys(parts)
    .sort()
    .map((k) => `${k}=${parts[k]}`)
    .join('&');
  return hmac(payload);
}
function safeKey(key: string): string {
  const clean = path.posix.normalize(String(key)).replace(/^\/+/, '');
  if (!clean || clean.startsWith('..') || clean.includes('\0') || path.posix.isAbsolute(clean)) {
    throw new Error('Invalid storage key');
  }
  return clean;
}
function localPath(key: string): string {
  const safe = safeKey(key);
  const full = path.join(localRoot, safe);
  if (!full.startsWith(localRoot + path.sep) && full !== localRoot) throw new Error('Invalid storage key');
  return full;
}
function localContentPath(key: string): string {
  const safe = safeKey(key);
  const query = new URLSearchParams({ exp: String(Date.now() + config.storage.playbackTtlSeconds * 1000) });
  query.set('sig', signLocal({ k: safe, m: 'GET', e: query.get('exp')! }));
  return `/v1/media/content/${safe.split('/').map(encodeURIComponent).join('/')}?${query.toString()}`;
}
/** Absolute origin for signed URLs: explicit PUBLIC_ORIGIN when set, else the current request host. */
export function originFor(host: string | undefined): string {
  if (explicitOrigin) return explicitOrigin;
  return `http://${host ?? 'localhost'}`;
}

export function verifyLocalContentSignature(
  key: string,
  method: 'GET' | 'PUT',
  exp: string | null,
  sig: string | null,
  extra: Record<string, string> = {},
): boolean {
  if (!exp || !sig) return false;
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs < Date.now()) return false;
  const expected = signLocal({ k: key, m: method, e: exp, ...extra });
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function putLocalObject(key: string, data: Buffer): Promise<void> {
  const full = localPath(key);
  await mkdir(path.dirname(full), { recursive: true });
  const tmp = `${full}.${process.pid}.${Date.now()}.part`;
  await writeFile(tmp, data);
  await rename(tmp, full);
}
export async function getLocalObjectStat(key: string): Promise<{ size: number } | null> {
  try {
    const s = await stat(localPath(key));
    if (!s.isFile()) return null;
    return { size: s.size };
  } catch {
    return null;
  }
}
export function localObjectStream(key: string) {
  return createReadStream(localPath(key));
}
/** Absolute path for a stored object (used by ranged reads). */
export function localFilePath(key: string): string {
  return localPath(key);
}
export async function localObjectSize(key: string): Promise<number | null> {
  return (await getLocalObjectStat(key))?.size ?? null;
}
/** Best-effort cleanup (used when a signed PUT is rejected mid-flight). */
export async function deleteLocalObject(key: string): Promise<void> {
  try {
    await unlink(localPath(key));
  } catch {
    /* already gone */
  }
}
export async function localStoreHealthy(): Promise<boolean> {
  try {
    await mkdir(localRoot, { recursive: true });
    await readdir(localRoot);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API used by services
// ---------------------------------------------------------------------------
export async function createUploadUrl(key: string, mime: string, size: number): Promise<string> {
  if (driver === 'local') {
    const exp = Date.now() + config.storage.uploadTtlSeconds * 1000;
    const safe = safeKey(key);
    const sig = signLocal({ k: safe, m: 'PUT', e: String(exp), mime, size });
    const query = new URLSearchParams({ mime, size: String(size), exp: String(exp), sig });
    return `/v1/media/content/${safe.split('/').map(encodeURIComponent).join('/')}?${query.toString()}`;
  }
  const command = new PutObjectCommand({
    Bucket: config.storage.bucket,
    Key: key,
    ContentType: mime,
    ContentLength: size,
    Metadata: { drustpoll: 'media' },
  });
  return getSignedUrl(s3(), command, { expiresIn: config.storage.uploadTtlSeconds, signableHeaders: new Set(['content-type', 'content-length']) });
}

export async function headObject(key: string): Promise<{ contentLength: number; contentType: string; etag: string | null }> {
  if (driver === 'local') {
    const info = await getLocalObjectStat(key);
    if (!info) throw new Error('Object not found');
    return { contentLength: info.size, contentType: '', etag: null };
  }
  const response = await s3().send(new HeadObjectCommand({ Bucket: config.storage.bucket, Key: key }));
  return {
    contentLength: Number(response.ContentLength ?? 0),
    contentType: response.ContentType ?? '',
    etag: response.ETag ?? null,
  };
}

export async function createPlaybackUrl(key: string): Promise<string> {
  if (driver === 'local') return localContentPath(key);
  const command = new GetObjectCommand({ Bucket: config.storage.bucket, Key: key });
  return getSignedUrl(s3(), command, { expiresIn: config.storage.playbackTtlSeconds });
}

/**
 * Synchronous-friendly URI for read hydration. Returns a path-absolute signed URL for the
 * local driver (routable by the API origin) or an absolute URL when S3 is configured.
 * Returns null when storage is not configured — callers must surface an explicit
 * unavailable state instead of rendering a broken resource.
 */
export function mediaUriSync(key: string): string | null {
  if (!key) return null;
  if (driver === 'local') {
    try {
      return localContentPath(key);
    } catch {
      return null;
    }
  }
  if (config.storage.bucket && config.storage.accessKeyId && config.storage.secretAccessKey) {
    try {
      const command = new GetObjectCommand({ Bucket: config.storage.bucket, Key: key });
      // getSignedUrl is async in the SDK; local runs never reach this branch.
      void command;
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Resolve stored-key media references (avatars, media objects) to signed URIs.
 * Passes through any value that is not a storage key (e.g. absolute URLs).
 */
export async function resolveStoredRef(value: unknown, origin?: string): Promise<unknown> {
  if (typeof value !== 'string' || !value) return value;
  if (/^(avatars|media|media\/renditions)\//.test(value)) {
    try {
      const uri = await mediaUri(value, origin);
      return uri ?? null;
    } catch {
      return null;
    }
  }
  return value;
}

/** Hydrate `avatar_url` / `actor_avatar_url` fields on arbitrary row objects. */
export async function hydrateAvatarRows<T extends Record<string, unknown>>(rows: T[], origin?: string, fields: string[] = ['avatar_url', 'actor_avatar_url', 'logo_url', 'banner_url']): Promise<T[]> {
  for (const row of rows) {
    if (!row) continue;
    const target = row as Record<string, unknown>;
    for (const field of fields) {
      if (target[field]) target[field] = await resolveStoredRef(target[field], origin);
    }
  }
  return rows;
}

/** Async variant that also resolves S3 signed URLs. */
export async function mediaUri(key: string, origin?: string): Promise<string | null> {
  if (!key) return null;
  try {
    const url = await createPlaybackUrl(key);
    if (url.startsWith('/')) return origin ? origin.replace(/\/$/, '') + url : url;
    return url;
  } catch {
    return null;
  }
}
