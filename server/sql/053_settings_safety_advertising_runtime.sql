CREATE TABLE IF NOT EXISTS user_setting_preferences(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'system' CHECK(theme IN ('system','light','dark')),
  language text NOT NULL DEFAULT 'en',
  region text NOT NULL DEFAULT 'IN',
  currency char(3) NOT NULL DEFAULT 'INR',
  notifications_enabled boolean NOT NULL DEFAULT true,
  activity_tracking_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hidden_topics(
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,topic)
);
CREATE INDEX IF NOT EXISTS hidden_topics_user_created_idx ON hidden_topics(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS ad_impressions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creative_id uuid NOT NULL REFERENCES ad_creatives(id) ON DELETE CASCADE,
  shown_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ad_impressions_user_creative_time_idx ON ad_impressions(user_id,creative_id,shown_at DESC);
ALTER TABLE ad_delivery_controls ADD COLUMN IF NOT EXISTS contextual_only boolean NOT NULL DEFAULT true;
ALTER TABLE ad_delivery_controls ADD COLUMN IF NOT EXISTS explanation_enabled boolean NOT NULL DEFAULT true;
INSERT INTO schema_migrations(version) VALUES('053_settings_safety_advertising_runtime.sql') ON CONFLICT DO NOTHING;
