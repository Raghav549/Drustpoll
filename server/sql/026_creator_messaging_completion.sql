ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'post' CHECK(content_type IN ('post','video','reel','poll','link','product','quote'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_warning text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_label text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS allow_comments boolean NOT NULL DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS post_mentions (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_offset integer NOT NULL DEFAULT 0,
  end_offset integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(post_id,user_id,start_offset)
);
CREATE INDEX IF NOT EXISTS post_mentions_user_idx ON post_mentions(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS post_product_tags (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(post_id,product_id)
);
CREATE INDEX IF NOT EXISTS post_product_tags_product_idx ON post_product_tags(product_id,created_at DESC);

CREATE TABLE IF NOT EXISTS creator_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creator_drafts_user_time_idx ON creator_drafts(user_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS message_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  typing_indicators boolean NOT NULL DEFAULT true,
  read_receipts boolean NOT NULL DEFAULT true,
  disappearing_default_seconds integer CHECK(disappearing_default_seconds IS NULL OR disappearing_default_seconds BETWEEN 5 AND 2592000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS message_typing (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(conversation_id,user_id)
);
CREATE TABLE IF NOT EXISTS message_reactions (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(message_id,user_id)
);
CREATE TABLE IF NOT EXISTS message_pins (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(conversation_id,message_id)
);
CREATE TABLE IF NOT EXISTS message_replies (
  message_id uuid PRIMARY KEY REFERENCES messages(id) ON DELETE CASCADE,
  parent_message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE
);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS disappearing_at timestamptz;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_metadata jsonb;
CREATE INDEX IF NOT EXISTS message_typing_expiry_idx ON message_typing(expires_at);
CREATE INDEX IF NOT EXISTS message_pins_conversation_idx ON message_pins(conversation_id,created_at DESC);
