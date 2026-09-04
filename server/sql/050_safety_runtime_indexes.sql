CREATE INDEX IF NOT EXISTS privacy_consents_user_idx ON privacy_consents(user_id);
CREATE INDEX IF NOT EXISTS privacy_audit_events_actor_created_idx ON privacy_audit_events(actor_id,created_at DESC);
CREATE INDEX IF NOT EXISTS content_report_evidence_media_idx ON content_report_evidence(media_id) WHERE media_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_restrictions_user_idx ON user_restrictions(user_id,created_at DESC);
INSERT INTO schema_migrations(version) VALUES('050_safety_runtime_indexes.sql') ON CONFLICT DO NOTHING;
