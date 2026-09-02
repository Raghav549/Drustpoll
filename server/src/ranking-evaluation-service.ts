import { query } from './db.js';

/** Offline evaluation over logged recommendation outcomes. No online metric is treated as causal evidence. */
export async function evaluateRecommendationWindow(startIso:string,endIso:string,experimentId?:string){
  const r=await query(`SELECT COALESCE(variant,'unknown') variant,surface,SUM(impressions)::bigint impressions,SUM(opens)::bigint opens,SUM(meaningful_interactions)::bigint meaningful_interactions,SUM(negative_feedback)::bigint negative_feedback,SUM(watch_ms)::bigint watch_ms,SUM(completed_views)::bigint completed_views,SUM(unique_creators)::bigint unique_creators,SUM(unique_topics)::bigint unique_topics,AVG(novelty_score)::float8 novelty_score,AVG(diversity_score)::float8 diversity_score FROM recommendation_metrics WHERE updated_at>=$1 AND updated_at<$2 ${experimentId?'AND experiment_id=$3':''} GROUP BY variant,surface ORDER BY surface,variant`,experimentId?[startIso,endIso,experimentId]:[startIso,endIso]);
  return r.rows.map(x=>({variant:x.variant,surface:x.surface,impressions:Number(x.impressions),openRate:x.impressions?Number(x.opens)/Number(x.impressions):0,meaningfulRate:x.impressions?Number(x.meaningful_interactions)/Number(x.impressions):0,negativeRate:x.impressions?Number(x.negative_feedback)/Number(x.impressions):0,completionRate:x.opens?Number(x.completed_views)/Number(x.opens):0,avgWatchMs:x.opens?Number(x.watch_ms)/Number(x.opens):0,uniqueCreators:Number(x.unique_creators),uniqueTopics:Number(x.unique_topics),noveltyScore:Number(x.novelty_score??0),diversityScore:Number(x.diversity_score??0)}));
}

export function shouldPauseVariant(metric:{impressions:number;negativeRate:number;meaningfulRate:number;completionRate:number},baseline:{negativeRate:number;meaningfulRate:number;completionRate:number}){
  if(metric.impressions<1000) return {pause:false,reason:'insufficient_sample'};
  const negativeBad=metric.negativeRate>Math.max(.03,baseline.negativeRate*1.25);
  const valueBad=metric.meaningfulRate<baseline.meaningfulRate*.90&&metric.completionRate<baseline.completionRate*.90;
  return {pause:negativeBad||valueBad,reason:negativeBad?'negative_feedback_guardrail':valueBad?'user_value_guardrail':'within_guardrails'};
}
