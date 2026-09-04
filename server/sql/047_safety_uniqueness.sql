CREATE UNIQUE INDEX IF NOT EXISTS safety_cases_report_unique ON safety_cases(report_id) WHERE report_id IS NOT NULL;
