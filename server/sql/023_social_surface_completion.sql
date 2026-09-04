CREATE TABLE IF NOT EXISTS post_links (
  post_id uuid PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text,
  site_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_polls (
  post_id uuid PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  question text NOT NULL,
  multiple_choice boolean NOT NULL DEFAULT false,
  closes_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS post_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES post_polls(post_id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(post_id,sort_order)
);
CREATE TABLE IF NOT EXISTS post_poll_votes (
  post_id uuid NOT NULL REFERENCES post_polls(post_id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES post_poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(post_id,option_id,user_id)
);

CREATE TABLE IF NOT EXISTS post_reposts (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quote text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(post_id,user_id)
);

CREATE TABLE IF NOT EXISTS post_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,name)
);
CREATE TABLE IF NOT EXISTS post_collection_items (
  collection_id uuid NOT NULL REFERENCES post_collections(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(collection_id,post_id)
);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_type text NOT NULL CHECK(object_type IN ('post','reel','product','creator','topic')),
  object_id uuid NOT NULL,
  signal text NOT NULL CHECK(signal IN ('more_like_this','less_like_this','not_interested','hide','mute','report')),
  context text NOT NULL DEFAULT 'feed',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,object_type,object_id,signal,context)
);
CREATE INDEX IF NOT EXISTS recommendation_feedback_user_time_idx ON recommendation_feedback(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS hidden_topics (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,topic)
);

CREATE TABLE IF NOT EXISTS feed_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'for_you' CHECK(mode IN ('for_you','following','latest')),
  topic text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feed_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_reposts_user_idx ON post_reposts(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS poll_votes_user_idx ON post_poll_votes(user_id,created_at DESC);
