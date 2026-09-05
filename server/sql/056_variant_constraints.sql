ALTER TABLE cart_lines ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT;
ALTER TABLE order_lines ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX IF NOT EXISTS cart_lines_no_variant_uq ON cart_lines(cart_id,product_id) WHERE variant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cart_lines_variant_uq ON cart_lines(cart_id,product_id,variant_id) WHERE variant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS order_lines_variant_uq ON order_lines(order_id,product_id,variant_id) WHERE variant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS order_lines_no_variant_uq ON order_lines(order_id,product_id) WHERE variant_id IS NULL;
INSERT INTO schema_migrations(version) VALUES('056_variant_constraints.sql') ON CONFLICT DO NOTHING;
