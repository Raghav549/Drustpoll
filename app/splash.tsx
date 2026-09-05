import {useEffect} from 'react';
import {ActivityIndicator,StyleSheet,Text,View} from 'react-native';
import {router} from 'expo-router';
import {colors,radius,spacing,type} from '../src/ui/theme';

export default function Splash(){
 useEffect(()=>{const t=setTimeout(()=>router.replace('/'),650);return()=>clearTimeout(t);},[]);
 return <View style={s.screen}><View style={s.halo}/><View style={s.mark}><View style={s.inner}/></View><Text style={s.brand}>drustpoll</Text><Text style={s.tag}>people · ideas · places</Text><ActivityIndicator size="small" color={colors.brand} style={{marginTop:22}}/></View>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:colors.canvas,alignItems:'center',justifyContent:'center',padding:spacing.xl},halo:{position:'absolute',width:280,height:280,borderRadius:140,backgroundColor:colors.brandSoft,opacity:.65},mark:{width:92,height:92,borderRadius:30,backgroundColor:colors.brand,alignItems:'center',justifyContent:'center',transform:[{rotate:'-6deg'}]},inner:{width:50,height:50,borderRadius:18,borderWidth:2,borderColor:'rgba(255,255,255,.9)'},brand:{marginTop:22,fontSize:30,fontWeight:'900',letterSpacing:-1.2,color:colors.ink},tag:{marginTop:5,fontSize:type.bodySM,fontWeight:'700',letterSpacing:1,color:colors.muted}});
