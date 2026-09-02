import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config.js';

function client(){
  if(!config.storage.bucket||!config.storage.accessKeyId||!config.storage.secretAccessKey)throw new Error('MEDIA_STORAGE_NOT_CONFIGURED');
  return new S3Client({region:config.storage.region,endpoint:config.storage.endpoint||undefined,forcePathStyle:config.storage.forcePathStyle,credentials:{accessKeyId:config.storage.accessKeyId,secretAccessKey:config.storage.secretAccessKey}});
}
export async function createUploadUrl(key:string,mime:string,size:number){
  const command=new PutObjectCommand({Bucket:config.storage.bucket,Key:key,ContentType:mime,ContentLength:size,Metadata:{drustpoll:'media'}});
  return getSignedUrl(client(),command,{expiresIn:config.storage.uploadTtlSeconds,signableHeaders:new Set(['content-type','content-length'])});
}
export async function headObject(key:string){
  const response=await client().send(new HeadObjectCommand({Bucket:config.storage.bucket,Key:key}));
  return {contentLength:Number(response.ContentLength??0),contentType:response.ContentType??'',etag:response.ETag??null};
}
export async function createPlaybackUrl(key:string){
  const command=new GetObjectCommand({Bucket:config.storage.bucket,Key:key});
  return getSignedUrl(client(),command,{expiresIn:config.storage.playbackTtlSeconds});
}
