-- Clean legacy authentication artifacts once, then require verified contacts for sessions.
-- Existing users are intentionally removed so old credentials/sessions cannot bypass the fresh signup flow.
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE otp_challenges CASCADE;
TRUNCATE TABLE password_reset_challenges CASCADE;
