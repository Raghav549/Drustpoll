import { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Linking, PixelRatio, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { Icon } from '../src/ui/icons';
import { colors, radius, spacing, type } from '../src/ui/theme';

type DeviceAccessibility={reducedMotion:boolean;screenReader:boolean|null;fontScale:number|null};
const initial:DeviceAccessibility={reducedMotion:false,screenReader:null,fontScale:null};

export default function Accessibility(){
 const[device,setDevice]=useState(initial);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState<string|null>(null);
 const[opening,setOpening]=useState(false);
 useEffect(()=>{
  let live=true;
  Promise.all([
   AccessibilityInfo.isReduceMotionEnabled().catch(()=>false),
   Platform.OS==='web'?Promise.resolve(null):AccessibilityInfo.isScreenReaderEnabled().catch(()=>null),
  ]).then(([reducedMotion,screenReader])=>{
   if(live)setDevice({reducedMotion,screenReader,fontScale:Platform.OS==='web'?null:PixelRatio.getFontScale()});
  }).catch(()=>{if(live)setError('Could not read device accessibility settings.');}).finally(()=>{if(live)setLoading(false);});
  const motionSubscription=AccessibilityInfo.addEventListener('reduceMotionChanged',reducedMotion=>setDevice(value=>({...value,reducedMotion})));
  const screenReaderSubscription=Platform.OS==='web'?null:AccessibilityInfo.addEventListener('screenReaderChanged',screenReader=>setDevice(value=>({...value,screenReader})));
  return()=>{live=false;motionSubscription.remove();screenReaderSubscription?.remove();};
 },[]);
 const openDeviceSettings=async()=>{setOpening(true);setError(null);try{await Linking.openSettings();}catch(e){setError(e instanceof Error?e.message:'Could not open device settings.');}finally{setOpening(false);}};
 return <AppShell><ScrollView contentContainerStyle={styles.content}>
  <Link href="/settings" asChild><Pressable accessibilityRole="button" style={styles.back}><Icon name="back" size={18} color={colors.brand}/><Text style={styles.backText}>Settings</Text></Pressable></Link>
  <Text style={styles.kicker}>ACCESSIBILITY</Text><Text style={styles.title}>Accessibility, with clear boundaries.</Text>
  <Text style={styles.subtitle}>This page reports the accessibility settings provided by your device or browser. Drustpoll does not offer app-specific theme, motion or text-size overrides yet.</Text>
  {loading?<View style={styles.center}><ActivityIndicator/><Text style={styles.muted}>Checking device settings…</Text></View>:<View style={styles.card}>
   <StatusRow title="Reduced motion" body="Device preference for nonessential movement." enabled={device.reducedMotion}/>
   <StatusRow title="Screen reader" body="Whether a device screen reader is currently enabled." enabled={device.screenReader} value={device.screenReader===null?'Browser-managed':undefined}/>
   <StatusRow title="Text scale" body="The current system text scale, when exposed by the platform." value={device.fontScale===null?'Browser-managed':`${Math.round(device.fontScale*100)}%`}/>
  </View>}
  {error?<View accessibilityRole="alert" style={styles.error}><Icon name="circleAlert" size={18} color={colors.danger}/><Text style={styles.errorText}>{error}</Text></View>:null}
  {Platform.OS==='web'?<View style={styles.note}><Icon name="info" size={19} color={colors.info}/><View style={styles.noteCopy}><Text style={styles.noteTitle}>Browser accessibility controls</Text><Text style={styles.noteBody}>Use your browser zoom, operating-system contrast and motion settings, or screen-reader controls. Drustpoll’s page structure and labels continue to work with assistive technology.</Text></View></View>:<Pressable accessibilityRole="button" accessibilityState={{busy:opening}} disabled={opening} onPress={()=>void openDeviceSettings()} style={styles.primary}>{opening?<ActivityIndicator color={colors.white}/>:<><Icon name="settings" size={18} color={colors.white}/><Text style={styles.primaryText}>Open device settings</Text></>}</Pressable>}
  <View style={styles.note}><Text style={styles.noteTitle}>System settings still win.</Text><Text style={styles.noteBody}>Your operating system or browser remains the source of truth for assistive technology. Drustpoll does not save pretend overrides when a preference has no app-wide effect.</Text></View>
 </ScrollView></AppShell>;
}
function StatusRow({title,body,enabled,value}:{title:string;body:string;enabled?:boolean|null;value?:string}){return <View style={styles.row}><View style={styles.copy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowBody}>{body}</Text></View><View style={styles.status}><View style={[styles.dot,enabled===true&&styles.dotOn]}/><Text style={styles.statusText}>{value??(enabled===null||enabled===undefined?'Unavailable':enabled?'On':'Off')}</Text></View></View>}
const styles=StyleSheet.create({content:{padding:spacing.xl,gap:spacing.lg,maxWidth:760,width:'100%',alignSelf:'center'},back:{minHeight:44,flexDirection:'row',alignItems:'center',gap:8},backText:{fontWeight:'800',color:colors.brand},kicker:{fontSize:type.labelSM,fontWeight:'900',letterSpacing:1.8,color:colors.brand},title:{fontSize:type.displayLG,lineHeight:38,fontWeight:'900',color:colors.ink},subtitle:{fontSize:type.bodySM,lineHeight:21,color:colors.muted},center:{minHeight:180,justifyContent:'center',alignItems:'center',gap:8},muted:{color:colors.muted},card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,borderRadius:radius.lg,overflow:'hidden'},row:{minHeight:84,padding:spacing.lg,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:colors.line},copy:{flex:1},rowTitle:{fontSize:type.bodyMD,fontWeight:'900',color:colors.ink},rowBody:{fontSize:type.bodySM,lineHeight:20,color:colors.muted,marginTop:4},status:{minWidth:60,flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:6},statusText:{fontSize:type.labelMD,fontWeight:'800',color:colors.inkSoft},dot:{width:8,height:8,borderRadius:4,backgroundColor:colors.faint},dotOn:{backgroundColor:colors.success},primary:{minHeight:50,paddingHorizontal:16,borderRadius:radius.md,backgroundColor:colors.brand,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},primaryText:{color:colors.white,fontWeight:'900'},error:{padding:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.danger,backgroundColor:colors.dangerSoft,flexDirection:'row',gap:8,alignItems:'center'},errorText:{flex:1,color:colors.danger,fontSize:type.bodySM},note:{padding:spacing.xl,borderRadius:radius.lg,backgroundColor:colors.infoSoft,flexDirection:'row',gap:10,alignItems:'flex-start'},noteCopy:{flex:1},noteTitle:{fontSize:type.titleMD,fontWeight:'900',color:colors.ink},noteBody:{fontSize:type.bodySM,lineHeight:21,color:colors.inkSoft,marginTop:5}});
