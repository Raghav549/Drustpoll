ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS available_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS lease_until timestamptz;

UPDATE media_jobs SET available_at=COALESCE(available_at,created_at) WHERE available_at IS NULL;

CREATE INDEX IF NOT EXISTS media_jobs_queue_idx
  ON media_jobs(status,available_at,created_at);

CREATE INDEX IF NOT EXISTS media_jobs_lease_idx
  ON media_jobs(status,lease_until)
  WHERE status='running';
