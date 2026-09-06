-- Security audit schema. Existing databases may already contain the older
-- user-centric security_events shape; normalize it before adding indexes.
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

ALTER TABLE security_events ADD COLUMN IF NOT EXISTS actor_id uuid;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS resource_type text;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS resource_id text;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS ip_hash text;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS user_agent_hash text;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS created_at timestamptz;

ALTER TABLE security_events ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;
ALTER TABLE security_events ALTER COLUMN created_at SET DEFAULT now();

UPDATE security_events
SET actor_id=COALESCE(actor_id,user_id),
    event_type=COALESCE(event_type,event_type_legacy,'unknown'),
    metadata=COALESCE(metadata,'{}'::jsonb),
    created_at=COALESCE(created_at,now())
WHERE actor_id IS NULL OR event_type IS NULL OR metadata IS NULL OR created_at IS NULL;

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
