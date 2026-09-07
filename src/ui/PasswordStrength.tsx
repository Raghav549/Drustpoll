import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';
import { useI18n } from '../i18n/provider';

type Props={password:string};
export function passwordChecks(password:string){return {length:password.length>=12,upper:/[A-Z]/.test(password),lower:/[a-z]/.test(password),number:/\d/.test(password),special:/[^A-Za-z0-9]/.test(password)};}
export function PasswordStrength({password}:Props){const{t}=useI18n();const c=passwordChecks(password);const score=Object.values(c).filter(Boolean).length;const label=score===0?'':score<3?t('weak'):score<5?t('good'):t('strong');const checks:[keyof typeof c,string][]=[['length',t('password12')],['upper',t('passwordUpper')],['lower',t('passwordLower')],['number',t('passwordNumber')],['special',t('passwordSpecial')]];return <View style={s.wrap}>{password.length>0?<><View style={s.meter}>{[0,1,2,3,4].map(i=><View key={i} style={[s.segment,i<score&&s.active]}/>)}</View><Text style={s.label}>{label}</Text><View style={s.grid}>{checks.map(([k,l])=>{const ok=c[k];return <Text key={k} style={[s.check,ok&&s.ok]}>{ok?'✓':'○'} {l}</Text>;})}</View></>:null}</View>}
const s=StyleSheet.create({wrap:{marginTop:-10,marginBottom:14},meter:{flexDirection:'row',gap:4},segment:{height:4,flex:1,borderRadius:4,backgroundColor:colors.line},active:{backgroundColor:colors.brand},label:{fontSize:11,fontWeight:'800',color:colors.muted,marginTop:5},grid:{flexDirection:'row',flexWrap:'wrap',columnGap:12,rowGap:5,marginTop:6},check:{fontSize:11,color:colors.faint},ok:{color:colors.brand}});
