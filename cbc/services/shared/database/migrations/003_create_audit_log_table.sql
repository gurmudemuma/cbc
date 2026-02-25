-- Audit log table for pre-registration system
-- Enhanced audit trail for compliance and regulatory tracking

CREATE TABLE IF NOT EXISTS preregistration_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    
    -- User Information
    user_id VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    organization_id VARCHAR(100) NOT NULL,
    
    -- Action Details
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    
    -- Session Information
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Timing
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Classification
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    compliance_relevant BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Retention
    retention_period_days INTEGER DEFAULT 2555, -- 7 years for compliance
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_audit_log_timestamp ON preregistration_audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_event_type ON preregistration_audit_log(event_type);
CREATE INDEX idx_audit_log_entity ON preregistration_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user_id ON preregistration_audit_log(user_id);
CREATE INDEX idx_audit_log_organization ON preregistration_audit_log(organization_id);
CREATE INDEX idx_audit_log_severity ON preregistration_audit_log(severity);
CREATE INDEX idx_audit_log_compliance ON preregistration_audit_log(compliance_relevant);
CREATE INDEX idx_audit_log_session ON preregistration_audit_log(session_id);

-- Composite indexes for common queries
CREATE INDEX idx_audit_log_compliance_period ON preregistration_audit_log(compliance_relevant, timestamp DESC) WHERE compliance_relevant = TRUE;
CREATE INDEX idx_audit_log_critical_events ON preregistration_audit_log(severity, timestamp DESC) WHERE severity = 'CRITICAL';
CREATE INDEX idx_audit_log_entity_timeline ON preregistration_audit_log(entity_type, entity_id, timestamp DESC);

-- Partial index for active (non-archived) records
CREATE INDEX idx_audit_log_active ON preregistration_audit_log(timestamp DESC) WHERE archived = FALSE;

-- Function to automatically archive old records
CREATE OR REPLACE FUNCTION archive_old_audit_records()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE preregistration_audit_log 
    SET archived = TRUE, archived_at = CURRENT_TIMESTAMP
    WHERE archived = FALSE 
    AND timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_period_days;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run archival (requires pg_cron extension)
-- SELECT cron.schedule('archive-audit-logs', '0 2 * * *', 'SELECT archive_old_audit_records();');

-- View for compliance reporting
CREATE OR REPLACE VIEW compliance_audit_summary AS
SELECT 
    DATE_TRUNC('day', timestamp) as audit_date,
    event_type,
    entity_type,
    severity,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT entity_id) as unique_entities
FROM preregistration_audit_log
WHERE compliance_relevant = TRUE
AND archived = FALSE
GROUP BY DATE_TRUNC('day', timestamp), event_type, entity_type, severity
ORDER BY audit_date DESC;

-- View for security monitoring
CREATE OR REPLACE VIEW security_audit_summary AS
SELECT 
    DATE_TRUNC('hour', timestamp) as audit_hour,
    user_id,
    organization_id,
    ip_address,
    COUNT(*) as event_count,
    COUNT(DISTINCT event_type) as unique_event_types,
    MAX(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as has_critical_events
FROM preregistration_audit_log
WHERE event_type IN ('SYSTEM_ACCESS', 'UNAUTHORIZED_ACCESS', 'DATA_EXPORT')
AND archived = FALSE
AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp), user_id, organization_id, ip_address
ORDER BY audit_hour DESC;

-- View for exporter activity tracking
CREATE OR REPLACE VIEW exporter_audit_activity AS
SELECT 
    entity_id as exporter_id,
    COUNT(*) as total_events,
    COUNT(DISTINCT event_type) as unique_event_types,
    MIN(timestamp) as first_activity,
    MAX(timestamp) as last_activity,
    COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_events,
    COUNT(CASE WHEN event_type LIKE '%_REJECTED' THEN 1 END) as rejection_events,
    COUNT(CASE WHEN event_type LIKE '%_APPROVED' OR event_type LIKE '%_ISSUED' THEN 1 END) as approval_events
FROM preregistration_audit_log
WHERE entity_type = 'exporter_profile'
AND archived = FALSE
GROUP BY entity_id
ORDER BY last_activity DESC;

-- Comments
COMMENT ON TABLE preregistration_audit_log IS 'Comprehensive audit trail for pre-registration system activities';
COMMENT ON COLUMN preregistration_audit_log.event_type IS 'Type of event that occurred (e.g., PROFILE_CREATED, LICENSE_ISSUED)';
COMMENT ON COLUMN preregistration_audit_log.entity_type IS 'Type of entity affected (e.g., exporter_profile, export_license)';
COMMENT ON COLUMN preregistration_audit_log.entity_id IS 'ID of the specific entity affected';
COMMENT ON COLUMN preregistration_audit_log.old_values IS 'Previous values before the change (JSON)';
COMMENT ON COLUMN preregistration_audit_log.new_values IS 'New values after the change (JSON)';
COMMENT ON COLUMN preregistration_audit_log.metadata IS 'Additional context and metadata (JSON)';
COMMENT ON COLUMN preregistration_audit_log.severity IS 'Severity level of the event for monitoring and alerting';
COMMENT ON COLUMN preregistration_audit_log.compliance_relevant IS 'Whether this event is relevant for regulatory compliance reporting';
COMMENT ON COLUMN preregistration_audit_log.retention_period_days IS 'Number of days to retain this record before archival';

-- Trigger to prevent modification of audit records
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Only allow archival updates
        IF OLD.archived = FALSE AND NEW.archived = TRUE THEN
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Audit records cannot be modified';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Audit records cannot be deleted';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_modification_trigger
    BEFORE UPDATE OR DELETE ON preregistration_audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
