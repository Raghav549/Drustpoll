CREATE TABLE IF NOT EXISTS security_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 event_type text NOT NULL,
 resource_type text,
 resource_id text,
 ip_hash text,
 user_agent_hash text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_events_actor_time_idx ON security_events(actor_id,created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_type_time_idx ON security_events(event_type,created_at DESC);
CREATE TABLE IF NOT EXISTS security_incidents(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 severity text NOT NULL CHECK(severity IN ('low','medium','high','critical')),
 event_type text NOT NULL,
 state text NOT NULL DEFAULT 'open' CHECK(state IN ('open','contained','resolved')),
 details jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz
);
