import {query,withTransaction} from './db.js';
const clean=(v:unknown,max:number)=>String(v??'').trim().slice(0,max);
export async function getAdForViewer(userId:string,context:string){
 const ctx=clean(context,120)||'feed';
 const r=await query(`SELECT c.id creative_id,c.headline,c.body,c.cta,c.destination_url,c.media_id,
 a.id campaign_id,a.objective,a.currency,a.budget_minor,
 COALESCE(dc.max_impressions_per_user_per_day,3)::int daily_cap,
 COALESCE(dc.explanation_enabled,true) explanation_enabled,
 COALESCE(dc.contextual_only,true) contextual_only
 FROM ad_creatives c JOIN ad_campaigns a ON a.id=c.campaign_id
 LEFT JOIN ad_delivery_controls dc ON dc.advertiser_user_id=a.advertiser_user_id
 WHERE c.status='active' AND a.status='active'
 AND (a.starts_at IS NULL OR a.starts_at<=now()) AND (a.ends_at IS NULL OR a.ends_at>now())
 AND NOT EXISTS(SELECT 1 FROM ad_feedback f WHERE f.user_id=$1 AND f.creative_id=c.id AND f.signal IN('hide','not_relevant','report'))
 AND (COALESCE(dc.max_impressions_per_user_per_day,3)=0 OR (SELECT COUNT(*) FROM ad_impressions ai WHERE ai.user_id=$1 AND ai.creative_id=c.id AND ai.shown_at>=date_trunc('day',now())) < COALESCE(dc.max_impressions_per_user_per_day,3))
 ORDER BY a.created_at DESC,c.created_at DESC LIMIT 1`,[userId]);
 if(!r.rows[0])return {ad:null};
 const x=r.rows[0];
 await withTransaction(async client=>{await client.query('INSERT INTO ad_impressions(user_id,creative_id) VALUES($1,$2)',[userId,x.creative_id]);await client.query('INSERT INTO ad_delivery_events(user_id,creative_id,reason,explanation) VALUES($1,$2,$3,$4)',[userId,x.creative_id,'eligible',JSON.stringify({context:ctx,contextualOnly:Boolean(x.contextual_only),frequencyCapPerDay:Number(x.daily_cap),sensitiveInferenceTargeting:false})]);});
 return {ad:{...x,context:ctx,why:x.explanation_enabled?`Shown for ${ctx} context; repetition is capped and sensitive inference is disabled.`:null}};
}
export async function adFeedback(userId:string,creativeId:string,signal:string){if(!['hide','not_relevant','report','why_this'].includes(signal))throw new Error('Invalid ad feedback');return (await query('INSERT INTO ad_feedback(user_id,creative_id,signal) VALUES($1,$2,$3) RETURNING id,signal,created_at',[userId,creativeId,signal])).rows[0];}
