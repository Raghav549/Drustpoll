import { query, withTransaction } from './db.js';
import { randomUUID } from 'node:crypto';

const clean=(v:unknown,max:number)=>String(v??'').trim().slice(0,max);
const hiddenKind=new Set(['word','topic']);

export async function listBlockedUsers(userId:string){
  const r=await query(`SELECT u.id,u.username,u.display_name,p.avatar_url,b.created_at FROM user_blocks b JOIN users u ON u.id=b.blocked_id LEFT JOIN profiles p ON p.user_id=u.id WHERE b.blocker_id=$1 ORDER BY b.created_at DESC LIMIT 200`,[userId]);
  return r.rows;
}
export async function listMutedUsers(userId:string){
  const r=await query(`SELECT u.id,u.username,u.display_name,p.avatar_url,m.created_at FROM user_mutes m JOIN users u ON u.id=m.muted_id LEFT JOIN profiles p ON p.user_id=u.id WHERE m.muter_id=$1 ORDER BY m.created_at DESC LIMIT 200`,[userId]);
  return r.rows;
}
export async function listHiddenTerms(userId:string){
  const r=await query(`SELECT term,kind,created_at FROM user_hidden_terms WHERE user_id=$1 ORDER BY created_at DESC LIMIT 500`,[userId]);
  return r.rows;
}
export async function setHiddenTerm(userId:string,term:string,kind:string,hidden:boolean){
  const t=clean(term,120).toLowerCase(); const k=clean(kind,20);
  if(!t||!hiddenKind.has(k)) throw new Error('Invalid hidden term');
  if(hidden) await query(`INSERT INTO user_hidden_terms(user_id,term,kind) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[userId,t,k]);
  else await query(`DELETE FROM user_hidden_terms WHERE user_id=$1 AND term=$2 AND kind=$3`,[userId,t,k]);
  return {term:t,kind:k,hidden};
}
export async function resetRecommendations(userId:string){
  await withTransaction(async client=>{
    await client.query(`DELETE FROM recommendation_feedback WHERE user_id=$1`,[userId]).catch(()=>undefined);
    await client.query(`DELETE FROM recommendation_exposures WHERE user_id=$1`,[userId]).catch(()=>undefined);
    await client.query(`DELETE FROM discovery_preferences WHERE user_id=$1`,[userId]).catch(()=>undefined);
    await client.query(`INSERT INTO privacy_audit_events(actor_id,subject_id,action,resource_type,resource_id,allowed) VALUES($1,$1,'recommendation_reset','recommendation',$1,true)`,[userId]);
  });
  return {ok:true,resetAt:new Date().toISOString()};
}
export async function listPrivacyAudit(userId:string){
  const r=await query(`SELECT id,action,resource_type,resource_id,allowed,created_at FROM privacy_audit_events WHERE subject_id=$1 ORDER BY created_at DESC LIMIT 200`,[userId]);
  return r.rows;
}
export async function getDataInventory(userId:string){
  const r=await query(`SELECT (SELECT count(*) FROM posts WHERE author_id=$1)::int post_count,(SELECT count(*) FROM comments WHERE author_id=$1)::int comment_count,(SELECT count(*) FROM user_blocks WHERE blocker_id=$1)::int blocked_count,(SELECT count(*) FROM user_mutes WHERE muter_id=$1)::int muted_count,(SELECT count(*) FROM privacy_audit_events WHERE subject_id=$1)::int privacy_event_count`,[userId]);
  return {categories:[
    {key:'account',label:'Account',purpose:'Authentication and account access',retention:'While the account is active'},
    {key:'social',label:'Social activity',purpose:'Deliver posts, comments, follows and conversations',retention:'Until deleted or otherwise required'},
    {key:'preferences',label:'Preferences',purpose:'Remember privacy, accessibility and recommendation choices',retention:'Until changed or deleted'},
    {key:'commerce',label:'Commerce',purpose:'Process carts, orders, delivery and support',retention:'As required for order and legal records'},
    {key:'security',label:'Security events',purpose:'Detect abuse, protect sessions and investigate incidents',retention:'Limited operational retention'}
  ],counts:r.rows[0]??{}};
}
export async function createDataRequest(userId:string,kind:'export'|'delete'){
  const r=await query(`INSERT INTO data_requests(user_id,kind,status,details) VALUES($1,$2,'requested',$3) RETURNING id,kind,status,requested_at`,[userId,kind,JSON.stringify({requestId:randomUUID()})]);
  await query(`INSERT INTO privacy_audit_events(actor_id,subject_id,action,resource_type,resource_id,allowed) VALUES($1,$1,$2,'data_request',$3,true)`,[userId,`data_${kind}_requested`,r.rows[0].id]);
  return r.rows[0];
}
export async function listDataRequests(userId:string){const r=await query(`SELECT id,kind,status,requested_at,completed_at,details FROM data_requests WHERE user_id=$1 ORDER BY requested_at DESC LIMIT 50`,[userId]);return r.rows;}
export async function listSecurityAlerts(userId:string){const r=await query(`SELECT id,event_type,severity,message,acknowledged_at,created_at FROM security_alerts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[userId]);return r.rows;}
export async function acknowledgeSecurityAlert(userId:string,id:string){const r=await query(`UPDATE security_alerts SET acknowledged_at=COALESCE(acknowledged_at,now()) WHERE id=$1 AND user_id=$2 RETURNING id,acknowledged_at`,[id,userId]);if(!r.rows[0])throw new Error('Security alert not found');return r.rows[0];}
export async function listPermissions(userId:string){
  return [
    {key:'camera',label:'Camera',scope:'device',state:'controlled_by_os',description:'Used only when you choose to capture media.'},
    {key:'microphone',label:'Microphone',scope:'device',state:'controlled_by_os',description:'Used only for features that require audio capture.'},
    {key:'photos',label:'Photos & media',scope:'device',state:'controlled_by_os',description:'Used only when you choose media from your device.'},
    {key:'notifications',label:'Notifications',scope:'device',state:'controlled_by_os',description:'Optional delivery of alerts; never required for core privacy.'},
    {key:'location',label:'Location',scope:'device',state:'controlled_by_os',description:'Optional and only used where a location feature is explicitly enabled.'},
  ];
}
