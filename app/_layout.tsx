import {useEffect,useState} from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SplashScreen} from 'expo-router';
import {AuthProvider} from '../src/core/auth/AuthProvider';
import {View,ActivityIndicator} from 'react-native';
import {colors} from '../src/ui/theme';

export default function RootLayout(){const[ready,setReady]=useState(false);useEffect(()=>{let alive=true;const t=setTimeout(()=>{if(alive){setReady(true);void SplashScreen.hideAsync();}},420);return()=>{alive=false;clearTimeout(t);};},[]);return <AuthProvider><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,animation:'fade',animationDuration:160,gestureEnabled:true,contentStyle:{backgroundColor:colors.canvas}}}/>{!ready?<View pointerEvents="none" style={{position:'absolute',inset:0,backgroundColor:colors.canvas,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={colors.brand}/></View>:null}</AuthProvider>}
