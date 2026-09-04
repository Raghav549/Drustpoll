CREATE TABLE IF NOT EXISTS account_contacts(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email text,
  phone text,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS privacy_policy_acceptances(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document text NOT NULL,
  version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,document,version)
);

CREATE TABLE IF NOT EXISTS privacy_downloads(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES data_requests(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK(kind IN ('export','history')),
  filename text,
  status text NOT NULL DEFAULT 'available' CHECK(status IN ('available','expired','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS privacy_downloads_user_created_idx ON privacy_downloads(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS recommendation_control_state(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  reset_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_events_user_created_idx ON security_events(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS safety_case_evidence(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES safety_cases(id) ON DELETE CASCADE,
  evidence_type text NOT NULL CHECK(evidence_type IN ('note','media')),
  reference_id text,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS safety_case_evidence_case_idx ON safety_case_evidence(case_id,created_at ASC);

CREATE TABLE IF NOT EXISTS account_restrictions(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'clear' CHECK(state IN ('clear','limited','locked','recovery')),
  reason text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations(version) VALUES('048_settings_safety_completion.sql') ON CONFLICT DO NOTHING;
