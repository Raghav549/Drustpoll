-- Reconcile the two historical shapes of content_features.
--
-- migrate.ts's compatibility pass creates a generic (modality, feature_json) row shape,
-- while the multimodal extraction worker and the ranking/reels services read per-modality
-- columns (text/image/audio/video/fused). Both must exist so feature extraction can write
-- and ranking can read without a hard failure on a fresh database.
--
-- Columns default to empty JSON objects: absent features score as neutral rather than
-- fabricating relevance signals.

ALTER TABLE content_features ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS text_features jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS image_features jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS audio_features jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS video_features jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS fused_features jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS extracted_at timestamptz;
ALTER TABLE content_features ADD COLUMN IF NOT EXISTS error_code text;

-- Carry any legacy generic payload into the fused slot so existing rows stay meaningful.
UPDATE content_features
   SET fused_features = feature_json
 WHERE fused_features = '{}'::jsonb
   AND feature_json IS NOT NULL
   AND feature_json <> '{}'::jsonb;

CREATE INDEX IF NOT EXISTS content_features_post_status_idx ON content_features(post_id, status);
