CREATE TABLE IF NOT EXISTS data_export_artifacts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES data_requests(id) ON DELETE CASCADE,
  storage_key text,
  download_url text,
  content_sha256 text,
  size_bytes bigint,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_delivery_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creative_id uuid NOT NULL REFERENCES ad_creatives(id) ON DELETE CASCADE,
  reason text NOT NULL,
  explanation jsonb NOT NULL DEFAULT '{}'::jsonb,
  shown_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ad_delivery_events_user_time_idx ON ad_delivery_events(user_id,shown_at DESC);
CREATE INDEX IF NOT EXISTS ad_delivery_events_creative_time_idx ON ad_delivery_events(creative_id,shown_at DESC);

ALTER TABLE order_fulfillment ADD COLUMN IF NOT EXISTS provider_reference text;
ALTER TABLE order_fulfillment ADD COLUMN IF NOT EXISTS provider_webhook_status text;
ALTER TABLE order_fulfillment ADD COLUMN IF NOT EXISTS fulfillment_mode text NOT NULL DEFAULT 'seller';
ALTER TABLE order_fulfillment ADD COLUMN IF NOT EXISTS shipping_fee_minor bigint NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS order_receipt_artifacts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  receipt_number text,
  storage_key text,
  download_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS order_receipt_artifacts_receipt_uq ON order_receipt_artifacts(receipt_number) WHERE receipt_number IS NOT NULL;

INSERT INTO schema_migrations(version) VALUES('054_final_runtime_hardening.sql') ON CONFLICT DO NOTHING;
