CREATE TABLE IF NOT EXISTS recommendation_training_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  surface text NOT NULL CHECK(surface IN ('feed','reels','shop')),
  label text NOT NULL CHECK(label IN ('positive','negative','neutral')),
  target_score double precision NOT NULL CHECK(target_score >= 0 AND target_score <= 1),
  feature_vector jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_event_id uuid REFERENCES recommendation_events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,post_id,surface,source_event_id)
);
CREATE INDEX IF NOT EXISTS recommendation_training_examples_user_time_idx ON recommendation_training_examples(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS recommendation_training_examples_surface_time_idx ON recommendation_training_examples(surface,created_at DESC);
