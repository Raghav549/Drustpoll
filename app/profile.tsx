import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { colors, elevation, radius, spacing, type } from '../src/ui/theme';

export default function Profile() {
  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <View style={styles.avatar} accessibilityLabel="Profile avatar"><Text style={styles.avatarText}>R</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit profile" style={({pressed})=>[styles.edit,pressed&&styles.pressed]}><Text style={styles.editText}>Edit profile</Text></Pressable>
        </View>
        <Text style={styles.kicker}>YOU</Text>
        <Text style={styles.name}>Your profile</Text>
        <Text style={styles.handle}>@drustpoll_user</Text>
        <Text style={styles.bio}>One identity for your people, ideas and storefront — with clear boundaries.</Text>
        <View style={styles.stats} accessibilityLabel="Profile statistics"><Stat n="0" l="Posts"/><Stat n="0" l="Followers"/><Stat n="0" l="Following"/></View>
        <Link href="/shop" asChild><Pressable accessibilityRole="button" accessibilityLabel="Open your shop" style={({pressed})=>[styles.shop,pressed&&styles.pressed]}><Text style={styles.shopKicker}>MARKET</Text><Text style={styles.shopTitle}>Your Shop</Text><Text style={styles.shopBody}>A storefront connected to your identity, not a separate persona.</Text><Text style={styles.arrow}>→</Text></Pressable></Link>
        <View style={styles.tabs} accessibilityRole="tablist"><Text accessibilityRole="tab" style={styles.active}>Posts</Text><Text accessibilityRole="tab">Reels</Text><Text accessibilityRole="tab">Shop</Text></View>
        <View style={styles.empty}><Text style={styles.emptyTitle}>Your story starts here.</Text><Text style={styles.emptyBody}>Create something, meet people, or add a product when you're ready. Nothing is shared before you choose an audience.</Text></View>
      </ScrollView>
    </AppShell>
  );
}
function Stat({n,l}:{n:string;l:string}){return <View style={styles.stat}><Text style={styles.statN}>{n}</Text><Text style={styles.statL}>{l}</Text></View>}
const styles=StyleSheet.create({content:{padding:spacing.xl,gap:10},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},avatar:{width:88,height:88,borderRadius:44,backgroundColor:colors.brand,alignItems:'center',justifyContent:'center'},avatarText:{fontSize:32,fontWeight:'800',color:colors.white},edit:{borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,borderRadius:radius.md,paddingHorizontal:16,paddingVertical:11,minHeight:44,justifyContent:'center',...elevation.low},pressed:{opacity:.72},editText:{fontWeight:'700',color:colors.ink},kicker:{fontSize:type.labelSM,fontWeight:'800',letterSpacing:1.8,color:colors.brand,marginTop:5},name:{fontSize:type.displayLG,fontWeight:'800',color:colors.ink},handle:{color:colors.muted},bio:{fontSize:type.bodyMD,lineHeight:22,color:colors.inkSoft,maxWidth:440},stats:{flexDirection:'row',gap:38,paddingVertical:18},stat:{minWidth:62},statN:{fontSize:20,fontWeight:'800',color:colors.ink},statL:{fontSize:type.labelSM,color:colors.muted,marginTop:2},shop:{backgroundColor:colors.commerceSoft,borderRadius:radius.hero,padding:spacing.xl,position:'relative',minHeight:132,borderWidth:1,borderColor:'#F0D5BC',...elevation.low},shopKicker:{fontSize:type.labelSM,fontWeight:'800',letterSpacing:1.6,color:colors.commerce},shopTitle:{fontSize:type.titleLG,fontWeight:'800',color:colors.ink,marginTop:5},shopBody:{fontSize:type.bodySM,color:colors.inkSoft,marginTop:6,maxWidth:340,lineHeight:20},arrow:{position:'absolute',right:20,bottom:18,fontSize:24,color:colors.commerce},tabs:{flexDirection:'row',justifyContent:'space-around',paddingVertical:18,marginTop:6,borderBottomWidth:1,borderBottomColor:colors.line},active:{fontWeight:'800',color:colors.brand},empty:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,borderRadius:radius.lg,padding:spacing.xl,marginTop:6},emptyTitle:{fontSize:type.titleMD,fontWeight:'800',color:colors.ink},emptyBody:{fontSize:type.bodySM,lineHeight:21,color:colors.muted,marginTop:6}});
