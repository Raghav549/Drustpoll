import { query } from './db.js';
import { randomUUID } from 'node:crypto';
import { createUploadUrl, headObject } from './storage-service.js';

export async function createAvatarUpload(userId:string,mime:string,size:number){
 const allowed=new Set(['image/jpeg','image/png','image/webp']);
 if(!allowed.has(mime))throw new Error('Profile picture must be JPG, PNG or WebP');
 if(!Number.isSafeInteger(size)||size<1||size>5_000_000)throw new Error('Profile picture must be 5 MB or smaller');
 const key=`avatars/${userId}/${randomUUID()}`;
 const uploadUrl=await createUploadUrl(key,mime,size);
 await query('INSERT INTO profile_avatar_uploads(user_id,storage_key,mime_type,byte_size,status) VALUES($1,$2,$3,$4,\'pending\') ON CONFLICT(user_id) DO UPDATE SET storage_key=EXCLUDED.storage_key,mime_type=EXCLUDED.mime_type,byte_size=EXCLUDED.byte_size,status=\'pending\',updated_at=now()',[userId,key,mime,size]);
 return {uploadUrl,storageKey:key,maxBytes:5_000_000};
}
export async function completeAvatarUpload(userId:string,storageKey:string,mime:string,size:number){
 const r=await query<{storage_key:string;mime_type:string;byte_size:number}>('SELECT storage_key,mime_type,byte_size FROM profile_avatar_uploads WHERE user_id=$1 AND status=\'pending\'',[userId]);
 if(!r.rowCount||r.rows[0].storage_key!==storageKey||r.rows[0].mime_type!==mime||Number(r.rows[0].byte_size)!==Number(size))throw new Error('Avatar upload does not match the pending upload');
 const object=await headObject(storageKey);if(Number(object.contentLength)!==Number(size)||object.contentType!==mime)throw new Error('Profile picture upload could not be verified');
 await query('UPDATE profiles SET avatar_url=$2,updated_at=now() WHERE user_id=$1',[userId,storageKey]);
 await query('UPDATE profile_avatar_uploads SET status=\'ready\',updated_at=now() WHERE user_id=$1',[userId]);
 return {ok:true,avatarUrl:storageKey};
}
