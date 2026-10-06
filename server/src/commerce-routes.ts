import type { IncomingMessage } from 'node:http';
import { getCart, addCartItem, updateCartItem, listSellerProducts, createProduct } from './commerce-service.js';
import { getCheckoutState, prepareCheckout, setCheckoutAddress, setCheckoutDelivery, setCheckoutPaymentMethod, finalizeCheckout } from './checkout-service.js';
import { listBuyerOrders, getBuyerOrder, cancelPendingOrder } from './order-service.js';
import {
  listMarketCategories,
  listMarketProducts,
  getMarketProductDetail,
  setProductWishlist,
  getSavedProducts,
  relatedProducts,
  createProductReview,
  askProductQuestion,
  openOrderSupport,
  listAddresses,
  saveAddress,
  deleteAddress,
  getDeliveryEstimate,
  requestReturn,
  listReturns,
  setShippingProfile,
  createVariant,
  updateVariant,
  deleteVariant,
  setStorefrontMetadata,
  getShopDiscovery,
  listShopCollections,
  addCollection,
} from './market-surface-service.js';
import { recordCommerceEvent, getRecommendedProducts } from './commerce-recommendation-service.js';
import { originFor, mediaUri } from './storage-service.js';

const json = (res: any, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};
const body = async (req: IncomingMessage) => {
  let raw = '';
  for await (const c of req) {
    raw += c;
    if (Buffer.byteLength(raw) > 300000) throw new Error('Request too large');
  }
  return raw ? JSON.parse(raw) : {};
};
const str = (v: unknown) => String(v ?? '').trim();

/** Attach signed media URIs to product media rows (storage_key based). */
async function hydrateProductMedia(rows: Array<Record<string, unknown>>, origin: string) {
  for (const row of rows) {
    const key = typeof row.storage_key === 'string' ? row.storage_key : typeof row.mediaKey === 'string' ? (row.mediaKey as string) : null;
    if (!key) continue;
    const uri = await mediaUri(key, origin);
    if (uri) row.uri = uri;
  }
  return rows;
}

/**
 * Commerce routes: cart, checkout state machine, buyer orders, market discovery,
 * product detail, wishlist, reviews/Q&A, addresses, returns/support and seller studio.
 * All payment/order state transitions stay server-authoritative (see checkout-service).
 */
export async function handleCommerceRoute(req: IncomingMessage, res: any, userId: string, path: string, url: URL) {
  const origin = originFor(req.headers.host);
  const method = req.method ?? 'GET';

  // ---- Cart --------------------------------------------------------------
  if (path === '/v1/cart' && method === 'GET') return json(res, 200, await getCart(userId));
  if (path === '/v1/cart/items') {
    const i = await body(req);
    const productId = str(i.productId);
    const quantity = Number(i.quantity ?? 1);
    const variantId = i.variantId ? str(i.variantId) : undefined;
    if (!productId) return json(res, 400, { error: 'productId is required' });
    if (method === 'POST') return json(res, 200, await addCartItem(userId, productId, quantity, variantId));
    if (method === 'PATCH') return json(res, 200, await updateCartItem(userId, productId, quantity, variantId));
    if (method === 'DELETE') return json(res, 200, await updateCartItem(userId, productId, 0, variantId));
  }

  // ---- Checkout ----------------------------------------------------------
  if (path === '/v1/checkout/prepare' && method === 'POST') {
    const i = await body(req);
    const checkout = await prepareCheckout(userId, str(i.idempotencyKey));
    return json(res, 201, { checkout });
  }
  if (path === '/v1/checkout/state' && method === 'GET') {
    const checkout = await getCheckoutState(userId, url.searchParams.get('key') ?? '');
    return json(res, 200, { checkout });
  }
  let m = path.match(/^\/v1\/checkout\/([^/]+)\/(address|delivery|payment-method|finalize)$/);
  if (m) {
    const [, sessionId, step] = m;
    if (step === 'address' && method === 'PUT') {
      const i = await body(req);
      return json(res, 200, { checkout: await setCheckoutAddress(userId, sessionId, str(i.addressId)) });
    }
    if (step === 'delivery' && method === 'PUT') {
      const i = await body(req);
      return json(res, 200, {
        checkout: await setCheckoutDelivery(userId, sessionId, str(i.code), Number(i.feeMinor ?? 0), i.minDays == null ? undefined : Number(i.minDays), i.maxDays == null ? undefined : Number(i.maxDays)),
      });
    }
    if (step === 'payment-method' && method === 'PUT') {
      const i = await body(req);
      return json(res, 200, { checkout: await setCheckoutPaymentMethod(userId, sessionId, str(i.method)) });
    }
    if (step === 'finalize' && method === 'POST') {
      return json(res, 201, await finalizeCheckout(userId, sessionId));
    }
  }

  // ---- Buyer orders ------------------------------------------------------
  if (path === '/v1/orders' && method === 'GET') {
    const limit = Number(url.searchParams.get('limit') ?? 30);
    const before = url.searchParams.get('before') ?? undefined;
    return json(res, 200, await listBuyerOrders(userId, Number.isFinite(limit) ? limit : 30, before));
  }
  m = path.match(/^\/v1\/orders\/([^/]+)$/);
  if (m && method === 'GET') return json(res, 200, { order: await getBuyerOrder(userId, m[1]) });
  m = path.match(/^\/v1\/orders\/([^/]+)\/cancel$/);
  if (m && method === 'POST') return json(res, 200, await cancelPendingOrder(userId, m[1]));

  // ---- Market ------------------------------------------------------------
  if (path === '/v1/market/categories' && method === 'GET') {
    const rows = await listMarketCategories();
    return json(res, 200, {
      categories: rows.map((r: any) => ({
        id: String(r.category ?? 'uncategorized').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'uncategorized',
        slug: String(r.category ?? 'uncategorized'),
        name: String(r.category ?? 'Uncategorized'),
        count: Number(r.count ?? 0),
        following: false,
      })),
    });
  }
  if (path === '/v1/market/products' && method === 'GET') {
    const page = await listMarketProducts(userId, url.searchParams);
    await hydrateProductMedia((page.items ?? []) as any, origin);
    return json(res, 200, page);
  }
  if (path === '/v1/market/saved-products' && method === 'GET') {
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const before = url.searchParams.get('before') ?? undefined;
    return json(res, 200, await getSavedProducts(userId, Number.isFinite(limit) ? limit : 50, before));
  }
  if (path === '/v1/market/addresses') {
    if (method === 'GET') return json(res, 200, { addresses: await listAddresses(userId) });
    if (method === 'POST') {
      const i = await body(req);
      return json(res, 201, { address: await saveAddress(userId, i) });
    }
  }
  m = path.match(/^\/v1\/market\/addresses\/([^/]+)$/);
  if (m && method === 'DELETE') return json(res, 200, await deleteAddress(userId, m[1]));

  m = path.match(/^\/v1\/market\/products\/([^/]+)$/);
  if (m && method === 'GET') {
    const detail = await getMarketProductDetail(userId, m[1]);
    if (!detail) return json(res, 404, { error: 'Product not found' });
    await hydrateProductMedia(detail.media as any, origin);
    const related = await relatedProducts(userId, m[1], 8).catch(() => []);
    return json(res, 200, { ...detail, related });
  }
  m = path.match(/^\/v1\/market\/products\/([^/]+)\/wishlist$/);
  if (m && (method === 'POST' || method === 'DELETE')) return json(res, 200, await setProductWishlist(userId, m[1], method === 'POST'));
  m = path.match(/^\/v1\/market\/products\/([^/]+)\/related$/);
  if (m && method === 'GET') {
    const limit = Number(url.searchParams.get('limit') ?? 12);
    const items = await relatedProducts(userId, m[1], Number.isFinite(limit) ? limit : 12);
    await hydrateProductMedia(items as any, origin);
    return json(res, 200, { items });
  }
  m = path.match(/^\/v1\/market\/products\/([^/]+)\/reviews$/);
  if (m && method === 'POST') {
    const i = await body(req);
    return json(res, 201, await createProductReview(userId, m[1], i));
  }
  m = path.match(/^\/v1\/market\/products\/([^/]+)\/questions$/);
  if (m && method === 'POST') {
    const i = await body(req);
    return json(res, 201, await askProductQuestion(userId, m[1], str(i.question)));
  }
  m = path.match(/^\/v1\/market\/products\/([^/]+)\/delivery$/);
  if (m && method === 'GET') {
    const estimate = await getDeliveryEstimate(m[1], userId, url.searchParams.get('addressId') ?? undefined);
    return json(res, 200, estimate ?? {});
  }
  m = path.match(/^\/v1\/market\/products\/([^/]+)\/shipping-profile$/);
  if (m && method === 'PUT') return json(res, 200, await setShippingProfile(userId, m[1], await body(req)));

  m = path.match(/^\/v1\/market\/orders\/([^/]+)\/returns$/);
  if (m && method === 'POST') {
    const i = await body(req);
    return json(res, 201, await requestReturn(userId, m[1], str(i.reason), str(i.notes)));
  }
  if (path === '/v1/market/returns' && method === 'GET') return json(res, 200, await listReturns(userId, url.searchParams.get('orderId') ?? undefined));
  m = path.match(/^\/v1\/market\/orders\/([^/]+)\/support$/);
  if (m && method === 'POST') {
    const i = await body(req);
    return json(res, 201, await openOrderSupport(userId, m[1], str(i.subject)));
  }

  // ---- Seller studio / shop ---------------------------------------------
  if (path === '/v1/shop/products') {
    if (method === 'GET') return json(res, 200, { products: await listSellerProducts(userId) });
    if (method === 'POST') {
      const i = await body(req);
      return json(res, 201, await createProduct(userId, i));
    }
  }
  if (path === '/v1/shop/recommended' && method === 'GET') {
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const items = await getRecommendedProducts(userId, Number.isFinite(limit) ? limit : 20);
    await hydrateProductMedia((items ?? []) as any, origin);
    return json(res, 200, { items });
  }
  if (path === '/v1/shop/events' && method === 'POST') {
    const i = await body(req);
    return json(res, 201, await recordCommerceEvent(userId, i));
  }
  if (path === '/v1/shop/discovery' && method === 'GET') {
    const items = await getShopDiscovery(userId, Number(url.searchParams.get('limit') ?? 30));
    return json(res, 200, { items });
  }

  // ---- Storefront metadata & collections ---------------------------------
  m = path.match(/^\/v1\/shops\/([^/]+)\/storefront$/);
  if (m) {
    if (method === 'GET') {
      const items = await listShopCollections(userId, m[1]);
      return json(res, 200, items);
    }
    if (method === 'PUT') return json(res, 200, await setStorefrontMetadata(userId, m[1], await body(req)));
  }
  m = path.match(/^\/v1\/shops\/([^/]+)\/collections$/);
  if (m && method === 'POST') return json(res, 201, await addCollection(userId, m[1], await body(req)));

  // ---- Product variants ---------------------------------------------------
  m = path.match(/^\/v1\/market\/products\/([^/]+)\/variants$/);
  if (m && method === 'POST') return json(res, 201, await createVariant(userId, m[1], await body(req)));
  m = path.match(/^\/v1\/market\/variants\/([^/]+)$/);
  if (m) {
    if (method === 'PUT') return json(res, 200, await updateVariant(userId, m[1], await body(req)));
    if (method === 'DELETE') return json(res, 200, await deleteVariant(userId, m[1]));
  }

  return false;
}
