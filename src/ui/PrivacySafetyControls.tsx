import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Icon, type IconName} from './icons';
import {colors, radius, spacing, type} from './theme';

export function ControlCard({title,body,icon='shield',children}:{title:string;body?:string;icon?:IconName;children:React.ReactNode}){
  return <View style={s.card}><View style={s.head}><View style={s.icon}><Icon name={icon} size={19} color={colors.brand}/></View><View style={s.flex}><Text style={s.title}>{title}</Text>{body?<Text style={s.body}>{body}</Text>:null}</View></View>{children}</View>;
}
export function ActionButton({label,onPress,destructive=false,disabled=false,icon='chevronRight'}:{label:string;onPress:()=>void;destructive?:boolean;disabled?:boolean;icon?:IconName}){
  return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[s.action,destructive&&s.danger,pressed&&s.pressed,disabled&&s.disabled]}><Icon name={icon} size={17} color={destructive?colors.danger:colors.brand}/><Text style={[s.actionText,destructive&&{color:colors.danger}]}>{label}</Text></Pressable>;
}
export function StatePill({label,positive=false,warning=false}:{label:string;positive?:boolean;warning?:boolean}){
  return <View style={[s.pill,positive&&s.pillPositive,warning&&s.pillWarning]}><Text style={[s.pillText,positive&&s.pillPositiveText,warning&&s.pillWarningText]}>{label}</Text></View>;
}
const s=StyleSheet.create({card:{padding:spacing.lg,borderRadius:radius.xl,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface},head:{flexDirection:'row',gap:11,alignItems:'center',marginBottom:10},icon:{width:40,height:40,borderRadius:13,backgroundColor:colors.brandSoft,alignItems:'center',justifyContent:'center'},flex:{flex:1},title:{fontSize:type.titleMD,fontWeight:'900',color:colors.ink},body:{fontSize:type.bodySM,lineHeight:20,color:colors.muted,marginTop:3},action:{minHeight:46,borderTopWidth:1,borderTopColor:colors.line,flexDirection:'row',alignItems:'center',gap:8},actionText:{fontSize:type.bodySM,fontWeight:'900',color:colors.brand},danger:{borderTopColor:'#F1D3D0'},pressed:{opacity:.72},disabled:{opacity:.45},pill:{minHeight:31,paddingHorizontal:10,borderRadius:radius.pill,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},pillText:{fontSize:type.labelSM,fontWeight:'900',color:colors.muted},pillPositive:{backgroundColor:colors.successSoft,borderColor:'#CFE9D9'},pillPositiveText:{color:colors.success},pillWarning:{backgroundColor:colors.warningSoft,borderColor:'#EBD9B3'},pillWarningText:{color:colors.warning}});
