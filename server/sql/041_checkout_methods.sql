CREATE TABLE IF NOT EXISTS checkout_delivery_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id uuid NOT NULL REFERENCES checkout_sessions(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  fee_minor bigint NOT NULL DEFAULT 0,
  estimated_min_days integer,
  estimated_max_days integer,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(checkout_session_id,code)
);
CREATE TABLE IF NOT EXISTS checkout_payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id uuid NOT NULL REFERENCES checkout_sessions(id) ON DELETE CASCADE,
  method text NOT NULL,
  provider text,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','requires_action','processing','succeeded','failed','cancelled')),
  provider_reference text,
  failure_code text,
  failure_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS checkout_delivery_options_session_idx ON checkout_delivery_options(checkout_session_id,available,fee_minor);
CREATE INDEX IF NOT EXISTS checkout_payment_attempts_session_idx ON checkout_payment_attempts(checkout_session_id,created_at DESC);
