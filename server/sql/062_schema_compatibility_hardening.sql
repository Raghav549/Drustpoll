-- Final compatibility guard for fresh and previously-partially-migrated databases.
-- The migration chain historically contained two incompatible shapes for
-- content_features. Normalize the table before any later migration assumes
-- the polymorphic columns exist.
DO $$
BEGIN
  IF to_regclass('public.content_features') IS NULL THEN
    CREATE TABLE content_features (
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
    ALTER TABLE content_features ALTER COLUMN feature_json SET DEFAULT '{}'::jsonb;
    ALTER TABLE content_features ALTER COLUMN status SET DEFAULT 'ready';
    ALTER TABLE content_features ALTER COLUMN created_at SET DEFAULT now();
    ALTER TABLE content_features ALTER COLUMN updated_at SET DEFAULT now();

    UPDATE content_features
      SET modality = COALESCE(modality,
        CASE
          WHEN COALESCE(jsonb_typeof(image_features), 'null') = 'object' AND image_features <> '{}'::jsonb THEN 'image'
          WHEN COALESCE(jsonb_typeof(audio_features), 'null') = 'object' AND audio_features <> '{}'::jsonb THEN 'audio'
          WHEN COALESCE(jsonb_typeof(video_features), 'null') = 'object' AND video_features <> '{}'::jsonb THEN 'video'
          WHEN COALESCE(jsonb_typeof(fused_features), 'null') = 'object' AND fused_features <> '{}'::jsonb THEN 'fused'
          ELSE 'text'
        END
      );

    UPDATE content_features
      SET model_version = COALESCE(model_version,'legacy'),
          feature_json = COALESCE(feature_json,
            jsonb_build_object(
              'text_features', COALESCE(text_features, '{}'::jsonb),
              'image_features', COALESCE(image_features, '{}'::jsonb),
              'audio_features', COALESCE(audio_features, '{}'::jsonb),
              'video_features', COALESCE(video_features, '{}'::jsonb),
              'fused_features', COALESCE(fused_features, '{}'::jsonb)
            )
          ),
          status = COALESCE(status,'ready'),
          created_at = COALESCE(created_at,now()),
          updated_at = COALESCE(updated_at,now()),
          id = COALESCE(id,gen_random_uuid());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_features' AND column_name='id') THEN
    BEGIN
      ALTER TABLE content_features ALTER COLUMN id SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS content_features_post_idx ON content_features(post_id,modality,updated_at DESC);
CREATE INDEX IF NOT EXISTS content_features_asset_idx ON content_features(asset_id,modality,updated_at DESC);
