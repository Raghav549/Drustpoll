ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'public' CHECK(profile_visibility IN ('public','followers','private'));
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS activity_visibility text NOT NULL DEFAULT 'followers' CHECK(activity_visibility IN ('everyone','followers','only_me'));
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS discoverability text NOT NULL DEFAULT 'discoverable' CHECK(discoverability IN ('discoverable','hidden'));
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS message_requests text NOT NULL DEFAULT 'followers' CHECK(message_requests IN ('everyone','followers','nobody'));
CREATE TABLE IF NOT EXISTS privacy_settings(
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 personalized_recommendations boolean NOT NULL DEFAULT true,
 personalized_ads boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
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
CREATE INDEX IF NOT EXISTS privacy_audit_subject_time_idx ON privacy_audit_events(subject_id,created_at DESC);
