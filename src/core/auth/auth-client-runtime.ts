import { Platform } from 'react-native';
import { AuthState } from './auth-contract';

const API_URL=(process.env.EXPO_PUBLIC_API_URL??'').replace(/\/$/,'');
let memoryToken:string|null=null;let memoryRefresh:string|null=null;
async function secureStore(){if(Platform.OS==='web')return null;return import('expo-secure-store');}
async function saveTokens(token:string,refreshToken?:string){memoryToken=token;if(refreshToken)memoryRefresh=refreshToken;const store=await secureStore();if(store){await store.setItemAsync('drustpoll.session',token);if(refreshToken)await store.setItemAsync('drustpoll.refresh',refreshToken);}}
export async function getAccessToken(){if(memoryToken)return memoryToken;const store=await secureStore();memoryToken=store?await store.getItemAsync('drustpoll.session'):null;return memoryToken;}
async function loadRefresh(){if(memoryRefresh)return memoryRefresh;const store=await secureStore();memoryRefresh=store?await store.getItemAsync('drustpoll.refresh'):null;return memoryRefresh;}
async function clearTokens(){memoryToken=null;memoryRefresh=null;const store=await secureStore();if(store){await store.deleteItemAsync('drustpoll.session');await store.deleteItemAsync('drustpoll.refresh');}}
function localNetworkHint(url:string){return /^(http:\/\/localhost|http:\/\/127\.0\.0\.1|http:\/\/10\.|http:\/\/192\.168\.|http:\/\/172\.(1[6-9]|2\d|3[0-1])\.)/i.test(url);}
async function request(path:string,init:RequestInit={},withAuth=true){
 if(!API_URL)throw new Error('Backend URL is not configured. Set EXPO_PUBLIC_API_URL to the deployed HTTPS API URL.');
 if(localNetworkHint(API_URL)&&Platform.OS==='android')throw new Error('This Android build cannot use a localhost or LAN HTTP backend. Configure EXPO_PUBLIC_API_URL with the deployed HTTPS Drustpoll API URL.');
 const token=withAuth?await getAccessToken():null;const headers=new Headers(init.headers);headers.set('Content-Type','application/json');if(token)headers.set('Authorization',`Bearer ${token}`);
 let response:Response;try{response=await fetch(`${API_URL}${path}`,{...init,headers,credentials:'include'});}catch(e){throw new Error(e instanceof Error?e.message:'Network request failed. Check the Drustpoll API URL and your connection.');}
 const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error??'Request failed');return data;
}
export async function signUp(input:{username:string;displayName:string;password:string;email?:string;phone?:string}){const data=await request('/v1/auth/signup',{method:'POST',body:JSON.stringify(input)},false);if(data.token)await saveTokens(data.token,data.refreshToken);return data;}
export async function signIn(identifier:string,password:string){const data=await request('/v1/auth/login',{method:'POST',body:JSON.stringify({identifier,password})},false);if(data.token)await saveTokens(data.token,data.refreshToken);return data;}
export async function refreshSession(){const refreshToken=await loadRefresh();if(!refreshToken)return null;try{const data=await request('/v1/auth/refresh',{method:'POST',body:JSON.stringify({refreshToken})},false);if(data.token)await saveTokens(data.token,data.refreshToken);return data;}catch{await clearTokens();return null;}}
export async function signOut(){try{await request('/v1/auth/logout',{method:'POST'});}finally{await clearTokens();}}
export async function getAuthState():Promise<AuthState>{const token=await getAccessToken();if(!token)return{status:'signed_out',session:null};try{const data=await request('/v1/auth/me');const sess=data.session;return{status:'signed_in',session:{id:sess.sessionId,userId:sess.userId,deviceId:sess.deviceId,createdAt:0,lastSeenAt:Date.now(),expiresAt:new Date(sess.expiresAt).getTime(),absoluteExpiresAt:new Date(sess.absoluteExpiresAt??sess.expiresAt).getTime()}};}catch{const refreshed=await refreshSession();if(!refreshed)return{status:'signed_out',session:null};try{const data=await request('/v1/auth/me');const sess=data.session;return{status:'signed_in',session:{id:sess.sessionId,userId:sess.userId,deviceId:sess.deviceId,createdAt:0,lastSeenAt:Date.now(),expiresAt:new Date(sess.expiresAt).getTime(),absoluteExpiresAt:new Date(sess.absoluteExpiresAt??sess.expiresAt).getTime()}};}catch{await clearTokens();return{status:'signed_out',session:null};}}}
