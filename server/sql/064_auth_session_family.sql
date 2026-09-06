ALTER TABLE sessions ADD COLUMN IF NOT EXISTS family_id UUID;
CREATE INDEX IF NOT EXISTS sessions_family_id_idx ON sessions(family_id) WHERE revoked_at IS NULL;
