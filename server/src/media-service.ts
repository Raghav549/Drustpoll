import { randomUUID } from 'node:crypto';
import { query, withTransaction } from './db.js';
import { createPlaybackUrl, createUploadUrl, headObject } from './storage-service.js';
import { inspectMedia } from './media-inspector.js';
import { MEDIA_LIMITS, sanitizeUploadFilename, validateMediaDeclaration, type MediaType } from './media-policy.js';

export async function createUploadIntent(ownerId: string, input: { type: string; mime: string; filename?: string; byteSize?: number }) {
  const mime = String(input.mime);
  const size = Number(input.byteSize ?? 0);
  validateMediaDeclaration(input.type, mime, size);
  const storageKey = `media/${ownerId}/${randomUUID()}`;
  const filename = sanitizeUploadFilename(String(input.filename ?? 'upload'));
  const result = await query<{ id: string; storage_key: string; created_at: Date }>(
    `INSERT INTO media_assets(owner_id,media_type,storage_key,original_filename,declared_mime,byte_size)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING id,storage_key,created_at`,
    [ownerId, input.type, storageKey, filename, mime, size],
  );
  const uploadUrl = await createUploadUrl(storageKey, mime, size);
  return {
    assetId: result.rows[0].id,
    storageKey: result.rows[0].storage_key,
    status: 'pending_upload',
    createdAt: result.rows[0].created_at.toISOString(),
    maxBytes: MEDIA_LIMITS[input.type as MediaType],
    uploadUrl,
  };
}

export async function getMediaAsset(ownerId: string, assetId: string) {
  const result = await query(
    `SELECT id,media_type,original_filename,declared_mime,detected_mime,byte_size,width,height,duration_ms,status,moderation_status,created_at,updated_at
     FROM media_assets WHERE id=$1 AND owner_id=$2`,
    [assetId, ownerId],
  );
  if (!result.rowCount) throw new Error('Media asset not found');
  return result.rows[0];
}

export async function completeUpload(
  ownerId: string,
  assetId: string,
  _clientDetectedMime: string,
  _width: number | null,
  _height: number | null,
  _durationMs: number | null,
) {
  // Lock only for the short state transition. Never hold a database transaction while
  // waiting on object storage or an external media inspector.
  const asset = await withTransaction(async client => {
    const result = await client.query<{
      media_type: MediaType;
      declared_mime: string;
      storage_key: string;
      byte_size: number;
      status: string;
    }>(
      `SELECT media_type,declared_mime,storage_key,byte_size,status
       FROM media_assets WHERE id=$1 AND owner_id=$2 FOR UPDATE`,
      [assetId, ownerId],
    );
    if (!result.rowCount) throw new Error('Media asset not found');
    const row = result.rows[0];
    if (row.status === 'ready') return { ...row, alreadyComplete: true };
    if (row.status === 'scanning') return { ...row, alreadyComplete: true };
    await client.query(
      `UPDATE media_assets SET status='scanning',updated_at=now() WHERE id=$1 AND owner_id=$2`,
      [assetId, ownerId],
    );
    return { ...row, alreadyComplete: false };
  });

  if (asset.alreadyComplete) return { assetId, status: asset.status };

  try {
    const object = await headObject(asset.storage_key);
    if (object.contentLength !== Number(asset.byte_size)) throw new Error('Uploaded object size mismatch');
    if (object.contentType && object.contentType !== asset.declared_mime) throw new Error('Uploaded object MIME mismatch');

    const inspected = await inspectMedia({
      url: await createPlaybackUrl(asset.storage_key),
      declaredMime: asset.declared_mime,
      expectedBytes: Number(asset.byte_size),
      mediaType: asset.media_type,
    });

    validateMediaDeclaration(asset.media_type, inspected.actualMime, inspected.byteSize);
    if (inspected.actualMime !== asset.declared_mime || inspected.byteSize !== Number(asset.byte_size)) {
      throw new Error('Media content verification failed');
    }
    if (inspected.width !== null && (!Number.isSafeInteger(inspected.width) || inspected.width < 1)) {
      throw new Error('Invalid media width');
    }
    if (inspected.height !== null && (!Number.isSafeInteger(inspected.height) || inspected.height < 1)) {
      throw new Error('Invalid media height');
    }
    if (inspected.durationMs !== null && (!Number.isSafeInteger(inspected.durationMs) || inspected.durationMs < 0)) {
      throw new Error('Invalid media duration');
    }

    await withTransaction(async client => {
      const current = await client.query<{ status: string }>(
        `SELECT status FROM media_assets WHERE id=$1 AND owner_id=$2 FOR UPDATE`,
        [assetId, ownerId],
      );
      if (!current.rowCount) throw new Error('Media asset not found');
      if (current.rows[0].status === 'ready') return;
      if (current.rows[0].status !== 'scanning') throw new Error('Media verification state changed');

      await client.query(
        `UPDATE media_assets
         SET detected_mime=$2,byte_size=$3,width=$4,height=$5,duration_ms=$6,status='scanning',updated_at=now()
         WHERE id=$1`,
        [assetId, inspected.actualMime, inspected.byteSize, inspected.width, inspected.height, inspected.durationMs],
      );
      for (const jobType of ['probe', 'scan', 'thumbnail', 'moderation', 'transcode']) {
        await client.query(
          'INSERT INTO media_jobs(asset_id,job_type) VALUES($1,$2) ON CONFLICT DO NOTHING',
          [assetId, jobType],
        );
      }
    });

    return { assetId, status: 'scanning' };
  } catch (error) {
    // Failed verification is retryable. The object is never made playable while pending.
    await query(
      `UPDATE media_assets
       SET status='pending_upload',updated_at=now()
       WHERE id=$1 AND owner_id=$2 AND status='scanning'`,
      [assetId, ownerId],
    );
    throw error;
  }
}

export async function markUploadVerified(
  assetId: string,
  detectedMime: string,
  byteSize: number,
  width: number | null,
  height: number | null,
  durationMs: number | null,
) {
  const asset = await query<{ owner_id: string }>('SELECT owner_id FROM media_assets WHERE id=$1', [assetId]);
  if (!asset.rowCount) throw new Error('Media asset not found');
  return completeUpload(asset.rows[0].owner_id, assetId, detectedMime, width, height, durationMs);
}

export async function getPlaybackUrl(userId: string, assetId: string) {
  const r = await query<{ storage_key: string; status: string; moderation_status: string }>(
    `SELECT storage_key,status,moderation_status FROM media_assets WHERE id=$1 AND owner_id=$2`,
    [assetId, userId],
  );
  if (!r.rowCount) throw new Error('Media asset not found');
  if (r.rows[0].status !== 'ready' || r.rows[0].moderation_status !== 'approved') throw new Error('Media is not playable');
  return { url: await createPlaybackUrl(r.rows[0].storage_key), expiresIn: 300 };
}

export async function markMediaReady(assetId: string) {
  return withTransaction(async client => {
    const r = await client.query<{ moderation_status: string; status: string }>(
      'SELECT moderation_status,status FROM media_assets WHERE id=$1 FOR UPDATE',
      [assetId],
    );
    if (!r.rowCount) throw new Error('Media asset not found');
    if (r.rows[0].moderation_status !== 'approved') throw new Error('Media moderation is not approved');
    const jobs = await client.query<{ job_type: string; status: string }>(
      `SELECT job_type,status FROM media_jobs WHERE asset_id=$1`,
      [assetId],
    );
    const required = ['probe', 'scan', 'thumbnail', 'moderation', 'transcode'];
    const state = new Map(jobs.rows.map(job => [job.job_type, job.status]));
    if (required.some(job => state.get(job) !== 'succeeded')) throw new Error('Media processing is not complete');
    const rendition = await client.query(
      `SELECT 1 FROM media_renditions
       WHERE asset_id=$1 AND rendition_type IN ('original','image','hls','dash','preview') LIMIT 1`,
      [assetId],
    );
    if (!rendition.rowCount) throw new Error('Media rendition is missing');
    await client.query("UPDATE media_assets SET status='ready',updated_at=now() WHERE id=$1", [assetId]);
    return { assetId, status: 'ready' };
  });
}
