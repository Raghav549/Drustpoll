import { query } from './db.js';

export async function getPrivacySettings(userId:string){const r=await query(`SELECT COALESCE(p.profile_visibility,'public') profile_visibility,COALESCE(p.activity_visibility,'followers') activity_visibility,COALESCE(p.discoverability,'discoverable') discoverability,COALESCE(p.message_requests,'followers') message_requests,COALESCE(s.personalized_recommendations,true) personalized_recommendations,COALESCE(s.personalized_ads,false) personalized_ads FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN privacy_settings s ON s.user_id=u.id WHERE u.id=$1`,[userId]);if(!r.rowCount)throw new Error('User not found');return r.rows[0];}

export async function updatePrivacySettings(userId:string,input:Record<string,unknown>){
 const profileVisibility=String(input.profileVisibility??'public');const activityVisibility=String(input.activityVisibility??'followers');const discoverability=String(input.discoverability??'discoverable');const messageRequests=String(input.messageRequests??'followers');
 if(!['public','followers','private'].includes(profileVisibility)||!['everyone','followers','only_me'].includes(activityVisibility)||!['discoverable','hidden'].includes(discoverability)||!['everyone','followers','nobody'].includes(messageRequests))throw new Error('Invalid privacy setting');
 const rec=input.personalizedRecommendations===undefined?true:Boolean(input.personalizedRecommendations);const ads=input.personalizedAds===undefined?false:Boolean(input.personalizedAds);
 await query(`INSERT INTO profiles(user_id,profile_visibility,activity_visibility,discoverability,message_requests) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id) DO UPDATE SET profile_visibility=EXCLUDED.profile_visibility,activity_visibility=EXCLUDED.activity_visibility,discoverability=EXCLUDED.discoverability,message_requests=EXCLUDED.message_requests`,[userId,profileVisibility,activityVisibility,discoverability,messageRequests]);
 await query(`INSERT INTO privacy_settings(user_id,personalized_recommendations,personalized_ads) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET personalized_recommendations=EXCLUDED.personalized_recommendations,personalized_ads=EXCLUDED.personalized_ads,updated_at=now()`,[userId,rec,ads]);
 await query(`INSERT INTO privacy_audit_events(actor_id,subject_id,action,resource_type,resource_id,allowed) VALUES($1,$1,'privacy_settings_update','privacy',$1,true)`,[userId]);
 return getPrivacySettings(userId);
}

export async function isDiscoverable(userId:string,targetId:string){if(userId===targetId)return true;const r=await query(`SELECT COALESCE(p.discoverability,'discoverable') discoverability FROM profiles p WHERE p.user_id=$1`,[targetId]);return r.rowCount>0&&r.rows[0].discoverability==='discoverable';}
