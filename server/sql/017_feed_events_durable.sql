CREATE TABLE IF NOT EXISTS feed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  creator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK(event_type IN ('impression','open','dwell','like','comment','save','share','follow','hide','not_interested','report','mute')),
  value_num double precision,
  session_id uuid,
  client_event_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,client_event_id)
);
CREATE INDEX IF NOT EXISTS feed_events_user_time_idx ON feed_events(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS feed_events_post_time_idx ON feed_events(post_id,created_at DESC) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS feed_events_creator_time_idx ON feed_events(creator_id,created_at DESC) WHERE creator_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS post_counters (
  post_id uuid PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  impressions bigint NOT NULL DEFAULT 0 CHECK(impressions>=0),
  opens bigint NOT NULL DEFAULT 0 CHECK(opens>=0),
  meaningful_interactions bigint NOT NULL DEFAULT 0 CHECK(meaningful_interactions>=0),
  hides bigint NOT NULL DEFAULT 0 CHECK(hides>=0),
  reports bigint NOT NULL DEFAULT 0 CHECK(reports>=0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
