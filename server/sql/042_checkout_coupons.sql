CREATE TABLE IF NOT EXISTS checkout_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id uuid NOT NULL REFERENCES checkout_sessions(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_minor bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'accepted' CHECK(status IN ('accepted','rejected','expired','removed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS checkout_coupons_session_idx ON checkout_coupons(checkout_session_id,created_at DESC);
