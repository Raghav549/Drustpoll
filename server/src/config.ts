import { strict as assert } from 'node:assert';
function required(name:string):string{const value=process.env[name];assert(value,`${name} is required`);return value;}
export const config={
  port:Number(process.env.PORT??4000),databaseUrl:required('DATABASE_URL'),sessionSecret:required('SESSION_PEPPER'),passwordPepper:required('PASSWORD_PEPPER'),publicOrigin:process.env.PUBLIC_ORIGIN??'https://drustpoll.app',secureCookies:process.env.NODE_ENV!=='development',
  storage:{endpoint:process.env.S3_ENDPOINT??'',region:process.env.S3_REGION??'auto',bucket:process.env.S3_BUCKET??'',accessKeyId:process.env.S3_ACCESS_KEY_ID??'',secretAccessKey:process.env.S3_SECRET_ACCESS_KEY??'',forcePathStyle:process.env.S3_FORCE_PATH_STYLE==='true',uploadTtlSeconds:Math.min(Math.max(Number(process.env.S3_UPLOAD_TTL_SECONDS??900),60),3600),playbackTtlSeconds:Math.min(Math.max(Number(process.env.S3_PLAYBACK_TTL_SECONDS??300),60),1800)},
  extraction:{endpoint:process.env.MULTIMODAL_EXTRACTOR_URL??'',apiKey:process.env.MULTIMODAL_EXTRACTOR_API_KEY??'',timeoutMs:Math.min(Math.max(Number(process.env.MULTIMODAL_EXTRACTOR_TIMEOUT_MS??30000),1000),120000)},
  mediaInspection:{endpoint:process.env.MEDIA_INSPECTOR_URL??'',apiKey:process.env.MEDIA_INSPECTOR_API_KEY??'',timeoutMs:Math.min(Math.max(Number(process.env.MEDIA_INSPECTOR_TIMEOUT_MS??15000),1000),60000)},
};
export const durations={sessionMs:1000*60*60*24*30,absoluteSessionMs:1000*60*60*24*180,otpMs:1000*60*5,passwordResetMs:1000*60*15};
