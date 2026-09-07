import {useEffect,useRef,useState} from 'react';
import {Animated,Easing,StyleSheet,View} from 'react-native';
import {Stack} from 'expo-router';
import * as NativeSplash from 'expo-splash-screen';
import {StatusBar} from 'expo-status-bar';
import {AuthProvider} from '../src/core/auth/AuthProvider';
import {I18nProvider} from '../src/i18n/provider';
import {InitialLanguageGate} from '../src/i18n/InitialLanguageGate';
import {colors,motion} from '../src/ui/theme';
import {BrandMark} from '../src/ui/BrandMark';
void NativeSplash.preventAutoHideAsync().catch(()=>undefined);
export default function RootLayout(){
 const[ready,setReady]=useState(false);const opacity=useRef(new Animated.Value(0)).current;const scale=useRef(new Animated.Value(.86)).current;
 useEffect(()=>{Animated.parallel([Animated.timing(opacity,{toValue:1,duration:motion.quick,easing:Easing.out(Easing.cubic),useNativeDriver:true}),Animated.timing(scale,{toValue:1,duration:motion.standard,easing:Easing.out(Easing.cubic),useNativeDriver:true})]).start();const timer=setTimeout(()=>{setReady(true);void NativeSplash.hideAsync();},380);return()=>clearTimeout(timer);},[opacity,scale]);
 return <I18nProvider><InitialLanguageGate><AuthProvider><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,animation:'slide_from_right',animationDuration:motion.standard,gestureEnabled:true,contentStyle:{backgroundColor:colors.canvas}}}/>{!ready?<View pointerEvents="none" style={s.overlay}><Animated.View style={{opacity,transform:[{scale}]}}><BrandMark size={78}/></Animated.View><View style={s.loaderTrack}><Animated.View style={[s.loaderFill,{opacity}]}/></View></View>:null}</AuthProvider></InitialLanguageGate></I18nProvider>;
}
const s=StyleSheet.create({overlay:{...StyleSheet.absoluteFillObject,backgroundColor:colors.canvas,alignItems:'center',justifyContent:'center'},loaderTrack:{position:'absolute',bottom:'31%',width:74,height:2,backgroundColor:colors.line,borderRadius:2,overflow:'hidden'},loaderFill:{height:2,width:'55%',backgroundColor:colors.brand,borderRadius:2}});