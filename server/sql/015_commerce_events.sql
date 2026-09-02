CREATE TABLE IF NOT EXISTS commerce_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK(event_type IN ('impression','open','view','add_cart','remove_cart','purchase','save','not_interested')),
  dwell_ms integer CHECK(dwell_ms IS NULL OR (dwell_ms >= 0 AND dwell_ms <= 86400000)),
  client_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,client_event_id)
);
CREATE INDEX IF NOT EXISTS commerce_events_user_time_idx ON commerce_events(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS commerce_events_product_time_idx ON commerce_events(product_id,created_at DESC);
