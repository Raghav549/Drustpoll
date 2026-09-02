import { createHash } from 'node:crypto';
import { query } from './db.js';

function bucket(experimentKey:string,userId:string){return parseInt(createHash('sha256').update(`${experimentKey}:${userId}`).digest('hex').slice(0,12),16)%10000/10000;}

export async function assignRecommendationVariant(userId:string,key:string,variants:string[]=['control','candidate']){
  if(!variants.length||variants.length>8) throw new Error('Invalid experiment variants');
  const exp=await query<{id:string;status:string;config:any}>(`SELECT id,status,config FROM recommendation_experiments WHERE key=$1`,[key]);
  if(!exp.rowCount||exp.rows[0].status!=='running') return {variant:variants[0],experimentId:null,assigned:false};
  const existing=await query<{variant:string}>(`SELECT variant FROM recommendation_assignments WHERE experiment_id=$1 AND user_id=$2`,[exp.rows[0].id,userId]);
  if(existing.rowCount) return {variant:existing.rows[0].variant,experimentId:exp.rows[0].id,assigned:true};
  const b=bucket(key,userId);const variant=variants[Math.min(variants.length-1,Math.floor(b*variants.length))];
  await query(`INSERT INTO recommendation_assignments(experiment_id,user_id,variant) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[exp.rows[0].id,userId,variant]);
  return {variant,experimentId:exp.rows[0].id,assigned:true};
}

export async function recordRecommendationExposure(userId:string,items:Array<{postId:string;creatorId:string;surface:'feed'|'reels'|'shop';position:number}>){
  if(items.length>100) throw new Error('Too many exposure events');
  for(const item of items) await query(`INSERT INTO recommendation_exposure(user_id,post_id,creator_id,surface,position) VALUES($1,$2,$3,$4,$5)`,[userId,item.postId,item.creatorId,item.surface,item.position]);
  return {accepted:items.length};
}

export async function upsertRecommendationMetric(input:{experimentId:string;userId:string;variant:string;surface:'feed'|'reels'|'shop';impressions?:number;opens?:number;meaningfulInteractions?:number;negativeFeedback?:number;watchMs?:number;completedViews?:number;uniqueCreators?:number;uniqueTopics?:number;noveltyScore?:number;diversityScore?:number}){
  const n=(v:number|undefined)=>Math.max(0,v??0);
  const r=await query(`INSERT INTO recommendation_metrics(experiment_id,user_id,variant,surface,impressions,opens,meaningful_interactions,negative_feedback,watch_ms,completed_views,unique_creators,unique_topics,novelty_score,diversity_score) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT(experiment_id,user_id,surface) DO UPDATE SET variant=EXCLUDED.variant,impressions=recommendation_metrics.impressions+EXCLUDED.impressions,opens=recommendation_metrics.opens+EXCLUDED.opens,meaningful_interactions=recommendation_metrics.meaningful_interactions+EXCLUDED.meaningful_interactions,negative_feedback=recommendation_metrics.negative_feedback+EXCLUDED.negative_feedback,watch_ms=recommendation_metrics.watch_ms+EXCLUDED.watch_ms,completed_views=recommendation_metrics.completed_views+EXCLUDED.completed_views,unique_creators=GREATEST(recommendation_metrics.unique_creators,EXCLUDED.unique_creators),unique_topics=GREATEST(recommendation_metrics.unique_topics,EXCLUDED.unique_topics),novelty_score=EXCLUDED.novelty_score,diversity_score=EXCLUDED.diversity_score,updated_at=now() RETURNING *`,[input.experimentId,input.userId,input.variant,input.surface,n(input.impressions),n(input.opens),n(input.meaningfulInteractions),n(input.negativeFeedback),n(input.watchMs),n(input.completedViews),n(input.uniqueCreators),n(input.uniqueTopics),Math.max(0,input.noveltyScore??0),Math.max(0,input.diversityScore??0)]);
  return r.rows[0];
}
