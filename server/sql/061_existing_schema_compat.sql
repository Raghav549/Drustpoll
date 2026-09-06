-- Existing installations may have been created by an earlier schema revision.
-- Keep startup migrations forward-only and make the known profile/search field
-- compatible with either schema shape.

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='display_name'
    ) THEN
      NULL;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='name'
    ) THEN
      ALTER TABLE profiles ADD COLUMN display_name text NOT NULL DEFAULT '';
      UPDATE profiles SET display_name = name WHERE display_name = '';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name'
    ) THEN
      ALTER TABLE profiles ADD COLUMN display_name text NOT NULL DEFAULT '';
      UPDATE profiles SET display_name = full_name WHERE display_name = '';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='display_name') THEN
    CREATE INDEX IF NOT EXISTS profiles_display_name_lower_idx ON profiles (lower(display_name));
  END IF;
END $$;
