CREATE INDEX IF NOT EXISTS otp_user_purpose_active_idx ON otp_challenges(user_id,purpose,created_at DESC) WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS password_reset_user_active_idx ON password_reset_challenges(user_id,created_at DESC) WHERE consumed_at IS NULL;
