CREATE TABLE IF NOT EXISTS user_hidden_terms(
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  term text NOT NULL,
  kind text NOT NULL DEFAULT 'word' CHECK(kind IN ('word','topic')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,term,kind)
);
CREATE INDEX IF NOT EXISTS user_hidden_terms_user_idx ON user_hidden_terms(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS privacy_consents(
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,purpose)
);
CREATE TABLE IF NOT EXISTS privacy_audit_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  allowed boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS privacy_audit_events_subject_created_idx ON privacy_audit_events(subject_id,created_at DESC);

CREATE TABLE IF NOT EXISTS data_requests(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('export','delete')),
  status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','processing','ready','completed','cancelled','failed')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS data_requests_user_created_idx ON data_requests(user_id,requested_at DESC);

CREATE TABLE IF NOT EXISTS safety_cases(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id uuid REFERENCES content_reports(id) ON DELETE SET NULL,
  state text NOT NULL DEFAULT 'open' CHECK(state IN ('open','reviewing','actioned','appealed','closed')),
  appeal_text text NOT NULL DEFAULT '',
  appeal_status text NOT NULL DEFAULT 'none' CHECK(appeal_status IN ('none','submitted','reviewing','upheld','overturned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS safety_cases_reporter_idx ON safety_cases(reporter_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS security_alerts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK(severity IN ('info','warning','critical')),
  message text NOT NULL,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_alerts_user_created_idx ON security_alerts(user_id,created_at DESC);
