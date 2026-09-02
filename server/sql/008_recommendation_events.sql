CREATE TABLE IF NOT EXISTS recommendation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK(event_type IN ('impression','open','view_start','view_progress','like','save','share','comment','hide','not_interested','report','follow_author')),
  session_id uuid,
  position integer,
  dwell_ms integer CHECK(dwell_ms IS NULL OR (dwell_ms >= 0 AND dwell_ms <= 86400000)),
  progress_ms integer CHECK(progress_ms IS NULL OR progress_ms >= 0),
  source text NOT NULL DEFAULT 'feed',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recommendation_events_user_time_idx ON recommendation_events(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS recommendation_events_post_time_idx ON recommendation_events(post_id,created_at DESC) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS recommendation_events_type_time_idx ON recommendation_events(event_type,created_at DESC);
