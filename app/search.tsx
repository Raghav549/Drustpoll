import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { colors, elevation, radius, spacing, type } from '../src/ui/theme';

const suggestions = ['Photography', 'Streetwear', 'Music', 'Local food', 'Design', 'Travel'];

export default function Search() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => suggestions.filter((item) => item.toLowerCase().includes(query.trim().toLowerCase())), [query]);

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>EXPLORE</Text>
        <Text style={styles.title}>Find something worth following.</Text>
        <Text style={styles.subtitle}>People, ideas, videos, shops and products — without the noise.</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search people, ideas or products"
          placeholderTextColor={colors.faint}
          style={styles.input}
          accessibilityLabel="Search Drustpoll"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <View style={styles.searchMeta}><Text style={styles.section}>Explore by interest</Text><Text style={styles.hint}>{query ? `${filtered.length} nearby` : 'Start anywhere'}</Text></View>
        <View style={styles.chips}>
          {filtered.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityLabel={`Explore ${item}`} style={({pressed})=>[styles.chip,pressed&&styles.pressed]}><Text style={styles.chipText}>{item}</Text><Text style={styles.chipArrow}>↗</Text></Pressable>)}
        </View>
        {filtered.length===0 && <View style={styles.empty}><Text style={styles.emptyTitle}>No close matches</Text><Text style={styles.emptyBody}>Try a broader word, or explore the marketplace.</Text></View>}
        <Link href="/shop" asChild><Pressable accessibilityRole="button" style={({pressed})=>[styles.shop,pressed&&styles.pressed]}><View style={styles.shopCopy}><Text style={styles.shopKicker}>MARKET</Text><Text style={styles.shopTitle}>Discover products from shops you trust.</Text><Text style={styles.shopBody}>Clear prices, seller context and useful recommendations — no pressure.</Text></View><Text style={styles.arrow}>→</Text></Pressable></Link>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  kicker: { fontSize: type.labelSM, fontWeight: '800', letterSpacing: 1.8, color: colors.brand },
  title: { fontSize: type.displayLG, lineHeight: 38, fontWeight: '800', color: colors.ink, maxWidth: 390 },
  subtitle: { fontSize: type.bodySM, lineHeight: 20, color: colors.muted, maxWidth: 390, marginTop: -10 },
  input: { height: 54, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 17, fontSize: type.bodyMD, color: colors.ink, ...elevation.low },
  searchMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  section: { fontSize: type.labelLG, fontWeight: '800', color: colors.ink },
  hint: { fontSize: type.labelSM, color: colors.faint },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 11, backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, minHeight: 42 },
  chipText: { color: colors.ink, fontWeight: '700' },
  chipArrow: { color: colors.muted, fontSize: 14 },
  pressed: { opacity: 0.72 },
  empty: { padding: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  emptyTitle: { fontSize: type.titleMD, fontWeight: '800', color: colors.ink },
  emptyBody: { marginTop: 5, color: colors.muted, lineHeight: 20 },
  shop: { backgroundColor: colors.commerceSoft, borderRadius: radius.hero, padding: spacing.xl, minHeight: 155, position: 'relative', borderWidth: 1, borderColor: '#F0D5BC', ...elevation.low },
  shopCopy: { paddingRight: 35 },
  shopKicker: { fontSize: type.labelSM, fontWeight: '800', letterSpacing: 1.6, color: colors.commerce },
  shopTitle: { fontSize: type.titleMD, lineHeight: 24, fontWeight: '800', color: colors.ink, marginTop: 6 },
  shopBody: { color: colors.inkSoft, marginTop: 7, lineHeight: 20 },
  arrow: { position: 'absolute', right: 20, bottom: 18, fontSize: 22, color: colors.commerce },
});
