import { createHmac, timingSafeEqual } from 'node:crypto';
import { withTransaction } from './db.js';

export type PaymentProvider = {
  name: string;
  createIntent(input: { orderId: string; amountMinor: number; currency: string; idempotencyKey: string }): Promise<{ providerIntentId: string; status: 'created' | 'requires_action' | 'processing' }>;
  verifyWebhook(input: { rawBody: string; signature: string }): { eventId: string; type: string; providerIntentId: string; status: 'succeeded' | 'failed' | 'cancelled' };
};

export function verifyHmacSha256(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function validKey(key: string) { return /^[A-Za-z0-9._~-]{16,128}$/.test(key); }

export async function createPaymentIntent(buyerId: string, orderId: string, idempotencyKey: string, provider: PaymentProvider) {
  if (!validKey(idempotencyKey)) throw new Error('Invalid idempotency key');
  return withTransaction(async client => {
    const existing = await client.query('SELECT id,provider_intent_id,status,amount_minor,currency FROM payment_intents WHERE provider=$1 AND idempotency_key=$2 FOR UPDATE', [provider.name, idempotencyKey]);
    if (existing.rows[0]) return existing.rows[0];
    const order = await client.query<{ buyer_id: string; total_minor: string; currency: string; status: string }>('SELECT buyer_id,total_minor,currency,status FROM orders WHERE id=$1 FOR UPDATE', [orderId]);
    const o = order.rows[0];
    if (!o || o.buyer_id !== buyerId) throw new Error('Order not found');
    if (o.status !== 'pending_payment') throw new Error('Order is not payable');
    const amountMinor = Number(o.total_minor);
    const created = await provider.createIntent({ orderId, amountMinor, currency: o.currency, idempotencyKey });
    const inserted = await client.query('INSERT INTO payment_intents(order_id,buyer_id,provider,provider_intent_id,amount_minor,currency,status,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,provider_intent_id,status,amount_minor,currency', [orderId,buyerId,provider.name,created.providerIntentId,amountMinor,o.currency,created.status,idempotencyKey]);
    return inserted.rows[0];
  });
}

export async function applyWebhook(provider: PaymentProvider, rawBody: string, signature: string) {
  const event = provider.verifyWebhook({ rawBody, signature });
  return withTransaction(async client => {
    const existing = await client.query('SELECT id,processed_at FROM payment_events WHERE provider=$1 AND provider_event_id=$2 FOR UPDATE', [provider.name, event.eventId]);
    if (existing.rows[0]?.processed_at) return { duplicate: true };
    const intent = await client.query<{ id:string; order_id:string; amount_minor:string }>('SELECT id,order_id,amount_minor FROM payment_intents WHERE provider=$1 AND provider_intent_id=$2 FOR UPDATE', [provider.name,event.providerIntentId]);
    if (!intent.rows[0]) throw new Error('Payment intent not found');
    const payloadHash = createHmac('sha256', provider.name).update(rawBody,'utf8').digest('hex');
    if (!existing.rows[0]) await client.query('INSERT INTO payment_events(provider,provider_event_id,payment_intent_id,event_type,payload_hash) VALUES($1,$2,$3,$4,$5)',[provider.name,event.eventId,intent.rows[0].id,event.type,payloadHash]);
    const order = await client.query<{status:string;total_minor:string}>('SELECT status,total_minor FROM orders WHERE id=$1 FOR UPDATE',[intent.rows[0].order_id]);
    if (event.status === 'succeeded') {
      if (Number(order.rows[0].total_minor) !== Number(intent.rows[0].amount_minor)) throw new Error('Payment amount mismatch');
      if (!['pending_payment','paid'].includes(order.rows[0].status)) throw new Error('Order state cannot be paid');
      await client.query("UPDATE payment_intents SET status='succeeded',updated_at=now() WHERE id=$1",[intent.rows[0].id]);
      await client.query("UPDATE orders SET status='paid',updated_at=now() WHERE id=$1 AND status='pending_payment'",[intent.rows[0].order_id]);
    } else {
      await client.query('UPDATE payment_intents SET status=$1,updated_at=now() WHERE id=$2',[event.status,intent.rows[0].id]);
    }
    await client.query('UPDATE payment_events SET processed_at=now() WHERE provider=$1 AND provider_event_id=$2',[provider.name,event.eventId]);
    return { duplicate:false, status:event.status, orderId:intent.rows[0].order_id };
  });
}
