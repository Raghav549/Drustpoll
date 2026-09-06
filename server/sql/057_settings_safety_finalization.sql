CREATE TABLE IF NOT EXISTS privacy_consents(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 consent_type text NOT NULL,
 version text NOT NULL,
 granted boolean NOT NULL DEFAULT false,
 granted_at timestamptz,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS privacy_consents_user_type_version_uq ON privacy_consents(user_id,consent_type,version);

CREATE TABLE IF NOT EXISTS security_device_recovery(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
 state text NOT NULL DEFAULT 'open' CHECK(state IN ('open','verified','completed','cancelled')),
 reason text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS security_device_recovery_user_created_idx ON security_device_recovery(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS safety_restriction_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 target_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 action text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS safety_restriction_events_actor_target_idx ON safety_restriction_events(actor_id,target_id,created_at DESC);

ALTER TABLE safety_cases ADD COLUMN IF NOT EXISTS appeal_status text NOT NULL DEFAULT 'none';
ALTER TABLE safety_cases ADD COLUMN IF NOT EXISTS appeal_body text NOT NULL DEFAULT '';
ALTER TABLE safety_cases ADD COLUMN IF NOT EXISTS evidence_count integer NOT NULL DEFAULT 0;
ALTER TABLE safety_cases ADD COLUMN IF NOT EXISTS resolution_code text;

-- Marking this migration as applied is handled centrally by migrate.ts.
