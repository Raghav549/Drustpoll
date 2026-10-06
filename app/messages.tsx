import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { getConversations, getMessageRequests, markConversationRead, respondToMessageRequest, type ConversationSummary, type MessageRequest } from '../src/api/client';
import { AppShell } from '../src/ui/AppShell';
import { Chip, StateView } from '../src/ui/primitives';
import { Icon } from '../src/ui/icons';
import { colors, elevation, radius, spacing, type } from '../src/ui/theme';

type InboxTab='all'|'requests'|'unread';
const time=(value?:string)=>{if(!value)return'';const ms=Math.max(0,Date.now()-new Date(value).getTime());if(ms<60_000)return'now';if(ms<3_600_000)return`${Math.floor(ms/60_000)}m`;if(ms<86_400_000)return`${Math.floor(ms/3_600_000)}h`;return`${Math.floor(ms/86_400_000)}d`;};

export default function Messages(){
 const router=useRouter();
 const[threads,setThreads]=useState<ConversationSummary[]>([]);
 const[requests,setRequests]=useState<MessageRequest[]>([]);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState<string|null>(null);
 const[notice,setNotice]=useState<string|null>(null);
 const[busy,setBusy]=useState<string|null>(null);
 const[tab,setTab]=useState<InboxTab>('all');

 const load=useCallback(async()=>{
  setLoading(true);setError(null);
  try{
   if(tab==='requests'){
    const result=await getMessageRequests();setRequests(result.requests??[]);
   }else{
    const result=await getConversations(30,tab==='unread'?'unread':'all');setThreads(result.conversations??[]);
   }
  }catch(e){setError(e instanceof Error?e.message:'Could not load messages');}
  finally{setLoading(false);}
 },[tab]);
 useEffect(()=>{void load();},[load]);

 const openThread=async(thread:ConversationSummary)=>{
  if(busy)return;setBusy(thread.id);
  try{await markConversationRead(thread.id);}catch(e){setNotice(e instanceof Error?e.message:'Could not update read state');}
  finally{setBusy(null);router.push({pathname:'/conversation/[id]',params:{id:thread.id}});}
 };
 const resolve=async(request:MessageRequest,decision:'accept'|'decline')=>{
  if(busy)return;setBusy(request.request_id);setError(null);setNotice(null);
  try{
   await respondToMessageRequest(request.request_id,decision);
   setRequests(current=>current.filter(item=>item.request_id!==request.request_id));
   if(decision==='accept'){
    setNotice('Request accepted. Message content stays private to a compatible encrypted client.');
    router.push({pathname:'/conversation/[id]',params:{id:request.conversation_id}});
   }
  }catch(e){setError(e instanceof Error?e.message:'Could not update the message request');}
  finally{setBusy(null);}
 };

 return <AppShell><ScrollView contentContainerStyle={styles.content}>
  <View style={styles.header}>
   <View style={styles.copy}><Text style={styles.kicker}>CONNECT</Text><Text style={styles.title}>Messages</Text><Text style={styles.subtitle}>Private conversations, kept separate from public activity.</Text></View>
   <Link href="/discovery" asChild><Pressable accessibilityRole="link" accessibilityLabel="Find people in discovery" style={styles.search}><Icon name="search" size={19} color={colors.brand}/></Pressable></Link>
  </View>
  <View style={styles.filters} accessibilityRole="tablist">{(['all','requests','unread'] as const).map(value=><Chip key={value} label={value==='all'?'All':value==='requests'?'Requests':'Unread'} selected={tab===value} onPress={()=>setTab(value)}/>)}</View>
  <View style={styles.notice}><Icon name="shield" size={20} color={colors.info}/><View style={styles.noticeCopy}><Text style={styles.noticeTitle}>Messaging is read-only in this build</Text><Text style={styles.noticeBody}>An audited client encryption protocol is not installed, so this app does not send or display message bodies. It does not claim end-to-end encryption.</Text></View></View>
  {notice?<View accessibilityLiveRegion="polite" style={styles.successNotice}><Icon name="check" size={17} color={colors.success}/><Text style={styles.successText}>{notice}</Text></View>:null}
  {loading?<StateView loading title={tab==='requests'?'Loading requests':'Opening conversations'} body="Syncing your private space."/>:error?<StateView tone="danger" title="Messages unavailable" body={error} action={<Pressable accessibilityRole="button" onPress={()=>void load()} style={styles.retry}><Icon name="refresh" size={16} color={colors.brand}/><Text style={styles.retryText}>Try again</Text></Pressable>}/>:tab==='requests'?
   <View style={styles.list}>
    {requests.length?requests.map(request=><View key={request.request_id} style={styles.requestRow}>
     {request.avatar_url?<Image source={{uri:request.avatar_url}} style={styles.avatarImage} accessibilityLabel="Requester avatar"/>:<View style={styles.avatar}><Icon name="profile" size={19} color={colors.brand}/></View>}
     <View style={styles.rowCopy}><Text style={styles.name}>{request.display_name||request.username||'Drustpoll member'}</Text><Text style={styles.handle}>@{request.username||'member'} · {time(request.created_at)}</Text><Text style={styles.message}>Encrypted message request</Text><Text style={styles.requestHint}>Accept to open a private thread, or decline to remove this request.</Text>
      <View style={styles.requestActions}><Pressable accessibilityRole="button" accessibilityState={{busy:busy===request.request_id,disabled:Boolean(busy)}} disabled={Boolean(busy)} onPress={()=>void resolve(request,'accept')} style={[styles.accept,busy===request.request_id&&styles.disabled]}>{busy===request.request_id?<ActivityIndicator size="small" color={colors.white}/>:<><Icon name="check" size={16} color={colors.white}/><Text style={styles.acceptText}>Accept</Text></>}</Pressable><Pressable accessibilityRole="button" accessibilityState={{busy:busy===request.request_id,disabled:Boolean(busy)}} disabled={Boolean(busy)} onPress={()=>void resolve(request,'decline')} style={[styles.decline,busy===request.request_id&&styles.disabled]}><Text style={styles.declineText}>Decline</Text></Pressable></View>
     </View>
    </View>):<View style={styles.empty}><View style={styles.emptyGlyph}><Icon name="connect" size={25} color={colors.brand}/></View><Text style={styles.emptyTitle}>No pending requests</Text><Text style={styles.emptyBody}>New message requests will appear here with the sender and their profile details.</Text><Link href="/discovery" asChild><Pressable accessibilityRole="link" style={styles.emptyAction}><Text style={styles.emptyActionText}>Explore people</Text><Icon name="chevronRight" size={16} color={colors.brand}/></Pressable></Link></View>}
   </View>:
   <View style={styles.list}>
    {threads.length?threads.map(thread=><Pressable key={thread.id} accessibilityRole="button" accessibilityLabel={`Open conversation with ${thread.member_count} participants`} onPress={()=>void openThread(thread)} style={({pressed})=>[styles.row,pressed&&styles.pressed]}>
     <View style={styles.avatar}><Icon name="connect" size={19} color={colors.white}/></View>
     <View style={styles.rowCopy}><View style={styles.nameLine}><Text style={styles.name}>Private conversation</Text>{thread.request_state==='sent'?<Text style={styles.pending}>REQUEST SENT</Text>:null}</View><Text style={styles.message}>{thread.member_count} participants · encrypted messages</Text>{thread.request_state==='sent'?<Text style={styles.requestHint}>Waiting for the recipient to accept.</Text>:null}</View>
     <View style={styles.trailing}><Text style={styles.timeText}>{time(thread.last_message_at)}</Text>{thread.unread_count>0?<View style={styles.unread}><Text style={styles.unreadText}>{thread.unread_count>99?'99+':thread.unread_count}</Text></View>:null}{busy===thread.id?<ActivityIndicator size="small"/>:null}</View>
    </Pressable>):<View style={styles.empty}><View style={styles.emptyGlyph}><Icon name="connect" size={25} color={colors.brand}/></View><Text style={styles.emptyTitle}>{tab==='unread'?'You are all caught up.':'Your quiet space is empty.'}</Text><Text style={styles.emptyBody}>{tab==='unread'?'There are no unread messages.':'Explore people you follow and connect when you are ready.'}</Text><Link href="/discovery" asChild><Pressable accessibilityRole="link" style={styles.emptyAction}><Text style={styles.emptyActionText}>Explore people</Text><Icon name="chevronRight" size={16} color={colors.brand}/></Pressable></Link></View>}
   </View>}
  <View style={styles.note}><Text style={styles.noteKicker}>PRIVACY BOUNDARY</Text><Text style={styles.noteTitle}>Opaque transport is not end-to-end encryption.</Text><Text style={styles.noteBody}>The server can store encrypted envelopes from compatible clients. This app does not invent cryptography, turn typed text into ciphertext, or expose envelope bytes as readable messages.</Text></View>
 </ScrollView></AppShell>;
}

const styles=StyleSheet.create({
 content:{padding:spacing.xl,gap:spacing.lg,maxWidth:820,width:'100%',alignSelf:'center'},header:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:spacing.md},copy:{flex:1},kicker:{fontSize:type.labelSM,fontWeight:'800',letterSpacing:1.9,color:colors.brand},title:{fontSize:type.displayLG,lineHeight:38,fontWeight:'800',letterSpacing:-.7,color:colors.ink,marginTop:4},subtitle:{fontSize:type.bodySM,lineHeight:21,color:colors.muted,marginTop:6,maxWidth:470},search:{width:48,height:48,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',...elevation.low},filters:{flexDirection:'row',gap:8,flexWrap:'wrap'},notice:{padding:spacing.md,borderRadius:radius.lg,borderWidth:1,borderColor:'#D5E6F5',backgroundColor:colors.infoSoft,flexDirection:'row',alignItems:'flex-start',gap:10},noticeCopy:{flex:1},noticeTitle:{fontWeight:'800',color:colors.ink},noticeBody:{fontSize:type.bodySM,lineHeight:20,color:colors.inkSoft,marginTop:4},successNotice:{padding:12,borderRadius:radius.md,backgroundColor:colors.successSoft,flexDirection:'row',alignItems:'center',gap:8},successText:{flex:1,fontSize:type.bodySM,color:colors.inkSoft},retry:{minHeight:44,paddingHorizontal:13,borderRadius:radius.md,backgroundColor:colors.brandSoft,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center'},retryText:{color:colors.brand,fontWeight:'800'},list:{borderTopWidth:1,borderTopColor:colors.line},row:{minHeight:80,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:colors.line},requestRow:{paddingVertical:16,flexDirection:'row',alignItems:'flex-start',gap:12,borderBottomWidth:1,borderBottomColor:colors.line},avatar:{width:46,height:46,borderRadius:15,backgroundColor:colors.brand,alignItems:'center',justifyContent:'center'},avatarImage:{width:46,height:46,borderRadius:15,backgroundColor:colors.surfaceStrong},rowCopy:{flex:1,gap:4,minWidth:0},nameLine:{flexDirection:'row',alignItems:'center',gap:7,flexWrap:'wrap'},name:{fontSize:type.bodyMD,fontWeight:'800',color:colors.ink},handle:{fontSize:type.labelSM,color:colors.faint},message:{color:colors.muted,fontSize:type.bodySM},requestHint:{fontSize:type.labelSM,lineHeight:18,color:colors.inkSoft},trailing:{alignItems:'flex-end',gap:7},timeText:{color:colors.faint,fontSize:type.labelSM},pending:{fontSize:9,fontWeight:'900',letterSpacing:.7,color:colors.warning,backgroundColor:colors.warningSoft,paddingHorizontal:7,paddingVertical:4,borderRadius:radius.pill},unread:{minWidth:22,height:22,paddingHorizontal:6,borderRadius:11,backgroundColor:colors.brand,alignItems:'center',justifyContent:'center'},unreadText:{fontSize:10,fontWeight:'900',color:colors.white},requestActions:{flexDirection:'row',gap:8,marginTop:7},accept:{minHeight:42,paddingHorizontal:13,borderRadius:radius.md,backgroundColor:colors.brand,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},acceptText:{fontSize:type.labelMD,fontWeight:'800',color:colors.white},decline:{minHeight:42,paddingHorizontal:13,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},declineText:{fontSize:type.labelMD,fontWeight:'800',color:colors.inkSoft},disabled:{opacity:.6},empty:{paddingVertical:42,paddingHorizontal:22,alignItems:'center'},emptyGlyph:{width:56,height:56,borderRadius:18,backgroundColor:colors.brandSoft,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.line},emptyTitle:{fontSize:type.titleLG,fontWeight:'800',color:colors.ink,marginTop:16},emptyBody:{fontSize:type.bodySM,lineHeight:21,color:colors.muted,textAlign:'center',maxWidth:400,marginTop:6},emptyAction:{marginTop:16,minHeight:44,paddingHorizontal:14,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,flexDirection:'row',gap:6,alignItems:'center'},emptyActionText:{fontSize:type.labelLG,fontWeight:'800',color:colors.brand},note:{backgroundColor:colors.surfaceStrong,borderRadius:radius.lg,padding:spacing.lg,borderWidth:1,borderColor:colors.line},noteKicker:{fontSize:type.labelSM,fontWeight:'800',letterSpacing:1.6,color:colors.brand},noteTitle:{fontSize:type.titleMD,fontWeight:'800',color:colors.ink,marginTop:4},noteBody:{color:colors.inkSoft,lineHeight:21,marginTop:6,fontSize:type.bodySM},pressed:{opacity:.72,transform:[{scale:.99}]},
});
