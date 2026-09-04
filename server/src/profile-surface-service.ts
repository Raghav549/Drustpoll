import { query, withTransaction } from './db.js';

type ProfileTab='posts'|'videos'|'collections'|'tagged'|'saved'|'shop';
function safeLimit(value:number,max=50){return Math.min(Math.max(Number.isFinite(value)?Math.trunc(value):20,1),max);}

async function assertProfileVisible(viewerId:string,targetId:string){
 const r=await query<{id:string}>('SELECT u.id FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=$1 AND (u.id=$2 OR COALESCE(p.profile_visibility,\'public\')=\'public\' OR (COALESCE(p.profile_visibility,\'public\')=\'followers\' AND EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.followed_id=u.id AND f.state=\'following\'))) AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$2 AND b.blocked_id=u.id) OR (b.blocker_id=u.id AND b.blocked_id=$2))',[targetId,viewerId]);
 if(!r.rowCount)throw new Error('Profile not found');
}

async function baseProfile(viewerId:string,targetId:string){
 await assertProfileVisible(viewerId,targetId);
 const r=await query(`SELECT u.id user_id,u.username,u.display_name,p.bio,p.avatar_url,p.website_url,p.profile_visibility,p.activity_visibility,p.discoverability,
 COALESCE((SELECT count(*)::int FROM follows f WHERE f.followed_id=u.id AND f.state='following'),0) follower_count,
 COALESCE((SELECT count(*)::int FROM follows f WHERE f.follower_id=u.id AND f.state='following'),0) following_count,
 COALESCE((SELECT count(*)::int FROM posts x WHERE x.author_id=u.id AND x.deleted_at IS NULL),0) post_count,
 COALESCE((SELECT count(*)::int FROM posts x JOIN post_media m ON m.post_id=x.id WHERE x.author_id=u.id AND x.deleted_at IS NULL AND m.media_type='video'),0) video_count,
 EXISTS(SELECT 1 FROM follows me WHERE me.follower_id=$1 AND me.followed_id=u.id AND me.state='following') following,
 EXISTS(SELECT 1 FROM follows req WHERE req.follower_id=$1 AND req.followed_id=u.id AND req.state='requested') requested,
 (SELECT state FROM follows rel WHERE rel.follower_id=$1 AND rel.followed_id=u.id LIMIT 1) relationship_state,
 EXISTS(SELECT 1 FROM profile_verifications v WHERE v.user_id=u.id AND v.status='verified') verified,
 COALESCE((SELECT v.label FROM profile_verifications v WHERE v.user_id=u.id AND v.status='verified' LIMIT 1),'') verification_label,
 ci.category creator_category,ci.bio_public creator_bio,si.seller_status seller_status,sh.id shop_id,sh.name shop_name,
 pl.city,pl.region,pl.country_code,pl.precision location_precision,pl.discoverable location_discoverable
 FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN profile_creator_info ci ON ci.user_id=u.id LEFT JOIN profile_seller_info si ON si.user_id=u.id LEFT JOIN shops sh ON sh.id=si.shop_id LEFT JOIN profile_locations pl ON pl.user_id=u.id WHERE u.id=$2`,[viewerId,targetId]);
 return r.rows[0]??null;
}

export async function getProfileSurface(viewerId:string,targetId:string){return baseProfile(viewerId,targetId);}
export async function getMutualContext(viewerId:string,targetId:string){
 await assertProfileVisible(viewerId,targetId);
 const r=await query(`SELECT u.id,u.username,u.display_name,p.avatar_url FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id IN(SELECT f1.followed_id FROM follows f1 WHERE f1.follower_id=$1 AND f1.state='following' INTERSECT SELECT f2.followed_id FROM follows f2 WHERE f2.follower_id=$2 AND f2.state='following') ORDER BY u.username LIMIT 12`,[viewerId,targetId]);
 return{count:r.rowCount??0,people:r.rows};
}

export async function listFollowers(viewerId:string,targetId:string,limit=50,before?:string){await assertProfileVisible(viewerId,targetId);const size=safeLimit(limit,100);const r=await query(`SELECT u.id,u.username,u.display_name,p.avatar_url,f.created_at FROM follows f JOIN users u ON u.id=f.follower_id LEFT JOIN profiles p ON p.user_id=u.id WHERE f.followed_id=$1 AND f.state='following' AND ($2::timestamptz IS NULL OR f.created_at<$2::timestamptz) ORDER BY f.created_at DESC LIMIT $3`,[targetId,before??null,size+1]);const rows=r.rows.slice(0,size);return{people:rows,nextBefore:r.rows.length>size?new Date(rows[rows.length-1].created_at).toISOString():null};}
export async function listFollowing(viewerId:string,targetId:string,limit=50,before?:string){await assertProfileVisible(viewerId,targetId);const size=safeLimit(limit,100);const r=await query(`SELECT u.id,u.username,u.display_name,p.avatar_url,f.created_at FROM follows f JOIN users u ON u.id=f.followed_id LEFT JOIN profiles p ON p.user_id=u.id WHERE f.follower_id=$1 AND f.state='following' AND ($2::timestamptz IS NULL OR f.created_at<$2::timestamptz) ORDER BY f.created_at DESC LIMIT $3`,[targetId,before??null,size+1]);const rows=r.rows.slice(0,size);return{people:rows,nextBefore:r.rows.length>size?new Date(rows[rows.length-1].created_at).toISOString():null};}

async function listPosts(viewerId:string,targetId:string,tab:ProfileTab,limit=30,before?:string){
 await assertProfileVisible(viewerId,targetId);const size=safeLimit(limit,50);let extra='';const params:[string,string,string|null,number]=[viewerId,targetId,before??null,size+1];
 if(tab==='videos')extra=`AND EXISTS(SELECT 1 FROM post_media vm WHERE vm.post_id=p.id AND vm.media_type='video')`;
 if(tab==='tagged')extra=`AND EXISTS(SELECT 1 FROM profile_tagged_posts tp WHERE tp.post_id=p.id AND tp.tagged_user_id=$2)`;
 if(tab==='saved')extra=`AND EXISTS(SELECT 1 FROM post_saves ps WHERE ps.post_id=p.id AND ps.user_id=$2)`;
 const r=await query(`SELECT p.id,p.author_id,p.caption,p.visibility,p.created_at,u.username,u.display_name,pf.avatar_url,
 COALESCE((SELECT count(*)::int FROM post_reactions rr WHERE rr.post_id=p.id),0) like_count,
 COALESCE((SELECT count(*)::int FROM comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL),0) comment_count,
 COALESCE(json_agg(json_build_object('id',m.id,'type',m.media_type,'storageKey',m.storage_key,'width',m.width,'height',m.height,'durationMs',m.duration_ms,'alt',m.alt_text) ORDER BY m.sort_order) FILTER(WHERE m.id IS NOT NULL),'[]'::json) media
 FROM posts p JOIN users u ON u.id=p.author_id LEFT JOIN profiles pf ON pf.user_id=u.id LEFT JOIN post_media m ON m.post_id=p.id
 WHERE p.deleted_at IS NULL AND p.author_id=$2 ${extra} AND (p.author_id=$1 OR p.visibility='public' OR p.visibility='followers' AND EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=$1 AND f.followed_id=$2 AND f.state='following'))
 AND ($3::timestamptz IS NULL OR p.created_at<$3::timestamptz) GROUP BY p.id,u.id,pf.avatar_url ORDER BY p.created_at DESC,p.id DESC LIMIT $4`,params);
 const rows=r.rows.slice(0,size);return{posts:rows,nextBefore:r.rows.length>size?new Date(rows[rows.length-1].created_at).toISOString():null};
}
export async function listProfilePosts(viewerId:string,targetId:string,limit=30,before?:string){return listPosts(viewerId,targetId,'posts',limit,before);}
export async function listProfileVideos(viewerId:string,targetId:string,limit=30,before?:string){return listPosts(viewerId,targetId,'videos',limit,before);}
export async function listTaggedPosts(viewerId:string,targetId:string,limit=30,before?:string){return listPosts(viewerId,targetId,'tagged',limit,before);}
export async function listSavedPosts(viewerId:string,limit=30,before?:string){return listPosts(viewerId,viewerId,'saved',limit,before);}

export async function listCollections(viewerId:string,targetId:string){await assertProfileVisible(viewerId,targetId);const r=await query(`SELECT c.id,c.name,c.description,c.visibility,c.created_at,COUNT(i.post_id)::int item_count FROM profile_collections c LEFT JOIN profile_collection_items i ON i.collection_id=c.id WHERE c.user_id=$1 AND (c.user_id=$2 OR c.visibility='public' OR c.visibility='followers' AND EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.followed_id=c.user_id AND f.state='following')) GROUP BY c.id ORDER BY c.created_at DESC`,[targetId,viewerId]);return{collections:r.rows};}
export async function getCollection(viewerId:string,collectionId:string,limit=30,before?:string){const h=await query<{user_id:string;visibility:string}>('SELECT user_id,visibility FROM profile_collections WHERE id=$1',[collectionId]);if(!h.rowCount)throw new Error('Collection not found');if(h.rows[0].user_id!==viewerId){await assertProfileVisible(viewerId,h.rows[0].user_id);if(h.rows[0].visibility==='private')throw new Error('Collection unavailable');}const size=safeLimit(limit,50);const r=await query(`SELECT p.id,p.author_id,p.caption,p.created_at,u.username,u.display_name,pf.avatar_url FROM profile_collection_items i JOIN posts p ON p.id=i.post_id JOIN users u ON u.id=p.author_id LEFT JOIN profiles pf ON pf.user_id=u.id WHERE i.collection_id=$1 AND p.deleted_at IS NULL AND ($2::timestamptz IS NULL OR i.created_at<$2::timestamptz) ORDER BY i.created_at DESC LIMIT $3`,[collectionId,before??null,size+1]);const rows=r.rows.slice(0,size);return{collection:h.rows[0],posts:rows,nextBefore:r.rows.length>size?new Date(rows[rows.length-1].created_at).toISOString():null};}

export async function getShopSummary(viewerId:string,targetId:string){await assertProfileVisible(viewerId,targetId);const r=await query(`SELECT s.id,s.name,s.status,s.description,COUNT(pr.id)::int product_count FROM shops s LEFT JOIN products pr ON pr.shop_id=s.id AND pr.status='active' WHERE s.owner_id=$1 AND s.status='active' GROUP BY s.id LIMIT 1`,[targetId]);return r.rows[0]??null;}
export async function getSellerSummary(viewerId:string,targetId:string){await assertProfileVisible(viewerId,targetId);const r=await query(`SELECT si.seller_status,si.support_url,si.return_policy,COALESCE(COUNT(pr.id),0)::int active_products FROM profile_seller_info si LEFT JOIN shops s ON s.id=si.shop_id LEFT JOIN products pr ON pr.shop_id=s.id AND pr.status='active' WHERE si.user_id=$1 GROUP BY si.user_id`,[targetId]);return r.rows[0]??null;}

export async function updateProfileExtras(userId:string,input:{creator?:Record<string,unknown>;seller?:Record<string,unknown>;location?:Record<string,unknown>}){
 return withTransaction(async client=>{
  if(input.creator){await client.query(`INSERT INTO profile_creator_info(user_id,category,bio_public,website_url,contact_email,updated_at) VALUES($1,$2,$3,$4,$5,now()) ON CONFLICT(user_id) DO UPDATE SET category=$2,bio_public=$3,website_url=$4,contact_email=$5,updated_at=now()`,[userId,input.creator.category??null,input.creator.bioPublic??null,input.creator.websiteUrl??null,input.creator.contactEmail??null]);}
  if(input.seller){await client.query(`INSERT INTO profile_seller_info(user_id,seller_status,shop_id,support_url,return_policy,updated_at) VALUES($1,$2,$3,$4,$5,now()) ON CONFLICT(user_id) DO UPDATE SET seller_status=$2,shop_id=$3,support_url=$4,return_policy=$5,updated_at=now()`,[userId,input.seller.sellerStatus??'inactive',input.seller.shopId??null,input.seller.supportUrl??null,input.seller.returnPolicy??null]);}
  if(input.location){await client.query(`INSERT INTO profile_locations(user_id,city,region,country_code,precision,discoverable,updated_at) VALUES($1,$2,$3,$4,$5,$6,now()) ON CONFLICT(user_id) DO UPDATE SET city=$2,region=$3,country_code=$4,precision=$5,discoverable=$6,updated_at=now()`,[userId,input.location.city??null,input.location.region??null,input.location.countryCode??null,input.location.precision??'city',Boolean(input.location.discoverable)]);}
  return{ok:true};
 });
}
