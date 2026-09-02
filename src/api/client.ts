const API_URL=(process.env.EXPO_PUBLIC_API_URL??'').replace(/\/$/,'');

export class ApiError extends Error{constructor(public status:number,message:string){super(message);}}
export async function api<T>(path:string,init:RequestInit={}):Promise<T>{
  if(!API_URL) throw new ApiError(0,'EXPO_PUBLIC_API_URL is not configured');
  const res=await fetch(`${API_URL}${path}`,{...init,credentials:'include',headers:{'Content-Type':'application/json',...(init.headers??{})}});
  const text=await res.text();let data:any={};try{data=text?JSON.parse(text):{};}catch{data={error:'Invalid server response'};}
  if(!res.ok) throw new ApiError(res.status,String(data.error??`Request failed (${res.status})`));
  return data as T;
}
export type FeedPost={id:string;author_id:string;caption:string;visibility:string;created_at:string;like_count:number;comment_count:number;save_count:number;share_count:number;media:Array<{type:'image'|'video';uri:string;alt?:string}>};
export async function getFeed(mode:'for_you'|'following'='for_you',before?:string){return api<{items:FeedPost[];nextCursor?:string|null}>(`/v1/feed?mode=${mode}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getReels(){return api<{items:Array<{id:string;author_id:string;created_at:string;prior_watched_ms:number;prior_duration_ms:number;creator_exposures:number;likes:number;comments:number}>}>(`/v1/reels/recommended`);}
export async function getShopRecommendations(){return api<{items:Array<{id:string;shop_id:string;title:string;description:string;price_minor:number;currency:string;inventory:number;score:number;reason:string}>}>(`/v1/shop/recommended`);}
export async function recordExposure(items:Array<{postId:string;creatorId:string;surface:'feed'|'reels'|'shop';position:number}>){return api('/v1/recommendation/exposure',{method:'POST',body:JSON.stringify({items})});}
