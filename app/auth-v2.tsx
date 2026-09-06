import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { signIn, signUp } from '../src/core/auth/auth-client';
import { colors, spacing, type } from '../src/ui/theme';
import { Icon } from '../src/ui/icons';

function Field({label,value,onChange,placeholder,secureTextEntry,keyboardType}:{label:string;value:string;onChange:(v:string)=>void;placeholder:string;secureTextEntry?:boolean;keyboardType?:'email-address'}){
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.faint} style={styles.input} secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={secureTextEntry?'none':'sentences'} />;</View>;
}

export default function AuthV2(){
 const [mode,setMode]=useState<'signin'|'signup'>('signin');
 const [identifier,setIdentifier]=useState(''); const [username,setUsername]=useState(''); const [displayName,setDisplayName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 async function submit(){
  setError(''); if(password.length<12){setError('Use at least 12 characters for your password.');return;}
  if(mode==='signin'&&!identifier.trim()){setError('Enter your username, email or phone.');return;}
  if(mode==='signup'&&(!displayName.trim()||!username.trim())){setError('Add your name and username to continue.');return;}
  setBusy(true);
  try{if(mode==='signin') await signIn(identifier.trim(),password); else await signUp({displayName:displayName.trim(),username:username.trim(),email:email.trim()||undefined,password}); router.replace('/');}
  catch(e){setError(e instanceof Error?e.message:'Could not complete this action.');}
  finally{setBusy(false);}
 }
 return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS==='ios'?'padding':undefined}>
  <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
   <View style={styles.top}><View style={styles.logoMark}><View style={styles.dotA}/><View style={styles.dotB}/><View style={styles.dotC}/><View style={styles.linkA}/><View style={styles.linkB}/></View><View><Text style={styles.brand}>drustpoll</Text><Text style={styles.strap}>people · ideas · places</Text></View></View>
   <View style={styles.progress}><View style={[styles.progressFill,{width:mode==='signup'?'66%':'100%'}]}/></View>
   <Text style={styles.kicker}>{mode==='signin'?'WELCOME BACK':'CREATE ACCOUNT'}</Text>
   <Text style={styles.title}>{mode==='signin'?'Your space is waiting.':'Make the space yours.'}</Text>
   <Text style={styles.body}>{mode==='signin'?'Sign in and continue without losing your context.':'A social identity for people, ideas, discovery and commerce.'}</Text>
   {mode==='signup'&&<><Field label="Name" value={displayName} onChange={setDisplayName} placeholder="What should people call you?"/><Field label="Username" value={username} onChange={setUsername} placeholder="Choose a unique username"/></>}
   {mode==='signin'&&<Field label="Account" value={identifier} onChange={setIdentifier} placeholder="Username, email or phone"/>}
   {mode==='signup'&&<Field label="Email" value={email} onChange={setEmail} placeholder="Optional" keyboardType="email-address"/>}
   <Field label="Password" value={password} onChange={setPassword} placeholder="12+ characters" secureTextEntry/>
   {mode==='signin'&&<Pressable style={styles.forgot} onPress={()=>router.push('/auth?mode=forgot')}><Text style={styles.forgotText}>Forgot password?</Text></Pressable>}
   {error?<View style={styles.error}><Icon name="circleAlert" size={18} color={colors.danger}/><Text style={styles.errorText}>{error}</Text></View>:null}
   <Pressable disabled={busy} onPress={()=>void submit()} style={({pressed})=>[styles.primary,pressed&&styles.pressed,busy&&styles.disabled]}>{busy?<ActivityIndicator color={colors.white}/>:<Text style={styles.primaryText}>{mode==='signin'?'Continue':'Create account'}</Text>}</Pressable>
   <View style={styles.switchRow}><Text style={styles.switchMuted}>{mode==='signin'?'New to Drustpoll?':'Already have an account?'}</Text><Pressable onPress={()=>{setError('');setMode(mode==='signin'?'signup':'signin');}}><Text style={styles.switchLink}>{mode==='signin'?'Create account':'Sign in'}</Text></Pressable></View>
   <Text style={styles.legal}>By continuing, you keep control of your profile, privacy and recommendations.</Text>
  </ScrollView>
 </KeyboardAvoidingView>;
}

const styles=StyleSheet.create({screen:{flex:1,backgroundColor:colors.canvas},wrap:{flexGrow:1,width:'100%',maxWidth:720,alignSelf:'center',paddingHorizontal:24,paddingTop:28,paddingBottom:36,justifyContent:'center',gap:18},top:{flexDirection:'row',alignItems:'center',gap:12},logoMark:{width:42,height:42,borderRadius:14,backgroundColor:colors.brand,position:'relative'},dotA:{position:'absolute',width:6,height:6,borderRadius:3,backgroundColor:colors.white,left:9,top:12},dotB:{position:'absolute',width:6,height:6,borderRadius:3,backgroundColor:colors.white,right:8,top:9},dotC:{position:'absolute',width:6,height:6,borderRadius:3,backgroundColor:colors.white,left:17,bottom:9},linkA:{position:'absolute',width:17,height:1.5,backgroundColor:colors.white,left:14,top:13,transform:[{rotate:'-10deg'}]},linkB:{position:'absolute',width:15,height:1.5,backgroundColor:colors.white,left:13,top:23,transform:[{rotate:'48deg'}]},brand:{fontSize:20,fontWeight:'900',letterSpacing:-.6,color:colors.ink},strap:{fontSize:11,color:colors.muted,marginTop:2},progress:{height:2,backgroundColor:colors.line,width:'100%',marginTop:4},progressFill:{height:2,backgroundColor:colors.brand},kicker:{fontSize:11,fontWeight:'900',letterSpacing:2,color:colors.brand,marginTop:10},title:{fontSize:36,lineHeight:42,fontWeight:'800',letterSpacing:-1,color:colors.ink,maxWidth:620},body:{fontSize:15,lineHeight:22,color:colors.muted,maxWidth:560},field:{gap:7,marginTop:6},label:{fontSize:12,fontWeight:'800',color:colors.ink},input:{height:54,borderBottomWidth:1,borderBottomColor:colors.line,color:colors.ink,fontSize:17,paddingHorizontal:2},forgot:{alignSelf:'flex-start',paddingVertical:4},forgotText:{fontSize:13,fontWeight:'700',color:colors.brand},error:{padding:13,borderRadius:12,backgroundColor:colors.dangerSoft,flexDirection:'row',gap:9,alignItems:'flex-start'},errorText:{flex:1,color:colors.danger,fontSize:13,lineHeight:19},primary:{height:56,borderRadius:15,backgroundColor:colors.brand,alignItems:'center',justifyContent:'center',marginTop:6},primaryText:{color:colors.white,fontSize:16,fontWeight:'800'},pressed:{opacity:.82},disabled:{opacity:.55},switchRow:{flexDirection:'row',justifyContent:'center',gap:5,marginTop:6},switchMuted:{fontSize:14,color:colors.muted},switchLink:{fontSize:14,color:colors.brand,fontWeight:'800'},legal:{fontSize:11,lineHeight:17,color:colors.faint,textAlign:'center',maxWidth:540,alignSelf:'center',marginTop:6}});