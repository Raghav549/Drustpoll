const API_URL=(process.env.EXPO_PUBLIC_API_URL??'').replace(/\/$/,'');
export class ApiError extends Error{constructor(public status:number,message:string){super(message);}}
export async function api<T>(path:string,init:RequestInit={}):Promise<T>{if(!API_URL)throw new ApiError(0,'EXPO_PUBLIC_API_URL is not configured');const res=await fetch(`${API_URL}${path}`,{...init,credentials:'include',headers:{'Content-Type':'application/json',...(init.headers??{})}});const text=await res.text();let data:any={};try{data=text?JSON.parse(text):{};}catch{data={error:'Invalid server response'};}if(!res.ok)throw new ApiError(res.status,String(data.error??`Request failed (${res.status})`));return data as T;}
export type FeedPost={id:string;author_id:string;caption:string;visibility:string;created_at:string;content_type?:string;content_warning?:string;location_label?:string|null;allow_comments?:boolean;metadata?:any;like_count:number;comment_count:number;save_count:number;share_count:number;liked_by_me?:boolean;saved_by_me?:boolean;username?:string;display_name?:string;avatar_url?:string|null;media:Array<{type:'image'|'video';uri:string;storageKey?:string;alt?:string;width?:number|null;height?:number|null;durationMs?:number|null}>};
export async function getFeed(mode:'for_you'|'following'|'latest'='for_you',before?:string){return api<{items:FeedPost[];nextCursor?:string|null}>(`/v1/feed?mode=${mode}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function recordExposure(items:any[]){return api('/v1/recommendation/exposure',{method:'POST',body:JSON.stringify({items})});}
export async function toggleReaction(postId:string){return api<{active:boolean;reaction:string|null}>(`/v1/posts/${encodeURIComponent(postId)}/reaction`,{method:'POST'});}
export async function toggleSave(postId:string){return api<{saved:boolean}>(`/v1/posts/${encodeURIComponent(postId)}/save`,{method:'POST'});}
export async function addComment(postId:string,body:string,parentId?:string){return api<{id:string;createdAt:string}>(`/v1/posts/${encodeURIComponent(postId)}/comments`,{method:'POST',body:JSON.stringify({body,parentId})});}
export async function getComments(postId:string,limit=50,before?:string){return api<{comments:Array<any>;nextBefore:string|null}>(`/v1/posts/${encodeURIComponent(postId)}/comments?limit=${Math.min(Math.max(limit,1),100)}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getCommentReplies(commentId:string,limit=50,before?:string){return api<{comments:Array<any>;nextBefore:string|null}>(`/v1/comments/${encodeURIComponent(commentId)}/replies?limit=${Math.min(Math.max(limit,1),100)}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getPoll(postId:string){return api<any>(`/v1/posts/${encodeURIComponent(postId)}/poll`);}
export async function votePoll(postId:string,optionId:string){return api<{ok:boolean}>(`/v1/posts/${encodeURIComponent(postId)}/poll`,{method:'POST',body:JSON.stringify({optionId})});}
export async function repostPost(postId:string,quote=''){return api<{reposted:boolean}>(`/v1/posts/${encodeURIComponent(postId)}/repost`,{method:'POST',body:JSON.stringify({quote})});}
export type FeedbackObjectType='post'|'reel'|'product'|'creator'|'topic';export type FeedbackSignal='more_like_this'|'less_like_this'|'not_interested'|'hide'|'mute'|'report';
export async function recommendationFeedback(input:{objectType:FeedbackObjectType;objectId:string;signal:FeedbackSignal;context?:string}){return api<{ok:boolean}>('/v1/recommendation/feedback',{method:'POST',body:JSON.stringify(input)});}
export async function removeRecommendationFeedback(input:{objectType:FeedbackObjectType;objectId:string;signal:FeedbackSignal;context?:string}){return api<{ok:boolean}>('/v1/recommendation/feedback',{method:'DELETE',body:JSON.stringify(input)});}
export async function setHiddenTopic(topic:string,hidden=true){return api<{topic:string;hidden:boolean}>('/v1/feed/hidden-topics',{method:hidden?'POST':'DELETE',body:JSON.stringify({topic})});}
export async function listHiddenTopics(){return api<{topics:Array<{topic:string;created_at:string}>}>('/v1/feed/hidden-topics');}
export async function getFeedPreferences(){return api<{mode:'for_you'|'following'|'latest';topic:string|null;updated_at:string|null}>('/v1/feed/preferences');}
export async function setFeedPreferences(input:{mode?:'for_you'|'following'|'latest';topic?:string|null}){return api<{mode:'for_you'|'following'|'latest';topic:string|null;updated_at:string}>('/v1/feed/preferences',{method:'PUT',body:JSON.stringify(input)});}
export async function resetFeed(){return api<{ok:boolean;resetAt:string}>('/v1/feed/reset',{method:'POST'});}
export async function getFeedTopics(){return api<{topics:Array<{topic:string;count:number}>}>('/v1/feed/topics');}
export async function getReels(){return api<{items:Array<any>}>('/v1/reels/recommended');}
export async function startReelWatchSession(clientSessionId:string){return api<{sessionId:string}>('/v1/reels/watch-sessions',{method:'POST',body:JSON.stringify({clientSessionId})});}
export async function recordReelWatchEvents(sessionId:string,events:Array<any>){return api<{accepted:number;acceptedClientEventIds:string[]}>('/v1/reels/watch-events',{method:'POST',body:JSON.stringify({sessionId,events})});}
export async function endReelWatchSession(sessionId:string){return api(`/v1/reels/watch-sessions/${encodeURIComponent(sessionId)}`,{method:'DELETE'});}
export async function getReelPreferences(){return api<{preferences:any}>('/v1/reels/preferences');}
export async function updateReelPreferences(input:Record<string,unknown>){return api('/v1/reels/preferences',{method:'PUT',body:JSON.stringify(input)});}
export async function reelCreatorFeedback(creatorId:string,signal:'hide'|'mute'|'not_interested'|'report'){return api(`/v1/reels/creators/${encodeURIComponent(creatorId)}/feedback`,{method:'POST',body:JSON.stringify({signal})});}
export async function getReelAudio(q=''){return api<{audio:any[]}>(`/v1/reels/audio?q=${encodeURIComponent(q)}`);}
export async function getRelatedReels(postId:string){return api<{items:any[]}>(`/v1/reels/related?postId=${encodeURIComponent(postId)}`);}
export async function getDiscoveryResults(q:string,kind='all',sort='relevance',limit=20){return api<{query:string;people:any[];posts:any[];videos:any[];products:any[];shops:any[];topics:any[];suggestions:string[];sort:string}>(`/v1/discovery/results?q=${encodeURIComponent(q)}&kind=${encodeURIComponent(kind)}&sort=${encodeURIComponent(sort)}&limit=${limit}`);}
export type DiscoveryResult={query:string;people:any[];posts:any[];videos:any[];products:any[];shops:any[];topics:any[];suggestions:string[];sort:string};
export async function searchDiscovery(q:string,kind='all',limit=20){return api<DiscoveryResult>(`/v1/discovery/search?q=${encodeURIComponent(q)}&kind=${encodeURIComponent(kind)}&limit=${limit}`);}
export async function getDiscoveryFeed(params:{topic?:string;category?:string;limit?:number}={}){const qs=new URLSearchParams();if(params.topic)qs.set('topic',params.topic);if(params.category)qs.set('category',params.category);qs.set('limit',String(params.limit??20));return api<{topic:string;category:string;items:any[]}>(`/v1/discovery/feed?${qs.toString()}`);}
export async function getRecentSearches(){return api<{items:Array<{query:string;last_used_at:string}>}>('/v1/discovery/recent-searches');}
export async function clearRecentSearches(){return api('/v1/discovery/recent-searches',{method:'DELETE'});}
export async function getSavedSearches(){return api<{items:Array<{id:string;query:string;kind:string;created_at:string}>}>('/v1/discovery/saved-searches');}
export async function saveSearch(query:string,kind='all'){return api('/v1/discovery/saved-searches',{method:'POST',body:JSON.stringify({query,kind})});}
export async function deleteSavedSearch(id:string){return api(`/v1/discovery/saved-searches/${encodeURIComponent(id)}`,{method:'DELETE'});}
export async function getDiscoveryCategories(){return api<{categories:any[]}>('/v1/discovery/categories');}
export async function getDiscoveryPreferences(){return api<{preferences:any}>('/v1/discovery/preferences');}
export async function updateDiscoveryPreferences(input:Record<string,unknown>){return api('/v1/discovery/preferences',{method:'PUT',body:JSON.stringify(input)});}
export async function getShopRecommendations(){return api<{items:any[]}>('/v1/shop/recommended');}
export async function getProduct(productId:string){return api<{product:any|null}>(`/v1/shop/products/${encodeURIComponent(productId)}`);}
export async function recordCommerceEvent(input:any){return api('/v1/shop/events',{method:'POST',body:JSON.stringify(input)});}
export async function getCart(){return api<{id:string|null;items:any[]}>(`/v1/cart`);}
export async function addCartItem(productId:string,quantity:number,variantId?:string){return api(`/v1/cart/items`,{method:'POST',body:JSON.stringify({productId,quantity,variantId})});}
export async function updateCartItem(productId:string,quantity:number,variantId?:string){return api<{id:string|null;items:any[]}>(`/v1/cart/items`,{method:'PATCH',body:JSON.stringify({productId,quantity,variantId})});}
export type Order={orderId:string;sellerId:string;totalMinor:number;currency:string;status:string;createdAt:string;updatedAt:string;items:any[]};
export async function getOrders(limit=30,before?:string){return api<{orders:Order[];nextBefore:string|null}>(`/v1/orders?limit=${Math.min(Math.max(limit,1),50)}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getOrder(orderId:string){return api<{order:Order|null}>(`/v1/orders/${encodeURIComponent(orderId)}`);}
export async function cancelOrder(orderId:string){return api<{orderId:string;status:string}>(`/v1/orders/${encodeURIComponent(orderId)}/cancel`,{method:'POST'});}
export async function checkout(idempotencyKey:string){return api<{orders:any[]}>(`/v1/orders`,{method:'POST',body:JSON.stringify({idempotencyKey})});}
export async function createPost(input:any){return api<{id:string;createdAt:string}>('/v1/posts',{method:'POST',body:JSON.stringify(input)});}
export type ProfileSurface={user_id:string;username:string;display_name:string;bio:string;avatar_url:string|null;website_url:string|null;profile_visibility:string;activity_visibility:string;discoverability:string;follower_count:number;following_count:number;post_count:number;video_count:number;following:boolean;requested:boolean;relationship_state:string|null;verified:boolean;verification_label:string;creator_category:string|null;creator_bio:string|null;seller_status:string|null;shop_id:string|null;shop_name:string|null;city:string|null;region:string|null;country_code:string|null;location_precision:string|null;location_discoverable:boolean};
export async function getMyProfile(){return api<{profile:any|null}>('/v1/social/me/profile');}
export async function getProfileSurface(userId:string){return api<{profile:ProfileSurface}>(`/v1/profiles/${encodeURIComponent(userId)}`);}
export async function getMyProfileSurface(){return api<{profile:ProfileSurface}>('/v1/profiles/me');}
export async function getMutualContext(userId:string){return api<{count:number;people:any[]}>(`/v1/profiles/${encodeURIComponent(userId)}/mutuals`);}
export async function getFollowers(userId:string,limit=50,before?:string){return api<{people:any[];nextBefore:string|null}>(`/v1/profiles/${encodeURIComponent(userId)}/followers?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getFollowing(userId:string,limit=50,before?:string){return api<{people:any[];nextBefore:string|null}>(`/v1/profiles/${encodeURIComponent(userId)}/following?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getProfilePosts(userId:string,limit=30,before?:string){return api<{posts:any[];nextBefore:string|null}>(`/v1/profiles/${encodeURIComponent(userId)}/posts?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getProfileVideos(userId:string,limit=30,before?:string){return api<{posts:any[];nextBefore:string|null}>(`/v1/profiles/${encodeURIComponent(userId)}/videos?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getProfileTagged(userId:string,limit=30,before?:string){return api<{posts:any[];nextBefore:string|null}>(`/v1/profiles/${encodeURIComponent(userId)}/tagged?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getCollections(userId:string){return api<{collections:any[]}>(`/v1/profiles/${encodeURIComponent(userId)}/collections`);}
export async function getCollection(id:string,limit=30,before?:string){return api<{collection:any;posts:any[];nextBefore:string|null}>(`/v1/profile-collections/${encodeURIComponent(id)}?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getProfileShop(userId:string){return api<{shop:any|null}>(`/v1/profiles/${encodeURIComponent(userId)}/shop`);}
export async function followUser(targetUserId:string){return api<{state:string}>('/v1/social/follow',{method:'POST',body:JSON.stringify({targetUserId})});}
export async function unfollowUser(targetUserId:string){return api<{state:string}>('/v1/social/follow',{method:'DELETE',body:JSON.stringify({targetUserId})});}
export async function getConversations(limit=30){return api<{conversations:any[]}>(`/v1/messages/conversations?limit=${Math.min(Math.max(limit,1),50)}`);}
export async function createConversation(participantIds:string[]){return api<{id:string;createdAt:string;participantIds:string[]}>('/v1/messages/conversations',{method:'POST',body:JSON.stringify({participantIds})});}
export async function markConversationRead(id:string){return api<{updated:number}>(`/v1/messages/conversations/${encodeURIComponent(id)}/read`,{method:'POST'});}
export async function getMessages(id:string,limit=50,before?:string){return api<{messages:any[];nextBefore:string|null}>(`/v1/messages/conversations/${encodeURIComponent(id)}/messages?limit=${Math.min(Math.max(limit,1),100)}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function sendEncryptedMessage(id:string,ciphertext:string,keyVersion=1,deviceId?:string){return api<{id:string;createdAt:string}>(`/v1/messages/conversations/${encodeURIComponent(id)}/messages`,{method:'POST',body:JSON.stringify({ciphertext,keyVersion,deviceId})});}
export type Notification={id:string;actor_id:string|null;type:string;object_id:string|null;grouped_key:string|null;metadata:Record<string,unknown>;category?:string;read_at:string|null;created_at:string;actor_username?:string|null;actor_display_name?:string|null;actor_avatar_url?:string|null};
export type NotificationPreferences={social:boolean;mentions_replies:boolean;follows:boolean;commerce_orders:boolean;security:boolean;system:boolean;digest_enabled:boolean;digest_frequency:'daily'|'weekly';quiet_enabled:boolean;quiet_start_minute:number;quiet_end_minute:number;quiet_timezone:string;updated_at:string|null};
export type PrivacySettings={profile_visibility:string;activity_visibility:string;discoverability:string;message_requests:string;personalized_ads?:boolean;personalized_recommendations?:boolean;search_engine_indexing?:boolean};
export async function getNotifications(limit=30,before?:string,category='all'){return api<{notifications:Notification[];nextBefore:string|null}>(`/v1/notifications?limit=${Math.min(Math.max(limit,1),100)}&category=${encodeURIComponent(category)}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function markAllNotificationsRead(){return api<any>('/v1/notifications/read-all',{method:'POST'});}
export async function markNotificationRead(id:string){return api<any>(`/v1/notifications/${encodeURIComponent(id)}/read`,{method:'POST'});}
export async function getNotificationPreferences(){return api<{preferences:NotificationPreferences}>('/v1/notifications/preferences');}
export async function updateNotificationPreferences(input:Record<string,unknown>){return api<{preferences:NotificationPreferences}>('/v1/notifications/preferences',{method:'PUT',body:JSON.stringify(input)});}
export async function getNotificationDigest(){return api<{digest:any}>('/v1/notifications/digest');}
export async function getPrivacy(){return api<{privacy:PrivacySettings}>('/v1/privacy');}
export async function updatePrivacy(input:any){return api<{privacy:PrivacySettings}>('/v1/privacy',{method:'PUT',body:JSON.stringify(input)});}
export async function getAccountExperiencePreferences(){return api<{preferences:any}>('/v1/account/experience');}
export async function updateAccountExperiencePreferences(input:any){return api<{preferences:any}>('/v1/account/experience',{method:'PUT',body:JSON.stringify(input)});}
export async function getAccountContacts(){return api<any>('/v1/account/contacts');}
export async function updateAccountContacts(input:any){return api<any>('/v1/account/contacts',{method:'PUT',body:JSON.stringify(input)});}
export async function getSecuritySessions(){return api<{sessions:any[]}>('/v1/auth/sessions');}
export async function revokeSecuritySession(id:string){return api<any>(`/v1/auth/sessions/${encodeURIComponent(id)}/revoke`,{method:'POST'});}
export async function revokeAllSecuritySessions(){return api<any>('/v1/auth/sessions/revoke-all',{method:'POST'});}
export async function getBlockedUsers(){return api<any>('/v1/privacy/blocked');}
export async function getMutedUsers(){return api<any>('/v1/privacy/muted');}
export async function getHiddenTerms(){return api<any>('/v1/privacy/hidden-terms');}
export async function setHiddenTerm(term:string,kind:'word'|'topic',hidden:boolean){return api<any>('/v1/privacy/hidden-terms',{method:hidden?'POST':'DELETE',body:JSON.stringify({term,kind})});}
export async function resetRecommendations(){return api<any>('/v1/privacy/recommendations/reset',{method:'POST'});}
export async function getDataInventory(){return api<any>('/v1/privacy/inventory');}
export async function getDataRequests(){return api<any>('/v1/privacy/data-requests');}
export async function requestData(kind:'export'|'delete'){return api<any>('/v1/privacy/data-requests',{method:'POST',body:JSON.stringify({kind})});}
export async function getPrivacyAudit(){return api<any>('/v1/privacy/audit');}
export async function getPrivacyPermissions(){return api<any>('/v1/privacy/permissions');}
export async function getSecurityAlerts(){return api<any>('/v1/security/alerts');}
export async function acknowledgeSecurityAlert(id:string){return api<any>(`/v1/security/alerts/${encodeURIComponent(id)}/ack`,{method:'POST'});}
export async function getSecurityEvents(){return api<any>('/v1/security/events');}
export async function secureAccount(){return api<any>('/v1/security/secure-account',{method:'POST'});}
export type SellerProduct={id:string;title:string;description?:string;price_minor:number;currency:string;inventory:number;category?:string|null;status:string};
export async function getSellerProducts(){return api<{products:SellerProduct[]}>('/v1/shop/products');}
export async function createSellerProduct(input:any){return api('/v1/shop/products',{method:'POST',body:JSON.stringify(input)});}
export async function getSellerSummary(userId:string){return api<{seller:any|null}>(`/v1/profiles/${encodeURIComponent(userId)}/seller`);}
export async function getShopRecommendations(){return api<{items:any[]}>('/v1/shop/recommended');}
export async function getMarketProductDetail(productId:string){return api<any>(`/v1/market/products/${encodeURIComponent(productId)}`);}
export async function getRelatedProducts(productId:string,limit=12){return api<any>(`/v1/market/products/${encodeURIComponent(productId)}/related?limit=${limit}`);}
export async function getReturns(orderId?:string){return api<any>(`/v1/market/returns${orderId?`?orderId=${encodeURIComponent(orderId)}`:''}`);}
export async function requestReturn(orderId:string,reason:string,notes=''){return api<any>(`/v1/market/orders/${encodeURIComponent(orderId)}/returns`,{method:'POST',body:JSON.stringify({reason,notes})});}
export async function openOrderSupport(orderId:string,subject:string){return api<any>(`/v1/market/orders/${encodeURIComponent(orderId)}/support`,{method:'POST',body:JSON.stringify({subject})});}
export async function getSafetyState(targetUserId?:string){return api<any>(`/v1/safety/state${targetUserId?`?targetUserId=${encodeURIComponent(targetUserId)}`:''}`);}
export async function reportTarget(target:any,reason:string,details=''){return api<any>('/v1/safety/report',{method:'POST',body:JSON.stringify({target,reason,details})});}
export async function setRestricted(targetUserId:string,restricted:boolean){return api<any>('/v1/safety/restrict',{method:restricted?'POST':'DELETE',body:JSON.stringify({targetUserId})});}
export async function addReportEvidence(caseId:string,evidence:any){return api<any>(`/v1/safety/cases/${encodeURIComponent(caseId)}/evidence`,{method:'POST',body:JSON.stringify(evidence)});}
export async function getSafetyCases(){return api<any>('/v1/safety/cases');}
export async function submitSafetyAppeal(caseId:string,reason:string){return api<any>(`/v1/safety/cases/${encodeURIComponent(caseId)}/appeal`,{method:'POST',body:JSON.stringify({reason})});}
export async function getModerationNotices(){return api<any>('/v1/safety/notices');}
