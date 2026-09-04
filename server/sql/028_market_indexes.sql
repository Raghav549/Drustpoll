CREATE INDEX IF NOT EXISTS product_category_idx ON products(category,status,created_at DESC);
CREATE INDEX IF NOT EXISTS product_price_idx ON products(price_minor,status,created_at DESC);
CREATE INDEX IF NOT EXISTS product_review_rating_idx ON product_reviews(product_id,status,rating,created_at DESC);
CREATE INDEX IF NOT EXISTS product_shipping_profile_idx ON product_shipping_profiles(product_id);
CREATE INDEX IF NOT EXISTS order_fulfillment_tracking_idx ON order_fulfillment(tracking_number) WHERE tracking_number IS NOT NULL;
