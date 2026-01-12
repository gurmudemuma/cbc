-- ============================================================================
-- MIGRATION 006: Fix Exports Status Values and Add ECTA Fields
-- ============================================================================
-- Purpose: Update exports table to support ECTA-specific statuses and fields
-- Date: 2024-12-31
-- Author: System Migration
-- ============================================================================

-- Remove old CHECK constraint
ALTER TABLE exports DROP CONSTRAINT IF EXISTS exports_status_check;

-- Add new CHECK constraint with all ECTA statuses
ALTER TABLE exports ADD CONSTRAINT exports_status_check CHECK (
    status IN (
        -- Initial statuses
        'PENDING',
        'SUBMITTED',
        
        -- ECX (Ethiopian Commodity Exchange) statuses
        'ECX_PENDING',
        'ECX_VERIFIED',
        'ECX_REJECTED',
        
        -- ECTA License statuses
        'ECTA_LICENSE_PENDING',
        'ECTA_LICENSE_APPROVED',
        'ECTA_LICENSE_REJECTED',
        
        -- ECTA Quality statuses
        'ECTA_QUALITY_PENDING',
        'ECTA_QUALITY_APPROVED',
        'ECTA_QUALITY_REJECTED',
        
        -- ECTA Contract statuses
        'ECTA_CONTRACT_PENDING',
        'ECTA_CONTRACT_APPROVED',
        'ECTA_CONTRACT_REJECTED',
        
        -- Legacy statuses (for backward compatibility)
        'FX_APPROVED',
        'FX_REJECTED',
        'QUALITY_PENDING',
        'QUALITY_CERTIFIED',
        'QUALITY_REJECTED',
        
        -- Shipment statuses
        'SHIPMENT_SCHEDULED',
        'SHIPPED',
        
        -- Final statuses
        'COMPLETED',
        'CANCELLED'
    )
);

-- Add missing columns for ECTA License data
ALTER TABLE exports ADD COLUMN IF NOT EXISTS license_approved_by VARCHAR(255);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS license_approved_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS license_approval_notes TEXT;

-- Add missing columns for ECTA Contract data
ALTER TABLE exports ADD COLUMN IF NOT EXISTS origin_certificate_number VARCHAR(100);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS contract_number VARCHAR(100);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS contract_approved_at TIMESTAMP;

-- Add quality inspection details
ALTER TABLE exports ADD COLUMN IF NOT EXISTS moisture_content DECIMAL(5, 2);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS defect_count INTEGER;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS cup_score DECIMAL(5, 2);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS inspection_notes TEXT;

-- Create quality_certificates table
CREATE TABLE IF NOT EXISTS quality_certificates (
    certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID NOT NULL REFERENCES exports(export_id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    quality_grade VARCHAR(50) NOT NULL,
    issued_by VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Quality metrics
    moisture_content DECIMAL(5, 2),
    defect_count INTEGER,
    cup_score DECIMAL(5, 2),
    inspection_notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(export_id)
);

-- Create indexes for quality_certificates
CREATE INDEX IF NOT EXISTS idx_quality_certificates_export_id ON quality_certificates(export_id);
CREATE INDEX IF NOT EXISTS idx_quality_certificates_number ON quality_certificates(certificate_number);

-- Add indexes for ECTA-specific queries
CREATE INDEX IF NOT EXISTS idx_exports_license_approved_by ON exports(license_approved_by);
CREATE INDEX IF NOT EXISTS idx_exports_quality_approved_by ON exports(quality_approved_by);
CREATE INDEX IF NOT EXISTS idx_exports_contract_approved_by ON exports(contract_approved_by);

CREATE INDEX IF NOT EXISTS idx_exports_license_approved_at ON exports(license_approved_at);
CREATE INDEX IF NOT EXISTS idx_exports_quality_approved_at ON exports(quality_approved_at);
CREATE INDEX IF NOT EXISTS idx_exports_contract_approved_at ON exports(contract_approved_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_exports_status_created ON exports(status, created_at DESC);

-- Add trigger for quality_certificates updated_at
CREATE TRIGGER IF NOT EXISTS update_quality_certificates_updated_at 
BEFORE UPDATE ON quality_certificates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE quality_certificates IS 'ECTA quality certificates with detailed inspection data';
COMMENT ON COLUMN exports.license_approved_by IS 'User ID of ECTA officer who approved the license';
COMMENT ON COLUMN exports.license_approved_at IS 'Timestamp when license was approved';
COMMENT ON COLUMN exports.license_approval_notes IS 'Notes from ECTA officer during license approval';
COMMENT ON COLUMN exports.origin_certificate_number IS 'Certificate of Origin number issued by ECTA';
COMMENT ON COLUMN exports.contract_number IS 'Contract number verified by ECTA';
COMMENT ON COLUMN exports.moisture_content IS 'Coffee moisture content percentage';
COMMENT ON COLUMN exports.defect_count IS 'Number of defects found during quality inspection';
COMMENT ON COLUMN exports.cup_score IS 'Coffee cupping score (0-100)';
COMMENT ON COLUMN exports.inspection_notes IS 'Detailed notes from quality inspection';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after migration to verify:
--
-- 1. Check status constraint:
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'exports_status_check';
--
-- 2. Check new columns:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'exports' 
-- AND column_name LIKE '%approved%';
--
-- 3. Check quality_certificates table:
-- SELECT * FROM quality_certificates LIMIT 1;
-- ============================================================================

