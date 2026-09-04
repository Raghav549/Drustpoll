CREATE TABLE IF NOT EXISTS product_reputation (
  product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quality_score numeric(5,4) NOT NULL DEFAULT 0,
  fulfillment_score numeric(5,4) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS seller_reputation (
  seller_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  rating numeric(4,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  fulfilled_count integer NOT NULL DEFAULT 0,
  cancellation_count integer NOT NULL DEFAULT 0,
  return_count integer NOT NULL DEFAULT 0,
  response_rate numeric(5,4) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS product_media_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  media_type text NOT NULL CHECK(media_type IN ('image','video')),
  sort_order integer NOT NULL DEFAULT 0,
  alt_text text NOT NULL DEFAULT '',
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_media_metadata_idx ON product_media_metadata(product_id,sort_order,created_at);
CREATE TABLE IF NOT EXISTS saved_for_later (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK(quantity>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,product_id)
);
CREATE TABLE IF NOT EXISTS order_shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  fee_minor bigint NOT NULL DEFAULT 0,
  estimated_min_days integer,
  estimated_max_days integer,
  selected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_shipping_methods_order_idx ON order_shipping_methods(order_id,selected,created_at);
CREATE TABLE IF NOT EXISTS order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider text,
  provider_reference text,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','requires_action','authorized','paid','failed','cancelled','refunded')),
  amount_minor bigint NOT NULL DEFAULT 0,
  currency char(3) NOT NULL,
  failure_code text,
  failure_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_payments_order_idx ON order_payments(order_id,created_at DESC);
CREATE TABLE IF NOT EXISTS order_issue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  issue_type text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_review','resolved','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_issue_reports_order_idx ON order_issue_reports(order_id,created_at DESC);
ALTER TABLE order_fulfillment ADD COLUMN IF NOT EXISTS shipment_status text NOT NULL DEFAULT 'unfulfilled';
ALTER TABLE order_fulfillment ADD COLUMN IF NOT EXISTS delivery_notes text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_minor bigint NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_id uuid REFERENCES buyer_addresses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_address_idx ON orders(address_id,created_at DESC);
CREATE INDEX IF NOT EXISTS product_variants_inventory_idx ON product_variants(product_id,active,inventory);
