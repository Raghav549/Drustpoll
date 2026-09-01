import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../src/ui/AppShell';
import { colors, radius, spacing } from '../src/ui/theme';

export default function Cart() {
  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>MARKET</Text>
        <Text style={styles.title}>Your cart</Text>
        <View style={styles.empty}>
          <Text style={styles.icon}>◇</Text>
          <Text style={styles.emptyTitle}>Nothing here yet.</Text>
          <Text style={styles.emptyBody}>Products you save from profiles and shops will appear here before checkout.</Text>
        </View>
        <View style={styles.security}><Text style={styles.securityTitle}>Checkout principle</Text><Text style={styles.securityBody}>Keep social identity, seller authorization and payment processing separated so a commerce action cannot silently expand social permissions.</Text></View>
        <Pressable style={styles.button}><Text style={styles.buttonText}>Continue shopping</Text></Pressable>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, color: colors.muted },
  title: { fontSize: 34, fontWeight: '800', color: colors.ink },
  empty: { backgroundColor: colors.surface, borderRadius: radius.xl, minHeight: 250, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, borderWidth: 1, borderColor: colors.line },
  icon: { fontSize: 38, color: colors.accent },
  emptyTitle: { fontSize: 21, fontWeight: '800', color: colors.ink, marginTop: 12 },
  emptyBody: { textAlign: 'center', color: colors.muted, lineHeight: 20, marginTop: 6, maxWidth: 320 },
  security: { backgroundColor: colors.successSoft, borderRadius: radius.lg, padding: spacing.xl },
  securityTitle: { color: colors.success, fontWeight: '800' },
  securityBody: { color: colors.ink, lineHeight: 20, marginTop: 6, fontSize: 13 },
  button: { backgroundColor: colors.dark, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '800' },
});
