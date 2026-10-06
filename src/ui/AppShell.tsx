import { ReactNode } from 'react';
import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from './BrandMark';
import { colors, elevation, radius, type } from './theme';
import { useResponsiveLayout } from './responsive';
import { Icon, type IconName } from './icons';
import { useI18n } from '../i18n/provider';

type NavKey = 'home' | 'explore' | 'createNav' | 'connect' | 'market' | 'you';
type NavItem = { href: string; icon: IconName; key: NavKey; routes: string[] };

const items: NavItem[] = [
  { href: '/', icon: 'home', key: 'home', routes: ['/'] },
  { href: '/discovery', icon: 'search', key: 'explore', routes: ['/search', '/discovery', '/reels'] },
  { href: '/create', icon: 'create', key: 'createNav', routes: ['/create'] },
  { href: '/messages', icon: 'connect', key: 'connect', routes: ['/messages', '/conversation', '/new-message'] },
  { href: '/shop', icon: 'shop', key: 'market', routes: ['/shop', '/product', '/cart', '/checkout', '/checkout-screen', '/orders', '/order', '/seller', '/seller-settings', '/saved-products'] },
  { href: '/profile', icon: 'profile', key: 'you', routes: ['/profile', '/profile-view', '/profile-list', '/collection', '/settings', '/settings-control', '/account-controls', '/privacy', '/security', '/safety', '/language', '/accessibility', '/ads', '/professional', '/business-verification'] },
];

const utilityItems: Array<{ href: string; key: 'notifications' | 'settings'; icon: IconName; routes: string[] }> = [
  { href: '/notifications', key: 'notifications', icon: 'bell', routes: ['/notifications'] },
  { href: '/settings', key: 'settings', icon: 'settings', routes: ['/settings'] },
];

function routeMatches(pathname: string, route: string) {
  return route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isDesktop, isTablet } = useResponsiveLayout();
  const { t } = useI18n();
  const useRail = isDesktop || isTablet;
  const compactRail = isTablet && !isDesktop;
  const activeFor = (item: NavItem) => item.routes.some(route => routeMatches(pathname, route));
  const activeUtility = (routes: string[]) => routes.some(route => routeMatches(pathname, route));

  if (useRail) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.desktopBody}>
          <View
            style={[styles.rail, compactRail && styles.railCompact]}
            accessibilityLabel="Drustpoll primary navigation"
          >
            <Link href="/" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel="Drustpoll home" style={[styles.brandLockup, compactRail && styles.brandLockupCompact]}>
                <BrandMark size={compactRail ? 38 : 42} />
                {!compactRail ? (
                  <View>
                    <Text style={styles.brandWord}>drustpoll</Text>
                    <Text style={styles.brandSub}>A more human social space</Text>
                  </View>
                ) : null}
              </Pressable>
            </Link>

            <View style={[styles.railItems, compactRail && styles.railItemsCompact]}>
              {items.map(item => {
                const active = activeFor(item);
                const label = t(item.key);
                const isCreate = item.key === 'createNav';
                return (
                  <Link key={item.href} href={item.href as any} asChild>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={label}
                      accessibilityState={{ selected: active }}
                      style={({ pressed }) => [
                        styles.railItem,
                        compactRail && styles.railItemCompact,
                        active && styles.railActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={[
                        styles.railIcon,
                        active && styles.railIconActive,
                        isCreate && styles.railCreateIcon,
                      ]}>
                        <Icon name={item.icon} size={20} color={isCreate ? colors.white : active ? colors.brand : colors.muted} />
                      </View>
                      {!compactRail ? (
                        <View style={styles.railLabelWrap}>
                          <Text style={[styles.railLabel, active && styles.labelActive]}>{label}</Text>
                          {active ? <View style={styles.railMark} /> : null}
                        </View>
                      ) : null}
                    </Pressable>
                  </Link>
                );
              })}
            </View>

            <View style={[styles.railFoot, compactRail && styles.railFootCompact]}>
              <View style={styles.footRule} />
              {utilityItems.map(item => {
                const active = activeUtility(item.routes);
                const label = t(item.key);
                return (
                  <Link key={item.href} href={item.href as any} asChild>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={label}
                      accessibilityState={{ selected: active }}
                      style={({ pressed }) => [
                        styles.utilityItem,
                        compactRail && styles.utilityItemCompact,
                        active && styles.utilityActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Icon name={item.icon} size={18} color={active ? colors.brand : colors.muted} />
                      {!compactRail ? <Text style={[styles.utilityLabel, active && styles.labelActive]}>{label}</Text> : null}
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          </View>
          <View style={styles.desktopContent}>{children}</View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.body}>{children}</View>
      <View style={styles.dock} accessibilityRole="tablist" accessibilityLabel="Drustpoll primary navigation">
        <View style={styles.dockInner}>
          {items.map(item => {
            const active = activeFor(item);
            const label = t(item.key);
            const isCreate = item.key === 'createNav';
            return (
              <Link key={item.href} href={item.href as any} asChild>
                <Pressable
                  accessibilityRole="tab"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [styles.dockItem, pressed && styles.pressed]}
                >
                  <View style={[
                    styles.dockIcon,
                    isCreate && styles.createIcon,
                    active && !isCreate && styles.dockIconActive,
                  ]}>
                    <Icon name={item.icon} size={isCreate ? 22 : 19} color={isCreate ? colors.white : active ? colors.brand : colors.muted} />
                    {active && !isCreate ? <View style={styles.activeTick} /> : null}
                  </View>
                  <Text numberOfLines={1} style={[styles.dockLabel, active && styles.dockLabelActive, isCreate && styles.createLabel]}>
                    {label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  body: { flex: 1, paddingBottom: 90 },
  desktopBody: { flex: 1, flexDirection: 'row', minHeight: 0 },
  desktopContent: { flex: 1, minWidth: 0, minHeight: 0 },
  rail: {
    width: 224,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: colors.canvas,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  railCompact: { width: 76, alignItems: 'center', paddingHorizontal: 9 },
  brandLockup: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 4 },
  brandLockupCompact: { justifyContent: 'center', paddingHorizontal: 0 },
  brandWord: { fontSize: 15, fontWeight: '800', letterSpacing: -0.4, color: colors.ink },
  brandSub: { fontSize: 10, color: colors.muted, marginTop: 2 },
  railItems: { width: '100%', gap: 4, marginTop: 30 },
  railItemsCompact: { alignItems: 'center', marginTop: 24 },
  railItem: { minHeight: 52, borderRadius: radius.md, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  railItemCompact: { width: 54, minHeight: 54, justifyContent: 'center', paddingHorizontal: 0 },
  railActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...elevation.low },
  railIcon: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  railIconActive: { backgroundColor: colors.brandSoft },
  railCreateIcon: { backgroundColor: colors.brand },
  railLabelWrap: { flex: 1, minWidth: 0, gap: 3 },
  railLabel: { fontSize: type.bodySM, color: colors.muted, fontWeight: '700' },
  labelActive: { color: colors.ink, fontWeight: '800' },
  railMark: { height: 2, width: 18, borderRadius: 2, backgroundColor: colors.accent },
  railFoot: { width: '100%', marginTop: 'auto', gap: 4 },
  railFootCompact: { alignItems: 'center' },
  footRule: { height: 1, backgroundColor: colors.line, marginBottom: 6 },
  utilityItem: { minHeight: 42, paddingHorizontal: 10, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', gap: 10 },
  utilityItemCompact: { width: 54, justifyContent: 'center', paddingHorizontal: 0 },
  utilityActive: { backgroundColor: colors.brandSoft },
  utilityLabel: { fontSize: type.labelMD, color: colors.muted, fontWeight: '700' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  dock: { position: 'absolute', left: 8, right: 8, bottom: 8, alignItems: 'center' },
  dockInner: {
    width: '100%',
    maxWidth: 560,
    minHeight: 70,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 19,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.medium,
  },
  dockItem: { flex: 1, minWidth: 0, minHeight: 62, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dockIcon: { width: 38, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dockIconActive: { backgroundColor: colors.brandSoft },
  activeTick: { position: 'absolute', bottom: -2, width: 13, height: 2, borderRadius: 2, backgroundColor: colors.brand },
  createIcon: { width: 40, height: 38, borderRadius: 13, backgroundColor: colors.brand },
  dockLabel: { maxWidth: '100%', fontSize: 9, color: colors.muted, fontWeight: '700', letterSpacing: -0.1 },
  dockLabelActive: { color: colors.ink, fontWeight: '800' },
  createLabel: { color: colors.brand, fontWeight: '800' },
});
