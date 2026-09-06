CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_username_trgm_idx ON users USING gin (lower(username) gin_trgm_ops);
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='display_name') THEN
    CREATE INDEX IF NOT EXISTS profiles_display_name_trgm_idx ON profiles USING gin (lower(display_name) gin_trgm_ops);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS posts_caption_trgm_idx ON posts USING gin (lower(caption) gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS products_title_trgm_idx ON products USING gin (lower(title) gin_trgm_ops) WHERE status='active';
