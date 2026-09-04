CREATE TABLE IF NOT EXISTS search_history (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query text NOT NULL,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,query)
);
CREATE INDEX IF NOT EXISTS search_history_user_time_idx ON search_history(user_id,last_used_at DESC);

CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query text NOT NULL,
  kind text NOT NULL DEFAULT 'all' CHECK(kind IN ('all','people','posts','products')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,query,kind)
);
CREATE INDEX IF NOT EXISTS saved_searches_user_idx ON saved_searches(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS discovery_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  people boolean NOT NULL DEFAULT true,
  posts boolean NOT NULL DEFAULT true,
  videos boolean NOT NULL DEFAULT true,
  products boolean NOT NULL DEFAULT true,
  shops boolean NOT NULL DEFAULT true,
  topics boolean NOT NULL DEFAULT true,
  local boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discovery_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discovery_category_follows (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES discovery_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,category_id)
);

CREATE TABLE IF NOT EXISTS reel_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'for_you' CHECK(mode IN ('for_you','following','topic')),
  topic text,
  quality text NOT NULL DEFAULT 'auto' CHECK(quality IN ('auto','low','medium','high')),
  preload text NOT NULL DEFAULT 'wifi' CHECK(preload IN ('never','wifi','always')),
  autoplay boolean NOT NULL DEFAULT true,
  data_saver boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reel_creator_feedback (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal text NOT NULL CHECK(signal IN ('hide','mute','not_interested','report')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,creator_id,signal)
);

CREATE TABLE IF NOT EXISTS reel_audio_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL DEFAULT '',
  source_url text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reel_audio_links (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  audio_id uuid NOT NULL REFERENCES reel_audio_catalog(id) ON DELETE CASCADE,
  PRIMARY KEY(post_id,audio_id)
);

CREATE TABLE IF NOT EXISTS reel_topics (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  topic text NOT NULL,
  PRIMARY KEY(post_id,topic)
);

CREATE INDEX IF NOT EXISTS reel_creator_feedback_idx ON reel_creator_feedback(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS reel_topics_topic_idx ON reel_topics(topic,post_id);
