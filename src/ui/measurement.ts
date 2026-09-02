import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

const QUEUE_KEY='drustpoll.ui.measurements.v1';
const MAX=300;

type Measurement={surface:string;metric:string;valueNum?:number;valueText?:string;sessionId?:string;clientEventId:string};
const id=()=>`${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
async function read():Promise<Measurement[]>{try{const raw=await AsyncStorage.getItem(QUEUE_KEY);const parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed:[];}catch{return[];}}
async function write(items:Measurement[]){try{await AsyncStorage.setItem(QUEUE_KEY,JSON.stringify(items.slice(-MAX)));}catch{}}
export async function trackUi(input:Omit<Measurement,'clientEventId'> & {clientEventId?:string}){const event={...input,clientEventId:input.clientEventId??id()};const current=await read();if(current.some(x=>x.clientEventId===event.clientEventId))return;current.push(event);await write(current);void flushUi();}
export async function flushUi(){const current=await read();if(!current.length)return 0;const batch=current.slice(0,50);try{const result=await api<{accepted:number;acceptedClientEventIds:string[]}>('/v1/measurements/ui',{method:'POST',body:JSON.stringify({events:batch})});const accepted=new Set(result.acceptedClientEventIds??[]);if(accepted.size)await write(current.filter(x=>!accepted.has(x.clientEventId)));return result.accepted??0;}catch{return 0;}}
export async function clearUiMeasurements(){await AsyncStorage.removeItem(QUEUE_KEY);}
