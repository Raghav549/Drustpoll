CREATE TABLE IF NOT EXISTS profile_verifications (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'identity',
  status text NOT NULL DEFAULT 'unverified' CHECK(status IN ('unverified','pending','verified','revoked')),
  label text,
  verified_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'private' CHECK(visibility IN ('public','followers','private')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,name)
);

CREATE TABLE IF NOT EXISTS profile_collection_items (
  collection_id uuid NOT NULL REFERENCES profile_collections(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(collection_id,post_id)
);

CREATE TABLE IF NOT EXISTS profile_tagged_posts (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tagged_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(post_id,tagged_user_id)
);

CREATE TABLE IF NOT EXISTS profile_locations (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  city text,
  region text,
  country_code text,
  precision text NOT NULL DEFAULT 'city' CHECK(precision IN ('exact','city','region','country')),
  discoverable boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_creator_info (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  category text,
  bio_public text,
  website_url text,
  contact_email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_seller_info (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  shop_id uuid REFERENCES shops(id) ON DELETE SET NULL,
  seller_status text NOT NULL DEFAULT 'inactive' CHECK(seller_status IN ('inactive','pending','active','suspended')),
  support_url text,
  return_policy text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_collection_items_post_idx ON profile_collection_items(post_id,created_at DESC);
CREATE INDEX IF NOT EXISTS profile_tagged_user_time_idx ON profile_tagged_posts(tagged_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS profile_locations_discoverable_idx ON profile_locations(country_code,region,city) WHERE discoverable=true;
CREATE INDEX IF NOT EXISTS profile_collections_user_visibility_idx ON profile_collections(user_id,visibility,created_at DESC);
