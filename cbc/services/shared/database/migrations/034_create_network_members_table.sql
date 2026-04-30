-- ============================================================================
-- Migration: Create Network Members Table
-- Description: Creates table for network member agencies
-- ============================================================================

-- Create network_members table
CREATE TABLE IF NOT EXISTS network_members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Member identification
    member_code VARCHAR(50) UNIQUE NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    member_type VARCHAR(50) NOT NULL CHECK (member_type IN (
        'ECTA', 'ECX', 'ERCA', 'QUALITY_AUTHORITY', 'SHIPPING', 'BANK', 'NBE', 'OTHER'
    )),
    
    -- Contact information
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Capabilities
    can_verify_documents BOOLEAN DEFAULT FALSE,
    can_approve_exports BOOLEAN DEFAULT FALSE,
    can_process_payments BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    description TEXT,
    website VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create user_network_members junction table (for users assigned to agencies)
CREATE TABLE IF NOT EXISTS user_network_members (
    user_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    member_id UUID NOT NULL REFERENCES network_members(member_id) ON DELETE CASCADE,
    
    role VARCHAR(50) DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER', 'VIEWER')),
    is_primary BOOLEAN DEFAULT FALSE,
    
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(100),
    
    UNIQUE(user_id, member_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_network_members_member_code ON network_members(member_code);
CREATE INDEX IF NOT EXISTS idx_network_members_member_type ON network_members(member_type);
CREATE INDEX IF NOT EXISTS idx_network_members_status ON network_members(status);

CREATE INDEX IF NOT EXISTS idx_user_network_members_user_id ON user_network_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_network_members_member_id ON user_network_members(member_id);

-- Insert default network members
INSERT INTO network_members (member_code, member_name, member_type, can_verify_documents, can_approve_exports, can_process_payments, description, status)
VALUES 
    ('ECTA', 'Ethiopian Coffee & Tea Authority', 'ECTA', TRUE, TRUE, FALSE, 'Regulatory authority for coffee and tea exports', 'ACTIVE'),
    ('ECX', 'Ethiopian Commodity Exchange', 'ECX', TRUE, TRUE, FALSE, 'Commodity exchange for coffee trading', 'ACTIVE'),
    ('ERCA', 'Ethiopian Revenues and Customs Authority', 'ERCA', TRUE, TRUE, FALSE, 'Customs and tax authority', 'ACTIVE'),
    ('QUALITY', 'Quality and Standards Authority', 'QUALITY_AUTHORITY', TRUE, TRUE, FALSE, 'Quality inspection and certification', 'ACTIVE'),
    ('SHIPPING', 'Ethiopian Shipping Lines', 'SHIPPING', TRUE, FALSE, FALSE, 'Shipping and logistics services', 'ACTIVE'),
    ('CBE', 'Commercial Bank of Ethiopia', 'BANK', TRUE, FALSE, TRUE, 'Primary banking services for exports', 'ACTIVE'),
    ('NBE', 'National Bank of Ethiopia', 'NBE', TRUE, TRUE, TRUE, 'Central bank and monetary authority', 'ACTIVE')
ON CONFLICT (member_code) DO NOTHING;

-- Add comments
COMMENT ON TABLE network_members IS 'Network member agencies in the coffee export system';
COMMENT ON TABLE user_network_members IS 'Junction table linking users to network member agencies';

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE network_members TO postgres;
GRANT ALL PRIVILEGES ON TABLE user_network_members TO postgres;
