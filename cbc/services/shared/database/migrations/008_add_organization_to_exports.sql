-- ============================================================================
-- MIGRATION 008: Add Organization ID to Exports Table
-- ============================================================================
-- Purpose: Add organization filtering to exports for proper data isolation
-- Date: 2025-01-02
-- Author: System Migration
-- ============================================================================

-- ============================================================================
-- PART 1: Add organization_id column to exports table
-- ============================================================================

-- Add organization_id column (nullable initially for backfill)
ALTER TABLE exports ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_exports_organization_id ON exports(organization_id);

-- ============================================================================
-- PART 2: Backfill existing data
-- ============================================================================

-- Strategy: Link exports to organizations through exporter_profiles and users
-- This assumes exporter_profiles has a user_id or similar link to users table

-- Option A: If exporter_profiles has user_id
UPDATE exports e
SET organization_id = u.organization_id
FROM exporter_profiles ep
JOIN users u ON ep.user_id = u.id
WHERE e.exporter_id = ep.exporter_id
AND e.organization_id IS NULL;

-- Option B: If no direct link, set default based on exporter type
-- For coffee exporters, default to ECTA jurisdiction
UPDATE exports
SET organization_id = 'ECTA'
WHERE organization_id IS NULL
AND coffee_type IS NOT NULL;

-- ============================================================================
-- PART 3: Add organization_id to related tables
-- ============================================================================

-- Add to export_status_history for audit trail
ALTER TABLE export_status_history ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);

-- Backfill export_status_history
UPDATE export_status_history esh
SET organization_id = e.organization_id
FROM exports e
WHERE esh.export_id = e.export_id
AND esh.organization_id IS NULL;

-- Add to export_approvals
ALTER TABLE export_approvals ADD COLUMN IF NOT EXISTS requesting_organization_id VARCHAR(255);

-- Backfill export_approvals
UPDATE export_approvals ea
SET requesting_organization_id = e.organization_id
FROM exports e
WHERE ea.export_id = e.export_id
AND ea.requesting_organization_id IS NULL;

-- ============================================================================
-- PART 4: Create organizations master table
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  organization_id VARCHAR(255) PRIMARY KEY,
  organization_name VARCHAR(255) NOT NULL,
  organization_name_amharic VARCHAR(255),
  organization_type VARCHAR(50) NOT NULL CHECK (organization_type IN (
    'EXPORTER',           -- Private exporters
    'REGULATORY_AGENCY',  -- ECTA, MOA, MOH, etc.
    'BANKING',            -- Commercial banks, NBE
    'CUSTOMS',            -- ERCA, customs authorities
    'EXCHANGE',           -- ECX
    'SHIPPING',           -- Shipping lines
    'GOVERNMENT',         -- Other government agencies
    'MINISTRY'            -- Government ministries
  )),
  
  -- Permissions
  can_view_all_exports BOOLEAN DEFAULT false,
  can_approve_exports BOOLEAN DEFAULT false,
  jurisdiction VARCHAR(100),  -- e.g., 'COFFEE', 'ALL_COMMODITIES', 'BANKING_SERVICES'
  
  -- Contact information
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(organization_type);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- ============================================================================
-- PART 5: Seed organizations data
-- ============================================================================

INSERT INTO organizations (organization_id, organization_name, organization_type, can_view_all_exports, can_approve_exports, jurisdiction, description) VALUES
  -- Regulatory Agencies
  ('ECTA', 'Ethiopian Coffee and Tea Authority', 'REGULATORY_AGENCY', true, true, 'COFFEE_TEA', 'Regulates coffee and tea quality, licensing, and contracts'),
  ('MOA', 'Ministry of Agriculture', 'MINISTRY', true, true, 'AGRICULTURE', 'Issues phytosanitary certificates for agricultural products'),
  ('MOH', 'Ministry of Health', 'MINISTRY', true, true, 'HEALTH', 'Issues health certificates when required'),
  ('EPA', 'Environmental Protection Authority', 'REGULATORY_AGENCY', true, true, 'ENVIRONMENT', 'Environmental compliance for certain exports'),
  ('QSAE', 'Quality and Standards Authority of Ethiopia', 'REGULATORY_AGENCY', true, true, 'QUALITY_STANDARDS', 'Product quality standards verification'),
  
  -- Banking
  ('NBE', 'National Bank of Ethiopia', 'BANKING', true, true, 'FOREIGN_EXCHANGE', 'Approves foreign exchange and monitors export proceeds'),
  ('COMMERCIAL_BANK', 'Commercial Bank of Ethiopia', 'BANKING', false, true, 'BANKING_SERVICES', 'Document verification and banking services'),
  ('COMMERCIAL-BANK', 'Commercial Bank of Ethiopia', 'BANKING', false, true, 'BANKING_SERVICES', 'Document verification and banking services (alias)'),
  ('COMMERCIALBANK', 'Commercial Bank of Ethiopia', 'BANKING', false, true, 'BANKING_SERVICES', 'Document verification and banking services (alias)'),
  
  -- Customs
  ('ERCA', 'Ethiopian Revenues and Customs Authority', 'CUSTOMS', true, true, 'CUSTOMS_CLEARANCE', 'Handles customs clearance and export duties'),
  ('FDRE_CUSTOMS', 'Federal Democratic Republic of Ethiopia Customs', 'CUSTOMS', true, true, 'CUSTOMS_OVERSIGHT', 'Federal customs oversight'),
  ('CUSTOM-AUTHORITIES', 'Customs Authorities', 'CUSTOMS', true, true, 'CUSTOMS_CLEARANCE', 'Customs clearance operations'),
  ('CUSTOM_AUTHORITIES', 'Customs Authorities', 'CUSTOMS', true, true, 'CUSTOMS_CLEARANCE', 'Customs clearance operations (alias)'),
  
  -- Exchange
  ('ECX', 'Ethiopian Commodity Exchange', 'EXCHANGE', true, true, 'COMMODITY_TRADING', 'Commodity grading and trading platform'),
  
  -- Shipping
  ('ESLSE', 'Ethiopian Shipping & Logistics Services Enterprise', 'SHIPPING', true, true, 'SHIPPING_LOGISTICS', 'Coordinates shipping and logistics'),
  ('SHIPPING-LINE', 'Shipping Line Services', 'SHIPPING', false, true, 'SHIPPING_OPERATIONS', 'Shipping line operations'),
  ('SHIPPING_LINE', 'Shipping Line Services', 'SHIPPING', false, true, 'SHIPPING_OPERATIONS', 'Shipping line operations (alias)'),
  ('SHIPPINGLINE', 'Shipping Line Services', 'SHIPPING', false, true, 'SHIPPING_OPERATIONS', 'Shipping line operations (alias)'),
  
  -- Ministries
  ('MOT', 'Ministry of Trade and Regional Integration', 'MINISTRY', true, true, 'TRADE_POLICY', 'Reviews export declarations and trade compliance'),
  ('MOFED', 'Ministry of Finance and Economic Development', 'MINISTRY', true, false, 'ECONOMIC_POLICY', 'Economic policy and development oversight'),
  ('MOTI', 'Ministry of Transport and Infrastructure', 'MINISTRY', true, false, 'TRANSPORT_INFRASTRUCTURE', 'Transport infrastructure and logistics'),
  ('MIDROC', 'Ministry of Industry', 'MINISTRY', true, true, 'INDUSTRIAL_STANDARDS', 'Industrial product standards and compliance'),
  
  -- Other Government
  ('EIC', 'Ethiopian Investment Commission', 'GOVERNMENT', true, false, 'INVESTMENT', 'Reviews investment-related exports'),
  ('TRADE_REMEDY', 'Trade Remedy and Quality Compliance Directorate', 'GOVERNMENT', true, true, 'TRADE_COMPLIANCE', 'Trade remedy measures and compliance'),
  
  -- Exporters (examples - actual exporters will be added dynamically)
  ('EXPORTER', 'Generic Exporter Organization', 'EXPORTER', false, false, 'EXPORT_OPERATIONS', 'Default exporter organization type'),
  ('EXPORTER-PORTAL', 'Exporter Portal', 'EXPORTER', false, false, 'EXPORT_OPERATIONS', 'Exporter portal access'),
  ('EXPORTERPORTAL', 'Exporter Portal', 'EXPORTER', false, false, 'EXPORT_OPERATIONS', 'Exporter portal access (alias)')
ON CONFLICT (organization_id) DO NOTHING;

-- ============================================================================
-- PART 6: Add foreign key constraint (optional - can be added later)
-- ============================================================================

-- Note: We're not adding FK constraint immediately to allow flexibility
-- Uncomment if you want strict referential integrity:
-- ALTER TABLE exports 
-- ADD CONSTRAINT fk_exports_organization 
-- FOREIGN KEY (organization_id) REFERENCES organizations(organization_id);

-- ============================================================================
-- PART 7: Create views for organization-filtered data
-- ============================================================================

-- View: Exports by Organization
CREATE OR REPLACE VIEW exports_by_organization AS
SELECT 
    o.organization_id,
    o.organization_name,
    o.organization_type,
    COUNT(e.export_id) as total_exports,
    COUNT(CASE WHEN e.status = 'PENDING' THEN 1 END) as pending_exports,
    COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END) as completed_exports,
    SUM(e.estimated_value) as total_value,
    MAX(e.created_at) as latest_export_date
FROM organizations o
LEFT JOIN exports e ON o.organization_id = e.organization_id
WHERE o.is_active = true
GROUP BY o.organization_id, o.organization_name, o.organization_type
ORDER BY total_exports DESC;

-- View: Regulatory Agency Dashboard
CREATE OR REPLACE VIEW regulatory_agency_exports AS
SELECT 
    e.export_id,
    e.organization_id,
    e.exporter_id,
    ep.business_name as exporter_name,
    e.coffee_type,
    e.quantity,
    e.destination_country,
    e.status,
    e.estimated_value,
    e.created_at,
    e.updated_at,
    o.organization_name as managing_organization,
    o.jurisdiction
FROM exports e
JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
LEFT JOIN organizations o ON e.organization_id = o.organization_id
WHERE o.can_view_all_exports = true OR o.organization_type = 'REGULATORY_AGENCY'
ORDER BY e.created_at DESC;

-- ============================================================================
-- PART 8: Update trigger for organizations
-- ============================================================================

CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();

-- ============================================================================
-- PART 9: Comments for documentation
-- ============================================================================

COMMENT ON COLUMN exports.organization_id IS 'Organization that owns/manages this export (exporter organization or regulatory agency)';
COMMENT ON COLUMN export_status_history.organization_id IS 'Organization that made the status change';
COMMENT ON COLUMN export_approvals.requesting_organization_id IS 'Organization that requested the export';

COMMENT ON TABLE organizations IS 'Master table of all organizations in the system (agencies, banks, exporters, etc.)';
COMMENT ON COLUMN organizations.can_view_all_exports IS 'Whether this organization can view all exports (regulatory agencies)';
COMMENT ON COLUMN organizations.can_approve_exports IS 'Whether this organization can approve/reject exports';
COMMENT ON COLUMN organizations.jurisdiction IS 'Area of authority (e.g., COFFEE, BANKING_SERVICES, CUSTOMS_CLEARANCE)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after migration to verify:
--
-- 1. Check organization_id added to exports:
-- SELECT COUNT(*), COUNT(organization_id) FROM exports;
--
-- 2. Check organizations seeded:
-- SELECT organization_id, organization_name, organization_type, jurisdiction FROM organizations ORDER BY organization_type, organization_name;
--
-- 3. Check exports by organization:
-- SELECT * FROM exports_by_organization;
--
-- 4. Check regulatory agency view:
-- SELECT * FROM regulatory_agency_exports LIMIT 10;
--
-- 5. Verify backfill worked:
-- SELECT organization_id, COUNT(*) FROM exports GROUP BY organization_id;
-- ============================================================================
