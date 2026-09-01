import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { colors, radius, spacing } from '../src/ui/theme';

const suggestions = ['Photography', 'Streetwear', 'Music', 'Local food', 'Design', 'Travel'];

export default function Search() {
  const [query, setQuery] = useState('');
  const filtered = suggestions.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>EXPLORE</Text>
        <Text style={styles.title}>Find people, ideas & products.</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Drustpoll"
          placeholderTextColor={colors.faint}
          style={styles.input}
          autoCapitalize="none"
          returnKeyType="search"
        />
        <Text style={styles.section}>Explore topics</Text>
        <View style={styles.chips}>
          {filtered.map((item) => <Pressable key={item} style={styles.chip}><Text style={styles.chipText}>{item}</Text></Pressable>)}
        </View>
        <Link href="/shop" asChild><Pressable style={styles.shop}><Text style={styles.shopTitle}>Search the marketplace</Text><Text style={styles.shopBody}>Discover products from profiles you trust.</Text><Text style={styles.arrow}>→</Text></Pressable></Link>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, color: colors.muted },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.ink },
  input: { height: 52, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, fontSize: 16, color: colors.ink },
  section: { fontSize: 14, fontWeight: '800', color: colors.ink, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 15, paddingVertical: 11, backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  chipText: { color: colors.ink, fontWeight: '700' },
  shop: { backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: spacing.xl, minHeight: 120, position: 'relative' },
  shopTitle: { fontSize: 19, fontWeight: '800', color: colors.ink },
  shopBody: { color: colors.muted, marginTop: 6, maxWidth: 300, lineHeight: 20 },
  arrow: { position: 'absolute', right: 20, bottom: 18, fontSize: 22, color: colors.ink },
});
