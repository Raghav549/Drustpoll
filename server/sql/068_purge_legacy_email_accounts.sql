-- Purge the currently existing legacy email accounts while retaining only a
-- one-way identifier block so those same email addresses cannot be registered again.
CREATE TABLE IF NOT EXISTS blocked_signup_emails (
  email_hash bytea PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO blocked_signup_emails(email_hash)
SELECT DISTINCT digest(lower(trim(email)), 'sha256')
FROM users
WHERE email IS NOT NULL
ON CONFLICT DO NOTHING;

DELETE FROM users
WHERE email IS NOT NULL;
