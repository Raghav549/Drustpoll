CREATE TABLE IF NOT EXISTS payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider text NOT NULL,
  provider_intent_id text,
  amount_minor bigint NOT NULL CHECK(amount_minor >= 0),
  currency char(3) NOT NULL,
  status text NOT NULL DEFAULT 'created' CHECK(status IN ('created','requires_action','processing','succeeded','failed','cancelled')),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider,idempotency_key),
  UNIQUE(provider,provider_intent_id)
);
CREATE INDEX IF NOT EXISTS payment_intents_order_idx ON payment_intents(order_id,created_at DESC);
CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  payment_intent_id uuid REFERENCES payment_intents(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload_hash text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(provider,provider_event_id)
);
CREATE INDEX IF NOT EXISTS payment_events_intent_idx ON payment_events(payment_intent_id,received_at DESC);
