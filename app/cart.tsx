import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppShell } from '../src/ui/AppShell';
import { getCart, getSavedForLater, setSavedForLater, updateCartItem } from '../src/api/client';
import { Icon } from '../src/ui/icons';
import { colors, elevation, radius, spacing, type } from '../src/ui/theme';

type CartData = Awaited<ReturnType<typeof getCart>>;
type CartItem = CartData['items'][number];

type SavedItem = {
  product_id: string;
  variant_id?: string;
  quantity: number;
  title?: string;
  price_minor?: number;
  currency?: string;
  media_key?: string;
};

const itemKey = (item: { productId?: string; variantId?: string | null }) =>
  `${item.productId ?? ''}:${item.variantId ?? 'base'}`;

export default function Cart() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [remoteCart, remoteSaved] = await Promise.all([getCart(), getSavedForLater()]);
      setCart(remoteCart);
      setSaved((remoteSaved.items ?? []) as SavedItem[]);
      setOffline(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load cart');
      try {
        const snapshot = await AsyncStorage.getItem('drustpoll.cart.snapshot');
        if (snapshot) setCart(JSON.parse(snapshot) as CartData);
        setOffline(Boolean(snapshot));
      } catch {
        setOffline(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (cart) void AsyncStorage.setItem('drustpoll.cart.snapshot', JSON.stringify(cart));
  }, [cart]);

  const items = cart?.items ?? [];
  const currency = items[0]?.currency ?? '';
  const mixedCurrency = items.some((item) => item.currency !== currency);
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            (item as any).currentUnitPriceMinor ??
              (item as any).unitPriceMinor ??
              (item as any).priceMinor ??
              0,
          ) * Number(item.quantity ?? 0),
        0,
      ),
    [items],
  );

  const changeQuantity = async (item: CartItem, delta: number) => {
    const key = itemKey(item as any);
    if (busy) return;
    const next = Math.max(0, Number(item.quantity) + delta);
    setBusy(key);
    setError(null);
    try {
      const nextCart = await updateCartItem(item.productId, next, (item as any).variantId ?? undefined);
      setCart(nextCart);
      setOffline(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update quantity');
    } finally {
      setBusy(null);
    }
  };

  const saveLater = async (item: CartItem) => {
    if (busy) return;
    const key = itemKey(item as any);
    setBusy(key);
    setError(null);
    try {
      await setSavedForLater(item.productId, Number(item.quantity), true);
      const nextCart = await updateCartItem(item.productId, 0, (item as any).variantId ?? undefined);
      setCart(nextCart);
      setSaved((current) => [
        ...current.filter((x) => x.product_id !== item.productId),
        {
          product_id: item.productId,
          variant_id: (item as any).variantId,
          quantity: Number(item.quantity),
          title: item.title,
          price_minor: Number(
            (item as any).currentUnitPriceMinor ?? (item as any).unitPriceMinor ?? (item as any).priceMinor ?? 0,
          ),
          currency: item.currency,
          media_key: (item as any).mediaKey,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save item for later');
    } finally {
      setBusy(null);
    }
  };

  const restore = async (item: SavedItem) => {
    if (busy) return;
    setBusy(`${item.product_id}:${item.variant_id ?? 'base'}`);
    setError(null);
    try {
      await updateCartItem(item.product_id, Math.max(1, Number(item.quantity) || 1), item.variant_id);
      await setSavedForLater(item.product_id, Number(item.quantity) || 1, false);
      setSaved((current) => current.filter((x) => x.product_id !== item.product_id));
      const nextCart = await getCart();
      setCart(nextCart);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not move item to cart');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.kicker}>MARKET · CART</Text>
            <Text style={styles.title}>Your cart</Text>
            <Text style={styles.subtitle}>
              Review stock, price changes and saved items before making a purchase.
            </Text>
          </View>
          <Link href="/shop" asChild>
            <Pressable style={styles.market} accessibilityRole="button">
              <Icon name="shop" size={18} color={colors.white} />
              <Text style={styles.marketText}>Market</Text>
            </Pressable>
          </Link>
        </View>

        {offline ? (
          <View style={styles.notice}>
            <Icon name="archive" size={19} color={colors.info} />
            <View style={styles.flex}>
              <Text style={styles.noticeTitle}>Recovery mode</Text>
              <Text style={styles.noticeBody}>
                The last known cart is visible. Server mutations remain unavailable until connection returns.
              </Text>
            </View>
          </View>
        ) : null}

        {loading && !cart ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Loading your cart…</Text>
          </View>
        ) : error && !cart ? (
          <View style={styles.alert} accessibilityRole="alert">
            <Icon name="circleAlert" size={21} color={colors.danger} />
            <Text style={styles.alertText}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retry} accessibilityRole="button">
              <Icon name="refresh" size={17} color={colors.danger} />
            </Pressable>
          </View>
        ) : !items.length ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="cart" size={34} color={colors.commerce} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is clear.</Text>
            <Text style={styles.emptyBody}>Saved products stay separate until you explicitly move them here.</Text>
            <Link href="/shop" asChild>
              <Pressable style={styles.primary} accessibilityRole="button">
                <Icon name="search" size={17} color={colors.white} />
                <Text style={styles.primaryText}>Continue shopping</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <>
            {items.map((item, index) => {
              const raw = item as any;
              const currentPrice = Number(raw.currentUnitPriceMinor ?? raw.unitPriceMinor ?? raw.priceMinor ?? 0);
              const originalPrice = Number(raw.unitPriceMinor ?? currentPrice);
              const inventory = Number(raw.inventory ?? 0);
              const unavailable = raw.status === 'unavailable' || inventory <= 0;
              const priceChanged = Boolean(raw.priceChanged) || originalPrice !== currentPrice;
              const key = itemKey(raw) || String(index);
              const atInventoryLimit = inventory > 0 && Number(item.quantity) >= inventory;

              return (
                <View key={key} style={styles.item}>
                  <View style={styles.thumb}>
                    {raw.mediaKey ? (
                      <Image source={{ uri: String(raw.mediaKey) }} style={styles.image} />
                    ) : (
                      <Icon name={unavailable ? 'circleAlert' : 'package'} size={21} color={unavailable ? colors.danger : colors.commerce} />
                    )}
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.itemTitle}>{item.title || 'Product'}</Text>
                    {raw.variantName ? <Text style={styles.variant}>Variant · {raw.variantName}</Text> : null}
                    <Text style={styles.price}>{(currentPrice / 100).toFixed(2)} {item.currency}</Text>
                    {priceChanged ? <Text style={styles.changed}>Price changed since it was added.</Text> : null}
                    {unavailable ? <Text style={styles.unavailable}>Currently unavailable.</Text> : null}
                    {!unavailable && atInventoryLimit ? <Text style={styles.limit}>Only {inventory} available.</Text> : null}
                    <Pressable onPress={() => void saveLater(item)} disabled={busy === key} style={styles.inline} accessibilityRole="button">
                      <Icon name="bookmark" size={15} color={colors.brand} />
                      <Text style={styles.inlineText}>Save for later</Text>
                    </Pressable>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => void changeQuantity(item, -1)} disabled={busy === key} style={styles.step} accessibilityLabel={`Decrease ${item.title || 'item'} quantity`}>
                      <Icon name="minus" size={17} color={colors.ink} />
                    </Pressable>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <Pressable onPress={() => void changeQuantity(item, 1)} disabled={busy === key || unavailable || atInventoryLimit} style={styles.step} accessibilityLabel={`Increase ${item.title || 'item'} quantity`}>
                      <Icon name="plus" size={17} color={colors.ink} />
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <View style={styles.summary}>
              <View style={styles.summaryHead}>
                <Text style={styles.summaryLabel}>Estimated subtotal</Text>
                <Icon name="receipt" size={19} color={colors.commerce} />
              </View>
              <Text style={styles.total}>{(subtotal / 100).toFixed(2)} {mixedCurrency ? '' : currency}</Text>
              {mixedCurrency ? (
                <View style={styles.warning}>
                  <Icon name="circleAlert" size={17} color={colors.warning} />
                  <Text style={styles.warningText}>Multiple currencies need separate order groups before checkout.</Text>
                </View>
              ) : null}
              {error ? <Text style={styles.errorInline}>{error}</Text> : null}
              <Text style={styles.revalidate}>
                The server revalidates current price, inventory, delivery and payment eligibility before commitment.
              </Text>
              <Link href="/checkout" asChild>
                <Pressable disabled={mixedCurrency || offline} style={[styles.checkout, (mixedCurrency || offline) && styles.disabled]} accessibilityRole="button">
                  <Icon name="lock" size={18} color={colors.white} />
                  <Text style={styles.primaryText}>{offline ? 'Reconnect to checkout' : mixedCurrency ? 'Resolve currencies' : 'Continue to checkout'}</Text>
                </Pressable>
              </Link>
            </View>
          </>
        )}

        {saved.length ? (
          <View style={styles.saved}>
            <View style={styles.summaryHead}>
              <Text style={styles.sectionTitle}>Saved for later</Text>
              <Icon name="bookmark" size={18} color={colors.brand} />
            </View>
            {saved.map((item) => {
              const key = `${item.product_id}:${item.variant_id ?? 'base'}`;
              return (
                <View key={key} style={styles.savedRow}>
                  <View style={styles.flex}>
                    <Text style={styles.itemTitle}>{item.title || 'Saved product'}</Text>
                    <Text style={styles.price}>{(Number(item.price_minor ?? 0) / 100).toFixed(2)} {item.currency ?? ''}</Text>
                  </View>
                  <Pressable onPress={() => void restore(item)} disabled={busy === key} style={styles.restore} accessibilityRole="button">
                    <Icon name="cart" size={16} color={colors.brand} />
                    <Text style={styles.restoreText}>Move to cart</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.trust}>
          <Icon name="shield" size={21} color={colors.success} />
          <View style={styles.flex}>
            <Text style={styles.trustKicker}>TRUST BY DESIGN</Text>
            <Text style={styles.trustTitle}>Nothing is silently purchased.</Text>
            <Text style={styles.trustBody}>Cart edits are explicit; checkout and payment remain server-authoritative states.</Text>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg, maxWidth: 900, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  kicker: { fontSize: type.labelSM, fontWeight: '900', letterSpacing: 1.8, color: colors.commerce },
  title: { fontSize: type.displayLG, fontWeight: '900', color: colors.ink },
  subtitle: { fontSize: type.bodyMD, color: colors.muted, lineHeight: 22, maxWidth: 650 },
  market: { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  marketText: { color: colors.white, fontWeight: '900' },
  notice: { padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: '#D5E6F5', backgroundColor: colors.infoSoft, flexDirection: 'row', gap: 10 },
  noticeTitle: { fontWeight: '900', color: colors.info },
  noticeBody: { fontSize: type.bodySM, color: colors.inkSoft, lineHeight: 20, marginTop: 4 },
  center: { minHeight: 220, justifyContent: 'center', alignItems: 'center', gap: 8 },
  muted: { color: colors.muted },
  alert: { padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertText: { flex: 1, color: colors.danger, lineHeight: 20 },
  retry: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 320, padding: spacing.xxl, backgroundColor: colors.surface, borderRadius: radius.hero, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...elevation.low },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.commerceSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: type.titleLG, fontWeight: '900', color: colors.ink, marginTop: 12 },
  emptyBody: { fontSize: type.bodySM, color: colors.muted, textAlign: 'center', lineHeight: 21, maxWidth: 430, marginTop: 5 },
  primary: { marginTop: 18, minHeight: 48, paddingHorizontal: 18, borderRadius: radius.lg, backgroundColor: colors.commerce, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryText: { color: colors.white, fontWeight: '900' },
  item: { padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 60, height: 60, borderRadius: 16, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  itemTitle: { fontSize: type.titleMD, fontWeight: '800', color: colors.ink },
  variant: { fontSize: type.labelSM, color: colors.brand, fontWeight: '700', marginTop: 3 },
  price: { fontSize: type.bodySM, color: colors.muted, marginTop: 4 },
  changed: { fontSize: type.labelSM, color: colors.warning, lineHeight: 18, marginTop: 5 },
  unavailable: { fontSize: type.labelSM, color: colors.danger, fontWeight: '800', marginTop: 5 },
  limit: { fontSize: type.labelSM, color: colors.warning, fontWeight: '800', marginTop: 5 },
  inline: { alignSelf: 'flex-start', marginTop: 8, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 5 },
  inlineText: { fontSize: type.labelSM, fontWeight: '800', color: colors.brand },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  qty: { minWidth: 22, textAlign: 'center', fontWeight: '900', color: colors.ink },
  summary: { padding: spacing.xl, borderRadius: radius.xl, backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.line },
  summaryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  summaryLabel: { fontSize: type.bodySM, color: colors.muted },
  total: { fontSize: type.titleXL, fontWeight: '900', color: colors.ink, marginTop: 4 },
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 8 },
  warningText: { fontSize: type.bodySM, color: colors.warning, lineHeight: 20, flex: 1 },
  errorInline: { marginTop: 8, color: colors.danger, fontSize: type.bodySM },
  revalidate: { fontSize: type.labelSM, color: colors.muted, lineHeight: 19, marginTop: 9 },
  checkout: { marginTop: 15, minHeight: 52, borderRadius: radius.lg, backgroundColor: colors.commerce, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  disabled: { opacity: 0.45 },
  saved: { gap: 10, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  sectionTitle: { fontSize: type.titleMD, fontWeight: '900', color: colors.ink },
  savedRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 10 },
  restore: { minHeight: 42, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  restoreText: { fontWeight: '800', color: colors.brand },
  trust: { padding: spacing.xl, borderRadius: radius.xl, backgroundColor: colors.successSoft, borderWidth: 1, borderColor: '#CFE9D9', flexDirection: 'row', gap: 10 },
  trustKicker: { fontSize: type.labelSM, fontWeight: '900', letterSpacing: 1.6, color: colors.success },
  trustTitle: { fontSize: type.titleMD, fontWeight: '900', color: colors.ink, marginTop: 4 },
  trustBody: { fontSize: type.bodySM, color: colors.inkSoft, lineHeight: 21, marginTop: 5 },
});
