const API_URL=(process.env.EXPO_PUBLIC_API_URL??'').replace(/\/$/,'');
export class ApiError extends Error{constructor(public status:number,message:string){super(message);}}
export async function api<T>(path:string,init:RequestInit={}):Promise<T>{if(!API_URL)throw new ApiError(0,'EXPO_PUBLIC_API_URL is not configured');const res=await fetch(`${API_URL}${path}`,{...init,credentials:'include',headers:{'Content-Type':'application/json',...(init.headers??{})}});const text=await res.text();let data:any={};try{data=text?JSON.parse(text):{};}catch{data={error:'Invalid server response'};}if(!res.ok)throw new ApiError(res.status,String(data.error??`Request failed (${res.status})`));return data as T;}
export type FeedPost={id:string;author_id:string;caption:string;visibility:string;created_at:string;content_type?:string;content_warning?:string;location_label?:string|null;allow_comments?:boolean;metadata?:any;like_count:number;comment_count:number;save_count:number;share_count:number;liked_by_me?:boolean;saved_by_me?:boolean;username?:string;display_name?:string;avatar_url?:string|null;media:Array<{type:'image'|'video';uri:string;storageKey?:string;alt?:string;width?:number|null;height?:number|null;durationMs?:number|null}>};
export async function getFeed(mode:'for_you'|'following'|'latest'='for_you',before?:string){return api<{items:FeedPost[];nextCursor?:string|null}>(`/v1/feed?mode=${mode}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function recordExposure(items:any[]){return api('/v1/recommendation/exposure',{method:'POST',body:JSON.stringify({items})});}
export async function toggleReaction(postId:string){return api<any>(`/v1/posts/${encodeURIComponent(postId)}/reaction`,{method:'POST'});}
export async function toggleSave(postId:string){return api<any>(`/v1/posts/${encodeURIComponent(postId)}/save`,{method:'POST'});}
export async function addComment(postId:string,body:string,parentId?:string){return api<any>(`/v1/posts/${encodeURIComponent(postId)}/comments`,{method:'POST',body:JSON.stringify({body,parentId})});}
export async function getComments(postId:string,limit=50,before?:string){return api<any>(`/v1/posts/${encodeURIComponent(postId)}/comments?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getCommentReplies(commentId:string,limit=50,before?:string){return api<any>(`/v1/comments/${encodeURIComponent(commentId)}/replies?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function recommendationFeedback(input:any){return api<any>('/v1/recommendation/feedback',{method:'POST',body:JSON.stringify(input)});}
export async function removeRecommendationFeedback(input:any){return api<any>('/v1/recommendation/feedback',{method:'DELETE',body:JSON.stringify(input)});}
export async function getPoll(postId:string){return api<any>(`/v1/posts/${encodeURIComponent(postId)}/poll`);}
export async function votePoll(postId:string,optionId:string){return api<any>(`/v1/posts/${encodeURIComponent(postId)}/poll`,{method:'POST',body:JSON.stringify({optionId})});}
export async function repostPost(postId:string,quote=''){return api<any>(`/v1/posts/${encodeURIComponent(postId)}/repost`,{method:'POST',body:JSON.stringify({quote})});}
export async function setHiddenTopic(topic:string,hidden=true){return api<any>('/v1/feed/hidden-topics',{method:hidden?'POST':'DELETE',body:JSON.stringify({topic})});}
export async function listHiddenTopics(){return api<any>('/v1/feed/hidden-topics');}
export async function getFeedPreferences(){return api<any>('/v1/feed/preferences');}
export async function setFeedPreferences(input:any){return api<any>('/v1/feed/preferences',{method:'PUT',body:JSON.stringify(input)});}
export async function resetFeed(){return api<any>('/v1/feed/reset',{method:'POST'});}
export async function getFeedTopics(){return api<any>('/v1/feed/topics');}
export async function getReels(){return api<any>('/v1/reels/recommended');}
export async function startReelWatchSession(clientSessionId:string){return api<any>('/v1/reels/watch-sessions',{method:'POST',body:JSON.stringify({clientSessionId})});}
export async function recordReelWatchEvents(sessionId:string,events:any[]){return api<any>('/v1/reels/watch-events',{method:'POST',body:JSON.stringify({sessionId,events})});}
export async function endReelWatchSession(sessionId:string){return api<any>(`/v1/reels/watch-sessions/${encodeURIComponent(sessionId)}`,{method:'DELETE'});}
export async function getReelPreferences(){return api<any>('/v1/reels/preferences');}
export async function updateReelPreferences(input:any){return api<any>('/v1/reels/preferences',{method:'PUT',body:JSON.stringify(input)});}
export async function reelCreatorFeedback(creatorId:string,signal:string){return api<any>(`/v1/reels/creators/${encodeURIComponent(creatorId)}/feedback`,{method:'POST',body:JSON.stringify({signal})});}
export async function getReelAudio(q=''){return api<any>(`/v1/reels/audio?q=${encodeURIComponent(q)}`);}
export async function getRelatedReels(postId:string){return api<any>(`/v1/reels/related?postId=${encodeURIComponent(postId)}`);}
export async function getDiscoveryResults(q:string,kind='all',sort='relevance',limit=20){return api<any>(`/v1/discovery/results?q=${encodeURIComponent(q)}&kind=${encodeURIComponent(kind)}&sort=${encodeURIComponent(sort)}&limit=${limit}`);}
export async function searchDiscovery(q:string,kind='all',limit=20){return api<any>(`/v1/discovery/search?q=${encodeURIComponent(q)}&kind=${encodeURIComponent(kind)}&limit=${limit}`);}
export async function getDiscoveryFeed(params:any={}){const q=new URLSearchParams(params as any);return api<any>(`/v1/discovery/feed?${q.toString()}`);}
export async function getRecentSearches(){return api<any>('/v1/discovery/recent-searches');}
export async function clearRecentSearches(){return api<any>('/v1/discovery/recent-searches',{method:'DELETE'});}
export async function getSavedSearches(){return api<any>('/v1/discovery/saved-searches');}
export async function saveSearch(query:string,kind='all'){return api<any>('/v1/discovery/saved-searches',{method:'POST',body:JSON.stringify({query,kind})});}
export async function deleteSavedSearch(id:string){return api<any>(`/v1/discovery/saved-searches/${encodeURIComponent(id)}`,{method:'DELETE'});}
export * from './discovery-client';
export * from './social-client';
export * from './commerce-client';
export * from './account-client';
