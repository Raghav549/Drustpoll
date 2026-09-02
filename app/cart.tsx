import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { colors, elevation, radius, spacing, type } from '../src/ui/theme';
import { addCartItem, getCart } from '../src/api/client';

type CartData = Awaited<ReturnType<typeof getCart>>;
type CartItem = { id?: string; productId?: string; quantity: number; unitPriceMinor: number; title?: string; currency: string; inventory?: number };

export default function Cart() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCart(await getCart()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load cart'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const items = (((cart as any)?.items ?? []) as CartItem[]);
  const total = items.reduce((sum, x) => sum + Number(x.unitPriceMinor || 0) * Number(x.quantity || 0), 0);

  const change = async (item: CartItem, delta: number) => {
    const productId = item.productId;
    if (!productId || busy) return;
    const next = Math.max(0, item.quantity + delta);
    setBusy(productId); setError(null);
    try {
      if (next === 0) {
        const res = await fetchCartAbsolute(productId, 0);
        setCart(res);
      } else {
        const res = await fetchCartAbsolute(productId, next);
        setCart(res);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update cart'); }
    finally { setBusy(null); }
  };

  async function fetchCartAbsolute(productId: string, quantity: number) {
    if (quantity === 0) throw new Error('Removing the final item is not yet available');
    return await addCartItem(productId, quantity);
  }

  return <AppShell><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>MARKET</Text><Text style={styles.title}>Your cart</Text>
    {loading && !cart ? <View style={styles.center}><ActivityIndicator/><Text style={styles.muted}>Loading your cart…</Text></View>
    : error ? <View style={styles.alert} accessibilityRole="alert"><Text style={styles.alertTitle}>Cart needs attention</Text><Text style={styles.alertBody}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()} style={styles.secondary}><Text style={styles.secondaryText}>Try again</Text></Pressable></View>
    : !items.length ? <View style={styles.empty}><Text style={styles.icon}>◇</Text><Text style={styles.emptyTitle}>Nothing here yet.</Text><Text style={styles.emptyBody}>Add products explicitly from a shop. Social actions never create a purchase.</Text><Link href="/shop" asChild><Pressable accessibilityRole="button" style={styles.button}><Text style={styles.buttonText}>Continue shopping</Text></Pressable></Link></View>
    : <>
      {items.map((item, i) => <View key={item.id ?? item.productId ?? String(i)} style={styles.item}>
        <View style={styles.copy}><Text style={styles.itemTitle}>{item.title ?? 'Product'}</Text><Text style={styles.price}>{(Number(item.unitPriceMinor || 0) / 100).toFixed(2)} {item.currency}</Text>{typeof item.inventory === 'number' && item.quantity >= item.inventory ? <Text style={styles.limit}>Maximum available quantity reached.</Text> : null}</View>
        <View style={styles.stepper}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${item.title ?? 'product'} quantity`} accessibilityState={{ disabled: busy === item.productId }} disabled={busy === item.productId} onPress={() => void change(item, -1)} style={styles.step}><Text style={styles.stepText}>−</Text></Pressable>
          <Text accessibilityLabel={`Quantity ${item.quantity}`} style={styles.qty}>{item.quantity}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${item.title ?? 'product'} quantity`} accessibilityState={{ disabled: busy === item.productId || (typeof item.inventory === 'number' && item.quantity >= item.inventory) }} disabled={busy === item.productId || (typeof item.inventory === 'number' && item.quantity >= item.inventory)} onPress={() => void change(item, 1)} style={styles.step}><Text style={styles.stepText}>+</Text></Pressable>
        </View>
      </View>)}
      <View style={styles.summary}><Text style={styles.summaryLabel}>Total</Text><Text style={styles.total}>{(total / 100).toFixed(2)} {items[0]?.currency ?? ''}</Text><Link href="/checkout" asChild><Pressable accessibilityRole="button" style={styles.checkout}><Text style={styles.buttonText}>Review checkout</Text></Pressable></Link></View>
    </>}
    <View style={styles.security}><Text style={styles.securityKicker}>TRUST BY DESIGN</Text><Text style={styles.securityTitle}>Checkout stays explicit.</Text><Text style={styles.securityBody}>Prices and inventory are revalidated by the server when an order is created. This screen never claims payment success.</Text></View>
  </ScrollView></AppShell>;
}

const styles = StyleSheet.create({content:{padding:spacing.xl,gap:spacing.lg,maxWidth:760,width:'100%',alignSelf:'center'},kicker:{fontSize:type.labelSM,fontWeight:'800',letterSpacing:1.8,color:colors.commerce},title:{fontSize:type.displayLG,fontWeight:'800',color:colors.ink},center:{minHeight:180,justifyContent:'center',alignItems:'center',gap:8},muted:{color:colors.muted},alert:{backgroundColor:colors.dangerSoft,borderColor:colors.danger,borderWidth:1,borderRadius:radius.lg,padding:spacing.lg},alertTitle:{fontWeight:'800',color:colors.danger},alertBody:{color:colors.inkSoft,marginTop:5,lineHeight:20},secondary:{marginTop:12,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,padding:12,alignSelf:'flex-start'},secondaryText:{color:colors.ink,fontWeight:'800'},empty:{backgroundColor:colors.surface,borderRadius:radius.hero,minHeight:300,alignItems:'center',justifyContent:'center',padding:spacing.xxl,borderWidth:1,borderColor:colors.line,...elevation.low},icon:{fontSize:42,color:colors.commerce},emptyTitle:{fontSize:type.titleLG,fontWeight:'800',color:colors.ink,marginTop:12},emptyBody:{textAlign:'center',color:colors.muted,lineHeight:21,marginTop:6,maxWidth:340,fontSize:type.bodySM},button:{marginTop:18,backgroundColor:colors.commerce,borderRadius:radius.md,paddingHorizontal:18,paddingVertical:12,minHeight:44,alignItems:'center',justifyContent:'center'},buttonText:{color:colors.white,fontWeight:'800'},item:{backgroundColor:colors.surface,borderRadius:radius.lg,borderWidth:1,borderColor:colors.line,padding:spacing.lg,flexDirection:'row',alignItems:'center',gap:spacing.md},copy:{flex:1},itemTitle:{fontSize:type.titleMD,fontWeight:'800',color:colors.ink},price:{fontSize:type.bodySM,color:colors.muted,marginTop:5},limit:{fontSize:type.labelSM,color:colors.warning,fontWeight:'700',marginTop:5},stepper:{flexDirection:'row',alignItems:'center',gap:10},step:{width:44,height:44,borderRadius:radius.pill,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},stepText:{fontSize:22,color:colors.ink},qty:{minWidth:24,textAlign:'center',fontWeight:'800',color:colors.ink},summary:{backgroundColor:colors.surfaceStrong,borderRadius:radius.lg,padding:spacing.xl,borderWidth:1,borderColor:colors.line},summaryLabel:{color:colors.muted,fontSize:type.bodySM},total:{fontSize:type.titleXL,fontWeight:'800',color:colors.ink,marginTop:4},checkout:{marginTop:14,backgroundColor:colors.commerce,borderRadius:radius.md,minHeight:48,alignItems:'center',justifyContent:'center'},security:{backgroundColor:colors.successSoft,borderRadius:radius.lg,padding:spacing.xl,borderWidth:1,borderColor:'#CFE9D9'},securityKicker:{fontSize:type.labelSM,fontWeight:'800',letterSpacing:1.6,color:colors.success},securityTitle:{fontSize:type.titleMD,fontWeight:'800',color:colors.ink,marginTop:4},securityBody:{color:colors.inkSoft,lineHeight:21,marginTop:6,fontSize:type.bodySM}});