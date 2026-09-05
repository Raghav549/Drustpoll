import { api } from './client';

export async function createPost(input:any){return api<{id:string;createdAt:string}>('/v1/posts',{method:'POST',body:JSON.stringify(input)});}
export async function getMyProfile(){return api<{profile:any|null}>('/v1/social/me/profile');}
export async function getMyProfileSurface(){return api<{profile:any}>('/v1/profiles/me');}
export async function getProfileSurface(userId:string){return api<{profile:any}>(`/v1/profiles/${encodeURIComponent(userId)}`);}
export async function getFollowers(userId:string,limit=50,before?:string){return api<{people:any[];nextBefore:string|null}>(`/v1/profiles/${encodeURIComponent(userId)}/followers?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getFollowing(userId:string,limit=50,before?:string){return api<{people:any[];nextBefore:string|null}>(`/v1/profiles/${encodeURIComponent(userId)}/following?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getMutualContext(userId:string){return api<any>(`/v1/profiles/${encodeURIComponent(userId)}/mutuals`);}
export async function getProfilePosts(userId:string,limit=30,before?:string){return api<any>(`/v1/profiles/${encodeURIComponent(userId)}/posts?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getProfileVideos(userId:string,limit=30,before?:string){return api<any>(`/v1/profiles/${encodeURIComponent(userId)}/videos?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getProfileTagged(userId:string,limit=30,before?:string){return api<any>(`/v1/profiles/${encodeURIComponent(userId)}/tagged?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getCollections(userId:string){return api<any>(`/v1/profiles/${encodeURIComponent(userId)}/collections`);}
export async function getCollection(id:string,limit=30,before?:string){return api<any>(`/v1/profile-collections/${encodeURIComponent(id)}?limit=${limit}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function getProfileShop(userId:string){return api<any>(`/v1/profiles/${encodeURIComponent(userId)}/shop`);}
export async function followUser(targetUserId:string){return api<any>('/v1/social/follow',{method:'POST',body:JSON.stringify({targetUserId})});}
export async function unfollowUser(targetUserId:string){return api<any>('/v1/social/follow',{method:'DELETE',body:JSON.stringify({targetUserId})});}
export async function getConversations(limit=30){return api<any>(`/v1/messages/conversations?limit=${Math.min(Math.max(limit,1),50)}`);}
export async function createConversation(participantIds:string[]){return api<any>('/v1/messages/conversations',{method:'POST',body:JSON.stringify({participantIds})});}
export async function markConversationRead(id:string){return api<any>(`/v1/messages/conversations/${encodeURIComponent(id)}/read`,{method:'POST'});}
export async function getMessages(id:string,limit=50,before?:string){return api<any>(`/v1/messages/conversations/${encodeURIComponent(id)}/messages?limit=${Math.min(Math.max(limit,1),100)}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function sendEncryptedMessage(id:string,ciphertext:string,keyVersion=1,deviceId?:string){return api<any>(`/v1/messages/conversations/${encodeURIComponent(id)}/messages`,{method:'POST',body:JSON.stringify({ciphertext,keyVersion,deviceId})});}
export type Notification={id:string;actor_id:string|null;type:string;object_id:string|null;grouped_key:string|null;metadata:Record<string,unknown>;category?:string;read_at:string|null;created_at:string;actor_username?:string|null;actor_display_name?:string|null;actor_avatar_url?:string|null};
export type NotificationPreferences={social:boolean;mentions_replies:boolean;follows:boolean;commerce_orders:boolean;security:boolean;system:boolean;digest_enabled:boolean;digest_frequency:'daily'|'weekly';quiet_enabled:boolean;quiet_start_minute:number;quiet_end_minute:number;quiet_timezone:string;updated_at:string|null};
export async function getNotifications(limit=30,before?:string,category='all'){return api<any>(`/v1/notifications?limit=${Math.min(Math.max(limit,1),100)}&category=${encodeURIComponent(category)}${before?`&before=${encodeURIComponent(before)}`:''}`);}
export async function markAllNotificationsRead(){return api<any>('/v1/notifications/read-all',{method:'POST'});}
export async function markNotificationRead(id:string){return api<any>(`/v1/notifications/${encodeURIComponent(id)}/read`,{method:'POST'});}
export async function getNotificationPreferences(){return api<any>('/v1/notifications/preferences');}
export async function updateNotificationPreferences(input:any){return api<any>('/v1/notifications/preferences',{method:'PUT',body:JSON.stringify(input)});}
export async function getNotificationDigest(){return api<any>('/v1/notifications/digest');}
export async function getSecuritySessions(){return api<any>('/v1/auth/sessions');}
export async function revokeSecuritySession(id:string){return api<any>(`/v1/auth/sessions/${encodeURIComponent(id)}/revoke`,{method:'POST'});}
export async function revokeAllSecuritySessions(){return api<any>('/v1/auth/sessions/revoke-all',{method:'POST'});}
