CREATE INDEX IF NOT EXISTS payment_intents_order_idx ON payment_intents(order_id,created_at DESC);
ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS failure_code text;
ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS failure_message text;
