ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS verified_purchase boolean NOT NULL DEFAULT false;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS product_reviews_verified_idx ON product_reviews(product_id,verified_purchase,status,created_at DESC);
CREATE INDEX IF NOT EXISTS seller_reputation_rating_idx ON seller_reputation(rating DESC,review_count DESC);
CREATE INDEX IF NOT EXISTS order_status_events_order_created_idx ON order_status_events(order_id,created_at ASC);
CREATE UNIQUE INDEX IF NOT EXISTS order_support_one_open_idx ON order_support_threads(order_id,user_id) WHERE status IN ('open','pending');
