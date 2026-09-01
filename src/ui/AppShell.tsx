import { ReactNode } from 'react';
import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from './theme';

const items = [
  { href: '/', icon: '⌂', label: 'Home' },
  { href: '/reels', icon: '◉', label: 'Discover' },
  { href: '/search', icon: '⌕', label: 'Search' },
  { href: '/messages', icon: '◌', label: 'Messages' },
  { href: '/profile', icon: '◎', label: 'You' },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.body}>{children}</View>
      <View style={styles.nav}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} asChild>
              <Pressable accessibilityRole="button" accessibilityLabel={item.label} style={styles.navItem}>
                <View style={[styles.iconWrap, active && styles.iconActive]}>
                  <Text style={[styles.icon, active && styles.iconActiveText]}>{item.icon}</Text>
                </View>
                <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  body: { flex: 1 },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 70,
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 6,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap: { minWidth: 42, minHeight: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  iconActive: { backgroundColor: colors.accentSoft },
  icon: { fontSize: 21, color: colors.muted },
  iconActiveText: { color: colors.accent, fontWeight: '800' },
  label: { fontSize: 10, color: colors.faint, fontWeight: '600' },
  labelActive: { color: colors.ink, fontWeight: '800' },
});
