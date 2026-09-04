import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { colors, radius, spacing, type } from './theme';
import { Icon, type IconName } from './icons';

export type SocialAction='why'|'more_like_this'|'less_like_this'|'not_interested'|'hide'|'mute'|'block'|'report'|'repost'|'share';

type Item={action:SocialAction;label:string;icon:IconName;danger?:boolean};
const ITEMS:Item[]=[
 {action:'why',label:'Why this appears',icon:'search'},
 {action:'more_like_this',label:'More like this',icon:'plus'},
 {action:'less_like_this',label:'Less like this',icon:'filter'},
 {action:'not_interested',label:'Not interested',icon:'close'},
 {action:'hide',label:'Hide this post',icon:'eye' as IconName},
 {action:'mute',label:'Mute creator',icon:'close'},
 {action:'block',label:'Block creator',icon:'shield',danger:true},
 {action:'report',label:'Report',icon:'flag' as IconName,danger:true},
 {action:'repost',label:'Repost / quote',icon:'refresh'},
 {action:'share',label:'Share',icon:'share'},
];

export function SocialActionSheet({visible,onClose,onAction,reason}:{visible:boolean;onClose:()=>void;onAction:(action:SocialAction)=>void;reason?:string}){
 const [confirm,setConfirm]=useState<SocialAction|null>(null);
 const choose=(action:SocialAction)=>{if(action==='block'||action==='report'||action==='hide'||action==='mute'){setConfirm(action);return;}onAction(action);onClose();};
 const confirmNow=()=>{if(!confirm)return;onAction(confirm);setConfirm(null);onClose();};
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal><View style={styles.scrim}><Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="Close actions"/><View style={styles.sheet}><View style={styles.handle}/>{confirm?<><Text style={styles.title}>{confirm==='block'?'Block this creator?':confirm==='report'?'Report this post?':confirm==='hide'?'Hide this post?':'Mute this creator?'}</Text><Text style={styles.body}>{confirm==='block'?'You will stop seeing interaction from this account and they cannot interact with you.':confirm==='report'?'The report goes to moderation review. Your privacy settings remain unchanged.':confirm==='hide'?'This post will be removed from your current feed.':reason??'Their posts will stop appearing in your recommendation surfaces.'}</Text><View style={styles.confirmRow}><Pressable accessibilityRole="button" onPress={()=>setConfirm(null)} style={styles.secondary}><Text style={styles.secondaryText}>Cancel</Text></Pressable><Pressable accessibilityRole="button" onPress={confirmNow} style={[styles.primary,confirm==='block'||confirm==='report'?styles.danger:null]}><Text style={styles.primaryText}>{confirm==='report'?'Report':'Confirm'}</Text></Pressable></View></>:<><Text style={styles.title}>Shape your feed</Text><Text style={styles.body}>Your controls influence future recommendations. Nothing here changes your privacy settings without a separate explicit choice.</Text><ScrollView contentContainerStyle={styles.list}>{ITEMS.map(item=><Pressable key={item.action} accessibilityRole="button" accessibilityLabel={item.label} onPress={()=>choose(item.action)} style={styles.row}><View style={[styles.iconBox,item.danger&&styles.iconDanger]}><Icon name={item.icon} size={20} color={item.danger?colors.danger:colors.brand}/></View><Text style={[styles.label,item.danger&&styles.labelDanger]}>{item.label}</Text><Icon name="chevronRight" size={19} color={colors.faint}/></Pressable>)}</ScrollView></>}</View></View></Modal>;
}
const styles=StyleSheet.create({scrim:{flex:1,backgroundColor:'rgba(0,0,0,0.38)',justifyContent:'flex-end'},dismiss:{...StyleSheet.absoluteFillObject},sheet:{backgroundColor:colors.surface,borderTopLeftRadius:radius.hero,borderTopRightRadius:radius.hero,paddingHorizontal:spacing.lg,paddingTop:spacing.sm,paddingBottom:spacing.xl,maxHeight:'82%'},handle:{width:44,height:5,borderRadius:3,backgroundColor:colors.line,alignSelf:'center',marginBottom:spacing.lg},title:{fontSize:type.titleXL,fontWeight:'800',color:colors.ink},body:{fontSize:type.bodySM,lineHeight:21,color:colors.muted,marginTop:6},list:{paddingBottom:spacing.sm,paddingTop:spacing.md},row:{minHeight:58,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:colors.line},iconBox:{width:40,height:40,borderRadius:radius.md,backgroundColor:colors.brandSoft,alignItems:'center',justifyContent:'center'},iconDanger:{backgroundColor:colors.dangerSoft},label:{flex:1,fontSize:type.bodyMD,fontWeight:'700',color:colors.ink},labelDanger:{color:colors.danger},confirmRow:{flexDirection:'row',gap:10,marginTop:spacing.lg},secondary:{flex:1,minHeight:48,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},secondaryText:{fontWeight:'800',color:colors.ink},primary:{flex:1,minHeight:48,borderRadius:radius.md,backgroundColor:colors.brand,alignItems:'center',justifyContent:'center'},danger:{backgroundColor:colors.danger},primaryText:{fontWeight:'800',color:colors.white}});