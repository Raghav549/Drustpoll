-- After the legacy-account purge, email signup must be available again.
-- The old purge block is intentionally retired; fresh addresses can register normally.
DROP TABLE IF EXISTS blocked_signup_emails;
