CREATE TABLE IF NOT EXISTS recommendation_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','running','paused','completed')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendation_assignments (
  experiment_id uuid NOT NULL REFERENCES recommendation_experiments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(experiment_id,user_id)
);

CREATE TABLE IF NOT EXISTS recommendation_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES recommendation_experiments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant text NOT NULL,
  surface text NOT NULL CHECK(surface IN ('feed','reels','shop')),
  impressions integer NOT NULL DEFAULT 0,
  opens integer NOT NULL DEFAULT 0,
  meaningful_interactions integer NOT NULL DEFAULT 0,
  negative_feedback integer NOT NULL DEFAULT 0,
  watch_ms bigint NOT NULL DEFAULT 0,
  completed_views integer NOT NULL DEFAULT 0,
  unique_creators integer NOT NULL DEFAULT 0,
  unique_topics integer NOT NULL DEFAULT 0,
  novelty_score double precision NOT NULL DEFAULT 0,
  diversity_score double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(experiment_id,user_id,surface)
);

CREATE INDEX IF NOT EXISTS recommendation_metrics_experiment_variant_idx ON recommendation_metrics(experiment_id,variant,surface);
