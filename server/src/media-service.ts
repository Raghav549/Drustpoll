import { randomUUID } from 'node:crypto';
import { query, withTransaction } from './db.js';

const LIMITS={image:20*1024*1024,video:500*1024*1024} as const;
const MIME={image:new Set(['image/jpeg','image/png','image/webp']),video:new Set(['video/mp4','video/webm'])} as const;

type MediaType=keyof typeof LIMITS;

function cleanFilename(value:string){return value.replace(/[\u0000-\u001f\\/:*?"<>|]+/g,'_').trim().slice(0,180) || 'upload';}
function assertType(type:string):asserts type is MediaType{if(type!=='image'&&type!=='video')throw new Error('Invalid media type');}
function assertMime(type:MediaType,mime:string){if(!MIME[type].has(mime))throw new Error('Unsupported media type');}

export async function createUploadIntent(ownerId:string,input:{type:string;mime:string;filename?:string;byteSize?:number}){
  assertType(input.type); const mime=String(input.mime); assertMime(input.type,mime);
  const size=Number(input.byteSize??0); if(!Number.isSafeInteger(size)||size<=0||size>LIMITS[input.type])throw new Error('Invalid media size');
  const storageKey=`media/${ownerId}/${randomUUID()}`;
  const filename=cleanFilename(String(input.filename??'upload'));
  const result=await query<{id:string;storage_key:string;created_at:Date}>(`INSERT INTO media_assets(owner_id,media_type,storage_key,original_filename,declared_mime,byte_size) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,storage_key,created_at`,[ownerId,input.type,storageKey,filename,mime,size]);
  return {assetId:result.rows[0].id,storageKey:result.rows[0].storage_key,status:'pending_upload',createdAt:result.rows[0].created_at.toISOString(),maxBytes:LIMITS[input.type],uploadUrl:null};
}

export async function getMediaAsset(ownerId:string,assetId:string){
  const result=await query(`SELECT id,media_type,original_filename,declared_mime,detected_mime,byte_size,width,height,duration_ms,status,moderation_status,created_at,updated_at FROM media_assets WHERE id=$1 AND owner_id=$2`,[assetId,ownerId]);
  if(!result.rowCount)throw new Error('Media asset not found');
  return result.rows[0];
}

export async function markUploadVerified(assetId:string,detectedMime:string,byteSize:number,width:number|null,height:number|null,durationMs:number|null){
  return withTransaction(async client=>{
    const asset=await client.query<{media_type:MediaType;declared_mime:string;owner_id:string}>('SELECT media_type,declared_mime,owner_id FROM media_assets WHERE id=$1 FOR UPDATE',[assetId]);
    if(!asset.rowCount)throw new Error('Media asset not found');
    const row=asset.rows[0]; assertMime(row.media_type,detectedMime);
    if(detectedMime!==row.declared_mime)throw new Error('Detected media type does not match declaration');
    const size=Number(byteSize); if(!Number.isSafeInteger(size)||size<=0||size>LIMITS[row.media_type])throw new Error('Invalid verified media size');
    await client.query(`UPDATE media_assets SET detected_mime=$2,byte_size=$3,width=$4,height=$5,duration_ms=$6,status='scanning',updated_at=now() WHERE id=$1`,[assetId,detectedMime,size,width,height,durationMs]);
    for(const jobType of ['probe','scan','thumbnail','moderation','transcode']) await client.query('INSERT INTO media_jobs(asset_id,job_type) VALUES($1,$2) ON CONFLICT DO NOTHING',[assetId,jobType]);
    return {assetId,status:'scanning'};
  });
}

export async function markMediaReady(assetId:string){
  return withTransaction(async client=>{
    const r=await client.query<{moderation_status:string;status:string}>('SELECT moderation_status,status FROM media_assets WHERE id=$1 FOR UPDATE',[assetId]);
    if(!r.rowCount)throw new Error('Media asset not found');
    if(r.rows[0].moderation_status!=='approved')throw new Error('Media moderation is not approved');
    const jobs=await client.query<{job_type:string;status:string}>(`SELECT job_type,status FROM media_jobs WHERE asset_id=$1`,[assetId]);
    const required=['probe','scan','thumbnail','moderation','transcode'];
    const state=new Map(jobs.rows.map(job=>[job.job_type,job.status]));
    if(required.some(job=>state.get(job)!=='succeeded'))throw new Error('Media processing is not complete');
    const asset=await client.query<{media_type:MediaType;storage_key:string}>(`SELECT media_type,storage_key FROM media_assets WHERE id=$1`,[assetId]);
    if(!asset.rowCount)throw new Error('Media asset not found');
    const rendition=await client.query(`SELECT 1 FROM media_renditions WHERE asset_id=$1 AND rendition_type IN ('original','image','hls','dash','preview') LIMIT 1`,[assetId]);
    if(!rendition.rowCount)throw new Error('Media rendition is missing');
    await client.query("UPDATE media_assets SET status='ready',updated_at=now() WHERE id=$1",[assetId]);
    return {assetId,status:'ready'};
  });
}
