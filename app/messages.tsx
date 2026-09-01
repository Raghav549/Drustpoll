import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../src/ui/AppShell';
import { colors, radius, spacing } from '../src/ui/theme';

const threads = [
  ['A', 'Aarav', 'Loved the new collection.', '2m'],
  ['M', 'Maya', 'Are you joining the room tonight?', '18m'],
  ['K', 'Kabir', 'That local place is brilliant.', '1h'],
];

export default function Messages() {
  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>PRIVATE</Text>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Conversations stay separate from public social activity.</Text>
        <View style={styles.list}>
          {threads.map(([initial, name, message, time]) => (
            <View key={name} style={styles.row}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
              <View style={styles.copy}><Text style={styles.name}>{name}</Text><Text style={styles.message} numberOfLines={1}>{message}</Text></View>
              <Text style={styles.time}>{time}</Text>
            </View>
          ))}
        </View>
        <View style={styles.note}><Text style={styles.noteTitle}>Privacy architecture</Text><Text style={styles.noteBody}>Private messaging will be designed around encrypted content, device/session controls and minimal server-readable metadata.</Text></View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, color: colors.muted },
  title: { fontSize: 34, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted, marginBottom: 8 },
  list: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  row: { minHeight: 76, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  copy: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: '800', color: colors.ink },
  message: { color: colors.muted, fontSize: 13 },
  time: { color: colors.faint, fontSize: 11 },
  note: { backgroundColor: colors.successSoft, borderRadius: radius.lg, padding: spacing.xl, marginTop: 4 },
  noteTitle: { fontWeight: '800', color: colors.success },
  noteBody: { color: colors.ink, lineHeight: 20, marginTop: 6, fontSize: 13 },
});
