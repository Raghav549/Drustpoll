CREATE TABLE IF NOT EXISTS recommendation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_type text NOT NULL CHECK(object_type IN ('post','reel','product','profile')),
  object_id uuid NOT NULL,
  event_type text NOT NULL CHECK(event_type IN ('impression','open','watch_start','watch_progress','watch_complete','like','save','share','comment','follow_author','hide','not_interested','report')),
  session_id uuid,
  position integer CHECK(position IS NULL OR position >= 0),
  dwell_ms integer CHECK(dwell_ms IS NULL OR dwell_ms >= 0),
  progress_ms integer CHECK(progress_ms IS NULL OR progress_ms >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recommendation_events_user_time_idx ON recommendation_events(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS recommendation_events_object_time_idx ON recommendation_events(object_type,object_id,created_at DESC);
CREATE INDEX IF NOT EXISTS recommendation_events_session_idx ON recommendation_events(session_id,created_at DESC) WHERE session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_type text NOT NULL CHECK(object_type IN ('post','reel','product','profile')),
  object_id uuid NOT NULL,
  feedback text NOT NULL CHECK(feedback IN ('hide','not_interested','report')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,object_type,object_id)
);
CREATE INDEX IF NOT EXISTS recommendation_feedback_user_idx ON recommendation_feedback(user_id,created_at DESC);
