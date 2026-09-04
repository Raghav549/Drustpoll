CREATE TABLE IF NOT EXISTS seller_commerce_settings(
  shop_id uuid PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  payment_cod boolean NOT NULL DEFAULT false,
  payment_upi boolean NOT NULL DEFAULT true,
  payment_card boolean NOT NULL DEFAULT false,
  delivery_mode text NOT NULL DEFAULT 'seller' CHECK(delivery_mode IN ('seller','provider')),
  delivery_provider_name text,
  delivery_provider_key_ref text,
  delivery_webhook_url text,
  free_delivery_threshold_minor bigint,
  base_delivery_fee_minor bigint NOT NULL DEFAULT 0,
  handling_days integer NOT NULL DEFAULT 1 CHECK(handling_days>=0),
  return_window_days integer NOT NULL DEFAULT 0 CHECK(return_window_days>=0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_verification_requests(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id uuid REFERENCES shops(id) ON DELETE SET NULL,
  business_name text NOT NULL,
  registration_number text,
  tax_identifier text,
  country_code char(2) NOT NULL DEFAULT 'IN',
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','needs_info','approved','rejected','suspended')),
  reviewer_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_verification_user_idx ON business_verification_requests(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS professional_profile_settings(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  category text,
  bio text,
  contact_email text,
  contact_phone text,
  website text,
  insights_enabled boolean NOT NULL DEFAULT true,
  professional_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_campaigns(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused','ended')),
  objective text NOT NULL DEFAULT 'awareness',
  budget_minor bigint NOT NULL DEFAULT 0 CHECK(budget_minor>=0),
  currency char(3) NOT NULL DEFAULT 'INR',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ad_creatives(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  headline text NOT NULL,
  body text NOT NULL DEFAULT '',
  cta text NOT NULL DEFAULT 'Learn more',
  destination_url text NOT NULL,
  media_id text,
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ad_delivery_controls(
  advertiser_user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  topic_targeting_enabled boolean NOT NULL DEFAULT false,
  activity_targeting_enabled boolean NOT NULL DEFAULT false,
  sensitive_inference_targeting_enabled boolean NOT NULL DEFAULT false,
  max_impressions_per_user_per_day integer NOT NULL DEFAULT 3 CHECK(max_impressions_per_user_per_day BETWEEN 0 AND 20),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ad_feedback(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creative_id uuid NOT NULL REFERENCES ad_creatives(id) ON DELETE CASCADE,
  signal text NOT NULL CHECK(signal IN ('hide','not_relevant','report','why_this')),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations(version) VALUES('051_seller_commerce_controls.sql') ON CONFLICT DO NOTHING;
