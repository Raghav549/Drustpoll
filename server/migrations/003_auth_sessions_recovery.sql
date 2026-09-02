BEGIN;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS family_id uuid,
  ADD COLUMN IF NOT EXISTS refresh_token_hash bytea UNIQUE,
  ADD COLUMN IF NOT EXISTS refresh_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS rotated_at timestamptz,
  ADD COLUMN IF NOT EXISTS replaced_by_session_id uuid,
  ADD COLUMN IF NOT EXISTS reuse_detected_at timestamptz,
  ADD COLUMN IF NOT EXISTS reauth_at timestamptz;

CREATE INDEX IF NOT EXISTS sessions_family_idx ON sessions(family_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS sessions_refresh_idx ON sessions(refresh_expires_at) WHERE revoked_at IS NULL;

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS device_key_fingerprint bytea;

CREATE UNIQUE INDEX IF NOT EXISTS devices_user_key_uq
  ON devices(user_id, device_key_fingerprint)
  WHERE revoked_at IS NULL AND device_key_fingerprint IS NOT NULL;

CREATE TABLE IF NOT EXISTS reauth_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  token_hash bytea NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);
CREATE INDEX IF NOT EXISTS reauth_grants_session_idx ON reauth_grants(session_id, expires_at) WHERE consumed_at IS NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

CREATE INDEX IF NOT EXISTS password_reset_active_idx
  ON password_reset_challenges(user_id, expires_at)
  WHERE consumed_at IS NULL;

COMMIT;
