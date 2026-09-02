import { query, withTransaction } from './db.js';

type ProductInput = { title: string; description?: string; priceMinor: number; currency?: string; inventory?: number; media?: unknown[]; shopName?: string };

async function ensureShop(ownerId: string, requestedName?: string) {
  const existing = await query<{id:string}>('SELECT id FROM shops WHERE owner_id=$1 LIMIT 1',[ownerId]);
  if (existing.rows[0]) return existing.rows[0].id;
  const name = (requestedName ?? 'My Shop').trim().slice(0,120) || 'My Shop';
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60) || 'shop';
  const slug = `${base}-${ownerId.slice(0,8)}`;
  const created = await query<{id:string}>('INSERT INTO shops(owner_id,name,slug) VALUES($1,$2,$3) RETURNING id',[ownerId,name,slug]);
  return created.rows[0].id;
}

export async function createProduct(sellerId: string, input: ProductInput) {
  const title = String(input.title ?? '').trim();
  const priceMinor = Number(input.priceMinor);
  const inventory = Number(input.inventory ?? 0);
  const currency = String(input.currency ?? 'INR').toUpperCase();
  if (!title || title.length > 200) throw new Error('Invalid product title');
  if (!Number.isSafeInteger(priceMinor) || priceMinor < 0) throw new Error('Invalid product price');
  if (!Number.isSafeInteger(inventory) || inventory < 0) throw new Error('Invalid inventory');
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Invalid currency');
  const shopId = await ensureShop(sellerId,input.shopName);
  const result = await query<{id:string;created_at:Date}>('INSERT INTO shop_products(shop_id,seller_id,title,description,price_minor,currency,inventory,media) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,created_at',[shopId,sellerId,title,String(input.description ?? '').trim().slice(0,10000),priceMinor,currency,inventory,JSON.stringify(Array.isArray(input.media)?input.media.slice(0,20):[])]);
  return {id:result.rows[0].id,createdAt:result.rows[0].created_at.toISOString()};
}

export async function listSellerProducts(sellerId: string) {
  const result = await query('SELECT id,shop_id,seller_id,title,description,price_minor,currency,inventory,status,media,created_at,updated_at FROM shop_products WHERE seller_id=$1 AND status<>\'archived\' ORDER BY created_at DESC',[sellerId]);
  return result.rows;
}

export async function getProduct(productId: string) {
  const result = await query('SELECT p.id,p.shop_id,p.seller_id,p.title,p.description,p.price_minor,p.currency,p.inventory,p.status,p.media,p.created_at,s.name AS shop_name,s.slug AS shop_slug FROM shop_products p JOIN shops s ON s.id=p.shop_id WHERE p.id=$1 LIMIT 1',[productId]);
  return result.rows[0] ?? null;
}

export async function getCart(buyerId: string) {
  const result = await query('SELECT c.id,c.currency,COALESCE(json_agg(json_build_object(\'productId\',i.product_id,\'quantity\',i.quantity,\'unitPriceMinor\',i.unit_price_minor,\'title\',p.title,\'inventory\',p.inventory)) FILTER (WHERE i.product_id IS NOT NULL),\'[]\'::json) AS items FROM carts c LEFT JOIN cart_items i ON i.cart_id=c.id LEFT JOIN shop_products p ON p.id=i.product_id WHERE c.buyer_id=$1 GROUP BY c.id',[buyerId]);
  return result.rows[0] ?? {id:null,currency:'INR',items:[]};
}

export async function addCartItem(buyerId: string, productId: string, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) throw new Error('Invalid quantity');
  return withTransaction(async client => {
    const product = await client.query<{price_minor:string;currency:string;inventory:number;status:string}>('SELECT price_minor,currency,inventory,status FROM shop_products WHERE id=$1 FOR UPDATE',[productId]);
    const p=product.rows[0];
    if (!p || p.status!=='active') throw new Error('Product not found or inactive');
    if (p.inventory < quantity) throw new Error('Insufficient inventory');
    const cart = await client.query<{id:string;currency:string}>('INSERT INTO carts(buyer_id,currency) VALUES($1,$2) ON CONFLICT(buyer_id) DO UPDATE SET updated_at=now() RETURNING id,currency',[buyerId,p.currency]);
    if (cart.rows[0].currency !== p.currency) throw new Error('Cart currency mismatch');
    await client.query('INSERT INTO cart_items(cart_id,product_id,quantity,unit_price_minor) VALUES($1,$2,$3,$4) ON CONFLICT(cart_id,product_id) DO UPDATE SET quantity=cart_items.quantity+EXCLUDED.quantity,unit_price_minor=EXCLUDED.unit_price_minor',[cart.rows[0].id,productId,quantity,p.price_minor]);
    return getCart(buyerId);
  });
}

export async function updateCartItem(buyerId: string, productId: string, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100) throw new Error('Invalid quantity');
  const cart = await query<{id:string}>('SELECT id FROM carts WHERE buyer_id=$1',[buyerId]);
  if (!cart.rows[0]) return getCart(buyerId);
  if (quantity===0) await query('DELETE FROM cart_items WHERE cart_id=$1 AND product_id=$2',[cart.rows[0].id,productId]);
  else await query('UPDATE cart_items SET quantity=$1 WHERE cart_id=$2 AND product_id=$3',[quantity,cart.rows[0].id,productId]);
  return getCart(buyerId);
}

export async function placeOrder(buyerId: string) {
  return withTransaction(async client => {
    const cart = await client.query<{id:string;currency:string}>('SELECT id,currency FROM carts WHERE buyer_id=$1 FOR UPDATE',[buyerId]);
    if (!cart.rows[0]) throw new Error('Cart is empty');
    const items = await client.query<{product_id:string;quantity:number;unit_price_minor:string;title:string;seller_id:string;inventory:number;status:string}>('SELECT i.product_id,i.quantity,i.unit_price_minor,p.title,p.seller_id,p.inventory,p.status FROM cart_items i JOIN shop_products p ON p.id=i.product_id WHERE i.cart_id=$1 FOR UPDATE',[cart.rows[0].id]);
    if (!items.rows.length) throw new Error('Cart is empty');
    let total=0;
    for(const item of items.rows){ if(item.status!=='active'||item.inventory<item.quantity) throw new Error('Cart contains unavailable inventory'); total += Number(item.unit_price_minor)*item.quantity; }
    if(!Number.isSafeInteger(total)) throw new Error('Order total overflow');
    const order=await client.query<{id:string}>('INSERT INTO shop_orders(buyer_id,status,total_minor,currency) VALUES($1,\'pending_payment\',$2,$3) RETURNING id',[buyerId,total,cart.rows[0].currency]);
    for(const item of items.rows){
      await client.query('INSERT INTO shop_order_items(order_id,product_id,seller_id,title_snapshot,quantity,unit_price_minor,currency) VALUES($1,$2,$3,$4,$5,$6,$7)',[order.rows[0].id,item.product_id,item.seller_id,item.title,item.quantity,item.unit_price_minor,cart.rows[0].currency]);
      await client.query('UPDATE shop_products SET inventory=inventory-$1,updated_at=now() WHERE id=$2',[item.quantity,item.product_id]);
    }
    await client.query('DELETE FROM cart_items WHERE cart_id=$1',[cart.rows[0].id]);
    await client.query('UPDATE carts SET updated_at=now() WHERE id=$1',[cart.rows[0].id]);
    return {orderId:order.rows[0].id,status:'pending_payment',totalMinor:total,currency:cart.rows[0].currency};
  });
}
