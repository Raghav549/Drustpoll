CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  parent_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_categories_parent_idx ON product_categories(parent_id);

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS ui_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  surface text NOT NULL,
  metric text NOT NULL,
  value_num double precision,
  value_text text,
  session_id uuid,
  client_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,client_event_id)
);
CREATE INDEX IF NOT EXISTS ui_measurements_surface_time_idx ON ui_measurements(surface,metric,created_at DESC);

CREATE TABLE IF NOT EXISTS privacy_control_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  control text NOT NULL,
  previous_value text,
  next_value text NOT NULL,
  source text NOT NULL DEFAULT 'settings',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS privacy_control_changes_user_time_idx ON privacy_control_changes(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS user_feedback_signals (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_type text NOT NULL CHECK(object_type IN ('post','reel','product','creator','topic')),
  object_id uuid NOT NULL,
  signal text NOT NULL CHECK(signal IN ('more_like_this','less_like_this','not_interested','hide','mute','report')),
  strength double precision NOT NULL DEFAULT 1 CHECK(strength >= 0 AND strength <= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,object_type,object_id,signal)
);
CREATE INDEX IF NOT EXISTS user_feedback_signals_user_time_idx ON user_feedback_signals(user_id,created_at DESC);
