import { getAccessToken, refreshSession } from '../core/auth/auth-client-runtime';
import { Platform } from 'react-native';

// On web an empty API URL means "same origin" so the browser can use a
// single-origin deployment or the Expo preview's reverse proxy. Native builds
// have no browser origin to fall back to and must be configured explicitly.
const API_URL=(process.env.EXPO_PUBLIC_API_URL??'').replace(/\/$/,'');
const SAME_ORIGIN=!API_URL&&Platform.OS==='web';
const REQUEST_TIMEOUT_MS=20000;
let refreshInFlight:Promise<any>|null=null;

async function fetchWithTimeout(url:string,init:RequestInit={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
 try{
  return await fetch(url,{...init,signal:controller.signal});
 }catch(error){
  if(error instanceof Error&&error.name==='AbortError')throw new ApiError(0,'NETWORK_TIMEOUT');
  throw new ApiError(0,error instanceof Error?error.message:'Network request failed');
 }finally{
  clearTimeout(timer);
 }
}

export class ApiError extends Error{
 constructor(public status:number,message:string){super(message);}
}

export async function api<T>(path:string,init:RequestInit={},retry=true):Promise<T>{
 if(!API_URL&&!SAME_ORIGIN)throw new ApiError(0,'Backend URL is not configured.');
 const token=await getAccessToken();
 const headers=new Headers(init.headers);
 headers.set('Content-Type','application/json');
 if(token)headers.set('Authorization',`Bearer ${token}`);
 let response:Response;
 try{
  response=await fetchWithTimeout(`${API_URL}${path}`,{...init,credentials:'include',headers});
 }catch(error){
  if(error instanceof ApiError&&error.status===0)throw new ApiError(0,'Unable to reach the Drustpoll server right now. Please check your connection and try again.');
  throw error;
 }
 const text=await response.text();
 let data:any={};
 try{data=text?JSON.parse(text):{};}catch{data={error:'Invalid server response'};}
 if(response.status===401&&retry&&token){
  refreshInFlight??=refreshSession().finally(()=>{refreshInFlight=null;});
  const refreshed=await refreshInFlight;
  if(refreshed?.token)return api<T>(path,init,false);
 }
 if(!response.ok)throw new ApiError(response.status,String(data.error??`Request failed (${response.status})`));
 return data as T;
}
