-- Compatibility repair for legacy device rows.
-- Delete orphaned rows before the FK is enforced by the schema.
DO $$
BEGIN
  IF to_regclass('public.devices') IS NOT NULL AND to_regclass('public.users') IS NOT NULL THEN
    DELETE FROM devices d WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id=d.user_id);
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      WHERE c.conrelid='public.devices'::regclass
        AND c.contype='f'
        AND c.conname='devices_user_id_fkey'
    ) THEN
      ALTER TABLE devices ADD CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
