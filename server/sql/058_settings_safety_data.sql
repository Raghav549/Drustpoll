CREATE INDEX IF NOT EXISTS privacy_audit_events_subject_created_idx ON privacy_audit_events(subject_id,created_at DESC);
CREATE INDEX IF NOT EXISTS data_requests_user_requested_idx ON data_requests(user_id,requested_at DESC);
CREATE INDEX IF NOT EXISTS content_report_evidence_report_created_idx ON content_report_evidence(report_id,created_at ASC);
CREATE INDEX IF NOT EXISTS safety_cases_reporter_updated_idx ON safety_cases(reporter_id,updated_at DESC);

ALTER TABLE privacy_consents ADD CONSTRAINT privacy_consents_version_nonempty CHECK(length(trim(version))>0);
ALTER TABLE privacy_consents ADD CONSTRAINT privacy_consents_type_nonempty CHECK(length(trim(consent_type))>0);

INSERT INTO schema_migrations(version) VALUES('058_settings_safety_data.sql') ON CONFLICT DO NOTHING;
