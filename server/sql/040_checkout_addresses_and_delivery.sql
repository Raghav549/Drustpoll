ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS delivery_min_days integer;
ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS delivery_max_days integer;
ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS address_snapshot jsonb;
CREATE INDEX IF NOT EXISTS checkout_sessions_status_idx ON checkout_sessions(buyer_id,status,updated_at DESC);
