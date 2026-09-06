-- Recommendation feature jobs depend on the recommendation experiment tables.
CREATE TABLE IF NOT EXISTS recommendation_feature_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  version integer NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','leased','succeeded','failed','cancelled')),
  attempt_count integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id,version)
);
CREATE INDEX IF NOT EXISTS recommendation_feature_jobs_queue_idx ON recommendation_feature_jobs(status,available_at);

CREATE TABLE IF NOT EXISTS recommendation_offline_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES recommendation_experiments(id) ON DELETE SET NULL,
  policy_version text NOT NULL,
  dataset_window_start timestamptz NOT NULL,
  dataset_window_end timestamptz NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
