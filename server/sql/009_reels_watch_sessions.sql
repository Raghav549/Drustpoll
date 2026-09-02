CREATE TABLE IF NOT EXISTS reel_watch_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  source text NOT NULL DEFAULT 'reels',
  client_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reel_watch_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES reel_watch_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK(event_type IN ('impression','start','progress','complete','skip','replay','like','save','share','comment','not_interested')),
  position integer CHECK(position IS NULL OR position >= 0),
  watched_ms integer CHECK(watched_ms IS NULL OR watched_ms >= 0),
  video_duration_ms integer CHECK(video_duration_ms IS NULL OR video_duration_ms >= 0),
  client_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_event_id)
);

CREATE INDEX IF NOT EXISTS reel_watch_events_user_time_idx ON reel_watch_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reel_watch_events_post_time_idx ON reel_watch_events(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reel_watch_events_session_idx ON reel_watch_events(session_id, created_at);

CREATE TABLE IF NOT EXISTS recommendation_exposure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surface text NOT NULL CHECK(surface IN ('feed','reels','shop')),
  position integer NOT NULL CHECK(position >= 0),
  shown_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recommendation_exposure_user_time_idx ON recommendation_exposure(user_id, shown_at DESC);
CREATE INDEX IF NOT EXISTS recommendation_exposure_creator_idx ON recommendation_exposure(user_id, creator_id, shown_at DESC);
