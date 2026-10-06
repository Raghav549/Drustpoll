import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../src/ui/AppShell';
import { getMessages, markConversationRead } from '../../src/api/client';
import { Icon } from '../../src/ui/icons';
import { colors, radius, spacing, type } from '../../src/ui/theme';

type MessageMetadata={id:string;sender_id:string;created_at:string;delivered_at:string|null;read_at:string|null;key_version:number};

export default function Conversation(){
 const params=useLocalSearchParams<{id?:string}>();
 const conversationId=Array.isArray(params.id)?params.id[0]:params.id;
 const[messages,setMessages]=useState<MessageMetadata[]>([]);
 const[nextBefore,setNextBefore]=useState<string|null>(null);
 const[loading,setLoading]=useState(true);
 const[loadingOlder,setLoadingOlder]=useState(false);
 const[error,setError]=useState<string|null>(null);

 const load=useCallback(async()=>{
  if(!conversationId){setError('Conversation unavailable');setLoading(false);return;}
  setLoading(true);setError(null);
  try{
   const result=await getMessages(conversationId,50);
   setMessages((result.messages??[]).map((message:any)=>({id:String(message.id),sender_id:String(message.sender_id),created_at:String(message.created_at),delivered_at:message.delivered_at??null,read_at:message.read_at??null,key_version:Number(message.key_version??1)})));
   setNextBefore(result.nextBefore??null);
   await markConversationRead(conversationId);
  }catch(e){setError(e instanceof Error?e.message:'Could not open this conversation');}
  finally{setLoading(false);}
 },[conversationId]);
 useEffect(()=>{void load();},[load]);

 const loadOlder=async()=>{
  if(!conversationId||!nextBefore||loadingOlder)return;
  setLoadingOlder(true);setError(null);
  try{
   const result=await getMessages(conversationId,50,nextBefore);
   const older=(result.messages??[]).map((message:any)=>({id:String(message.id),sender_id:String(message.sender_id),created_at:String(message.created_at),delivered_at:message.delivered_at??null,read_at:message.read_at??null,key_version:Number(message.key_version??1)}));
   setMessages(current=>{const seen=new Set(current.map(message=>message.id));return [...older.filter(message=>!seen.has(message.id)),...current];});
   setNextBefore(result.nextBefore??null);
  }catch(e){setError(e instanceof Error?e.message:'Could not load older messages');}
  finally{setLoadingOlder(false);}
 };

 return <AppShell><View style={styles.screen}>
  <View style={styles.header}><Link href="/messages" asChild><Pressable accessibilityRole="link" accessibilityLabel="Back to messages" style={styles.back}><Icon name="back" size={20} color={colors.ink}/></Pressable></Link><View style={styles.headerCopy}><Text style={styles.kicker}>PRIVATE CONNECT</Text><Text style={styles.title}>Conversation</Text><Text style={styles.presence}>Encrypted transport · read-only</Text></View></View>
  <View style={styles.boundary}><Icon name="lock" size={19} color={colors.info}/><Text style={styles.boundaryText}>This client does not have an audited encryption protocol. It will not send typed text, decrypt messages, or display stored envelope bytes.</Text></View>
  {loading?<View style={styles.center}><ActivityIndicator/><Text style={styles.muted}>Opening conversation…</Text></View>:error&&messages.length===0?<View accessibilityRole="alert" style={styles.error}><Text style={styles.errorTitle}>Conversation unavailable</Text><Text style={styles.errorBody}>{error}</Text><Pressable accessibilityRole="button" onPress={()=>void load()} style={styles.retry}><Icon name="refresh" size={16} color={colors.brand}/><Text style={styles.retryText}>Try again</Text></Pressable></View>:<>
   <View style={styles.count}><Text style={styles.countTitle}>{messages.length} encrypted envelope{messages.length===1?'':'s'}</Text><Text style={styles.countBody}>Only message metadata is shown here.</Text></View>
   <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
    {nextBefore?<Pressable accessibilityRole="button" accessibilityState={{busy:loadingOlder}} disabled={loadingOlder} onPress={()=>void loadOlder()} style={styles.older}>{loadingOlder?<ActivityIndicator size="small"/>:<><Icon name="refresh" size={15} color={colors.brand}/><Text style={styles.olderText}>Load older messages</Text></>}</Pressable>:null}
    {messages.length?messages.map(message=><View key={message.id} style={styles.message}>
     <View style={styles.messageHead}><View style={styles.envelopeIcon}><Icon name="lock" size={16} color={colors.brand}/></View><View style={styles.messageCopy}><Text style={styles.messageLabel}>Encrypted message</Text><Text style={styles.messageTime}>{new Date(message.created_at).toLocaleString()}</Text></View></View>
     <Text style={styles.messageBody}>Message content is not available in this client.</Text>
     <Text style={styles.messageMeta}>Key version {message.key_version}{message.read_at?' · Read':message.delivered_at?' · Delivered':' · Stored'}</Text>
    </View>):<View style={styles.empty}><View style={styles.emptyGlyph}><Icon name="connect" size={25} color={colors.brand}/></View><Text style={styles.emptyTitle}>No messages in this thread</Text><Text style={styles.emptyBody}>This view will not create or send a message until an audited encryption client is available.</Text></View>}
   </ScrollView>
  </>}
  {error&&messages.length?<View accessibilityRole="alert" style={styles.inlineError}><Icon name="circleAlert" size={17} color={colors.danger}/><Text style={styles.inlineErrorText}>{error}</Text></View>:null}
  <View style={styles.note}><Text style={styles.noteTitle}>Privacy boundary</Text><Text style={styles.noteBody}>Server storage of an encrypted-looking payload is not proof of end-to-end encryption. This screen deliberately avoids presenting raw ciphertext as human-readable text.</Text></View>
 </View></AppShell>;
}

const styles=StyleSheet.create({screen:{flex:1,maxWidth:900,width:'100%',alignSelf:'center',padding:spacing.lg,gap:spacing.md},header:{flexDirection:'row',alignItems:'center',gap:10},back:{width:44,height:44,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},headerCopy:{flex:1},kicker:{fontSize:type.labelSM,fontWeight:'800',letterSpacing:1.6,color:colors.brand},title:{fontSize:type.titleLG,fontWeight:'800',color:colors.ink},presence:{fontSize:type.labelSM,color:colors.info,fontWeight:'700',marginTop:2},boundary:{padding:12,borderRadius:radius.md,backgroundColor:colors.infoSoft,flexDirection:'row',alignItems:'flex-start',gap:8},boundaryText:{flex:1,color:colors.inkSoft,fontSize:type.bodySM,lineHeight:20},center:{minHeight:220,justifyContent:'center',alignItems:'center',gap:8},muted:{color:colors.muted},error:{padding:spacing.lg,borderRadius:radius.lg,borderWidth:1,borderColor:colors.danger,backgroundColor:colors.dangerSoft},errorTitle:{fontWeight:'800',color:colors.danger},errorBody:{color:colors.inkSoft,marginTop:5},retry:{marginTop:12,minHeight:44,paddingHorizontal:13,borderRadius:radius.md,backgroundColor:colors.brandSoft,flexDirection:'row',gap:7,alignItems:'center',alignSelf:'flex-start'},retryText:{fontWeight:'800',color:colors.brand},count:{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:8},countTitle:{fontSize:type.bodyMD,fontWeight:'800',color:colors.ink},countBody:{fontSize:type.labelSM,color:colors.muted},messages:{flex:1,minHeight:150,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,borderRadius:radius.lg},messagesContent:{padding:spacing.md,gap:10},older:{minHeight:44,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6,borderWidth:1,borderColor:colors.line,borderRadius:radius.md},olderText:{fontWeight:'800',color:colors.brand},message:{padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.surfaceStrong,borderWidth:1,borderColor:colors.line},messageHead:{flexDirection:'row',alignItems:'center',gap:9},envelopeIcon:{width:34,height:34,borderRadius:11,backgroundColor:colors.brandSoft,alignItems:'center',justifyContent:'center'},messageCopy:{flex:1},messageLabel:{fontWeight:'800',color:colors.ink},messageTime:{fontSize:type.labelSM,color:colors.faint,marginTop:2},messageBody:{fontSize:type.bodySM,color:colors.muted,lineHeight:20,marginTop:10},messageMeta:{fontSize:type.labelSM,color:colors.faint,marginTop:8},empty:{padding:spacing.xl,alignItems:'center'},emptyGlyph:{width:54,height:54,borderRadius:18,backgroundColor:colors.brandSoft,alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:type.titleMD,fontWeight:'800',color:colors.ink,marginTop:10},emptyBody:{fontSize:type.bodySM,lineHeight:20,color:colors.muted,textAlign:'center',marginTop:5},inlineError:{padding:10,borderRadius:radius.md,backgroundColor:colors.dangerSoft,flexDirection:'row',alignItems:'center',gap:7},inlineErrorText:{color:colors.danger,fontSize:type.bodySM,flex:1},note:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.infoSoft},noteTitle:{fontSize:type.titleMD,fontWeight:'800',color:colors.ink},noteBody:{fontSize:type.bodySM,lineHeight:20,color:colors.inkSoft,marginTop:5}});
