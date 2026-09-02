import { ReactNode } from 'react';
import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, elevation, radius, spacing, type } from './theme';
import { useResponsiveLayout } from './responsive';
import { Icon, type IconName } from './icons';

const items:Array<{href:string;icon:IconName;label:string;hint:string}>= [
 {href:'/',icon:'home',label:'Home',hint:'Your social context'},
 {href:'/search',icon:'search',label:'Explore',hint:'Find people, ideas and products'},
 {href:'/create',icon:'create',label:'Create',hint:'Create and express'},
 {href:'/messages',icon:'connect',label:'Connect',hint:'Messages and conversations'},
 {href:'/profile',icon:'profile',label:'You',hint:'Profile and controls'},
];

export function AppShell({children}:{children:ReactNode}){
 const pathname=usePathname();const{isDesktop}=useResponsiveLayout();
 const activeFor=(href:string)=>pathname===href||(href!=='/'&&pathname.startsWith(`${href}/`));
 if(isDesktop)return <SafeAreaView style={styles.safe} edges={['top','left','right','bottom']}><View style={styles.desktopBody}><View style={styles.rail} accessibilityRole="navigation" accessibilityLabel="Primary navigation"><Text accessibilityLabel="Drustpoll" style={styles.mark}>D</Text>{items.map(item=>{const active=activeFor(item.href);return <Link key={item.href} href={item.href} asChild><Pressable accessibilityRole="link" accessibilityLabel={`${item.label}: ${item.hint}`} accessibilityState={{selected:active}} style={({pressed})=>[styles.railItem,active&&styles.railActive,pressed&&styles.navPressed]}><View style={[styles.railIcon,active&&styles.iconActive]}><Icon name={item.icon} size={21} color={active?colors.brand:colors.muted}/></View><Text style={[styles.railLabel,active&&styles.labelActive]}>{item.label}</Text></Pressable></Link>})}</View><View style={styles.desktopContent}>{children}</View></View></SafeAreaView>;
 return <SafeAreaView style={styles.safe} edges={['top','left','right','bottom']}><View style={styles.body}>{children}</View><View style={styles.nav} accessibilityRole="tablist" accessibilityLabel="Primary navigation">{items.map(item=>{const active=activeFor(item.href);return <Link key={item.href} href={item.href} asChild><Pressable accessibilityRole="tab" accessibilityLabel={`${item.label}: ${item.hint}`} accessibilityState={{selected:active}} style={({pressed})=>[styles.navItem,pressed&&styles.navPressed]}><View style={[styles.iconWrap,active&&styles.iconActive]}><Icon name={item.icon} size={21} color={active?colors.brand:colors.muted}/></View><Text style={[styles.label,active&&styles.labelActive]}>{item.label}</Text></Pressable></Link>})}</View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.canvas},body:{flex:1},desktopBody:{flex:1,flexDirection:'row'},desktopContent:{flex:1,minWidth:0},rail:{width:112,padding:spacing.sm,backgroundColor:colors.surface,borderRightWidth:1,borderRightColor:colors.line,alignItems:'center',gap:spacing.xs},mark:{width:48,height:48,textAlign:'center',textAlignVertical:'center',borderRadius:16,overflow:'hidden',backgroundColor:colors.brand,color:colors.white,fontSize:22,fontWeight:'900',marginVertical:spacing.sm},railItem:{width:92,minHeight:82,borderRadius:radius.lg,alignItems:'center',justifyContent:'center',gap:5},railActive:{backgroundColor:colors.brandSoft},railIcon:{width:46,height:36,borderRadius:radius.pill,alignItems:'center',justifyContent:'center'},iconActive:{backgroundColor:colors.brandSoft},railLabel:{fontSize:type.labelSM,color:colors.faint,fontWeight:'700'},label:{fontSize:type.labelSM,color:colors.faint,fontWeight:'600'},labelActive:{color:colors.ink,fontWeight:'800'},navPressed:{opacity:.72},nav:{flexDirection:'row',justifyContent:'space-around',alignItems:'center',minHeight:78,paddingHorizontal:spacing.sm,paddingTop:spacing.xs,paddingBottom:spacing.xs,backgroundColor:colors.surface,borderTopWidth:1,borderTopColor:colors.line,...elevation.low},navItem:{flex:1,minHeight:62,alignItems:'center',justifyContent:'center',gap:3,borderRadius:radius.lg},iconWrap:{width:46,height:34,borderRadius:radius.pill,alignItems:'center',justifyContent:'center'}});
