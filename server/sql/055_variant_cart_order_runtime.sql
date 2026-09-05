ALTER TABLE cart_lines ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT;
ALTER TABLE order_lines ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS cart_lines_variant_idx ON cart_lines(cart_id,product_id,variant_id);
CREATE INDEX IF NOT EXISTS order_lines_variant_idx ON order_lines(order_id,product_id,variant_id);
INSERT INTO schema_migrations(version) VALUES('055_variant_cart_order_runtime.sql') ON CONFLICT DO NOTHING;
