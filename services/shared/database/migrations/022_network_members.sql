-- Migration: Network Members Table
-- Description: Create table to store network member/agency information
-- Date: 2026-04-08

-- Create network_members table
CREATE TABLE IF NOT EXISTS network_members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_code VARCHAR(50) UNIQUE NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    member_type VARCHAR(50) NOT NULL, -- 'REGULATORY', 'FINANCIAL', 'LOGISTICS', 'QUALITY', 'CUSTOMS'
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    can_issue_documents BOOLEAN DEFAULT true,
    can_approve_exports BOOLEAN DEFAULT true,
    blockchain_org VARCHAR(100), -- Organization name in blockchain network
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on member_code for faster lookups
CREATE INDEX idx_network_members_code ON network_members(member_code);
CREATE INDEX idx_network_members_active ON network_members(is_active);

-- Insert default network members
INSERT INTO network_members (member_code, member_name, member_type, description, blockchain_org, is_active) VALUES
('ECTA', 'Ethiopian Coffee & Tea Authority', 'REGULATORY', 'Regulatory authority for coffee and tea exports', 'ECTA', true),
('BANK', 'Commercial Bank of Ethiopia', 'FINANCIAL', 'Commercial banking services and export financing', 'CommercialBank', true),
('NBE', 'National Bank of Ethiopia', 'FINANCIAL', 'Central bank and foreign exchange authority', 'NationalBank', true),
('SHIPPING', 'Ethiopian Shipping Lines', 'LOGISTICS', 'Shipping and logistics services', 'ShippingLine', true),
('ERCA', 'Ethiopian Revenues and Customs Authority', 'CUSTOMS', 'Customs clearance and revenue collection', 'CustomsAuthority', true),
('ECX', 'Ethiopian Commodity Exchange', 'QUALITY', 'Commodity trading and quality certification', 'ECX', true),
('MOA', 'Ministry of Agriculture', 'REGULATORY', 'Agricultural standards and phytosanitary certification', 'MOA', true),
('MOH', 'Ministry of Health', 'REGULATORY', 'Health and safety certification', 'MOH', true)
ON CONFLICT (member_code) DO NOTHING;

-- Add comment
COMMENT ON TABLE network_members IS 'Network member organizations participating in the coffee export system';
