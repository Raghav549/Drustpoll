import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getLocalObjectStat, localFilePath, putLocalObject } from './storage-service.js';
import { validateMediaDeclaration } from './media-policy.js';

const exec = promisify(execFile);

/**
 * Local media pipeline (development / self-hosted driver).
 *
 * Provides the same fail-closed contract as the remote providers:
 *  - content is verified from actual stored bytes (magic sniffing + size checks);
 *  - image dimensions are parsed from real file headers;
 *  - moderation runs an explicit format/size policy check and records a real decision;
 *  - thumbnails are produced with ImageMagick when available;
 *  - videos without a configured transcoder keep an honest passthrough rendition
 *    (no fabricated transformations).
 *
 * Production deployments should configure MEDIA_INSPECTOR_URL / MEDIA_PROCESSOR_URL
 * and S3 storage instead of this driver.
 */

export type LocalInspection = {
  actualMime: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
};

function sniff(buffer: Buffer): { mime: string; kind: 'image' | 'video' | null } {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: 'image/jpeg', kind: 'image' };
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', kind: 'image' };
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', kind: 'image' };
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') return { mime: 'video/mp4', kind: 'video' };
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return { mime: 'video/webm', kind: 'video' };
  return { mime: '', kind: null };
}

function jpegDimensions(buffer: Buffer): { width: number | null; height: number | null } {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    offset += 2 + length;
  }
  return { width: null, height: null };
}

function imageDimensions(mime: string, buffer: Buffer): { width: number | null; height: number | null } {
  try {
    if (mime === 'image/png' && buffer.length >= 24) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    if (mime === 'image/jpeg') return jpegDimensions(buffer);
    if (mime === 'image/webp' && buffer.length >= 30) {
      const fourcc = buffer.toString('ascii', 12, 16);
      if (fourcc === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
      if (fourcc === 'VP8L') {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (fourcc === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
  } catch {
    /* fall through to null */
  }
  return { width: null, height: null };
}

async function readHead(key: string, bytes = 65536): Promise<{ head: Buffer; size: number }> {
  const stat = await getLocalObjectStat(key);
  if (!stat) throw new Error('MEDIA_OBJECT_MISSING');
  const full = localFilePath(key);
  const all = await readFile(full);
  return { head: all.subarray(0, Math.min(bytes, all.length)), size: stat.size };
}

/** Content verification from real stored bytes. Used when no remote inspector is configured. */
export async function localInspect(input: { url: string; declaredMime: string; expectedBytes: number; mediaType: 'image' | 'video' }): Promise<LocalInspection> {
  const key = decodeContentKey(input.url);
  const { head, size } = await readHead(key);
  const sniffer = sniff(head);
  if (!sniffer.mime) throw new Error('MEDIA_CONTENT_UNRECOGNIZED');
  if (sniffer.kind !== input.mediaType) throw new Error('MEDIA_CONTENT_TYPE_MISMATCH');
  const dims = sniffer.kind === 'image' ? imageDimensions(sniffer.mime, head) : { width: null, height: null };
  validateMediaDeclaration(input.mediaType, sniffer.mime, size);
  return { actualMime: sniffer.mime, byteSize: size, width: dims.width, height: dims.height, durationMs: null };
}

function decodeContentKey(url: string): string {
  const withoutQuery = url.split('?')[0].split('#')[0];
  const pathname = withoutQuery.startsWith('/') ? withoutQuery : new URL(withoutQuery).pathname;
  const prefix = '/v1/media/content/';
  const idx = pathname.indexOf(prefix);
  if (idx < 0) throw new Error('MEDIA_URL_INVALID');
  return pathname
    .slice(idx + prefix.length)
    .split('/')
    .map(decodeURIComponent)
    .join('/');
}

export type LocalJobResult = {
  detectedMime?: string;
  byteSize?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  status?: 'approved' | 'rejected' | 'review';
  renditions?: Array<{ renditionType: 'original' | 'thumbnail' | 'preview' | 'hls' | 'dash' | 'image'; storageKey: string; mimeType?: string; width?: number; height?: number; byteSize?: number }>;
};

/** Local worker processing for probe/scan/moderation/thumbnail/transcode jobs. */
export async function localProcessJob(input: {
  jobType: 'probe' | 'scan' | 'thumbnail' | 'moderation' | 'transcode';
  assetId: string;
  sourceUrl: string;
  mediaType: string;
  mime: string;
  byteSize: number;
}): Promise<Record<string, unknown>> {
  const key = decodeContentKey(input.sourceUrl);
  const { head, size } = await readHead(key);
  const sniffer = sniff(head);

  if (input.jobType === 'probe') {
    if (!sniffer.mime) throw new Error('MEDIA_PROBE_FAILED');
    const dims = sniffer.kind === 'image' ? imageDimensions(sniffer.mime, head) : { width: null, height: null };
    return {
      detectedMime: sniffer.mime,
      byteSize: size,
      width: dims.width,
      height: dims.height,
      durationMs: null,
    };
  }

  if (input.jobType === 'scan') {
    if (!sniffer.mime || sniffer.mime !== input.mime) throw new Error('MEDIA_SCAN_MIME_MISMATCH');
    if (size !== Number(input.byteSize)) throw new Error('MEDIA_SCAN_SIZE_MISMATCH');
    // Byte-level policy: reject obviously mislabeled or truncated objects.
    validateMediaDeclaration(input.mediaType, sniffer.mime, size);
    return {};
  }

  if (input.jobType === 'moderation') {
    // Explicit automated policy decision on verified content: format allow-list + size limits.
    try {
      if (!sniffer.mime) throw new Error('unrecognized');
      if (sniffer.mime !== input.mime) throw new Error('mislabeled');
      validateMediaDeclaration(input.mediaType, sniffer.mime, size);
      return { status: 'approved' };
    } catch {
      return { status: 'rejected' };
    }
  }

  if (input.jobType === 'thumbnail' && sniffer.kind === 'image') {
    try {
      const thumbKey = `media/renditions/${input.assetId}/thumb.jpg`;
      const created = await renderImageThumbnail(key, thumbKey, 640);
      if (created) return { renditions: [{ renditionType: 'thumbnail', storageKey: thumbKey, mimeType: 'image/jpeg', byteSize: created.size }] };
    } catch {
      // Fall through: job succeeds without a thumbnail only if conversion is unavailable.
    }
    return {};
  }

  if (input.jobType === 'transcode') {
    // Passthrough rendition over the verified source bytes. No transformation is claimed;
    // a real transcoder is required to produce adaptive renditions in production.
    return { renditions: [{ renditionType: 'original', storageKey: key, mimeType: input.mime, byteSize: size }] };
  }

  return {};
}

async function renderImageThumbnail(sourceKey: string, targetKey: string, maxEdge: number): Promise<{ size: number } | null> {
  const dir = await mkdtemp(path.join(tmpdir(), 'drustpoll-media-'));
  try {
    const src = path.join(dir, 'src');
    const dst = path.join(dir, 'thumb.jpg');
    const bytes = await readFile(localFilePath(sourceKey));
    await (await import('node:fs/promises')).writeFile(src, bytes);
    await exec('convert', [src, '-resize', `${maxEdge}x${maxEdge}>`, '-quality', '82', dst], { timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
    const out = await readFile(dst);
    if (!out.length) return null;
    await putLocalObject(targetKey, out);
    return { size: out.length };
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
