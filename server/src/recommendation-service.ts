import { query } from './db.js';

type RecommendationReason='following'|'recent_interest'|'fresh_creator'|'diverse_discovery'|'watch_pattern'|'content_match';
type Candidate={id:string;author_id:string;created_at:Date;like_count:number;comment_count:number;save_count:number;media_count:number;video_count:number;relevance:number;relationship:number;freshness:number;quality:number;novelty:number;diversity:number;safety:number;negative_feedback_risk:number;watch_affinity:number;creator_exposure:number;content_match:number};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const numberFeature=(value:unknown,fallback=0)=>{const n=Number(value);return Number.isFinite(n)?clamp(n):fallback;};
function score(c:Candidate){return c.relevance*.20+c.relationship*.14+c.quality*.14+c.freshness*.08+c.watch_affinity*.10+c.novelty*.08+c.diversity*.08+c.creator_exposure*.04+c.safety*.12+c.content_match*.05-c.negative_feedback_risk*.18;}
function redundancy(a:Candidate,b:Candidate){if(a.author_id===b.author_id)return 1;const gap=Math.abs(a.created_at.getTime()-b.created_at.getTime());return gap<15*60*1000?.30:.05;}
function reason(c:Candidate,selected:Candidate[]):RecommendationReason{if(c.watch_affinity>.72)return'watch_pattern';if(c.content_match>.75)return'content_match';if(c.relationship>.7)return'following';if(c.novelty>.75&&selected.some(x=>x.author_id!==c.author_id))return'diverse_discovery';if(c.freshness>.75)return'fresh_creator';return'recent_interest';}

/**
 * Research-first feed policy. The weights are an experimental starting point,
 * not a claim of proven optimality. Production changes require offline evaluation
 * and controlled experiments with diversity, safety, privacy and negative-feedback guardrails.
 */
export async function getRecommendedPosts(userId:string,limit=20){
 const size=Math.min(Math.max(Math.trunc(limit),1),50),candidateLimit=Math.min(size*12,600);
 const result=await query<Candidate>(`WITH followed AS(SELECT followed_id FROM follows WHERE follower_id=$1 AND state='following'),
 seen AS(SELECT DISTINCT post_id FROM recommendation_events WHERE user_id=$1 AND post_id IS NOT NULL AND created_at>now()-interval '14 days'),
 blocked AS(SELECT blocked_id user_id FROM user_blocks WHERE blocker_id=$1 UNION SELECT blocker_id FROM user_blocks WHERE blocked_id=$1),
 muted AS(SELECT muted_id user_id FROM user_mutes WHERE muter_id=$1),
 watch AS(SELECT post_id,MAX(COALESCE(watched_ms,0)) watched_ms,MAX(COALESCE(video_duration_ms,0)) duration_ms,COUNT(*) FILTER(WHERE event_type='replay')::int replays FROM reel_watch_events WHERE user_id=$1 GROUP BY post_id),
 exposures AS(SELECT creator_id,COUNT(*)::int n FROM recommendation_exposure WHERE user_id=$1 AND surface IN('feed','reels') AND shown_at>now()-interval '7 days' GROUP BY creator_id),
 negative AS(SELECT DISTINCT post_id FROM recommendation_events WHERE user_id=$1 AND post_id IS NOT NULL AND event_type IN('hide','not_interested','report') AND created_at>now()-interval '30 days'),
 raw AS(SELECT p.id,p.author_id,p.created_at,
 COALESCE((SELECT count(*)::int FROM post_reactions r WHERE r.post_id=p.id),0) like_count,
 COALESCE((SELECT count(*)::int FROM comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL),0) comment_count,
 COALESCE((SELECT count(*)::int FROM post_saves s WHERE s.post_id=p.id),0) save_count,
 COALESCE((SELECT count(*)::int FROM post_media m WHERE m.post_id=p.id),0) media_count,
 COALESCE((SELECT count(*)::int FROM post_media m WHERE m.post_id=p.id AND m.media_type='video'),0) video_count,
 CASE WHEN p.author_id IN(SELECT followed_id FROM followed) THEN 1.0 ELSE .35 END relationship,
 CASE WHEN p.created_at>now()-interval '6 hours' THEN 1.0 WHEN p.created_at>now()-interval '1 day' THEN .75 WHEN p.created_at>now()-interval '3 days' THEN .5 ELSE .2 END freshness,
 CASE WHEN p.author_id IN(SELECT followed_id FROM followed) THEN .85 ELSE .45 END relevance,
 CASE WHEN p.id IN(SELECT post_id FROM seen) THEN .12 ELSE .82 END novelty,
 CASE WHEN w.post_id IS NULL THEN .55 ELSE LEAST(1.0,GREATEST(.05,(w.watched_ms::double precision/GREATEST(w.duration_ms,1))*.75+LEAST(1,w.replays*.08))) END watch_affinity,
 CASE WHEN COALESCE(e.n,0)=0 THEN 1.0 WHEN e.n=1 THEN .75 WHEN e.n<4 THEN .45 ELSE .15 END creator_exposure,
 CASE WHEN cf.status='ready' THEN
   LEAST(1.0,GREATEST(0.0,
     COALESCE((cf.fused_features->>'relevance')::double precision,0.0)*.55+
     COALESCE((cf.fused_features->>'quality')::double precision,0.0)*.25+
     COALESCE((cf.fused_features->>'novelty')::double precision,0.0)*.20))
   ELSE 0.0 END content_match,
 1.0 safety,
 CASE WHEN n.post_id IS NOT NULL THEN 1.0 ELSE 0.0 END negative_feedback_risk
 FROM posts p LEFT JOIN watch w ON w.post_id=p.id LEFT JOIN exposures e ON e.creator_id=p.author_id LEFT JOIN negative n ON n.post_id=p.id
 LEFT JOIN content_features cf ON cf.post_id=p.id AND cf.status='ready'
 WHERE p.deleted_at IS NULL AND(p.visibility='public' OR p.author_id=$1 OR p.author_id IN(SELECT followed_id FROM followed))
 AND NOT EXISTS(SELECT 1 FROM blocked b WHERE b.user_id=p.author_id) AND NOT EXISTS(SELECT 1 FROM muted m WHERE m.user_id=p.author_id)
 ORDER BY p.created_at DESC LIMIT $2)
 SELECT *,LEAST(1.0,(like_count+comment_count*2+save_count*3+media_count)/100.0) quality FROM raw`,[userId,candidateLimit]);
 const candidates=result.rows.map(c=>({...c,relevance:clamp(Number(c.relevance)),relationship:clamp(Number(c.relationship)),freshness:clamp(Number(c.freshness)),quality:clamp(Number(c.quality)),novelty:clamp(Number(c.novelty)),diversity:clamp(Number(c.diversity)),safety:clamp(Number(c.safety)),negative_feedback_risk:clamp(Number(c.negative_feedback_risk)),watch_affinity:clamp(Number(c.watch_affinity)),creator_exposure:clamp(Number(c.creator_exposure)),content_match:numberFeature(c.content_match)}));
 const selected:Candidate[]=[];const remaining=[...candidates];
 while(selected.length<size&&remaining.length){let best=0,bestValue=-Infinity;for(let i=0;i<remaining.length;i++){const c=remaining[i];const red=selected.length?Math.max(...selected.map(x=>redundancy(c,x))):0;const value=score(c)+(1-red)*.12;if(value>bestValue){bestValue=value;best=i;}}selected.push(remaining.splice(best,1)[0]);}
 return selected.map((c,index)=>({id:c.id,authorId:c.author_id,position:index,reason:reason(c,selected.slice(0,index)),score:Number(score(c).toFixed(6))}));
}
