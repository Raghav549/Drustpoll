import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

const MAX_REQUESTS=120;
const WINDOW_MS=60_000;
const MAX_BUCKETS=10_000;
const buckets=new Map<string,{started:number;count:number}>();

export function requestFingerprint(req:IncomingMessage){
 return createHash('sha256').update(`${req.socket.remoteAddress??'unknown'}|${req.headers['user-agent']??''}`).digest('hex').slice(0,32);
}

function prune(now:number){
 for(const [key,b] of buckets){if(now-b.started>=WINDOW_MS)buckets.delete(key);}
 if(buckets.size<=MAX_BUCKETS)return;
 const excess=buckets.size-MAX_BUCKETS;
 let removed=0;
 for(const key of buckets.keys()){buckets.delete(key);if(++removed>=excess)break;}
}

export function allowRequest(req:IncomingMessage){
 const now=Date.now();
 if(buckets.size>MAX_BUCKETS||Math.random()<0.02)prune(now);
 const key=requestFingerprint(req),b=buckets.get(key);
 if(!b||now-b.started>=WINDOW_MS){buckets.set(key,{started:now,count:1});return true;}
 b.count+=1;
 return b.count<=MAX_REQUESTS;
}

export function securityHeaders(res:ServerResponse){
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Permissions-Policy','camera=(),microphone=(),geolocation=()');
 res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
}
