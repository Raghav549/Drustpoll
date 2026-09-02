import AsyncStorage from '@react-native-async-storage/async-storage';
import { recordReelWatchEvents } from '../api/client';

export type QueuedReelEvent={postId:string;eventType:'impression'|'start'|'progress'|'complete'|'skip'|'replay'|'like'|'save'|'share'|'comment'|'not_interested';position?:number;watchedMs?:number;videoDurationMs?:number;clientEventId:string};
const KEY='drustpoll.reels.event-queue.v1';const MAX=500;
async function read():Promise<QueuedReelEvent[]>{try{return JSON.parse((await AsyncStorage.getItem(KEY))??'[]') as QueuedReelEvent[];}catch{return[];}}
async function write(items:QueuedReelEvent[]){await AsyncStorage.setItem(KEY,JSON.stringify(items.slice(-MAX)));}
export async function enqueueReelEvents(events:QueuedReelEvent[]){if(!events.length)return;const current=await read();const ids=new Set(current.map(x=>x.clientEventId));for(const event of events)if(!ids.has(event.clientEventId)){current.push(event);ids.add(event.clientEventId);}await write(current);}
export async function flushReelEvents(sessionId:string){const current=await read();if(!current.length)return 0;const batch=current.slice(0,100);try{const result=await recordReelWatchEvents(sessionId,batch);if(result.accepted>0){const acceptedIds=new Set(batch.slice(0,result.accepted).map(x=>x.clientEventId));await write(current.filter(x=>!acceptedIds.has(x.clientEventId)));}return result.accepted;}catch{return 0;}}
export async function clearReelEventQueue(){await AsyncStorage.removeItem(KEY);}
