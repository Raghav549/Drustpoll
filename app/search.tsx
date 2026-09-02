import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { colors, elevation, radius, spacing, type } from '../src/ui/theme';
import { SearchField, Chip, Surface, SectionHeader, StateView } from '../src/ui/primitives';

const suggestions = ['Photography', 'Streetwear', 'Music', 'Local food', 'Design', 'Travel'];
export default function Search() {
 const [query,setQuery]=useState(''); const [selected,setSelected]=useState<string|null>(null);
 const filtered=useMemo(()=>suggestions.filter(item=>item.toLowerCase().includes(query.trim().toLowerCase())),[query]);
 return <AppShell><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
  <SectionHeader eyebrow="EXPLORE" title="Find something worth following." description="People, ideas, videos, shops and products — without the noise."/>
  <SearchField value={query} onChangeText={setQuery} placeholder="Search people, ideas or products" label="Search Drustpoll" returnKeyType="search"/>
  <View style={styles.meta}><Text style={styles.section}>Explore by interest</Text><Text style={styles.hint}>{query?`${filtered.length} nearby`:'Start anywhere'}</Text></View>
  <View style={styles.chips}>{filtered.map(item=><Chip key={item} label={item} selected={selected===item} onPress={()=>setSelected(selected===item?null:item)}/>)}</View>
  {!filtered.length?<StateView title="No close matches" body="Try a broader word, or explore the marketplace."/>:null}
  {selected?<Surface tone="info"><Text style={styles.selectionTitle}>You picked {selected}</Text><Text style={styles.selectionBody}>This preference is explicit. It does not silently change what you see elsewhere.</Text></Surface>:null}
  <Link href="/shop" asChild><Pressable accessibilityRole="button" accessibilityLabel="Open Market" style={({pressed})=>[styles.shop,pressed&&styles.pressed]}><Text style={styles.shopKicker}>MARKET</Text><Text style={styles.shopTitle}>Discover products from shops you trust.</Text><Text style={styles.shopBody}>Clear prices, seller context and useful recommendations — no pressure.</Text><Text style={styles.arrow}>→</Text></Pressable></Link>
 </ScrollView></AppShell>;
}
const styles=StyleSheet.create({content:{padding:spacing.xl,gap:spacing.lg,maxWidth:1120,width:'100%',alignSelf:'center'},meta:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},section:{fontSize:type.labelLG,fontWeight:'800',color:colors.ink},hint:{fontSize:type.labelSM,color:colors.faint},chips:{flexDirection:'row',flexWrap:'wrap',gap:10},shop:{backgroundColor:colors.commerceSoft,borderRadius:radius.hero,padding:spacing.xl,minHeight:155,position:'relative',borderWidth:1,borderColor:'#F0D5BC',...elevation.low},shopKicker:{fontSize:type.labelSM,fontWeight:'800',letterSpacing:1.6,color:colors.commerce},shopTitle:{fontSize:type.titleMD,lineHeight:24,fontWeight:'800',color:colors.ink,marginTop:6,maxWidth:600},shopBody:{color:colors.inkSoft,marginTop:7,lineHeight:20,maxWidth:620},arrow:{position:'absolute',right:20,bottom:18,fontSize:22,color:colors.commerce},selectionTitle:{fontWeight:'800',color:colors.ink},selectionBody:{fontSize:type.bodySM,lineHeight:20,color:colors.inkSoft,marginTop:4},pressed:{opacity:.72}});
