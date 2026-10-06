CREATE TABLE IF NOT EXISTS message_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  CONSTRAINT message_requests_distinct_users CHECK (requester_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS message_requests_recipient_status_created_idx
  ON message_requests(recipient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS message_requests_requester_status_created_idx
  ON message_requests(requester_id, status, created_at DESC);
