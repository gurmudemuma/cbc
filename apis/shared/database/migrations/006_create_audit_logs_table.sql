-- Comprehensive Audit Logging Table
-- Tracks all system operations for compliance and security

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Timestamp
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- User Information
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    
    -- Action Information
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    
    -- Changes
    changes JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE')),
    status_code INTEGER,
    error_message TEXT,
    
    -- Request Information
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Organization Information
    organization_id VARCHAR(255),
    msp_id VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_msp_id ON audit_logs(msp_id);

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_resource_timestamp ON audit_logs(resource_type, resource_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action_timestamp ON audit_logs(action, timestamp DESC);

-- Partitioning by month for large datasets (optional, uncomment if needed)
-- CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all system operations';
COMMENT ON COLUMN audit_logs.id IS 'Unique audit log identifier';
COMMENT ON COLUMN audit_logs.timestamp IS 'When the action occurred';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN audit_logs.username IS 'Username of the user who performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., EXPORT_CREATED, USER_LOGIN)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., EXPORT, USER, DOCUMENT)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the resource affected';
COMMENT ON COLUMN audit_logs.changes IS 'JSON object containing the changes made';
COMMENT ON COLUMN audit_logs.status IS 'Whether the action succeeded or failed';
COMMENT ON COLUMN audit_logs.status_code IS 'HTTP status code of the operation';
COMMENT ON COLUMN audit_logs.error_message IS 'Error message if the action failed';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the request';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent of the request';
COMMENT ON COLUMN audit_logs.organization_id IS 'Organization that performed the action';
COMMENT ON COLUMN audit_logs.msp_id IS 'Membership Service Provider ID';
