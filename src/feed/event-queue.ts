import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

export type QueuedFeedEvent={postId?:string;creatorId?:string;eventType:'impression'|'open'|'dwell'|'like'|'comment'|'save'|'share'|'follow'|'hide'|'not_interested'|'report'|'mute';valueNum?:number;sessionId?:string;clientEventId:string};
const KEY='drustpoll.feed.event-queue.v1';
const MAX=1000;

async function read():Promise<QueuedFeedEvent[]>{try{const raw=await AsyncStorage.getItem(KEY);const parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed:[];}catch{return[];}}
async function write(items:QueuedFeedEvent[]){await AsyncStorage.setItem(KEY,JSON.stringify(items.slice(-MAX)));}

export async function enqueueFeedEvents(events:QueuedFeedEvent[]){
  if(!events.length)return;
  const current=await read();
  const ids=new Set(current.map(x=>x.clientEventId));
  for(const event of events){if(!event.clientEventId||ids.has(event.clientEventId))continue;current.push(event);ids.add(event.clientEventId);}
  await write(current);
}

export async function flushFeedEvents(){
  const current=await read();if(!current.length)return 0;
  const batch=current.slice(0,100);
  try{
    const result=await api<{accepted:number;acceptedClientEventIds:string[]}>('/v1/feed/events',{method:'POST',body:JSON.stringify({events:batch})});
    const accepted=new Set(result.acceptedClientEventIds??[]);
    if(accepted.size)await write(current.filter(x=>!accepted.has(x.clientEventId)));
    return result.accepted??0;
  }catch{return 0;}
}

export async function clearFeedEventQueue(){await AsyncStorage.removeItem(KEY);}
