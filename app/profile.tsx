import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { colors, radius, spacing } from '../src/ui/theme';

export default function Profile() {
  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}><View style={styles.avatar}><Text style={styles.avatarText}>R</Text></View><Pressable style={styles.edit}><Text style={styles.editText}>Edit profile</Text></Pressable></View>
        <Text style={styles.name}>Your profile</Text>
        <Text style={styles.handle}>@drustpoll_user</Text>
        <Text style={styles.bio}>Posts, reels, people and a storefront—one identity with clear boundaries.</Text>
        <View style={styles.stats}><Stat n="0" l="Posts"/><Stat n="0" l="Followers"/><Stat n="0" l="Following"/></View>
        <Link href="/shop" asChild><Pressable style={styles.shop}><Text style={styles.shopTitle}>Your Shop</Text><Text style={styles.shopBody}>Turn your profile into a storefront without creating a separate public identity.</Text><Text style={styles.arrow}>→</Text></Pressable></Link>
        <View style={styles.tabs}><Text style={styles.active}>Posts</Text><Text>Reels</Text><Text>Shop</Text></View>
        <View style={styles.empty}><Text style={styles.emptyTitle}>Your story starts here.</Text><Text style={styles.emptyBody}>Create posts, publish short video, follow people and add products when you're ready.</Text></View>
      </ScrollView>
    </AppShell>
  );
}
function Stat({n,l}:{n:string;l:string}){return <View><Text style={styles.statN}>{n}</Text><Text style={styles.statL}>{l}</Text></View>}
const styles=StyleSheet.create({content:{padding:spacing.xl,gap:10},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},avatar:{width:86,height:86,borderRadius:43,backgroundColor:colors.dark,alignItems:'center',justifyContent:'center'},avatarText:{fontSize:32,fontWeight:'800',color:'#fff'},edit:{borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,borderRadius:radius.md,paddingHorizontal:14,paddingVertical:10},editText:{fontWeight:'700',color:colors.ink},name:{fontSize:27,fontWeight:'800',color:colors.ink,marginTop:5},handle:{color:colors.muted},bio:{fontSize:15,lineHeight:21,color:'#475467',maxWidth:420},stats:{flexDirection:'row',gap:34,paddingVertical:18},statN:{fontSize:19,fontWeight:'800',color:colors.ink},statL:{fontSize:12,color:colors.muted},shop:{backgroundColor:colors.accentSoft,borderRadius:radius.lg,padding:spacing.xl,position:'relative',minHeight:120},shopTitle:{fontSize:20,fontWeight:'800',color:colors.ink},shopBody:{fontSize:13,color:'#475467',marginTop:6,maxWidth:310,lineHeight:19},arrow:{position:'absolute',right:20,bottom:18,fontSize:24},tabs:{flexDirection:'row',justifyContent:'space-around',paddingVertical:18,marginTop:8},active:{fontWeight:'800',color:colors.ink},empty:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,borderRadius:radius.lg,padding:spacing.xl},emptyTitle:{fontSize:18,fontWeight:'800',color:colors.ink},emptyBody:{fontSize:13,lineHeight:20,color:colors.muted,marginTop:6}});
