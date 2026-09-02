import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AppShell } from '../src/ui/AppShell';
import { colors, spacing } from '../src/ui/theme';
import { getReels, startReelWatchSession, endReelWatchSession } from '../src/api/client';
import { enqueueReelEvents, flushReelEvents, type QueuedReelEvent } from '../src/reels/event-queue';

type Reel=Awaited<ReturnType<typeof getReels>>['items'][number];
const id=()=>`${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

function ReelVideo({item,active,preload,onEvent}:{item:Reel;active:boolean;preload:boolean;onEvent:(event:QueuedReelEvent)=>void}){
  const player=useVideoPlayer(preload?item.videoUrl:null,p=>{p.timeUpdateEventInterval=0.5;p.muted=true;});
  const started=useRef(false);const lastProgress=useRef(-1);
  useEffect(()=>{if(active){player.replace(item.videoUrl);player.muted=true;player.play();if(!started.current){started.current=true;onEvent({postId:item.id,eventType:'start',clientEventId:id()});}}else{if(started.current&&player.duration>0&&player.currentTime/player.duration<0.9)onEvent({postId:item.id,eventType:'skip',position:Math.floor(player.currentTime),watchedMs:Math.floor(player.currentTime*1000),videoDurationMs:Math.floor(player.duration*1000),clientEventId:id()});player.pause();}},[active,item.id,item.videoUrl,onEvent,player]);
  useEventListener(player,'timeUpdate',({currentTime})=>{if(!active)return;const second=Math.floor(currentTime);if(second!==lastProgress.current&&second%2===0){lastProgress.current=second;onEvent({postId:item.id,eventType:'progress',position:second,watchedMs:Math.floor(currentTime*1000),videoDurationMs:Math.floor((player.duration||0)*1000),clientEventId:id()});}});
  useEventListener(player,'playToEnd',()=>onEvent({postId:item.id,eventType:'complete',position:Math.floor(player.duration),watchedMs:Math.floor(player.duration*1000),videoDurationMs:Math.floor(player.duration*1000),clientEventId:id()}));
  return <VideoView style={styles.video} player={player} contentFit="cover" allowsFullscreen allowsPictureInPicture nativeControls={false}/>;
}

export default function Reels(){
 const {height}=useWindowDimensions();const [items,setItems]=useState<Reel[]>([]);const [active,setActive]=useState(0);const [session,setSession]=useState<string|null>(null);const [error,setError]=useState<string|null>(null);const queue=useRef<QueuedReelEvent[]>([]);
 const flush=useMemo(()=>async()=>{if(!session)return;if(queue.current.length){await enqueueReelEvents(queue.current.splice(0));}await flushReelEvents(session);},[session]);
 useEffect(()=>{let mounted=true;void(async()=>{try{const [r,s]=await Promise.all([getReels(),startReelWatchSession(id())]);if(mounted){setItems(r.items??[]);setSession(s.sessionId);}}catch(e){if(mounted)setError(e instanceof Error?e.message:'Could not load Reels');}})();return()=>{mounted=false;void flush();if(session)void endReelWatchSession(session);};},[]);
 useEffect(()=>{const timer=setInterval(()=>void flush(),5000);return()=>clearInterval(timer);},[flush]);
 const push=(event:QueuedReelEvent)=>{queue.current.push(event);};
 if(error)return <AppShell><View style={styles.center}><Text style={styles.state}>{error}</Text></View></AppShell>;
 if(!items.length)return <AppShell><View style={styles.center}><Text style={styles.state}>Loading Reels…</Text></View></AppShell>;
 return <AppShell><FlatList data={items} pagingEnabled keyExtractor={x=>x.id} showsVerticalScrollIndicator={false} onMomentumScrollEnd={e=>setActive(Math.round(e.nativeEvent.contentOffset.y/Math.max(height,1)))} renderItem={({item,index})=><View style={[styles.page,{height:Math.max(height,560)}]}><ReelVideo item={item} active={index===active} preload={Math.abs(index-active)<=1} onEvent={push}/><View style={styles.overlay}><Text style={styles.badge}>{item.reason.replace('_',' ')}</Text><Text style={styles.title}>{item.display_name||item.username}</Text><Text style={styles.meta}>{item.likes} likes · {item.comments} comments</Text></View></View>}/></AppShell>;
}
const styles=StyleSheet.create({page:{backgroundColor:'#050505',position:'relative'},video:{...StyleSheet.absoluteFillObject},overlay:{position:'absolute',left:spacing.xl,right:spacing.xl,bottom:spacing.xl,gap:8},badge:{alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:6,borderRadius:99,backgroundColor:'#FFFFFF22',color:'#fff',fontSize:11,fontWeight:'700',textTransform:'uppercase'},title:{fontSize:25,fontWeight:'800',color:'#fff'},meta:{fontSize:13,color:'#D0D5DD'},center:{flex:1,justifyContent:'center',alignItems:'center',padding:spacing.xl},state:{color:colors.muted}});
