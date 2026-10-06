-- Reauth grants + verification columns for password reset / step-up flows.
-- Mirrors server/migrations/003_auth_sessions_recovery.sql for fresh installs
-- that only run the sql/ migration sequence.

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

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

-- OTP challenge hardening columns (present on legacy databases via migrations/002).
ALTER TABLE otp_challenges ADD COLUMN IF NOT EXISTS consumed_at timestamptz;
ALTER TABLE otp_challenges ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS password_reset_active_idx
  ON password_reset_challenges(user_id, expires_at)
  WHERE consumed_at IS NULL;
