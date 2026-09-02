CREATE TABLE IF NOT EXISTS content_feature_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES media_assets(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  modality text NOT NULL CHECK(modality IN ('text','image','audio','video','fused')),
  job_type text NOT NULL CHECK(job_type IN ('text_features','image_features','audio_features','video_features','fusion')),
  status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','succeeded','failed','cancelled')),
  attempt_count integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_feature_jobs_queue_idx ON content_feature_jobs(status,available_at,created_at);
CREATE TABLE IF NOT EXISTS content_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES media_assets(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  modality text NOT NULL CHECK(modality IN ('text','image','audio','video','fused')),
  model_version text NOT NULL,
  feature_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','stale','invalid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(asset_id IS NOT NULL OR post_id IS NOT NULL),
  UNIQUE(asset_id,modality,model_version)
);
CREATE INDEX IF NOT EXISTS content_features_post_idx ON content_features(post_id,modality,updated_at DESC);
CREATE INDEX IF NOT EXISTS content_features_asset_idx ON content_features(asset_id,modality,updated_at DESC);
