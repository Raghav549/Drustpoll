CREATE INDEX IF NOT EXISTS product_media_metadata_product_type_idx ON product_media_metadata(product_id,media_type,sort_order);
CREATE INDEX IF NOT EXISTS product_wishlists_user_created_idx ON product_wishlists(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS saved_for_later_user_created_idx ON saved_for_later(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS order_issue_reports_user_created_idx ON order_issue_reports(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS order_returns_order_status_idx ON order_returns(order_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS order_payments_status_idx ON order_payments(order_id,status,updated_at DESC);
