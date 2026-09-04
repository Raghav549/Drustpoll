CREATE INDEX IF NOT EXISTS product_created_status_idx ON products(status,created_at DESC);
CREATE INDEX IF NOT EXISTS order_fulfillment_status_idx ON order_fulfillment(shipment_status,estimated_delivery_at);
CREATE INDEX IF NOT EXISTS product_price_history_recent_idx ON product_price_history(product_id,recorded_at DESC);
