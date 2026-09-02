CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK(media_type IN ('image','video')),
  storage_key text NOT NULL UNIQUE,
  original_filename text,
  declared_mime text,
  detected_mime text,
  byte_size bigint,
  width integer,
  height integer,
  duration_ms integer,
  status text NOT NULL DEFAULT 'pending_upload' CHECK(status IN ('pending_upload','uploaded','scanning','ready','rejected','deleted')),
  moderation_status text NOT NULL DEFAULT 'pending' CHECK(moderation_status IN ('pending','approved','rejected','review')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_assets_owner_idx ON media_assets(owner_id,created_at DESC);
CREATE INDEX IF NOT EXISTS media_assets_status_idx ON media_assets(status,updated_at);

CREATE TABLE IF NOT EXISTS media_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  job_type text NOT NULL CHECK(job_type IN ('probe','scan','transcode','thumbnail','moderation')),
  status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','succeeded','failed','cancelled')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count >= 0),
  input_version integer NOT NULL DEFAULT 1,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  UNIQUE(asset_id,job_type,input_version)
);
CREATE INDEX IF NOT EXISTS media_jobs_queue_idx ON media_jobs(status,created_at) WHERE status IN ('queued','running');

CREATE TABLE IF NOT EXISTS media_renditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  rendition_type text NOT NULL CHECK(rendition_type IN ('original','thumbnail','preview','hls','dash','image')),
  storage_key text NOT NULL UNIQUE,
  mime_type text,
  width integer,
  height integer,
  bitrate integer,
  duration_ms integer,
  byte_size bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(asset_id,rendition_type,width,height,bitrate)
);
CREATE INDEX IF NOT EXISTS media_renditions_asset_idx ON media_renditions(asset_id,rendition_type);
