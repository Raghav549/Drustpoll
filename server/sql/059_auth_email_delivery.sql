ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
CREATE INDEX IF NOT EXISTS users_email_verification_idx ON users(id,email_verified_at) WHERE email IS NOT NULL;
