-- Discovery/search indexes. Guard each index so partial migrations do not
-- prevent the migration chain from reaching the later schema definitions.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users') THEN
    CREATE INDEX IF NOT EXISTS users_username_lower_idx ON users (lower(username));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='display_name') THEN
    CREATE INDEX IF NOT EXISTS profiles_display_name_lower_idx ON profiles (lower(display_name));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='posts') THEN
    CREATE INDEX IF NOT EXISTS posts_caption_lower_idx ON posts (lower(caption)) WHERE deleted_at IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') THEN
    CREATE INDEX IF NOT EXISTS products_title_lower_idx ON products (lower(title)) WHERE status='active';
  END IF;
END $$;
