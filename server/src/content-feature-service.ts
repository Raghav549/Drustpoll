import { query, withTransaction } from './db.js';

export type Modality='text'|'image'|'audio'|'video';
export type ContentFeatureInput={postId:string;version:number;text?:Record<string,unknown>;image?:Record<string,unknown>;audio?:Record<string,unknown>;video?:Record<string,unknown>;fused?:Record<string,unknown>};

export function normalizeText(text:string){return text.normalize('NFKC').replace(/\s+/g,' ').trim().slice(0,2200);}
export function featureExtractionBoundary(modalities:Modality[]){return {version:1,modalities:[...new Set(modalities)],requiresWorker:true,providerConfigured:false};}

export async function queueContentFeatureExtraction(postId:string,version=1){
  return withTransaction(async client=>{
    await client.query(`INSERT INTO content_features(post_id,version,status) VALUES($1,$2,'queued') ON CONFLICT(post_id) DO UPDATE SET version=EXCLUDED.version,status='queued',error_code=NULL,updated_at=now()`,[postId,version]);
    await client.query(`INSERT INTO recommendation_feature_jobs(post_id,version) VALUES($1,$2) ON CONFLICT(post_id,version) DO UPDATE SET status='queued',available_at=now(),updated_at=now()`,[postId,version]);
    return {postId,version,status:'queued'};
  });
}

export async function leaseFeatureJob(workerId:string,leaseSeconds=120){
  const r=await query(`WITH candidate AS (SELECT id FROM recommendation_feature_jobs WHERE status IN('queued','leased') AND available_at<=now() AND (status='queued' OR lease_until<now()) ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE recommendation_feature_jobs j SET status='leased',attempt_count=j.attempt_count+1,lease_until=now()+make_interval(secs=>$1),updated_at=now() FROM candidate c WHERE j.id=c.id RETURNING j.id,j.post_id,j.version,j.attempt_count`,[Math.min(Math.max(leaseSeconds,30),900)]);
  return r.rows[0]??null;
}

export async function completeFeatureJob(jobId:string,features:ContentFeatureInput){
  return withTransaction(async client=>{
    await client.query(`UPDATE content_features SET version=$2,status='ready',text_features=$3,image_features=$4,audio_features=$5,video_features=$6,fused_features=$7,extracted_at=now(),error_code=NULL,updated_at=now() WHERE post_id=$1`,[features.postId,features.version,features.text??{},features.image??{},features.audio??{},features.video??{},features.fused??{}]);
    await client.query(`UPDATE recommendation_feature_jobs SET status='succeeded',lease_until=NULL,error_code=NULL,updated_at=now() WHERE id=$1`,[jobId]);
    return {ok:true,postId:features.postId,version:features.version};
  });
}

export async function failFeatureJob(jobId:string,errorCode:string,retry=true){
  const r=await query(`UPDATE recommendation_feature_jobs SET status=CASE WHEN $2 AND attempt_count<5 THEN 'queued' ELSE 'failed' END,available_at=now()+CASE WHEN attempt_count<5 THEN make_interval(secs=>LEAST(3600,30*power(2,attempt_count-1))) ELSE interval '0' END,lease_until=NULL,error_code=$1,updated_at=now() WHERE id=$3 RETURNING status`,[errorCode.slice(0,120),retry,jobId]);
  return r.rows[0]??null;
}
