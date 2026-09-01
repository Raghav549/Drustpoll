import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../src/ui/AppShell';
import { colors, radius, spacing } from '../src/ui/theme';

const items = [['Maya replied to your post', '4m'], ['Kabir followed you', '28m'], ['Your order was updated', '2h']];

export default function Notifications() {
  return <AppShell><ScrollView contentContainerStyle={styles.content}><Text style={styles.kicker}>UPDATES</Text><Text style={styles.title}>Notifications</Text><Text style={styles.subtitle}>Useful signals, grouped so your attention stays yours.</Text><View style={styles.list}>{items.map(([text,time])=><View key={text} style={styles.row}><View style={styles.dot}/><View style={styles.copy}><Text style={styles.text}>{text}</Text><Text style={styles.time}>{time}</Text></View></View>)}</View><View style={styles.note}><Text style={styles.noteTitle}>Notification policy</Text><Text style={styles.noteBody}>No engagement bait. Future notifications will be user-controlled, grouped where appropriate, and measured against interruption cost.</Text></View></ScrollView></AppShell>;
}
const styles=StyleSheet.create({content:{padding:spacing.xl,gap:spacing.lg},kicker:{fontSize:11,fontWeight:'800',letterSpacing:1.8,color:colors.muted},title:{fontSize:34,fontWeight:'800',color:colors.ink},subtitle:{fontSize:15,lineHeight:22,color:colors.muted},list:{backgroundColor:colors.surface,borderRadius:radius.lg,overflow:'hidden'},row:{minHeight:70,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:colors.line},dot:{width:9,height:9,borderRadius:5,backgroundColor:colors.accent},copy:{flex:1},text:{fontSize:14,fontWeight:'700',color:colors.ink},time:{fontSize:11,color:colors.faint,marginTop:3},note:{backgroundColor:colors.accentSoft,borderRadius:radius.lg,padding:spacing.xl},noteTitle:{fontWeight:'800',color:colors.accent},noteBody:{fontSize:13,lineHeight:20,color:colors.ink,marginTop:6}});
