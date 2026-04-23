-- Fix Database Schema - Add missing network_members table
-- This table is needed for the agencies API endpoint

-- Create network_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS network_members (
    id SERIAL PRIMARY KEY,
    member_code VARCHAR(50) UNIQUE NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    member_type VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default network members
INSERT INTO network_members (member_code, member_name, member_type, description, is_active) 
VALUES 
    ('ECTA', 'Ethiopian Coffee and Tea Authority', 'REGULATORY', 'Coffee quality control and export licensing', true),
    ('NBE', 'National Bank of Ethiopia', 'FINANCIAL', 'Foreign exchange and banking oversight', true),
    ('ERCA', 'Ethiopian Revenues and Customs Authority', 'REGULATORY', 'Customs clearance and trade facilitation', true),
    ('ECX', 'Ethiopia Commodity Exchange', 'TRADING', 'Coffee trading and price discovery', true),
    ('BANK', 'Commercial Banks', 'FINANCIAL', 'Banking services and trade finance', true),
    ('SHIPPING', 'Shipping Lines', 'LOGISTICS', 'Maritime transport and logistics', true),
    ('MOA', 'Ministry of Agriculture', 'REGULATORY', 'Agricultural oversight and phytosanitary certificates', true),
    ('MOH', 'Ministry of Health', 'REGULATORY', 'Health certificates and food safety', true)
ON CONFLICT (member_code) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_network_members_active ON network_members(is_active);
CREATE INDEX IF NOT EXISTS idx_network_members_type ON network_members(member_type);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_network_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_network_members_updated_at ON network_members;
CREATE TRIGGER update_network_members_updated_at
    BEFORE UPDATE ON network_members
    FOR EACH ROW
    EXECUTE FUNCTION update_network_members_updated_at();