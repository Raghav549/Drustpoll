import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX='drustpoll.cache.v1:';
const TTL_MS=1000*60*60*24;

export async function readCache<T>(key:string):Promise<T|null>{
  try{
    const raw=await AsyncStorage.getItem(PREFIX+key);
    if(!raw)return null;
    const parsed=JSON.parse(raw) as {savedAt:number;value:T};
    if(!parsed || Date.now()-parsed.savedAt>TTL_MS)return null;
    return parsed.value;
  }catch{return null;}
}

export async function writeCache<T>(key:string,value:T){
  try{await AsyncStorage.setItem(PREFIX+key,JSON.stringify({savedAt:Date.now(),value}));}catch{}
}

export async function clearCache(key?:string){
  try{
    if(key) await AsyncStorage.removeItem(PREFIX+key);
    else {
      const keys=await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys.filter(k=>k.startsWith(PREFIX)));
    }
  }catch{}
}
