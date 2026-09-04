ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_due_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS orders_receipt_number_uq ON orders(receipt_number) WHERE receipt_number IS NOT NULL;
