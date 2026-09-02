import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { config } from './config.js';
import { authenticate, changePassword, createReauthGrant, listSessions, login, refresh, requestOtp, requestPasswordReset, resetPassword, revoke, revokeAll, revokeSession, signup, verifyOtp } from './auth-service.js';
import { health } from './health.js';
import { addComment, createPost, follow, getFeed, getProfile, setFollowState, toggleReaction, toggleSave, unfollow } from './social-service.js';
import { recordFeedEvents } from './feed-events-service.js';
import { getRecommendedPosts } from './recommendation-service.js';
import { assignRecommendationVariant, recordRecommendationExposure, upsertRecommendationMetric } from './recommendation-experiment-service.js';
import { evaluateRecommendationWindow } from './ranking-evaluation-service.js';
import { startReelWatchSession, endReelWatchSession, recordReelWatchEvents, getReelCandidates } from './reels-service.js';
import { addCartItem, createProduct, getCart, getProduct, listSellerProducts, placeOrder, updateCartItem } from './commerce-service.js';
import { getRecommendedProducts, recordCommerceEvent } from './commerce-recommendation-service.js';
import { listNotifications, markAllNotificationsRead, markNotificationRead, unreadNotificationCount } from './notification-service.js';
import { searchDiscovery, type DiscoveryKind } from './discovery-service.js';
import { createConversation, listConversations, listMessages, markConversationRead, sendEncryptedMessage, upsertDeviceKeyBundle, listDeviceKeyBundles } from './messaging-service.js';
import { blockUser, getSafetyState, muteUser, reportContent, unblockUser, unmuteUser } from './safety-service.js';
import { completeUpload, createUploadIntent, getMediaAsset, getPlaybackUrl } from './media-service.js';
import { getPrivacySettings, updatePrivacySettings } from './privacy-service.js';
import { allowRequest, securityHeaders } from './security-middleware.js';
import { getBuyerOrder, listBuyerOrders, cancelPendingOrder } from './order-service.js';
import { recordUiMeasurements } from './measurement-service.js';

const json=(res:ServerResponse,status:number,body:unknown)=>{securityHeaders(res);res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));};
async function body(req:IncomingMessage):Promise<any>{let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>256*1024)throw new Error('Request too large');}return data?JSON.parse(data):{};}
function bearer(req:IncomingMessage){const v=req.headers.authorization;return v?.startsWith('Bearer ')?v.slice(7):null;}
function cookie(req:IncomingMessage,name:string){const x=(req.headers.cookie??'').split(';').map(v=>v.trim()).find(v=>v.startsWith(`${name}=`));return x?decodeURIComponent(x.slice(name.length+1)):null;}
function sessionCookie(req:IncomingMessage){return cookie(req,config.secureCookies?'__Host-drustpoll_session':'drustpoll_session');}
function setCookie(res:ServerResponse,token:string,maxAge=1800){const secure=config.secureCookies?'; Secure':'';const name=config.secureCookies?'__Host-drustpoll_session':'drustpoll_session';res.setHeader('Set-Cookie',`${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${maxAge}`);}
function clearCookie(res:ServerResponse){setCookie(res,'',0);}
async function auth(req:IncomingMessage){return authenticate(bearer(req)??sessionCookie(req)??'');}

const server=createServer(async(req,res)=>{try{
 if(!allowRequest(req))return json(res,429,{error:'Too many requests'});
 if(req.method==='OPTIONS'){securityHeaders(res);res.statusCode=204;res.end();return;}
 const url=new URL(req.url??'/',`http://${req.headers.host??'localhost'}`);
 const ip=req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()??req.socket.remoteAddress??'unknown';
 if(req.method==='GET'&&url.pathname==='/health')return json(res,200,await health());
 if(req.method==='POST'&&url.pathname==='/v1/auth/signup'){const r=await signup(await body(req),ip);setCookie(res,r.token);return json(res,201,r);}
 if(req.method==='POST'&&url.pathname==='/v1/auth/login'){const r=await login(await body(req),ip);setCookie(res,r.token);return json(res,200,r);}
 if(req.method==='POST'&&url.pathname==='/v1/auth/refresh'){const r=await refresh(String((await body(req)).refreshToken??''),ip);setCookie(res,r.token);return json(res,200,r);}
 if(req.method==='POST'&&url.pathname==='/v1/auth/password/forgot')return json(res,202,await requestPasswordReset(String((await body(req)).identifier??''),ip));
 if(req.method==='POST'&&url.pathname==='/v1/auth/password/reset'){const i=await body(req);return json(res,200,await resetPassword(String(i.token??''),String(i.newPassword??'')));}
 if(req.method==='POST'&&url.pathname==='/v1/auth/logout'){await revoke(bearer(req)??sessionCookie(req)??'');clearCookie(res);return json(res,200,{ok:true});}
 const session=await auth(req);if(!session)return json(res,401,{error:'Unauthenticated'});
 if(req.method==='GET'&&url.pathname==='/v1/auth/me')return json(res,200,{session});
 if(req.method==='GET'&&url.pathname==='/v1/auth/sessions')return json(res,200,{sessions:await listSessions(session.userId,session.sessionId)});
 if(req.method==='GET'&&url.pathname==='/v1/privacy')return json(res,200,{privacy:await getPrivacySettings(session.userId)});
 if(req.method==='PUT'&&url.pathname==='/v1/privacy')return json(res,200,{privacy:await updatePrivacySettings(session.userId,await body(req))});
 if(req.method==='GET'&&url.pathname==='/v1/notifications')return json(res,200,await listNotifications(session.userId,Number(url.searchParams.get('limit')??30),url.searchParams.get('before')??undefined));
 if(req.method==='GET'&&url.pathname==='/v1/notifications/unread-count')return json(res,200,{count:await unreadNotificationCount(session.userId)});
 const nr=url.pathname.match(/^\/v1\/notifications\/([^/]+)\/read$/);if(req.method==='POST'&&nr)return json(res,200,await markNotificationRead(session.userId,nr[1]));
 if(req.method==='POST'&&url.pathname==='/v1/notifications/read-all')return json(res,200,await markAllNotificationsRead(session.userId));
 if(req.method==='GET'&&url.pathname==='/v1/discovery/search'){const k=(url.searchParams.get('kind')??'all') as DiscoveryKind;if(!['all','people','posts','products'].includes(k))return json(res,400,{error:'Invalid search kind'});return json(res,200,await searchDiscovery(session.userId,url.searchParams.get('q')??'',k,Number(url.searchParams.get('limit')??20)));}
 if(req.method==='POST'&&url.pathname==='/v1/media/upload-intents'){const i=await body(req);return json(res,201,await createUploadIntent(session.userId,{type:String(i.type??''),mime:String(i.mime??''),filename:i.filename?String(i.filename):undefined,byteSize:Number(i.byteSize??0)}));}
 const mc=url.pathname.match(/^\/v1\/media\/([^/]+)\/complete$/);if(req.method==='POST'&&mc){const i=await body(req);return json(res,200,await completeUpload(session.userId,mc[1],String(i.detectedMime??''),i.width==null?null:Number(i.width),i.height==null?null:Number(i.height),i.durationMs==null?null:Number(i.durationMs)));}
 const mp=url.pathname.match(/^\/v1\/media\/([^/]+)\/playback$/);if(req.method==='GET'&&mp)return json(res,200,await getPlaybackUrl(session.userId,mp[1]));
 if(req.method==='POST'&&url.pathname==='/v1/reels/watch-sessions'){const i=await body(req);return json(res,201,await startReelWatchSession(session.userId,i.clientSessionId?String(i.clientSessionId):undefined));}
 const ws=url.pathname.match(/^\/v1\/reels\/watch-sessions\/([^/]+)$/);if(req.method==='DELETE'&&ws)return json(res,200,await endReelWatchSession(session.userId,ws[1]));
 if(req.method==='POST'&&url.pathname==='/v1/reels/watch-events'){const i=await body(req);return json(res,202,await recordReelWatchEvents(session.userId,String(i.sessionId??''),Array.isArray(i.events)?i.events:[]));}
 if(req.method==='GET'&&url.pathname==='/v1/reels/recommended')return json(res,200,{items:await getReelCandidates(session.userId,Number(url.searchParams.get('limit')??30))});
 if(req.method==='POST'&&url.pathname==='/v1/recommendation/exposure'){const i=await body(req);return json(res,202,await recordRecommendationExposure(session.userId,Array.isArray(i.items)?i.items:[]));}
 if(req.method==='POST'&&url.pathname==='/v1/recommendation/experiment/assign'){const i=await body(req);return json(res,200,await assignRecommendationVariant(session.userId,String(i.key??''),Array.isArray(i.variants)?i.variants.map(String):undefined));}
 if(req.method==='POST'&&url.pathname==='/v1/recommendation/metrics'){const i=await body(req);return json(res,202,await upsertRecommendationMetric({...i,userId:session.userId}));}
 if(req.method==='GET'&&url.pathname==='/v1/recommendation/offline-evaluation'){const start=url.searchParams.get('start'),end=url.searchParams.get('end');if(!start||!end)return json(res,400,{error:'start and end required'});return json(res,200,{metrics:await evaluateRecommendationWindow(start,end,url.searchParams.get('experimentId')??undefined)});}
 if(req.method==='POST'&&url.pathname==='/v1/measurements/ui'){const i=await body(req);return json(res,202,await recordUiMeasurements(session.userId,Array.isArray(i.events)?i.events:[]));}
 if(req.method==='GET'&&url.pathname==='/v1/messages/conversations')return json(res,200,await listConversations(session.userId,Number(url.searchParams.get('limit')??30)));
 if(req.method==='POST'&&url.pathname==='/v1/messages/conversations'){const i=await body(req);return json(res,201,await createConversation(session.userId,Array.isArray(i.participantIds)?i.participantIds.map(String):[]));}
 if(req.method==='POST'&&url.pathname==='/v1/messages/device-keys'){const i=await body(req);return json(res,200,await upsertDeviceKeyBundle(session.userId,{deviceId:String(i.deviceId??''),identityKey:String(i.identityKey??''),signedPreKey:String(i.signedPreKey??''),signedPreKeySignature:String(i.signedPreKeySignature??''),keyVersion:Number(i.keyVersion??1)}));}
 const dk=url.pathname.match(/^\/v1\/messages\/device-keys\/([^/]+)$/);if(req.method==='GET'&&dk)return json(res,200,await listDeviceKeyBundles(session.userId,dk[1]));
 const cv=url.pathname.match(/^\/v1\/messages\/conversations\/([^/]+)\/messages$/);if(cv){if(req.method==='GET')return json(res,200,await listMessages(session.userId,cv[1],Number(url.searchParams.get('limit')??50),url.searchParams.get('before')??undefined));if(req.method==='POST'){const i=await body(req);return json(res,201,await sendEncryptedMessage(session.userId,cv[1],String(i.ciphertext??''),Number(i.keyVersion??1),i.deviceId?String(i.deviceId):undefined));}}
 const rd=url.pathname.match(/^\/v1\/messages\/conversations\/([^/]+)\/read$/);if(req.method==='POST'&&rd)return json(res,200,await markConversationRead(session.userId,rd[1]));
 if(req.method==='POST'&&url.pathname==='/v1/safety/block'){const i=await body(req);return json(res,200,await blockUser(session.userId,String(i.targetUserId??'')));}
 if(req.method==='DELETE'&&url.pathname==='/v1/safety/block'){const i=await body(req);return json(res,200,await unblockUser(session.userId,String(i.targetUserId??'')));}
 if(req.method==='POST'&&url.pathname==='/v1/safety/mute'){const i=await body(req);return json(res,200,await muteUser(session.userId,String(i.targetUserId??'')));}
 if(req.method==='DELETE'&&url.pathname==='/v1/safety/mute'){const i=await body(req);return json(res,200,await unmuteUser(session.userId,String(i.targetUserId??'')));}
 if(req.method==='GET'&&url.pathname==='/v1/safety/state'){const id=url.searchParams.get('targetUserId');if(!id)return json(res,400,{error:'targetUserId required'});return json(res,200,await getSafetyState(session.userId,id));}
 if(req.method==='POST'&&url.pathname==='/v1/safety/report'){const i=await body(req);return json(res,201,await reportContent(session.userId,i.target??{},String(i.reason??''),String(i.details??'')));}
 if(req.method==='GET'&&url.pathname==='/v1/social/me/profile')return json(res,200,{profile:await getProfile(session.userId)});
 const pm=url.pathname.match(/^\/v1\/social\/profiles\/([^/]+)$/);if(req.method==='GET'&&pm)return json(res,200,{profile:await getProfile(pm[1])});
 if(req.method==='POST'&&url.pathname==='/v1/social/follow'){const i=await body(req);return json(res,200,await follow(session.userId,String(i.targetUserId??'')));}
 if(req.method==='DELETE'&&url.pathname==='/v1/social/follow'){const i=await body(req);return json(res,200,await unfollow(session.userId,String(i.targetUserId??'')));}
 if(req.method==='POST'&&url.pathname==='/v1/social/relationship'){const i=await body(req);return json(res,200,await setFollowState(session.userId,String(i.targetUserId??''),i.state));}
 if(req.method==='GET'&&url.pathname==='/v1/feed'){const m=url.searchParams.get('mode')==='following'?'following':'for_you';return json(res,200,await getFeed(session.userId,m,Number(url.searchParams.get('limit')??30),url.searchParams.get('before')??undefined));}
 if(req.method==='GET'&&url.pathname==='/v1/feed/recommended')return json(res,200,{items:await getRecommendedPosts(session.userId,Number(url.searchParams.get('limit')??20))});
 if(req.method==='POST'&&url.pathname==='/v1/feed/events'){const i=await body(req);return json(res,202,await recordFeedEvents(session.userId,Array.isArray(i.events)?i.events:[]));}
 if(req.method==='POST'&&url.pathname==='/v1/posts')return json(res,201,await createPost(session.userId,await body(req)));
 const rx=url.pathname.match(/^\/v1\/posts\/([^/]+)\/reaction$/);if(req.method==='POST'&&rx)return json(res,200,await toggleReaction(session.userId,rx[1]));
 const sv=url.pathname.match(/^\/v1\/posts\/([^/]+)\/save$/);if(req.method==='POST'&&sv)return json(res,200,await toggleSave(session.userId,sv[1]));
 const cm=url.pathname.match(/^\/v1\/posts\/([^/]+)\/comments$/);if(req.method==='POST'&&cm){const i=await body(req);return json(res,201,await addComment(session.userId,cm[1],String(i.body??''),i.parentId?String(i.parentId):undefined);}
 if(req.method==='GET'&&url.pathname==='/v1/shop/products')return json(res,200,{products:await listSellerProducts(url.searchParams.get('sellerId')??session.userId)});
 if(req.method==='POST'&&url.pathname==='/v1/shop/products')return json(res,201,await createProduct(session.userId,await body(req)));
 const pr=url.pathname.match(/^\/v1\/shop\/products\/([^/]+)$/);if(req.method==='GET'&&pr)return json(res,200,{product:await getProduct(pr[1])});
 if(req.method==='GET'&&url.pathname==='/v1/shop/recommended')return json(res,200,{items:await getRecommendedProducts(session.userId,Number(url.searchParams.get('limit')??20))});
 if(req.method==='POST'&&url.pathname==='/v1/shop/events'){const i=await body(req);return json(res,202,await recordCommerceEvent(session.userId,{productId:String(i.productId??''),eventType:i.eventType,dwellMs:i.dwellMs==null?undefined:Number(i.dwellMs),clientEventId:i.clientEventId?String(i.clientEventId):undefined}));}
 if(req.method==='GET'&&url.pathname==='/v1/cart')return json(res,200,await getCart(session.userId));
 if(req.method==='POST'&&url.pathname==='/v1/cart/items'){const i=await body(req);return json(res,200,await addCartItem(session.userId,String(i.productId??''),Number(i.quantity??1)));}
 if(req.method==='PATCH'&&url.pathname==='/v1/cart/items'){const i=await body(req);return json(res,200,await updateCartItem(session.userId,String(i.productId??''),Number(i.quantity??0)));}
 if(req.method==='GET'&&url.pathname==='/v1/orders')return json(res,200,await listBuyerOrders(session.userId,Number(url.searchParams.get('limit')??30),url.searchParams.get('before')??undefined));
 const or=url.pathname.match(/^\/v1\/orders\/([^/]+)$/);if(req.method==='GET'&&or)return json(res,200,{order:await getBuyerOrder(session.userId,or[1])});
 const oc=url.pathname.match(/^\/v1\/orders\/([^/]+)\/cancel$/);if(req.method==='POST'&&oc)return json(res,200,await cancelPendingOrder(session.userId,oc[1]));
 if(req.method==='POST'&&url.pathname==='/v1/orders'){const i=await body(req);return json(res,201,await placeOrder(session.userId,i.idempotencyKey?String(i.idempotencyKey):undefined));}
 return json(res,404,{error:'Not found'});
}catch(error){const message=error instanceof Error?error.message:'Request failed';const status=/Unauthenticated/i.test(message)?401:/too many/i.test(message)?429:/already in use|invalid|incorrect|expired|required|not found|Cannot|insufficient|inactive|blocked|moderation/i.test(message)?400:500;return json(res,status,{error:message});}});
server.listen(config.port,()=>console.log(`Drustpoll API listening on ${config.port}`));
