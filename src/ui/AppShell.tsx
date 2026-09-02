import { ReactNode } from 'react';
import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, elevation, radius, spacing, type } from './theme';

const items = [
  { href: '/', glyph: '◌', label: 'Home' },
  { href: '/search', glyph: '⌕', label: 'Explore' },
  { href: '/reels', glyph: '✦', label: 'Create' },
  { href: '/messages', glyph: '↗', label: 'Connect' },
  { href: '/profile', glyph: '○', label: 'You' },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.body}>{children}</View>
      <View style={styles.nav} accessibilityRole="tablist">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));
          return (
            <Link key={item.href} href={item.href} asChild>
              <Pressable
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [styles.navItem, pressed && styles.navPressed]}
              >
                <View style={[styles.iconWrap, active && styles.iconActive]}>
                  <Text style={[styles.icon, active && styles.iconActiveText]}>{item.glyph}</Text>
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
    minHeight: 78,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    ...elevation.low,
  },
  navItem: {
    flex: 1,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radius.lg,
  },
  navPressed: { opacity: 0.72 },
  iconWrap: {
    width: 46,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: { backgroundColor: colors.brandSoft },
  icon: { fontSize: 22, lineHeight: 24, color: colors.muted, fontWeight: '600' },
  iconActiveText: { color: colors.brand, fontWeight: '800' },
  label: { fontSize: type.labelSM, color: colors.faint, fontWeight: '600' },
  labelActive: { color: colors.ink, fontWeight: '800' },
});
