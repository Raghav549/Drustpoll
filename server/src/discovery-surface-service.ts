import { query } from './db.js';

type Kind='all'|'people'|'posts'|'videos'|'products'|'shops'|'topics';
const clamp=(v:number,min:number,max:number)=>Math.min(Math.max(Math.trunc(v),min),max);
const clean=(v:string)=>v.trim().replace(/\s+/g,' ').slice(0,120);
export async function recordSearch(userId:string,raw:string,_kind:Kind){const q=clean(raw);if(!q)return null;await query(`INSERT INTO search_history(user_id,query,last_used_at) VALUES($1,$2,now()) ON CONFLICT(user_id,query) DO UPDATE SET last_used_at=now()`,[userId,q]);await query(`DELETE FROM search_history WHERE user_id=$1 AND query NOT IN(SELECT query FROM search_history WHERE user_id=$1 ORDER BY last_used_at DESC LIMIT 50)`,[userId]);return{query:q};}
export async function listRecentSearches(userId:string,limit=20){const r=await query(`SELECT query,last_used_at FROM search_history WHERE user_id=$1 ORDER BY last_used_at DESC LIMIT $2`,[userId,clamp(limit,1,50)]);return{items:r.rows};}
export async function clearRecentSearches(userId:string){await query('DELETE FROM search_history WHERE user_id=$1',[userId]);return{ok:true};}
export async function listSavedSearches(userId:string){const r=await query(`SELECT id,query,kind,created_at FROM saved_searches WHERE user_id=$1 ORDER BY created_at DESC`,[userId]);return{items:r.rows};}
export async function saveSearch(userId:string,raw:string,kind:Kind='all'){const q=clean(raw);if(!q)throw new Error('Search query required');if(!['all','people','posts','products'].includes(kind))throw new Error('Invalid saved search kind');const r=await query(`INSERT INTO saved_searches(user_id,query,kind) VALUES($1,$2,$3) ON CONFLICT(user_id,query,kind) DO UPDATE SET created_at=now() RETURNING id,query,kind,created_at`,[userId,q,kind]);return r.rows[0];}
export async function deleteSavedSearch(userId:string,id:string){await query('DELETE FROM saved_searches WHERE id=$1 AND user_id=$2',[id,userId]);return{ok:true};}
export async function listDiscoveryCategories(userId:string){const r=await query(`SELECT c.id,c.slug,c.name,c.description,c.sort_order,EXISTS(SELECT 1 FROM discovery_category_follows f WHERE f.user_id=$1 AND f.category_id=c.id) following FROM discovery_categories c ORDER BY c.sort_order,c.name`,[userId]);return r.rows;}
export async function getDiscoveryPreferences(userId:string){const r=await query('SELECT people,posts,videos,products,shops,topics,local,updated_at FROM discovery_preferences WHERE user_id=$1',[userId]);return r.rows[0]??{people:true,posts:true,videos:true,products:true,shops:true,topics:true,local:false,updated_at:null};}
export async function updateDiscoveryPreferences(userId:string,input:Record<string,unknown>){const current=await getDiscoveryPreferences(userId);const bool=(k:string)=>typeof input[k]==='boolean'?Boolean(input[k]):Boolean(current[k as keyof typeof current]);await query(`INSERT INTO discovery_preferences(user_id,people,posts,videos,products,shops,topics,local,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,now()) ON CONFLICT(user_id) DO UPDATE SET people=$2,posts=$3,videos=$4,products=$5,shops=$6,topics=$7,local=$8,updated_at=now()`,[userId,bool('people'),bool('posts'),bool('videos'),bool('products'),bool('shops'),bool('topics'),bool('local')]);return getDiscoveryPreferences(userId);}
export async function getDiscoveryResults(userId:string,params:URLSearchParams){
  const q=clean(params.get('q')??'');
  const requestedKind=params.get('kind')??'all';
  const kind=(['all','people','posts','videos','products','shops','topics'].includes(requestedKind)?requestedKind:'all') as Kind;
  const sort=params.get('sort')==='newest'?'newest':'relevance';
  const limit=clamp(Number(params.get('limit')??20),1,50);
  if(!q)return{query:'',people:[],posts:[],videos:[],products:[],shops:[],topics:[],suggestions:[],sort};

  const base=await import('./discovery-service.js');
  const baseKind=kind==='videos'||kind==='shops'||kind==='topics'?'all':kind;
  const exact=await base.searchDiscovery(userId,q,baseKind as any,limit);
  const preferences=await getDiscoveryPreferences(userId);
  const pattern=`%${q}%`;
  const [videoRows,shopRows,topicRows]=await Promise.all([
    kind==='all'||kind==='videos'
      ?query(`SELECT p.id,p.author_id,p.caption,p.created_at,u.username,u.display_name,pf.avatar_url,
          COALESCE((SELECT count(*)::int FROM post_reactions r WHERE r.post_id=p.id),0) like_count,
          COALESCE((SELECT count(*)::int FROM comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL),0) comment_count,
          COALESCE(json_agg(json_build_object('id',m.id,'type',m.media_type,'storageKey',m.storage_key,'alt',m.alt_text,'durationMs',m.duration_ms) ORDER BY m.sort_order) FILTER(WHERE m.id IS NOT NULL),'[]'::json) media
        FROM posts p JOIN post_media m ON m.post_id=p.id AND m.media_type='video'
        JOIN users u ON u.id=p.author_id LEFT JOIN profiles pf ON pf.user_id=p.author_id
        WHERE p.deleted_at IS NULL AND p.visibility='public'
          AND (p.author_id=$1 OR COALESCE(pf.discoverability,'discoverable')='discoverable')
          AND (p.caption ILIKE $2 OR u.username ILIKE $2 OR COALESCE(u.display_name,'') ILIKE $2)
          AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=p.author_id) OR (b.blocker_id=p.author_id AND b.blocked_id=$1))
        GROUP BY p.id,u.id,pf.avatar_url ORDER BY p.created_at DESC,p.id DESC LIMIT $3`,[userId,pattern,limit])
      :Promise.resolve({rows:[] as any[]}),
    kind==='all'||kind==='shops'
      ?query(`SELECT s.id,s.owner_id,s.name,s.description,sm.slug,sm.logo_url,sm.banner_url,
          COUNT(DISTINCT p.id)::int product_count,MAX(s.created_at) created_at
        FROM shops s LEFT JOIN shops_metadata sm ON sm.shop_id=s.id
        LEFT JOIN products p ON p.shop_id=s.id AND p.status='active'
        LEFT JOIN profiles pf ON pf.user_id=s.owner_id
        WHERE s.status='active' AND (s.owner_id=$1 OR COALESCE(pf.discoverability,'discoverable')='discoverable')
          AND (s.name ILIKE $2 OR s.description ILIKE $2 OR COALESCE(sm.slug,'') ILIKE $2)
          AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=s.owner_id) OR (b.blocker_id=s.owner_id AND b.blocked_id=$1))
        GROUP BY s.id,s.owner_id,s.name,s.description,sm.slug,sm.logo_url,sm.banner_url
        ORDER BY product_count DESC,s.name ASC LIMIT $3`,[userId,pattern,limit])
      :Promise.resolve({rows:[] as any[]}),
    kind==='all'||kind==='topics'
      ?query(`SELECT topic,COUNT(*)::int count FROM reel_topics WHERE topic ILIKE $1 GROUP BY topic ORDER BY count DESC LIMIT $2`,[pattern,Math.min(limit,20)])
      :Promise.resolve({rows:[] as any[]}),
  ]);
  const newest=(rows:any[])=>sort==='newest'?[...rows].sort((a,b)=>new Date(b.created_at??0).getTime()-new Date(a.created_at??0).getTime()):rows;
  const suggestions=q.length>=3?[q,q.slice(0,Math.max(1,q.length-1)),q+'s'].filter((v,i,a)=>v&&a.indexOf(v)===i):[];
  return{
    ...exact,
    people:preferences.people?newest(exact.people??[]):[],
    posts:preferences.posts?newest(exact.posts??[]):[],
    products:preferences.products?newest(exact.products??[]):[],
    videos:preferences.videos?newest(videoRows.rows.map((row:any)=>({...row,kind:'videos'}))):[],
    shops:preferences.shops?newest(shopRows.rows.map((row:any)=>({...row,kind:'shops'}))):[],
    topics:preferences.topics?topicRows.rows.map((row:any)=>({...row,kind:'topics'})):[],
    suggestions,sort,
  };
}
export async function getDiscoveryFeed(userId:string,params:URLSearchParams){const topic=clean(params.get('topic')??'');const category=clean(params.get('category')??'');const limit=clamp(Number(params.get('limit')??20),1,50);const r=await query(`SELECT p.id,p.author_id,p.caption,p.created_at,u.username,u.display_name,COALESCE((SELECT count(*)::int FROM post_reactions r WHERE r.post_id=p.id),0) like_count,COALESCE((SELECT count(*)::int FROM comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL),0) comment_count FROM posts p JOIN users u ON u.id=p.author_id LEFT JOIN profiles pr ON pr.user_id=p.author_id WHERE p.deleted_at IS NULL AND p.visibility='public' AND (p.author_id=$1 OR COALESCE(pr.discoverability,'discoverable')='discoverable') AND ($2='' OR lower(p.caption) LIKE lower('%'||$2||'%')) AND ($3='' OR lower(p.caption) LIKE lower('%'||$3||'%')) AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=p.author_id) OR (b.blocker_id=p.author_id AND b.blocked_id=$1)) ORDER BY p.created_at DESC LIMIT $4`,[userId,topic,category,limit]);return{topic,category,items:r.rows};}
