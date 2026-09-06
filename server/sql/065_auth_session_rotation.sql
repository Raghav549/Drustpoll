ALTER TABLE sessions ADD COLUMN IF NOT EXISTS family_id UUID;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS refresh_token_hash BYTEA;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS refresh_expires_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS replaced_by_session_id UUID;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS reuse_detected_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS sessions_refresh_token_uq ON sessions(refresh_token_hash) WHERE refresh_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS sessions_family_id_idx ON sessions(family_id) WHERE revoked_at IS NULL;
