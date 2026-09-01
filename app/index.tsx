import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { colors, radius, spacing } from '../src/ui/theme';

const topics = ['For You', 'Following', 'Trending', 'Nearby'];

export default function Home() {
  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>DRUSTPOLL</Text><Text style={styles.title}>Your world, naturally.</Text></View>
          <Link href="/shop" asChild><Pressable style={styles.shopButton}><Text style={styles.shopText}>Shop</Text></Pressable></Link>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          {topics.map((topic, index) => <View key={topic} style={[styles.pill, index === 0 && styles.activePill]}><Text style={[styles.pillText, index === 0 && styles.activePillText]}>{topic}</Text></View>)}
        </ScrollView>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>DISCOVER</Text>
          <Text style={styles.heroTitle}>People, ideas & products worth your attention.</Text>
          <Text style={styles.heroBody}>Personalized around relevance and connection, while deliberately leaving room for novelty, diversity and user control.</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarText}>D</Text></View>
          <View style={styles.cardCopy}><Text style={styles.name}>Drustpoll</Text><Text style={styles.meta}>A new kind of social space</Text></View>
          <Text style={styles.more}>•••</Text>
          <Text style={styles.post}>Your feed should belong to you. The ranking layer will balance relevance, meaningful interactions, freshness, diversity, safety and negative feedback—not raw engagement alone.</Text>
          <View style={styles.actions}><Text>♡ Like</Text><Text>◌ Comment</Text><Text>↗ Share</Text><Text>⌁ Save</Text></View>
        </View>
        <View style={styles.grid}>
          <Link href="/reels" asChild><Pressable style={styles.tile}><Text style={styles.tileIcon}>▶</Text><Text style={styles.tileTitle}>Discover</Text><Text style={styles.tileBody}>Short video and ideas</Text></Pressable></Link>
          <Link href="/cart" asChild><Pressable style={styles.tile}><Text style={styles.tileIcon}>◇</Text><Text style={styles.tileTitle}>Cart</Text><Text style={styles.tileBody}>Products from profiles</Text></Pressable></Link>
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content:{padding:spacing.xl,gap:spacing.lg},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:2,color:colors.muted},title:{fontSize:26,fontWeight:'800',color:colors.ink,marginTop:3},shopButton:{backgroundColor:colors.dark,paddingHorizontal:16,paddingVertical:10,borderRadius:radius.md},shopText:{color:'#fff',fontWeight:'700'},pills:{gap:8},pill:{paddingHorizontal:15,paddingVertical:9,borderRadius:radius.pill,backgroundColor:colors.surface},activePill:{backgroundColor:colors.dark},pillText:{color:'#475467',fontWeight:'600'},activePillText:{color:'#fff'},hero:{backgroundColor:colors.accentSoft,borderRadius:radius.xl,padding:spacing.xl,gap:10},heroLabel:{fontSize:11,fontWeight:'800',letterSpacing:1.6,color:colors.accent},heroTitle:{fontSize:30,lineHeight:35,fontWeight:'800',color:colors.ink},heroBody:{fontSize:15,lineHeight:22,color:colors.muted},card:{backgroundColor:colors.surface,borderRadius:radius.lg,padding:spacing.lg,flexDirection:'row',flexWrap:'wrap',gap:12,borderWidth:1,borderColor:colors.line},avatar:{width:42,height:42,borderRadius:21,backgroundColor:colors.dark,alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'800'},cardCopy:{flex:1},name:{fontWeight:'800',color:colors.ink},meta:{color:colors.faint,marginTop:3,fontSize:12},more:{color:colors.faint},post:{width:'100%',fontSize:16,lineHeight:23,color:'#344054'},actions:{width:'100%',flexDirection:'row',justifyContent:'space-between',paddingTop:4},grid:{flexDirection:'row',gap:12},tile:{flex:1,backgroundColor:colors.surface,borderRadius:radius.lg,padding:spacing.lg,minHeight:145,borderWidth:1,borderColor:colors.line},tileIcon:{fontSize:24,color:colors.dark},tileTitle:{fontSize:18,fontWeight:'800',marginTop:14,color:colors.ink},tileBody:{fontSize:12,color:colors.muted,marginTop:5}
});
