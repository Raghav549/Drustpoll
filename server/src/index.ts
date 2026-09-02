import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { config } from './config.js';
import { authenticate, changePassword, createReauthGrant, listSessions, login, refresh, requestOtp, requestPasswordReset, resetPassword, revoke, revokeAll, revokeSession, signup, verifyOtp } from './auth-service.js';
import { health } from './health.js';
import { addComment, createPost, follow, getFeed, getProfile, setFollowState, toggleReaction, toggleSave, unfollow } from './social-service.js';
import { recordFeedEvents } from './feed-events-service.js';
import { addCartItem, createProduct, getCart, getProduct, listSellerProducts, placeOrder, updateCartItem } from './commerce-service.js';

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.end(JSON.stringify(body));
};
async function body(req: IncomingMessage): Promise<any> { let data=''; for await (const chunk of req) { data += chunk; if (Buffer.byteLength(data)>256*1024) throw new Error('Request too large'); } return data ? JSON.parse(data) : {}; }
function bearer(req: IncomingMessage): string|null { const value=req.headers.authorization; return value?.startsWith('Bearer ') ? value.slice(7) : null; }
function cookie(req: IncomingMessage,name:string): string|null { const item=(req.headers.cookie??'').split(';').map(v=>v.trim()).find(v=>v.startsWith(`${name}=`)); return item ? decodeURIComponent(item.slice(name.length+1)) : null; }
function setSessionCookie(res:ServerResponse,token:string,maxAgeSeconds=1800){const secure=config.secureCookies?'; Secure':'';const name=config.secureCookies?'__Host-drustpoll_session':'drustpoll_session';res.setHeader('Set-Cookie',`${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${maxAgeSeconds}`);}
function clearSessionCookie(res:ServerResponse){const name=config.secureCookies?'__Host-drustpoll_session':'drustpoll_session';res.setHeader('Set-Cookie',`${name}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${config.secureCookies?'; Secure':''}`);}
function sessionCookie(req:IncomingMessage){return cookie(req,config.secureCookies?'__Host-drustpoll_session':'drustpoll_session');}
async function auth(req:IncomingMessage){return authenticate(bearer(req)??sessionCookie(req)??'');}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==='OPTIONS'){res.statusCode=204;res.end();return;}
    const url=new URL(req.url??'/',`http://${req.headers.host??'localhost'}`);
    const ip=req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()??req.socket.remoteAddress??'unknown';
    if(req.method==='GET'&&url.pathname==='/health')return json(res,200,await health());
    if(req.method==='POST'&&url.pathname==='/v1/auth/signup'){const result=await signup(await body(req),ip);setSessionCookie(res,result.token);return json(res,201,{userId:result.userId,deviceId:result.deviceId,expiresAt:result.expiresAt,refreshExpiresAt:result.refreshExpiresAt,refreshToken:result.refreshToken,token:result.token});}
    if(req.method==='POST'&&url.pathname==='/v1/auth/login'){const result=await login(await body(req),ip);setSessionCookie(res,result.token);return json(res,200,{userId:result.userId,deviceId:result.deviceId,expiresAt:result.expiresAt,refreshExpiresAt:result.refreshExpiresAt,refreshToken:result.refreshToken,token:result.token});}
    if(req.method==='POST'&&url.pathname==='/v1/auth/refresh'){const input=await body(req);const result=await refresh(String(input.refreshToken??''),ip);setSessionCookie(res,result.token);return json(res,200,{userId:result.userId,deviceId:result.deviceId,expiresAt:result.expiresAt,refreshExpiresAt:result.refreshExpiresAt,refreshToken:result.refreshToken,token:result.token});}
    if(req.method==='POST'&&url.pathname==='/v1/auth/password/forgot')return json(res,202,await requestPasswordReset(String((await body(req)).identifier??''),ip));
    if(req.method==='POST'&&url.pathname==='/v1/auth/password/reset'){const input=await body(req);return json(res,200,await resetPassword(String(input.token??''),String(input.newPassword??'')));}
    if(req.method==='POST'&&url.pathname==='/v1/auth/logout'){await revoke(bearer(req)??sessionCookie(req)??'');clearSessionCookie(res);return json(res,200,{ok:true});}
    if(req.method==='POST'&&url.pathname==='/v1/auth/otp/request'){const input=await body(req);const purpose=input.purpose;const destination=String(input.destination??'');if(!destination||!['verify_email','verify_phone','login_step_up','password_reset'].includes(purpose))return json(res,400,{error:'Invalid OTP request'});const session=await auth(req);if(!session&&!['verify_email','verify_phone','password_reset'].includes(purpose))return json(res,401,{error:'Unauthenticated'});return json(res,202,await requestOtp(session?.userId??null,destination,purpose,ip));}
    if(req.method==='POST'&&url.pathname==='/v1/auth/otp/verify'){const input=await body(req);const purpose=String(input.purpose??'');const session=await auth(req);if(!session&&purpose!=='password_reset')return json(res,401,{error:'Unauthenticated'});await verifyOtp(session?.userId??null,String(input.destination??''),purpose as any,String(input.code??''));return json(res,200,{ok:true});}

    const session=await auth(req);if(!session)return json(res,401,{error:'Unauthenticated'});
    if(req.method==='GET'&&url.pathname==='/v1/auth/me')return json(res,200,{session});
    if(req.method==='GET'&&url.pathname==='/v1/auth/sessions')return json(res,200,{sessions:await listSessions(session.userId,session.sessionId)});
    const revokeMatch=url.pathname.match(/^\/v1\/auth\/sessions\/([^/]+)$/);if(req.method==='DELETE'&&revokeMatch){await revokeSession(session.userId,revokeMatch[1]);return json(res,200,{ok:true});}
    if(req.method==='POST'&&url.pathname==='/v1/auth/logout-all'){await revokeAll(session.userId);clearSessionCookie(res);return json(res,200,{ok:true});}
    if(req.method==='POST'&&url.pathname==='/v1/auth/reauthenticate'){const input=await body(req);return json(res,200,await createReauthGrant(session.userId,session.sessionId,String(input.password??'')));}
    if(req.method==='POST'&&url.pathname==='/v1/auth/password/change'){const input=await body(req);await changePassword(session.userId,String(input.currentPassword??''),String(input.newPassword??''));clearSessionCookie(res);return json(res,200,{ok:true,sessionsRevoked:true});}

    if(req.method==='GET'&&url.pathname==='/v1/social/me/profile')return json(res,200,{profile:await getProfile(session.userId)});
    const profileMatch=url.pathname.match(/^\/v1\/social\/profiles\/([^/]+)$/);if(req.method==='GET'&&profileMatch)return json(res,200,{profile:await getProfile(profileMatch[1])});
    if(req.method==='POST'&&url.pathname==='/v1/social/follow'){const input=await body(req);return json(res,200,await follow(session.userId,String(input.targetUserId??'')));}
    if(req.method==='DELETE'&&url.pathname==='/v1/social/follow'){const input=await body(req);return json(res,200,await unfollow(session.userId,String(input.targetUserId??'')));}
    if(req.method==='POST'&&url.pathname==='/v1/social/relationship'){const input=await body(req);return json(res,200,await setFollowState(session.userId,String(input.targetUserId??''),input.state));}
    if(req.method==='GET'&&url.pathname==='/v1/feed'){const mode=url.searchParams.get('mode')==='following'?'following':'for_you';const limit=Number(url.searchParams.get('limit')??30);const before=url.searchParams.get('before')??undefined;return json(res,200,await getFeed(session.userId,mode,limit,before));}
    if(req.method==='POST'&&url.pathname==='/v1/feed/events'){const input=await body(req);return json(res,202,await recordFeedEvents(session.userId,Array.isArray(input.events)?input.events:[]));}
    if(req.method==='POST'&&url.pathname==='/v1/posts')return json(res,201,await createPost(session.userId,await body(req)));
    const reactionMatch=url.pathname.match(/^\/v1\/posts\/([^/]+)\/reaction$/);if(req.method==='POST'&&reactionMatch)return json(res,200,await toggleReaction(session.userId,reactionMatch[1]));
    const saveMatch=url.pathname.match(/^\/v1\/posts\/([^/]+)\/save$/);if(req.method==='POST'&&saveMatch)return json(res,200,await toggleSave(session.userId,saveMatch[1]));
    const commentMatch=url.pathname.match(/^\/v1\/posts\/([^/]+)\/comments$/);if(req.method==='POST'&&commentMatch){const input=await body(req);return json(res,201,await addComment(session.userId,commentMatch[1],String(input.body??''),input.parentId?String(input.parentId):undefined));}

    if(req.method==='GET'&&url.pathname==='/v1/shop/products'){const sellerId=url.searchParams.get('sellerId')??session.userId;return json(res,200,{products:await listSellerProducts(sellerId)});}
    if(req.method==='POST'&&url.pathname==='/v1/shop/products')return json(res,201,await createProduct(session.userId,await body(req)));
    const productMatch=url.pathname.match(/^\/v1\/shop\/products\/([^/]+)$/);if(req.method==='GET'&&productMatch)return json(res,200,{product:await getProduct(productMatch[1])});
    if(req.method==='GET'&&url.pathname==='/v1/cart')return json(res,200,await getCart(session.userId));
    if(req.method==='POST'&&url.pathname==='/v1/cart/items'){const input=await body(req);return json(res,200,await addCartItem(session.userId,String(input.productId??''),Number(input.quantity??1)));}
    if(req.method==='PATCH'&&url.pathname==='/v1/cart/items'){const input=await body(req);return json(res,200,await updateCartItem(session.userId,String(input.productId??''),Number(input.quantity??0)));}
    if(req.method==='POST'&&url.pathname==='/v1/orders'){return json(res,201,await placeOrder(session.userId));}

    return json(res,404,{error:'Not found'});
  }catch(error){const message=error instanceof Error?error.message:'Request failed';const status=/Unauthenticated/i.test(message)?401:/too many/i.test(message)?429:/already in use|invalid|incorrect|expired|required|not found|Cannot|insufficient|inactive/i.test(message)?400:500;return json(res,status,{error:status===500?'Internal server error':message});}
});
server.listen(config.port,()=>console.log(`Drustpoll auth server listening on :${config.port}`));
