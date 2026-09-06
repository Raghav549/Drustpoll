import {useEffect,useState} from 'react';
import {Stack} from 'expo-router';
import * as NativeSplash from 'expo-splash-screen';
import {StatusBar} from 'expo-status-bar';
import {View,StyleSheet} from 'react-native';
import {AuthProvider} from '../src/core/auth/AuthProvider';
import {I18nProvider} from '../src/i18n/provider';
import {InitialLanguageGate} from '../src/i18n/InitialLanguageGate';
import {colors} from '../src/ui/theme';
import {BrandMark} from '../src/ui/BrandMark';
void NativeSplash.preventAutoHideAsync().catch(()=>undefined);
const absoluteFillObject={position:'absolute' as const,top:0,left:0,right:0,bottom:0};
export default function RootLayout(){
 const[ready,setReady]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>{setReady(true);void NativeSplash.hideAsync();},360);return()=>clearTimeout(timer);},[]);
 return <I18nProvider><InitialLanguageGate><AuthProvider>
   <StatusBar style="dark"/>
   <Stack screenOptions={{headerShown:false,animation:'slide_from_right',animationDuration:240,gestureEnabled:true,contentStyle:{backgroundColor:colors.canvas}}}/>
   {!ready?<View pointerEvents="none" style={s.overlay}><BrandMark size={88}/></View>:null}
 </AuthProvider></InitialLanguageGate></I18nProvider>;
}
const s=StyleSheet.create({overlay:{...absoluteFillObject,backgroundColor:colors.canvas,alignItems:'center',justifyContent:'center'}});
