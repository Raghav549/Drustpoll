import { query, withTransaction } from './db.js';

export type FeatureModality = 'text' | 'image' | 'audio' | 'video' | 'fused';
export type FeatureJobType = 'text_features' | 'image_features' | 'audio_features' | 'video_features' | 'fusion';

/** Provider-neutral extraction boundary. Real model adapters plug in here; no fake embeddings are generated. */
export type FeatureExtractor = {
  extract(input: { assetId: string; storageKey?: string; text?: string; modality: FeatureModality }): Promise<Record<string, unknown>>;
};

export async function leaseFeatureJobs(limit = 10) {
  const n = Math.max(1, Math.min(50, Math.floor(limit)));
  return withTransaction(async client => {
    const r = await client.query(
      `WITH picked AS (
         SELECT id FROM content_feature_jobs
         WHERE status='queued' AND (available_at IS NULL OR available_at<=now())
         ORDER BY created_at ASC LIMIT $1 FOR UPDATE SKIP LOCKED
       )
       UPDATE content_feature_jobs j
       SET status='running', attempt_count=attempt_count+1, started_at=now(), lease_until=now()+interval '2 minutes'
       FROM picked WHERE j.id=picked.id
       RETURNING j.*`, [n]);
    return r.rows;
  });
}

export async function completeFeatureJob(jobId: string, features: Record<string, unknown>, modelVersion: string) {
  return withTransaction(async client => {
    const job = await client.query(`SELECT * FROM content_feature_jobs WHERE id=$1 FOR UPDATE`, [jobId]);
    if (!job.rowCount) throw new Error('Feature job not found');
    const row = job.rows[0];
    if (row.status !== 'running') throw new Error('Feature job is not leased');
    await client.query(
      `INSERT INTO content_features(asset_id,post_id,modality,model_version,feature_json,status)
       VALUES($1,$2,$3,$4,$5,'ready')
       ON CONFLICT(asset_id,modality,model_version) DO UPDATE SET feature_json=EXCLUDED.feature_json,status='ready',updated_at=now()`,
      [row.asset_id, row.post_id, row.modality, modelVersion, JSON.stringify(features)]);
    await client.query(`UPDATE content_feature_jobs SET status='succeeded',finished_at=now(),lease_until=NULL,error_code=NULL WHERE id=$1`, [jobId]);
    return { ok: true };
  });
}

export async function failFeatureJob(jobId: string, errorCode = 'EXTRACTOR_FAILED') {
  const r = await query(`UPDATE content_feature_jobs
    SET status=CASE WHEN attempt_count>=5 THEN 'failed' ELSE 'queued' END,
        error_code=$2, finished_at=CASE WHEN attempt_count>=5 THEN now() ELSE NULL END,
        available_at=CASE WHEN attempt_count>=5 THEN NULL ELSE now()+make_interval(secs=>LEAST(3600, POWER(2,attempt_count)::int*10)) END,
        lease_until=NULL WHERE id=$1 RETURNING status`, [jobId, errorCode]);
  if (!r.rowCount) throw new Error('Feature job not found');
  return r.rows[0];
}

export async function recoverExpiredFeatureLeases() {
  const r = await query(`UPDATE content_feature_jobs SET status='queued',lease_until=NULL,available_at=now()+interval '10 seconds',error_code='LEASE_EXPIRED' WHERE status='running' AND lease_until<now() RETURNING id`);
  return r.rowCount;
}
