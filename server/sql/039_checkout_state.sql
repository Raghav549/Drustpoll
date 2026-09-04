CREATE TABLE IF NOT EXISTS checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  currency char(3),
  address_id uuid REFERENCES buyer_addresses(id) ON DELETE SET NULL,
  delivery_code text,
  payment_method text,
  status text NOT NULL DEFAULT 'review' CHECK(status IN ('review','address','delivery','payment','requires_action','pending','failed','confirmed','cancelled')),
  subtotal_minor bigint NOT NULL DEFAULT 0,
  shipping_minor bigint NOT NULL DEFAULT 0,
  total_minor bigint NOT NULL DEFAULT 0,
  failure_code text,
  failure_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(buyer_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS checkout_sessions_buyer_idx ON checkout_sessions(buyer_id,updated_at DESC);
