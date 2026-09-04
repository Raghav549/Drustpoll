ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'system';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS digest_eligible boolean NOT NULL DEFAULT true;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS muted_until timestamptz;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  social boolean NOT NULL DEFAULT true,
  mentions_replies boolean NOT NULL DEFAULT true,
  follows boolean NOT NULL DEFAULT true,
  commerce_orders boolean NOT NULL DEFAULT true,
  security boolean NOT NULL DEFAULT true,
  system boolean NOT NULL DEFAULT true,
  digest_enabled boolean NOT NULL DEFAULT false,
  digest_frequency text NOT NULL DEFAULT 'daily' CHECK(digest_frequency IN ('daily','weekly')),
  quiet_enabled boolean NOT NULL DEFAULT false,
  quiet_start_minute integer CHECK(quiet_start_minute IS NULL OR quiet_start_minute BETWEEN 0 AND 1439),
  quiet_end_minute integer CHECK(quiet_end_minute IS NULL OR quiet_end_minute BETWEEN 0 AND 1439),
  quiet_timezone text NOT NULL DEFAULT 'UTC',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_wishlists (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, product_id)
);
CREATE INDEX IF NOT EXISTS product_wishlists_product_idx ON product_wishlists(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'published' CHECK(status IN ('published','pending','removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id,user_id,order_id)
);
CREATE INDEX IF NOT EXISTS product_reviews_product_idx ON product_reviews(product_id,created_at DESC);

CREATE TABLE IF NOT EXISTS product_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  question text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS product_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_questions_idx ON product_questions(product_id,created_at DESC);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  price_minor bigint,
  inventory integer NOT NULL DEFAULT 0 CHECK(inventory >= 0),
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants(product_id,created_at DESC);

CREATE TABLE IF NOT EXISTS shops_metadata (
  shop_id uuid PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  slug text UNIQUE,
  logo_url text,
  banner_url text,
  accent_label text,
  policy_text text,
  support_email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_shipping_profiles (
  product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  origin_region text,
  shipping_text text NOT NULL DEFAULT '',
  delivery_min_days integer,
  delivery_max_days integer,
  free_shipping_threshold_minor bigint,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label text NOT NULL,
  recipient_name text NOT NULL,
  phone text NOT NULL,
  line1 text NOT NULL,
  line2 text NOT NULL DEFAULT '',
  city text NOT NULL,
  region text NOT NULL,
  postal_code text NOT NULL,
  country_code char(2) NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS buyer_addresses_user_idx ON buyer_addresses(user_id,is_default DESC,updated_at DESC);

CREATE TABLE IF NOT EXISTS order_fulfillment (
  order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  shipping_address_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  tracking_number text,
  carrier text,
  estimated_delivery_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','approved','rejected','received','refunded','cancelled')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_returns_buyer_idx ON order_returns(buyer_id,created_at DESC);

CREATE TABLE IF NOT EXISTS order_support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','pending','resolved','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_support_order_idx ON order_support_threads(order_id,updated_at DESC);
