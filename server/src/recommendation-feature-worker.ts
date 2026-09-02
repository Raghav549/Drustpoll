import { query, withTransaction } from './db.js';

type FeatureJob={id:string;post_id:string;version:number;attempt_count:number};

const MAX_ATTEMPTS=5;
const LEASE_MS=5*60*1000;

/** Provider-neutral extraction boundary. Real extractors are injected by deployment; this layer never invents model output. */
export type MultimodalExtractor={
 extractText(input:{caption:string}):Promise<Record<string,unknown>>;
 extractImage(input:{storageKeys:string[]}):Promise<Record<string,unknown>>;
 extractAudio(input:{storageKeys:string[]}):Promise<Record<string,unknown>>;
 extractVideo(input:{storageKeys:string[]}):Promise<Record<string,unknown>>;
 fuse(input:{text:Record<string,unknown>;image:Record<string,unknown>;audio:Record<string,unknown>;video:Record<string,unknown>}):Promise<Record<string,unknown>>;
};

export async function leaseFeatureJob(workerId:string):Promise<FeatureJob|null>{
 return withTransaction(async client=>{
  const r=await client.query<FeatureJob>(`SELECT id,post_id,version,attempt_count FROM recommendation_feature_jobs WHERE (status='queued' AND available_at<=now()) OR (status='leased' AND lease_until<now()) ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1`);
  if(!r.rowCount)return null;
  const job=r.rows[0];
  await client.query(`UPDATE recommendation_feature_jobs SET status='leased',attempt_count=attempt_count+1,lease_until=now()+$2::interval,updated_at=now() WHERE id=$1`,[job.id,`${LEASE_MS} milliseconds`]);
  await client.query(`UPDATE content_features SET status='running',error_code=NULL,updated_at=now() WHERE post_id=$1`,[job.post_id]);
  return job;
 });
}

export async function runFeatureJob(job:FeatureJob,extractor:MultimodalExtractor){
 try{
  const post=await query<{caption:string}>(`SELECT caption FROM posts WHERE id=$1`,[job.post_id]);
  if(!post.rowCount)throw new Error('POST_NOT_FOUND');
  const media=await query<{media_type:string;storage_key:string}>(`SELECT media_type,storage_key FROM post_media WHERE post_id=$1 ORDER BY sort_order`,[job.post_id]);
  const keys=media.rows.map(x=>x.storage_key);
  const image=await extractor.extractImage({storageKeys:media.rows.filter(x=>x.media_type==='image').map(x=>x.storage_key)});
  const video=await extractor.extractVideo({storageKeys:media.rows.filter(x=>x.media_type==='video').map(x=>x.storage_key)});
  const audio=await extractor.extractAudio({storageKeys:keys});
  const text=await extractor.extractText({caption:post.rows[0].caption});
  const fused=await extractor.fuse({text,image,audio,video});
  await withTransaction(async client=>{
   await client.query(`UPDATE content_features SET version=$2,status='ready',text_features=$3,image_features=$4,audio_features=$5,video_features=$6,fused_features=$7,extracted_at=now(),updated_at=now() WHERE post_id=$1`,[job.post_id,job.version,text,image,audio,video,fused]);
   await client.query(`UPDATE recommendation_feature_jobs SET status='succeeded',lease_until=NULL,error_code=NULL,updated_at=now() WHERE id=$1`,[job.id]);
  });
 }catch(error){
  const code=error instanceof Error?error.message:'FEATURE_EXTRACTION_FAILED';
  await query(`UPDATE recommendation_feature_jobs SET status=CASE WHEN attempt_count >= $2 THEN 'failed' ELSE 'queued' END,available_at=now()+make_interval(secs=>LEAST(3600,POWER(2,attempt_count)*5)::int),lease_until=NULL,error_code=$3,updated_at=now() WHERE id=$1`,[job.id,MAX_ATTEMPTS,code.slice(0,120)]);
  await query(`UPDATE content_features SET status=CASE WHEN EXISTS(SELECT 1 FROM recommendation_feature_jobs WHERE id=$1 AND status='failed') THEN 'failed' ELSE 'queued' END',error_code=$2,updated_at=now() WHERE post_id=(SELECT post_id FROM recommendation_feature_jobs WHERE id=$1)`,[job.id,code.slice(0,120)]).catch(()=>undefined);
  throw error;
 }
}

export async function enqueueFeatureExtraction(postId:string,version=1){
 await withTransaction(async client=>{
  await client.query(`INSERT INTO content_features(post_id,version,status) VALUES($1,$2,'queued') ON CONFLICT(post_id) DO UPDATE SET version=EXCLUDED.version,status='queued',updated_at=now()`,[postId,version]);
  await client.query(`INSERT INTO recommendation_feature_jobs(post_id,version) VALUES($1,$2) ON CONFLICT(post_id,version) DO NOTHING`,[postId,version]);
 });
}
