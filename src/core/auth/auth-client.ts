import { Platform } from 'react-native';
import { AuthState } from './auth-contract';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
let memoryToken: string | null = null;
async function secureStore(){if(Platform.OS==='web')return null;return import('expo-secure-store');}
async function saveToken(token:string){memoryToken=token;const store=await secureStore();if(store)await store.setItemAsync('drustpoll.session',token);}
async function loadToken(){if(memoryToken)return memoryToken;const store=await secureStore();memoryToken=store?await store.getItemAsync('drustpoll.session'):null;return memoryToken;}
async function clearToken(){memoryToken=null;const store=await secureStore();if(store)await store.deleteItemAsync('drustpoll.session');}
async function request(path:string,init:RequestInit={}){const token=await loadToken();const headers=new Headers(init.headers);headers.set('Content-Type','application/json');if(token)headers.set('Authorization',`Bearer ${token}`);const response=await fetch(`${API_URL}${path}`,{...init,headers,credentials:'include'});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error??'Request failed');return data;}
export async function signUp(input:{username:string;displayName:string;password:string;email?:string;phone?:string}){const data=await request('/v1/auth/signup',{method:'POST',body:JSON.stringify(input)});if(data.token)await saveToken(data.token);return data;}
export async function signIn(identifier:string,password:string){const data=await request('/v1/auth/login',{method:'POST',body:JSON.stringify({identifier,password})});if(data.token)await saveToken(data.token);return data;}
export async function signOut(){try{await request('/v1/auth/logout',{method:'POST'});}finally{await clearToken();}}
export async function getAuthState():Promise<AuthState>{const token=await loadToken();if(!token)return{status:'signed_out',session:null};try{const data=await request('/v1/auth/me');const s=data.session;return{status:'signed_in',session:{id:s.sessionId,userId:s.userId,deviceId:s.deviceId,createdAt:0,lastSeenAt:Date.now(),expiresAt:new Date(s.expiresAt).getTime(),absoluteExpiresAt:new Date(s.absoluteExpiresAt??s.expiresAt).getTime()}};}catch{await clearToken();return{status:'signed_out',session:null};}}
