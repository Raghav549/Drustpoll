import { query } from './db.js';

type ProductCandidate={id:string;shop_id:string;title:string;description:string;price_minor:number;currency:string;inventory:number;status:string;score:number;reason:string};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

/** Commerce ranking is intentionally inventory-aware and diversity-aware; urgency/scarcity copy is never used as a ranking signal. */
export async function getRecommendedProducts(userId:string,limit=20){
  const size=Math.min(Math.max(Math.trunc(limit),1),50);
  const r=await query<ProductCandidate>(`WITH interacted AS(
    SELECT DISTINCT p.id FROM products p JOIN cart_lines cl ON cl.product_id=p.id JOIN carts ca ON ca.id=cl.cart_id WHERE ca.user_id=$1
    UNION SELECT DISTINCT ol.product_id FROM order_lines ol JOIN orders o ON o.id=ol.order_id WHERE o.buyer_id=$1
  ),
  blocked AS(SELECT blocked_id user_id FROM user_blocks WHERE blocker_id=$1 UNION SELECT blocker_id FROM user_blocks WHERE blocked_id=$1),
  recent AS(SELECT DISTINCT p.id FROM products p JOIN product_media pm ON pm.product_id=p.id WHERE p.status='active'),
  raw AS(SELECT p.id,p.shop_id,p.title,p.description,p.price_minor,p.currency,p.inventory,p.status,
    CASE WHEN p.id IN(SELECT id FROM interacted) THEN .90 ELSE .35 END relevance,
    CASE WHEN p.id IN(SELECT id FROM recent) THEN .55 ELSE .20 END freshness,
    CASE WHEN p.inventory>0 THEN 1.0 ELSE 0.0 END availability,
    CASE WHEN s.owner_id IN(SELECT followed_id FROM follows WHERE follower_id=$1 AND state='following') THEN .85 ELSE .35 END relationship,
    CASE WHEN p.inventory>0 THEN .20 ELSE 0 END diversity,
    CASE WHEN p.shop_id IN(SELECT shop_id FROM products p2 JOIN interacted i ON i.id=p2.id) THEN 'similar_to_your_activity' ELSE 'discover_from_active_shop' END reason
  FROM products p JOIN shops s ON s.id=p.shop_id
  WHERE p.status='active' AND p.inventory>0 AND NOT EXISTS(SELECT 1 FROM blocked b WHERE b.user_id=s.owner_id)
  ORDER BY p.id LIMIT 500)
  SELECT *,(.35*relevance+.20*relationship+.15*freshness+.20*availability+.10*diversity) score FROM raw ORDER BY score DESC LIMIT $2`,[userId,size*4]);
  const selected:ProductCandidate[]=[];const shops=new Set<string>();
  for(const c of r.rows){if(selected.length>=size)break;const penalty=shops.has(c.shop_id)?.18:0;if(c.score-penalty<=0&&selected.length)continue;selected.push({...c,score:clamp(Number(c.score)-penalty)});shops.add(c.shop_id);}
  return selected.map((x,position)=>({...x,position}));
}
