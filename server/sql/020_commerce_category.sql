ALTER TABLE products ADD COLUMN IF NOT EXISTS category text;
CREATE INDEX IF NOT EXISTS products_category_idx ON products(lower(category),status,created_at DESC);
