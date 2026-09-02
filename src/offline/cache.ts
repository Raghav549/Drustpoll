import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX='drustpoll.cache.v2:';
const MAX_AGE_MS=1000*60*60*24*30;
const MAX_BYTES=900_000;

type Entry<T>={savedAt:number;value:T};

export async function readCache<T>(key:string):Promise<T|null>{
  try{
    const raw=await AsyncStorage.getItem(PREFIX+key);
    if(!raw)return null;
    const parsed=JSON.parse(raw) as Entry<T>;
    if(!parsed || typeof parsed.savedAt!=='number' || Date.now()-parsed.savedAt>MAX_AGE_MS)return null;
    return parsed.value;
  }catch{return null;}
}

export async function writeCache<T>(key:string,value:T){
  try{
    const raw=JSON.stringify({savedAt:Date.now(),value} satisfies Entry<T>);
    if(raw.length>MAX_BYTES)return;
    await AsyncStorage.setItem(PREFIX+key,raw);
  }catch{}
}

export async function clearCache(key?:string){
  try{
    if(key) await AsyncStorage.multiRemove([PREFIX+key,'drustpoll.cache.v1:'+key]);
    else {
      const keys=await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys.filter(k=>k.startsWith(PREFIX)||k.startsWith('drustpoll.cache.v1:')));
    }
  }catch{}
}
