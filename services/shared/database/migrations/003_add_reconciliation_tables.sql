-- Migration: Add Reconciliation Tables
-- Version: 003
-- Description: Tables for tracking reconciliation between Fabric and CBC

-- Reconciliation Log Table
CREATE TABLE IF NOT EXISTS reconciliation_log (
    id SERIAL PRIMARY KEY,
    mismatches_found INT NOT NULL DEFAULT 0,
    duration_ms INT NOT NULL,
    run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT
);

-- Reconciliation Issues Table
CREATE TABLE IF NOT EXISTS reconciliation_issues (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    fabric_value JSONB,
    cbc_value JSONB,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolved BOOLEAN DEFAULT FALSE,
    resolution_strategy VARCHAR(50),
    resolved_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    notes TEXT
);

-- Indexes for reconciliation_log
CREATE INDEX idx_reconciliation_log_run_at ON reconciliation_log(run_at DESC);
CREATE INDEX idx_reconciliation_log_status ON reconciliation_log(status);

-- Indexes for reconciliation_issues
CREATE INDEX idx_reconciliation_issues_resolved ON reconciliation_issues(resolved, created_at);
CREATE INDEX idx_reconciliation_issues_severity ON reconciliation_issues(severity, resolved);
CREATE INDEX idx_reconciliation_issues_type ON reconciliation_issues(type, entity_id);

-- Comments
COMMENT ON TABLE reconciliation_log IS 'Tracks reconciliation runs';
COMMENT ON COLUMN reconciliation_log.mismatches_found IS 'Number of mismatches detected in this run';
COMMENT ON COLUMN reconciliation_log.duration_ms IS 'Duration of reconciliation in milliseconds';

COMMENT ON TABLE reconciliation_issues IS 'Tracks data mismatches between Fabric and CBC';
COMMENT ON COLUMN reconciliation_issues.type IS 'Type of mismatch: exporter_status, license_status, etc.';
COMMENT ON COLUMN reconciliation_issues.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN reconciliation_issues.resolution_strategy IS 'Strategy used: fabric_wins, cbc_wins, manual_review';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON reconciliation_log TO postgres;
GRANT SELECT, INSERT, UPDATE ON reconciliation_issues TO postgres;
GRANT USAGE, SELECT ON SEQUENCE reconciliation_log_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE reconciliation_issues_id_seq TO postgres;
