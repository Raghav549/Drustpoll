ALTER TABLE account_contacts ADD COLUMN IF NOT EXISTS pending_email text;
ALTER TABLE account_contacts ADD COLUMN IF NOT EXISTS pending_phone text;

CREATE TABLE IF NOT EXISTS privacy_control_history(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  control text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS privacy_control_history_user_created_idx ON privacy_control_history(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS security_authenticators(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('passkey','password')),
  label text NOT NULL DEFAULT '',
  credential_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS security_authenticators_credential_idx ON security_authenticators(credential_id) WHERE credential_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS security_authenticators_user_idx ON security_authenticators(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS security_login_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outcome text NOT NULL CHECK(outcome IN ('success','failure','blocked')),
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_login_events_user_created_idx ON security_login_events(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS safety_appeal_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES safety_cases(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS safety_appeal_events_case_created_idx ON safety_appeal_events(case_id,created_at ASC);
CREATE TABLE IF NOT EXISTS account_restrictions(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'clear' CHECK(state IN ('clear','limited','locked','recovery')),
  reason text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
