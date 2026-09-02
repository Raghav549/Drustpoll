import { query, withTransaction } from './db.js';

export type MediaJobType='probe'|'scan'|'thumbnail'|'moderation'|'transcode';
export type MediaJobProcessor=(input:{assetId:string;jobType:MediaJobType;storageKey:string;mediaType:'image'|'video'})=>Promise<{detectedMime?:string;width?:number;height?:number;durationMs?:number;rendition?:{type:'original'|'thumbnail'|'preview'|'hls'|'dash'|'image';storageKey:string;mimeType?:string;width?:number;height?:number;bitrate?:number;durationMs?:number;byteSize?:number};moderationStatus?:'approved'|'rejected'|'review'}>;

const MAX_ATTEMPTS=5;
const LEASE_SECONDS=300;
const BACKOFF=[5,30,120,600,1800];

export async function leaseMediaJob(workerId:string){
  return withTransaction(async client=>{
    const r=await client.query<{id:string;asset_id:string;job_type:MediaJobType;attempt_count:number;storage_key:string;media_type:'image'|'video'}>(`SELECT j.id,j.asset_id,j.job_type,j.attempt_count,a.storage_key,a.media_type
      FROM media_jobs j JOIN media_assets a ON a.id=j.asset_id
      WHERE j.status='queued' AND j.created_at<=now() AND (j.started_at IS NULL OR j.started_at<=now())
      ORDER BY j.created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1`);
    if(!r.rowCount)return null;
    const job=r.rows[0];
    await client.query(`UPDATE media_jobs SET status='running',attempt_count=attempt_count+1,started_at=now(),finished_at=NULL,error_code=NULL WHERE id=$1`,[job.id]);
    return {...job,workerId,leaseUntil:new Date(Date.now()+LEASE_SECONDS*1000).toISOString()};
  });
}

export async function runMediaJob(jobId:string,processor:MediaJobProcessor){
  const job=await query<{asset_id:string;job_type:MediaJobType;status:string;attempt_count:number;storage_key:string;media_type:'image'|'video'}>(`SELECT j.asset_id,j.job_type,j.status,j.attempt_count,a.storage_key,a.media_type FROM media_jobs j JOIN media_assets a ON a.id=j.asset_id WHERE j.id=$1`,[jobId]);
  if(!job.rowCount)throw new Error('Media job not found');
  const current=job.rows[0];
  if(current.status!=='running')return {status:'ignored' as const};
  try{
    const result=await processor({assetId:current.asset_id,jobType:current.job_type,storageKey:current.storage_key,mediaType:current.media_type});
    await withTransaction(async client=>{
      if(result.detectedMime||result.width||result.height||result.durationMs){
        await client.query(`UPDATE media_assets SET detected_mime=COALESCE($2,detected_mime),width=COALESCE($3,width),height=COALESCE($4,height),duration_ms=COALESCE($5,duration_ms),updated_at=now() WHERE id=$1`,[current.asset_id,result.detectedMime??null,result.width??null,result.height??null,result.durationMs??null]);
      }
      if(result.moderationStatus){await client.query(`UPDATE media_assets SET moderation_status=$2,updated_at=now() WHERE id=$1`,[current.asset_id,result.moderationStatus]);}
      if(result.rendition){const x=result.rendition;await client.query(`INSERT INTO media_renditions(asset_id,rendition_type,storage_key,mime_type,width,height,bitrate,duration_ms,byte_size) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(asset_id,rendition_type,width,height,bitrate) DO UPDATE SET storage_key=EXCLUDED.storage_key,mime_type=EXCLUDED.mime_type,duration_ms=EXCLUDED.duration_ms,byte_size=EXCLUDED.byte_size`,[current.asset_id,x.type,x.storageKey,x.mimeType??null,x.width??null,x.height??null,x.bitrate??null,x.durationMs??null,x.byteSize??null]);}
      await client.query(`UPDATE media_jobs SET status='succeeded',finished_at=now() WHERE id=$1 AND status='running'`,[jobId]);
    });
    return {status:'succeeded' as const};
  }catch(error){
    const attempt=current.attempt_count;
    const terminal=attempt>=MAX_ATTEMPTS;
    const delay=BACKOFF[Math.min(Math.max(attempt-1,0),BACKOFF.length-1)];
    await query(`UPDATE media_jobs SET status=$2,error_code=$3,finished_at=CASE WHEN $2='failed' THEN now() ELSE NULL END,started_at=CASE WHEN $2='queued' THEN now()+($4::int * interval '1 second') ELSE started_at END WHERE id=$1`,[jobId,terminal?'failed':'queued',error instanceof Error?error.message.slice(0,240):'MEDIA_JOB_FAILED',delay]);
    return {status:terminal?'failed' as const:'queued' as const};
  }
}

export async function requeueExpiredMediaJobs(){
  const r=await query(`UPDATE media_jobs SET status='queued',started_at=NULL,error_code='LEASE_EXPIRED' WHERE status='running' AND started_at<now()-interval '5 minutes' RETURNING id`);
  return r.rowCount;
}
