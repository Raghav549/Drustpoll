CREATE TABLE IF NOT EXISTS content_report_evidence(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES content_reports(id) ON DELETE CASCADE,
  media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_report_evidence_report_idx ON content_report_evidence(report_id,created_at ASC);

CREATE TABLE IF NOT EXISTS user_restrictions(
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT 'safety',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,target_user_id),
  CHECK(user_id<>target_user_id)
);
CREATE INDEX IF NOT EXISTS user_restrictions_target_idx ON user_restrictions(target_user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS moderation_notices(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_type text NOT NULL,
  object_id text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action text NOT NULL DEFAULT 'removed',
  appeal_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,object_type,object_id)
);
CREATE INDEX IF NOT EXISTS moderation_notices_user_idx ON moderation_notices(user_id,created_at DESC);
