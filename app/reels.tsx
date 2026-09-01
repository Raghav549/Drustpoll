import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../src/ui/AppShell';
import { colors, radius, spacing } from '../src/ui/theme';

const cards = ['People making things','Ideas worth sharing','Your next rabbit hole'];

export default function Reels() {
  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>DISCOVER</Text>
        <Text style={styles.title}>A wider feed.</Text>
        <Text style={styles.subtitle}>Short video is one surface—not the whole product. Discovery should stay varied and explainable.</Text>
        {cards.map((item,i)=><View key={item} style={styles.card}><Text style={styles.number}>0{i+1}</Text><View style={styles.copy}><Text style={styles.cardTitle}>{item}</Text><Text style={styles.cardBody}>Ranking will combine relevance with novelty, diversity, quality and safety.</Text></View></View>)}
      </ScrollView>
    </AppShell>
  );
}
const styles=StyleSheet.create({content:{padding:spacing.xl,gap:spacing.lg},kicker:{fontSize:11,fontWeight:'800',letterSpacing:1.8,color:colors.muted},title:{fontSize:34,fontWeight:'800',color:colors.ink},subtitle:{fontSize:15,lineHeight:22,color:colors.muted},card:{minHeight:170,borderRadius:radius.xl,backgroundColor:colors.dark,padding:spacing.xl,flexDirection:'row',alignItems:'flex-end',gap:16},number:{fontSize:12,fontWeight:'800',color:colors.faint},copy:{flex:1},cardTitle:{fontSize:22,fontWeight:'800',color:'#fff'},cardBody:{fontSize:13,lineHeight:19,color:'#D0D5DD',marginTop:6,maxWidth:280}});
