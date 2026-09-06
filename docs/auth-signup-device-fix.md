# Auth signup device integrity fix

The signup flow was observed failing at session/device creation with `devices_user_id_fkey` after user creation. The repository now contains migration `server/sql/063_auth_device_integrity.sql`, and the centralized migration runner includes it. The migration removes orphaned device rows and restores the expected `devices_user_id_fkey` when absent, before subsequent runtime use.

The signup service itself should create the user before creating its device/session and should treat OTP delivery as a separate post-session concern so mail transport failure cannot roll back an otherwise valid account.
