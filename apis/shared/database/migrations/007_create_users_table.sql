-- Migration: Create users table
-- Purpose: Store user accounts synchronized with blockchain user-management chaincode
-- Version: 1.0
-- Date: 2024

BEGIN;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    organization_id VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_organization_role ON users(organization_id, role);

-- Add table comments
COMMENT ON TABLE users IS 'User accounts synchronized with blockchain user-management chaincode';

-- Add column comments
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID) - matches blockchain user ID';
COMMENT ON COLUMN users.username IS 'Unique username for login - must match blockchain';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password - never stored in plaintext';
COMMENT ON COLUMN users.email IS 'Unique email address - must match blockchain';
COMMENT ON COLUMN users.organization_id IS 'Organization the user belongs to (commercial-bank, national-bank, ecta, ecx, customs, shipping-line, exporter-portal)';
COMMENT ON COLUMN users.role IS 'User role (Banking Officer, FX Officer, Quality Officer, Lot Verifier, Customs Officer, Shipping Officer, Exporter, Admin)';
COMMENT ON COLUMN users.is_active IS 'Account active status - synchronized with blockchain';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp - synchronized with blockchain';
COMMENT ON COLUMN users.updated_at IS 'Last update timestamp - synchronized with blockchain';
COMMENT ON COLUMN users.last_login IS 'Last login timestamp - synchronized with blockchain';
COMMENT ON COLUMN users.created_by IS 'User who created this account (for audit trail)';
COMMENT ON COLUMN users.updated_by IS 'User who last updated this account (for audit trail)';
COMMENT ON COLUMN users.notes IS 'Additional notes about the user';

-- Create organizations reference table
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    msp_id VARCHAR(255) NOT NULL UNIQUE,
    api_port INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert organizations
INSERT INTO organizations (id, name, msp_id, api_port, description) VALUES
    ('commercial-bank', 'Commercial Bank', 'CommercialBankMSP', 3001, 'Commercial Bank of Ethiopia'),
    ('national-bank', 'National Bank', 'NationalBankMSP', 3002, 'National Bank of Ethiopia'),
    ('ecta', 'ECTA', 'ECTAMSP', 3003, 'Ethiopian Coffee & Tea Authority'),
    ('ecx', 'ECX', 'ECXMSP', 3006, 'Ethiopian Commodity Exchange'),
    ('customs', 'Customs', 'CustomsMSP', 3005, 'Ethiopian Customs Authority'),
    ('shipping-line', 'Shipping Line', 'ShippingLineMSP', 3004, 'Shipping Line Authority'),
    ('exporter-portal', 'Exporter Portal', 'ExporterPortalMSP', 3007, 'Coffee Exporter Portal')
ON CONFLICT (id) DO NOTHING;

-- Create user roles reference table
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert user roles
INSERT INTO user_roles (role_name, description, permissions) VALUES
    ('Banking Officer', 'Officer at Commercial or National Bank', ARRAY['view_exports', 'verify_documents', 'approve_financing', 'check_compliance']),
    ('FX Officer', 'Foreign Exchange Officer at National Bank', ARRAY['manage_fx_rates', 'approve_fx_requests', 'monitor_compliance']),
    ('Quality Officer', 'Quality Officer at ECTA', ARRAY['issue_certificates', 'manage_laboratories', 'grade_lots']),
    ('Lot Verifier', 'Lot Verifier at ECX', ARRAY['verify_lots', 'view_trading', 'check_prices']),
    ('Customs Officer', 'Officer at Customs Authority', ARRAY['clear_shipments', 'verify_documents', 'check_compliance']),
    ('Shipping Officer', 'Officer at Shipping Line', ARRAY['track_shipments', 'confirm_delivery', 'update_status']),
    ('Exporter', 'Coffee Exporter', ARRAY['create_exports', 'view_applications', 'submit_documents']),
    ('Admin', 'System Administrator', ARRAY['all_operations'])
ON CONFLICT (role_name) DO NOTHING;

-- Create user sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create user audit log table
CREATE TABLE IF NOT EXISTS user_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user audit logs
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user_id ON user_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_action ON user_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_created_at ON user_audit_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Create function to log user actions
CREATE OR REPLACE FUNCTION log_user_action(
    p_user_id UUID,
    p_action VARCHAR,
    p_details JSONB,
    p_ip_address VARCHAR,
    p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO user_audit_logs (user_id, action, details, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_details, p_ip_address, p_user_agent)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for active users
CREATE OR REPLACE VIEW active_users AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.organization_id,
    o.name as organization_name,
    u.role,
    u.is_active,
    u.last_login,
    u.created_at,
    COUNT(DISTINCT us.id) as active_sessions
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN user_sessions us ON u.id = us.user_id AND us.is_active = true
WHERE u.is_active = true
GROUP BY u.id, u.username, u.email, u.organization_id, o.name, u.role, u.is_active, u.last_login, u.created_at;

-- Create view for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as active_users,
    COUNT(DISTINCT CASE WHEN u.is_active = false THEN u.id END) as inactive_users,
    COUNT(DISTINCT CASE WHEN u.last_login IS NOT NULL THEN u.id END) as users_with_login,
    MAX(u.last_login) as last_login_time
FROM organizations o
LEFT JOIN users u ON o.id = u.organization_id
GROUP BY o.id, o.name;

COMMIT;

-- Log migration completion
SELECT 'Users table migration completed successfully' as status;
