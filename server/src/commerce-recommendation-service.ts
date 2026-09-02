import { query } from './db.js';
type ProductCandidate={id:string;shop_id:string;title:string;description:string;price_minor:number;currency:string;inventory:number;status:string;behavior_relevance:number;relationship:number;availability:number;shop_affinity:number;novelty:number;negative_risk:number;category_affinity:number;seller_quality:number;price_fit:number;score:number;reason:string};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const decay=(ageDays:number)=>Math.exp(-Math.max(0,ageDays)/30);
export async function recordCommerceEvent(userId:string,input:{productId:string;eventType:'impression'|'open'|'view'|'add_cart'|'remove_cart'|'purchase'|'save'|'not_interested';dwellMs?:number;clientEventId?:string}){if(!input.productId||!input.eventType)throw new Error('Invalid commerce event');const dwell=input.dwellMs==null?null:Number(input.dwellMs);if(dwell!==null&&(!Number.isSafeInteger(dwell)||dwell<0||dwell>86400000))throw new Error('Invalid dwell');const clientEventId=input.clientEventId?.trim()||null;if(clientEventId&&!/^[A-Za-z0-9._~-]{8,128}$/.test(clientEventId))throw new Error('Invalid client event id');const r=await query(`INSERT INTO commerce_events(user_id,product_id,event_type,dwell_ms,client_event_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,client_event_id) DO NOTHING RETURNING id`,[userId,input.productId,input.eventType,dwell,clientEventId]);return{accepted:Boolean(r.rowCount)};}
export async function getRecommendedProducts(userId:string,limit=20){const size=Math.min(Math.max(Math.trunc(limit),1),50);const r=await query<ProductCandidate>(`WITH behavior AS(SELECT ce.product_id,SUM((CASE ce.event_type WHEN 'purchase' THEN 3.0 WHEN 'add_cart' THEN 1.7 WHEN 'save' THEN 1.2 WHEN 'view' THEN .65 WHEN 'open' THEN .30 WHEN 'not_interested' THEN -2.0 WHEN 'remove_cart' THEN -.8 ELSE .05 END)*EXP(-GREATEST(0,EXTRACT(EPOCH FROM(now()-ce.created_at))/86400.0)/30.0)) signal,MAX(ce.created_at) last_event FROM commerce_events ce WHERE ce.user_id=$1 AND ce.created_at>now()-interval '180 days' GROUP BY ce.product_id),
blocked AS(SELECT blocked_id user_id FROM user_blocks WHERE blocker_id=$1 UNION SELECT blocker_id FROM user_blocks WHERE blocked_id=$1),
followed AS(SELECT followed_id FROM follows WHERE follower_id=$1 AND state='following'),
shop_affinity AS(SELECT p.shop_id,SUM(b.signal*EXP(-GREATEST(0,EXTRACT(EPOCH FROM(now()-b.last_event))/86400.0)/45.0)) signal FROM products p JOIN behavior b ON b.product_id=p.id GROUP BY p.shop_id),
category_affinity AS(SELECT lower(COALESCE(p.category,'')) category,SUM(b.signal) signal FROM products p JOIN behavior b ON b.product_id=p.id WHERE COALESCE(p.category,'')<>'' GROUP BY lower(p.category)),
seller_quality AS(SELECT s.id shop_id,LEAST(1,GREATEST(0,(COALESCE((SELECT AVG(CASE WHEN o.status IN('delivered','paid') THEN 1 ELSE 0 END) FROM orders o JOIN order_lines ol ON ol.order_id=o.id JOIN products pp ON pp.id=ol.product_id WHERE pp.shop_id=s.id),.5)))) quality FROM shops s),
price_stats AS(SELECT AVG(p.price_minor)::double precision avg_price FROM products p WHERE p.status='active' AND p.inventory>0),
raw AS(SELECT p.id,p.shop_id,p.title,p.description,p.price_minor,p.currency,p.inventory,p.status,
CASE WHEN b.signal IS NULL THEN .15 ELSE LEAST(1,GREATEST(0,(b.signal+1)/4.0)) END behavior_relevance,
CASE WHEN s.owner_id IN(SELECT followed_id FROM followed) THEN .9 ELSE .25 END relationship,
CASE WHEN p.inventory>20 THEN 1.0 WHEN p.inventory>5 THEN .8 ELSE .55 END availability,
CASE WHEN sa.signal IS NULL THEN .25 ELSE LEAST(1,GREATEST(0,(sa.signal+1)/5.0)) END shop_affinity,
CASE WHEN b.product_id IS NULL THEN .85 ELSE .2 END novelty,
CASE WHEN b.signal<0 THEN 1 ELSE 0 END negative_risk,
CASE WHEN COALESCE(cat.signal,0)>0 THEN LEAST(1,cat.signal/5.0) ELSE .15 END category_affinity,
COALESCE(sq.quality,.5) seller_quality,
CASE WHEN ps.avg_price<=0 THEN .5 ELSE clamp(1-ABS(p.price_minor-ps.avg_price)/GREATEST(ps.avg_price*2,1)) END price_fit
FROM products p JOIN shops s ON s.id=p.shop_id LEFT JOIN behavior b ON b.product_id=p.id LEFT JOIN shop_affinity sa ON sa.shop_id=p.shop_id LEFT JOIN category_affinity cat ON lower(COALESCE(cat.category,''))=lower(COALESCE(p.category,'')) LEFT JOIN seller_quality sq ON sq.shop_id=p.shop_id CROSS JOIN price_stats ps
WHERE p.status='active' AND p.inventory>0 AND NOT EXISTS(SELECT 1 FROM blocked x WHERE x.user_id=s.owner_id)),
scored AS(SELECT *,GREATEST(0,LEAST(1,.26*behavior_relevance+.12*relationship+.12*availability+.12*shop_affinity+.12*novelty+.12*category_affinity+.08*seller_quality+.06*price_fit-.30*negative_risk)) score FROM raw)
SELECT * FROM scored ORDER BY score DESC LIMIT $2`,[userId,size*6]);
const selected:ProductCandidate[]=[];const shops=new Set<string>();const categories=new Set<string>();for(const c of r.rows){if(selected.length>=size)break;const diversityPenalty=shops.has(c.shop_id)?.14:0;const categoryPenalty=categories.has((c as any).category)?.06:0;const score=clamp(Number(c.score)-diversityPenalty-categoryPenalty);if(score<=0&&selected.length)continue;selected.push({...c,score,reason:Number(c.behavior_relevance)>.62?'similar_to_activity':Number(c.category_affinity)>.55?'category_affinity':shops.has(c.shop_id)?'diverse_shop':'new_shop'});shops.add(c.shop_id);categories.add((c as any).category??'');}return selected.map((x,position)=>({...x,position}));}
