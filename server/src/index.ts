import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { config } from './config.js';
import { authenticate, changePassword, createReauthGrant, listSessions, login, refresh, requestOtp, requestPasswordReset, resetPassword, revoke, revokeAll, revokeSession, signup, verifyOtp } from './auth-service.js';
import { health } from './health.js';
import { addComment, createPost, follow, getFeed, getProfile, setFollowState, toggleReaction, toggleSave, unfollow } from './social-service.js';
import { recordFeedEvents } from './feed-events-service.js';
import { addCartItem, createProduct, getCart, getProduct, listSellerProducts, placeOrder, updateCartItem } from './commerce-service.js';
import { listNotifications, markAllNotificationsRead, markNotificationRead, unreadNotificationCount } from './notification-service.js';
import { searchDiscovery, type DiscoveryKind } from './discovery-service.js';
import { createConversation, listConversations, listMessages, markConversationRead, sendEncryptedMessage } from './messaging-service.js';
import { blockUser, getSafetyState, muteUser, reportContent, unblockUser, unmuteUser } from './safety-service.js';
import { createUploadIntent, getMediaAsset } from './media-service.js';

const json = (res: ServerResponse, status: number, body: unknown) => { res.statusCode=status; res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer'); res.end(JSON.stringify(body)); };
async function body(req: IncomingMessage): Promise<any> { let data=''; for await (const chunk of req) { data += chunk; if(Buffer.byteLength(data)>256*1024) throw new Error('Request too large'); } return data ? JSON.parse(data) : {}; }
function bearer(req: IncomingMessage): string|null { const value=req.headers.authorization; return value?.startsWith('Bearer ') ? value.slice(7) : null; }
function cookie(req: IncomingMessage,name:string): string|null { const item=(req.headers.cookie??'').split(';').map(v=>v.trim()).find(v=>v.startsWith(`${name}=`)); return item ? decodeURIComponent(item.slice(name.length+1)) : null; }
function setSessionCookie(res:ServerResponse,token:string,maxAgeSeconds=1800){const secure=config.secureCookies?'; Secure':'';const name=config.secureCookies?'__Host-drustpoll_session':'drustpoll_session';res.setHeader('Set-Cookie',`${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${maxAgeSeconds}`);}
function clearSessionCookie(res:ServerResponse){const name=config.secureCookies?'__Host-drustpoll_session':'drustpoll_session';res.setHeader('Set-Cookie',`${name}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${config.secureCookies?'; Secure':''}`);}
function sessionCookie(req:IncomingMessage){return cookie(req,config.secureCookies?'__Host-drustpoll_session':'drustpoll_session');}
async function auth(req:IncomingMessage){return authenticate(bearer(req)??sessionCookie(req)??'');}

const server=createServer(async(req,res)=>{try{
 if(req.method==='OPTIONS'){res.statusCode=204;res.end();return;}
 const url=new URL(req.url??'/',`http://${req.headers.host??'localhost'}`); const ip=req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()??req.socket.remoteAddress??'unknown';
 if(req.method==='GET'&&url.pathname==='/health')return json(res,200,await health());
 if(req.method==='POST'&&url.pathname==='/v1/auth/signup'){const r=await signup(await body(req),ip);setSessionCookie(res,r.token);return json(res,201,{userId:r.userId,deviceId:r.deviceId,expiresAt:r.expiresAt,refreshExpiresAt:r.refreshExpiresAt,refreshToken:r.refreshToken,token:r.token});}
 if(req.method==='POST'&&url.pathname==='/v1/auth/login'){const r=await login(await body(req),ip);setSessionCookie(res,r.token);return json(res,200,{userId:r.userId,deviceId:r.deviceId,expiresAt:r.expiresAt,refreshExpiresAt:r.refreshExpiresAt,refreshToken:r.refreshToken,token:r.token});}
 if(req.method==='POST'&&url.pathname==='/v1/auth/refresh'){const i=await body(req);const r=await refresh(String(i.refreshToken??''),ip);setSessionCookie(res,r.token);return json(res,200,{userId:r.userId,deviceId:r.deviceId,expiresAt:r.expiresAt,refreshExpiresAt:r.refreshExpiresAt,refreshToken:r.refreshToken,token:r.token});}
 if(req.method==='POST'&&url.pathname==='/v1/auth/password/forgot')return json(res,202,await requestPasswordReset(String((await body(req)).identifier??''),ip));
 if(req.method==='POST'&&url.pathname==='/v1/auth/password/reset'){const i=await body(req);return json(res,200,await resetPassword(String(i.token??''),String(i.newPassword??'')));}
 if(req.method==='POST'&&url.pathname==='/v1/auth/logout'){await revoke(bearer(req)??sessionCookie(req)??'');clearSessionCookie(res);return json(res,200,{ok:true});}
 if(req.method==='POST'&&url.pathname==='/v1/auth/otp/request'){const i=await body(req);const p=i.purpose,d=String(i.destination??'');if(!d||!['verify_email','verify_phone','login_step_up','password_reset'].includes(p))return json(res,400,{error:'Invalid OTP request'});const s=await auth(req);if(!s&&!['verify_email','verify_phone','password_reset'].includes(p))return json(res,401,{error:'Unauthenticated'});return json(res,202,await requestOtp(s?.userId??null,d,p,ip));}
 if(req.method==='POST'&&url.pathname==='/v1/auth/otp/verify'){const i=await body(req),p=String(i.purpose??''),s=await auth(req);if(!s&&p!=='password_reset')return json(res,401,{error:'Unauthenticated'});await verifyOtp(s?.userId??null,String(i.destination??''),p as any,String(i.code??''));return json(res,200,{ok:true});}
 const session=await auth(req);if(!session)return json(res,401,{error:'Unauthenticated'});
 if(req.method==='GET'&&url.pathname==='/v1/auth/me')return json(res,200,{session});
 if(req.method==='GET'&&url.pathname==='/v1/auth/sessions')return json(res,200,{sessions:await listSessions(session.userId,session.sessionId)});
 const revokeMatch=url.pathname.match(/^\/v1\/auth\/sessions\/([^/]+)$/);if(req.method==='DELETE'&&revokeMatch){await revokeSession(session.userId,revokeMatch[1]);return json(res,200,{ok:true});}
 if(req.method==='POST'&&url.pathname==='/v1/auth/logout-all'){await revokeAll(session.userId);clearSessionCookie(res);return json(res,200,{ok:true});}
 if(req.method==='POST'&&url.pathname==='/v1/auth/reauthenticate'){const i=await body(req);return json(res,200,await createReauthGrant(session.userId,session.sessionId,String(i.password??'')));}
 if(req.method==='POST'&&url.pathname==='/v1/auth/password/change'){const i=await body(req);await changePassword(session.userId,String(i.currentPassword??''),String(i.newPassword??''));clearSessionCookie(res);return json(res,200,{ok:true,sessionsRevoked:true});}
 if(req.method==='GET'&&url.pathname==='/v1/notifications'){const l=Number(url.searchParams.get('limit')??30),b=url.searchParams.get('before')??undefined;return json(res,200,await listNotifications(session.userId,l,b));}
 if(req.method==='GET'&&url.pathname==='/v1/notifications/unread-count')return json(res,200,await unreadNotificationCount(session.userId));
 const nm=url.pathname.match(/^\/v1\/notifications\/([^/]+)\/read$/);if(req.method==='POST'&&nm)return json(res,200,await markNotificationRead(session.userId,nm[1]));
 if(req.method==='POST'&&url.pathname==='/v1/notifications/read-all')return json(res,200,await markAllNotificationsRead(session.userId));
 if(req.method==='GET'&&url.pathname==='/v1/discovery/search'){const q=url.searchParams.get('q')??'',k=(url.searchParams.get('kind')??'all') as DiscoveryKind;if(!['all','people','posts','products'].includes(k))return json(res,400,{error:'Invalid search kind'});return json(res,200,await searchDiscovery(session.userId,q,k,Number(url.searchParams.get('limit')??20)));}
 if(req.method==='POST'&&url.pathname==='/v1/media/upload-intents'){const i=await body(req);return json(res,201,await createUploadIntent(session.userId,{type:String(i.type??''),mime:String(i.mime??''),filename:i.filename?String(i.filename):undefined,byteSize:Number(i.byteSize??0)}));}
 const mediaMatch=url.pathname.match(/^\/v1\/media\/([^/]+)$/);if(req.method==='GET'&&mediaMatch)return json(res,200,{asset:await getMediaAsset(session.userId,mediaMatch[1])});
 if(req.method==='GET'&&url.pathname==='/v1/messages/conversations')return json(res,200,await listConversations(session.userId,Number(url.searchParams.get('limit')??30)));
 if(req.method==='POST'&&url.pathname==='/v1/messages/conversations'){const i=await body(req);return json(res,201,await createConversation(session.userId,Array.isArray(i.participantIds)?i.participantIds.map(String):[]));}
 const convMatch=url.pathname.match(/^\/v1\/messages\/conversations\/([^/]+)\/messages$/);if(req.method==='GET'&&convMatch)return json(res,200,await listMessages(session.userId,convMatch[1],Number(url.searchParams.get('limit')??50),url.searchParams.get('before')??undefined));if(req.method==='POST'&&convMatch){const i=await body(req);return json(res,201,await sendEncryptedMessage(session.userId,convMatch[1],String(i.ciphertext??''),Number(i.keyVersion??1)));}
 const readMatch=url.pathname.match(/^\/v1\/messages\/conversations\/([^/]+)\/read$/);if(req.method==='POST'&&readMatch)return json(res,200,await markConversationRead(session.userId,readMatch[1]));
 if(req.method==='POST'&&url.pathname==='/v1/safety/block'){const i=await body(req);return json(res,200,await blockUser(session.userId,String(i.targetUserId??'')));}
 if(req.method==='DELETE'&&url.pathname==='/v1/safety/block'){const i=await body(req);return json(res,200,await unblockUser(session.userId,String(i.targetUserId??'')));}
 if(req.method==='POST'&&url.pathname==='/v1/safety/mute'){const i=await body(req);return json(res,200,await muteUser(session.userId,String(i.targetUserId??'')));}
 if(req.method==='DELETE'&&url.pathname==='/v1/safety/mute'){const i=await body(req);return json(res,200,await unmuteUser(session.userId,String(i.targetUserId??'')));}
 if(req.method==='GET'&&url.pathname==='/v1/safety/state'){const id=url.searchParams.get('targetUserId');if(!id)return json(res,400,{error:'targetUserId required'});return json(res,200,await getSafetyState(session.userId,id));}
 if(req.method==='POST'&&url.pathname==='/v1/safety/report'){const i=await body(req);return json(res,201,await reportContent(session.userId,i.target??{},String(i.reason??''),String(i.details??'')));}
 if(req.method==='GET'&&url.pathname==='/v1/social/me/profile')return json(res,200,{profile:await getProfile(session.userId)});
 const pm=url.pathname.match(/^\/v1\/social\/profiles\/([^/]+)$/);if(req.method==='GET'&&pm)return json(res,200,{profile:await getProfile(pm[1])});
 if(req.method==='POST'&&url.pathname==='/v1/social/follow'){const i=await body(req);return json(res,200,await follow(session.userId,String(i.targetUserId??'')));} if(req.method==='DELETE'&&url.pathname==='/v1/social/follow'){const i=await body(req);return json(res,200,await unfollow(session.userId,String(i.targetUserId??'')));}
 if(req.method==='POST'&&url.pathname==='/v1/social/relationship'){const i=await body(req);return json(res,200,await setFollowState(session.userId,String(i.targetUserId??''),i.state));}
 if(req.method==='GET'&&url.pathname==='/v1/feed'){const m=url.searchParams.get('mode')==='following'?'following':'for_you';return json(res,200,await getFeed(session.userId,m,Number(url.searchParams.get('limit')??30),url.searchParams.get('before')??undefined));}
 if(req.method==='POST'&&url.pathname==='/v1/feed/events'){const i=await body(req);return json(res,202,await recordFeedEvents(session.userId,Array.isArray(i.events)?i.events:[]));}
 if(req.method==='POST'&&url.pathname==='/v1/posts')return json(res,201,await createPost(session.userId,await body(req)));
 const rx=url.pathname.match(/^\/v1\/posts\/([^/]+)\/reaction$/);if(req.method==='POST'&&rx)return json(res,200,await toggleReaction(session.userId,rx[1]));const sv=url.pathname.match(/^\/v1\/posts\/([^/]+)\/save$/);if(req.method==='POST'&&sv)return json(res,200,await toggleSave(session.userId,sv[1]));const cm=url.pathname.match(/^\/v1\/posts\/([^/]+)\/comments$/);if(req.method==='POST'&&cm){const i=await body(req);return json(res,201,await addComment(session.userId,cm[1],String(i.body??''),i.parentId?String(i.parentId):undefined));}
 if(req.method==='GET'&&url.pathname==='/v1/shop/products')return json(res,200,{products:await listSellerProducts(url.searchParams.get('sellerId')??session.userId)});if(req.method==='POST'&&url.pathname==='/v1/shop/products')return json(res,201,await createProduct(session.userId,await body(req)));const prod=url.pathname.match(/^\/v1\/shop\/products\/([^/]+)$/);if(req.method==='GET'&&prod)return json(res,200,{product:await getProduct(prod[1])});
 if(req.method==='GET'&&url.pathname==='/v1/cart')return json(res,200,await getCart(session.userId));if(req.method==='POST'&&url.pathname==='/v1/cart/items'){const i=await body(req);return json(res,200,await addCartItem(session.userId,String(i.productId??''),Number(i.quantity??1)));}if(req.method==='PATCH'&&url.pathname==='/v1/cart/items'){const i=await body(req);return json(res,200,await updateCartItem(session.userId,String(i.productId??''),Number(i.quantity??0)));}if(req.method==='POST'&&url.pathname==='/v1/orders')return json(res,201,await placeOrder(session.userId));
 return json(res,404,{error:'Not found'});
 }catch(error){const message=error instanceof Error?error.message:'Request failed';const status=/Unauthenticated/i.test(message)?401:/too many/i.test(message)?429:/already in use|invalid|incorrect|expired|required|not found|Cannot|insufficient|inactive|blocked|moderation/i.test(message)?400:500;return json(res,status,{error:status===500?'Internal server error':message});}});
server.listen(config.port,()=>console.log(`Drustpoll auth server listening on :${config.port}`));
