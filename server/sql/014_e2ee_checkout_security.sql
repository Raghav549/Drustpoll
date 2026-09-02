CREATE TABLE IF NOT EXISTS device_key_bundles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  identity_key text NOT NULL,
  signed_pre_key text NOT NULL,
  signed_pre_key_signature text NOT NULL,
  key_version integer NOT NULL DEFAULT 1 CHECK(key_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz,
  PRIMARY KEY(user_id,device_id)
);
CREATE INDEX IF NOT EXISTS device_key_bundles_user_idx ON device_key_bundles(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS checkout_idempotency (
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(buyer_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS checkout_idempotency_created_idx ON checkout_idempotency(created_at);
