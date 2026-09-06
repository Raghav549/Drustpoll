-- Final migration compatibility guard.
-- Never assume a pre-existing table has the current schema; normalize the
-- feature table before creating indexes that reference newer columns.
DO $$
DECLARE
  has_text_features boolean;
  has_image_features boolean;
  has_audio_features boolean;
  has_video_features boolean;
  has_fused_features boolean;
BEGIN
  IF to_regclass('public.content_features') IS NULL THEN
    CREATE TABLE content_features (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      asset_id uuid REFERENCES media_assets(id) ON DELETE CASCADE,
      post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
      modality text NOT NULL DEFAULT 'text' CHECK(modality IN ('text','image','audio','video','fused')),
      model_version text NOT NULL DEFAULT 'legacy',
      feature_json jsonb NOT NULL DEFAULT '{}'::jsonb,
      status text NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','stale','invalid')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CHECK(asset_id IS NOT NULL OR post_id IS NOT NULL),
      UNIQUE(asset_id,modality,model_version)
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

    ALTER TABLE content_features ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ALTER TABLE content_features ALTER COLUMN modality SET DEFAULT 'text';
    ALTER TABLE content_features ALTER COLUMN model_version SET DEFAULT 'legacy';
    ALTER TABLE content_features ALTER COLUMN feature_json SET DEFAULT '{}'::jsonb;
    ALTER TABLE content_features ALTER COLUMN status SET DEFAULT 'ready';
    ALTER TABLE content_features ALTER COLUMN created_at SET DEFAULT now();
    ALTER TABLE content_features ALTER COLUMN updated_at SET DEFAULT now();

    has_text_features := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='text_features');
    has_image_features := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='image_features');
    has_audio_features := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='audio_features');
    has_video_features := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='video_features');
    has_fused_features := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='fused_features');

    IF has_text_features OR has_image_features OR has_audio_features OR has_video_features OR has_fused_features THEN
      EXECUTE format($fmt$
        UPDATE content_features
        SET modality = COALESCE(modality,
          CASE
            WHEN %s AND image_features IS NOT NULL AND image_features <> '{}'::jsonb THEN 'image'
            WHEN %s AND audio_features IS NOT NULL AND audio_features <> '{}'::jsonb THEN 'audio'
            WHEN %s AND video_features IS NOT NULL AND video_features <> '{}'::jsonb THEN 'video'
            WHEN %s AND fused_features IS NOT NULL AND fused_features <> '{}'::jsonb THEN 'fused'
            ELSE 'text'
          END),
          model_version = COALESCE(model_version,'legacy'),
          feature_json = COALESCE(feature_json, '{}'::jsonb),
          status = COALESCE(status,'ready'),
          created_at = COALESCE(created_at,now()),
          updated_at = COALESCE(updated_at,now()),
          id = COALESCE(id,gen_random_uuid())
      $fmt$, has_image_features, has_audio_features, has_video_features, has_fused_features);
    ELSE
      UPDATE content_features
      SET modality=COALESCE(modality,'text'), model_version=COALESCE(model_version,'legacy'), feature_json=COALESCE(feature_json,'{}'::jsonb), status=COALESCE(status,'ready'), created_at=COALESCE(created_at,now()), updated_at=COALESCE(updated_at,now()), id=COALESCE(id,gen_random_uuid());
    END IF;

    BEGIN
      ALTER TABLE content_features ALTER COLUMN modality SET NOT NULL;
      ALTER TABLE content_features ALTER COLUMN model_version SET NOT NULL;
      ALTER TABLE content_features ALTER COLUMN feature_json SET NOT NULL;
      ALTER TABLE content_features ALTER COLUMN status SET NOT NULL;
      ALTER TABLE content_features ALTER COLUMN created_at SET NOT NULL;
      ALTER TABLE content_features ALTER COLUMN updated_at SET NOT NULL;
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;

  CREATE INDEX IF NOT EXISTS content_features_post_idx ON content_features(post_id,modality,updated_at DESC);
  CREATE INDEX IF NOT EXISTS content_features_asset_idx ON content_features(asset_id,modality,updated_at DESC);
END $$;
