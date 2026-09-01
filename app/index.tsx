import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

const topics = ['For You', 'Following', 'Trending', 'Nearby'];

export default function Home() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>DRUSTPOLL</Text><Text style={styles.title}>Your world, naturally.</Text></View>
          <Link href="/shop" asChild><Pressable style={styles.shopButton}><Text style={styles.shopText}>Shop</Text></Pressable></Link>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          {topics.map((topic, index) => <View key={topic} style={[styles.pill, index === 0 && styles.activePill]}><Text style={[styles.pillText, index === 0 && styles.activePillText]}>{topic}</Text></View>)}
        </ScrollView>
        <View style={styles.hero}><Text style={styles.heroLabel}>DISCOVER</Text><Text style={styles.heroTitle}>People, ideas & products worth your attention.</Text><Text style={styles.heroBody}>A calm social feed built around relevance, variety, control and real connections—not endless noise.</Text></View>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarText}>D</Text></View><View style={styles.cardCopy}><Text style={styles.name}>Drustpoll</Text><Text style={styles.meta}>A new kind of social space</Text></View><Text style={styles.more}>•••</Text>
          <Text style={styles.post}>Your feed should belong to you. Drustpoll is being built with personalization, privacy and user control as first-class features.</Text>
          <View style={styles.actions}><Text>♡ Like</Text><Text>◌ Comment</Text><Text>↗ Share</Text><Text>⌁ Save</Text></View>
        </View>
        <View style={styles.grid}>
          <Link href="/reels" asChild><Pressable style={styles.tile}><Text style={styles.tileIcon}>▶</Text><Text style={styles.tileTitle}>Reels</Text><Text style={styles.tileBody}>Short video discovery</Text></Pressable></Link>
          <Link href="/profile" asChild><Pressable style={styles.tile}><Text style={styles.tileIcon}>◎</Text><Text style={styles.tileTitle}>Profile</Text><Text style={styles.tileBody}>Identity, posts & shop</Text></Pressable></Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F6F7F9'},content:{padding:20,gap:18},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:2,color:'#667085'},title:{fontSize:26,fontWeight:'800',color:'#101828',marginTop:3},shopButton:{backgroundColor:'#111827',paddingHorizontal:16,paddingVertical:10,borderRadius:14},shopText:{color:'#fff',fontWeight:'700'},pills:{gap:8},pill:{paddingHorizontal:15,paddingVertical:9,borderRadius:99,backgroundColor:'#fff'},activePill:{backgroundColor:'#111827'},pillText:{color:'#475467',fontWeight:'600'},activePillText:{color:'#fff'},hero:{backgroundColor:'#E8F0FF',borderRadius:28,padding:24,gap:10},heroLabel:{fontSize:11,fontWeight:'800',letterSpacing:1.6,color:'#3157D5'},heroTitle:{fontSize:30,lineHeight:35,fontWeight:'800',color:'#101828'},heroBody:{fontSize:15,lineHeight:22,color:'#475467'},card:{backgroundColor:'#fff',borderRadius:24,padding:18,flexDirection:'row',flexWrap:'wrap',gap:12},avatar:{width:42,height:42,borderRadius:21,backgroundColor:'#111827',alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'800'},cardCopy:{flex:1},name:{fontWeight:'800',color:'#101828'},meta:{color:'#98A2B3',marginTop:3,fontSize:12},more:{color:'#98A2B3'},post:{width:'100%',fontSize:16,lineHeight:23,color:'#344054'},actions:{width:'100%',flexDirection:'row',justifyContent:'space-between',paddingTop:4},grid:{flexDirection:'row',gap:12},tile:{flex:1,backgroundColor:'#fff',borderRadius:22,padding:18,minHeight:145},tileIcon:{fontSize:24,color:'#111827'},tileTitle:{fontSize:18,fontWeight:'800',marginTop:14,color:'#101828'},tileBody:{fontSize:12,color:'#667085',marginTop:5}
});
