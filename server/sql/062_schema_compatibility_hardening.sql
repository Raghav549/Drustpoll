-- Final compatibility repair for fresh and previously-partially-migrated DBs.
-- This migration is deliberately self-contained so a legacy content_features
-- table cannot make later indexes fail on missing modality columns.
DO $$
DECLARE
  has_image boolean := false;
  has_audio boolean := false;
  has_video boolean := false;
  has_fused boolean := false;
  has_text boolean := false;
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
    has_image := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='image_features');
    has_audio := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='audio_features');
    has_video := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='video_features');
    has_fused := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='fused_features');
    has_text := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='text_features');

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

    IF has_text OR has_image OR has_audio OR has_video OR has_fused THEN
      IF has_text THEN
        EXECUTE 'UPDATE content_features SET modality=COALESCE(modality,''text''), feature_json=COALESCE(feature_json,jsonb_build_object(''text_features'',COALESCE(text_features,''{}''::jsonb))), model_version=COALESCE(model_version,''legacy''), status=COALESCE(status,''ready''), created_at=COALESCE(created_at,now()), updated_at=COALESCE(updated_at,now()), id=COALESCE(id,gen_random_uuid())';
      ELSE
        UPDATE content_features
           SET modality=COALESCE(modality,'text'),
               feature_json=COALESCE(feature_json,'{}'::jsonb),
               model_version=COALESCE(model_version,'legacy'),
               status=COALESCE(status,'ready'),
               created_at=COALESCE(created_at,now()),
               updated_at=COALESCE(updated_at,now()),
               id=COALESCE(id,gen_random_uuid());
      END IF;
    ELSE
      UPDATE content_features
         SET modality=COALESCE(modality,'text'),
             feature_json=COALESCE(feature_json,'{}'::jsonb),
             model_version=COALESCE(model_version,'legacy'),
             status=COALESCE(status,'ready'),
             created_at=COALESCE(created_at,now()),
             updated_at=COALESCE(updated_at,now()),
             id=COALESCE(id,gen_random_uuid());
    END IF;
  END IF;

  CREATE INDEX IF NOT EXISTS content_features_post_idx ON content_features(post_id,modality,updated_at DESC);
  CREATE INDEX IF NOT EXISTS content_features_asset_idx ON content_features(asset_id,modality,updated_at DESC);
END $$;
