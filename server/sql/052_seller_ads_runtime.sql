CREATE INDEX IF NOT EXISTS ad_feedback_user_creative_created_idx ON ad_feedback(user_id,creative_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS business_verification_pending_unique_idx ON business_verification_requests(user_id) WHERE status IN ('pending','needs_info');
CREATE UNIQUE INDEX IF NOT EXISTS ad_campaign_name_user_idx ON ad_campaigns(advertiser_user_id,name);
INSERT INTO schema_migrations(version) VALUES('052_seller_ads_runtime.sql') ON CONFLICT DO NOTHING;
