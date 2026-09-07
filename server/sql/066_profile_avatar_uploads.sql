CREATE TABLE IF NOT EXISTS profile_avatar_uploads (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
