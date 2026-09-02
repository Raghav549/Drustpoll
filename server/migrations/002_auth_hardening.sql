BEGIN;

ALTER TABLE otp_challenges
  ADD COLUMN IF NOT EXISTS consumed_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS sessions_user_active_idx
  ON sessions(user_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS otp_active_lookup_idx
  ON otp_challenges(user_id, purpose, destination_fingerprint, created_at DESC)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS security_events_user_time_idx
  ON security_events(user_id, created_at DESC);

COMMIT;
