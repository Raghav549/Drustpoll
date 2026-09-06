BEGIN;

-- Repair legacy/partial device rows before enforcing the invariant that every
-- device belongs to an existing user. This migration is intentionally
-- self-contained and safe to run only once through the centralized runner.
DO $$
DECLARE
  has_users boolean;
  has_devices boolean;
BEGIN
  has_users := to_regclass('public.users') IS NOT NULL;
  has_devices := to_regclass('public.devices') IS NOT NULL;

  IF has_users AND has_devices THEN
    -- Remove orphan devices created by older incompatible auth flows.
    DELETE FROM devices d
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = d.user_id);

    -- Recreate the expected foreign key if a legacy schema is missing it.
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      WHERE c.conrelid = 'public.devices'::regclass
        AND c.contype = 'f'
        AND c.conname = 'devices_user_id_fkey'
    ) THEN
      ALTER TABLE devices
        ADD CONSTRAINT devices_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

COMMIT;
