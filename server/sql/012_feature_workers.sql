-- Canonical feature-worker schema. Normalize any legacy content_features table
-- shape before creating indexes that reference the current columns.
DO $$
DECLARE
  has_image boolean := false;
  has_audio boolean := false;
  has_video boolean := false;
  has_fused boolean := false;
BEGIN
  IF to_regclass('public.content_features') IS NULL THEN
    CREATE TABLE content_features (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      asset_id uuid REFERENCES media_assets(id) ON DELETE CASCADE,
      post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
      modality text NOT NULL DEFAULT 'text',
      model_version text NOT NULL DEFAULT 'legacy',
      feature_json jsonb NOT NULL DEFAULT '{}'::jsonb,
      status text NOT NULL DEFAULT 'ready',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  ELSE
    ALTER TABLE content_features ADD COLUMN IF NOT EXISTS id uuid;
    ALTER TABLE content_features ADD COLUMN IF NOT EXISTS asset_id uuid;
    ALTER TABLE content_features ADD COLUMN IF NOT EXISTS post_id uuid;
    ALTER TABLE content_features ADD COLUMN IF NOT EXISTS modality text;
    ALTER TABLE content_features ADD COLUMN IF NOT EXISTS model_version text;
    ALTER TABLE content_features ADD COLUMN IF NOT EXISTS feature_json jsonb;
    ALTER TABLE content_features ADD COLUMN IF NOT EXISTS status text;
    ALTER TABLE content_features ADD COLUMN IF NOT EXISTS created_at timestamptz;
    ALTER TABLE content_features ADD COLUMN IF NOT EXISTS updated_at timestamptz;

    has_image := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='image_features');
    has_audio := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='audio_features');
    has_video := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='video_features');
    has_fused := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='fused_features');

    ALTER TABLE content_features ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ALTER TABLE content_features ALTER COLUMN modality SET DEFAULT 'text';
    ALTER TABLE content_features ALTER COLUMN model_version SET DEFAULT 'legacy';
    ALTER TABLE content_features ALTER COLUMN feature_json SET DEFAULT '{}'::jsonb;
    ALTER TABLE content_features ALTER COLUMN status SET DEFAULT 'ready';
    ALTER TABLE content_features ALTER COLUMN created_at SET DEFAULT now();
    ALTER TABLE content_features ALTER COLUMN updated_at SET DEFAULT now();

    IF has_image OR has_audio OR has_video OR has_fused THEN
      EXECUTE format('UPDATE content_features SET modality=COALESCE(modality,''text''), model_version=COALESCE(model_version,''legacy''), feature_json=COALESCE(feature_json,''{}''::jsonb), status=COALESCE(status,''ready''), created_at=COALESCE(created_at,now()), updated_at=COALESCE(updated_at,now()), id=COALESCE(id,gen_random_uuid())');
    ELSE
      UPDATE content_features SET modality=COALESCE(modality,'text'), model_version=COALESCE(model_version,'legacy'), feature_json=COALESCE(feature_json,'{}'::jsonb), status=COALESCE(status,'ready'), created_at=COALESCE(created_at,now()), updated_at=COALESCE(updated_at,now()), id=COALESCE(id,gen_random_uuid());
    END IF;
  END IF;
END $$;

ALTER TABLE content_features ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS asset_id uuid;
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS post_id uuid;
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS modality text DEFAULT 'text';
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS model_version text DEFAULT 'legacy';
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS feature_json jsonb DEFAULT '{}'::jsonb;
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS status text DEFAULT 'ready';
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE content_features SET modality=COALESCE(modality,'text'), model_version=COALESCE(model_version,'legacy'), feature_json=COALESCE(feature_json,'{}'::jsonb), status=COALESCE(status,'ready'), created_at=COALESCE(created_at,now()), updated_at=COALESCE(updated_at,now()), id=COALESCE(id,gen_random_uuid());

CREATE INDEX IF NOT EXISTS content_features_post_idx ON content_features(post_id,modality,updated_at DESC);
CREATE INDEX IF NOT EXISTS content_features_asset_idx ON content_features(asset_id,modality,updated_at DESC);

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
