-- ============================================================================
-- ADD BANKING APPROVAL COLUMNS TO EXPORTS TABLE
-- ============================================================================
-- Purpose: Support Commercial Bank's role as gatekeeper and LC/CAD coordinator
-- Date: April 1, 2026
-- ============================================================================

-- Add banking approval columns
ALTER TABLE exports ADD COLUMN IF NOT EXISTS banking_approved_by VARCHAR(255);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS banking_approved_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS banking_notes TEXT;

-- Add banking rejection columns
ALTER TABLE exports ADD COLUMN IF NOT EXISTS banking_rejected_by VARCHAR(255);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS banking_rejected_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS banking_rejection_reason TEXT;

-- Add LC/CAD details columns
ALTER TABLE exports ADD COLUMN IF NOT EXISTS lc_number VARCHAR(100);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS lc_issuing_bank VARCHAR(255);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS lc_amount DECIMAL(15, 2);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS lc_currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE exports ADD COLUMN IF NOT EXISTS importer_bank VARCHAR(255);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS importer_bank_swift VARCHAR(50);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'LC' CHECK (
    payment_method IN ('LC', 'CAD', 'TT', 'DP', 'DA', 'OTHER')
);

-- Add document verification columns
ALTER TABLE exports ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS documents_verified_by VARCHAR(255);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS documents_verified_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exports_banking_approved_by ON exports(banking_approved_by);
CREATE INDEX IF NOT EXISTS idx_exports_banking_approved_at ON exports(banking_approved_at);
CREATE INDEX IF NOT EXISTS idx_exports_lc_number ON exports(lc_number);
CREATE INDEX IF NOT EXISTS idx_exports_payment_method ON exports(payment_method);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN exports.banking_approved_by IS 'Commercial Bank officer who approved the export';
COMMENT ON COLUMN exports.banking_approved_at IS 'Timestamp when export was approved by Commercial Bank';
COMMENT ON COLUMN exports.banking_notes IS 'Notes from Commercial Bank approval';
COMMENT ON COLUMN exports.banking_rejected_by IS 'Commercial Bank officer who rejected the export';
COMMENT ON COLUMN exports.banking_rejected_at IS 'Timestamp when export was rejected by Commercial Bank';
COMMENT ON COLUMN exports.banking_rejection_reason IS 'Reason for rejection by Commercial Bank';
COMMENT ON COLUMN exports.lc_number IS 'Letter of Credit number from importer bank';
COMMENT ON COLUMN exports.lc_issuing_bank IS 'Bank that issued the LC (importer bank)';
COMMENT ON COLUMN exports.lc_amount IS 'LC amount';
COMMENT ON COLUMN exports.lc_currency IS 'LC currency (USD, EUR, etc.)';
COMMENT ON COLUMN exports.importer_bank IS 'Importer/buyer bank name';
COMMENT ON COLUMN exports.importer_bank_swift IS 'Importer bank SWIFT code';
COMMENT ON COLUMN exports.payment_method IS 'Payment method: LC (Letter of Credit), CAD (Cash Against Documents), TT (Telegraphic Transfer), DP (Documents Against Payment), DA (Documents Against Acceptance)';
COMMENT ON COLUMN exports.documents_verified IS 'Whether documents have been verified by Commercial Bank';
COMMENT ON COLUMN exports.documents_verified_by IS 'Commercial Bank officer who verified documents';
COMMENT ON COLUMN exports.documents_verified_at IS 'Timestamp when documents were verified';
COMMENT ON COLUMN exports.verification_notes IS 'Notes from document verification';

-- ============================================================================
-- UPDATE STATUS CHECK CONSTRAINT
-- ============================================================================

-- Drop old constraint
ALTER TABLE exports DROP CONSTRAINT IF NOT EXISTS exports_status_check;

-- Add new constraint with BANKING statuses
ALTER TABLE exports ADD CONSTRAINT exports_status_check CHECK (
    status IN (
        -- Initial statuses
        'PENDING',
        'DRAFT',
        'SUBMITTED',
        
        -- Banking statuses (Commercial Bank - Gatekeeper)
        'BANKING_PENDING',
        'BANKING_APPROVED',
        'BANKING_REJECTED',
        
        -- FX statuses (National Bank)
        'FX_PENDING',
        'FX_APPROVED',
        'FX_REJECTED',
        
        -- Quality statuses (ECTA/ECX)
        'QUALITY_PENDING',
        'QUALITY_CERTIFIED',
        'QUALITY_REJECTED',
        
        -- Customs statuses
        'EXPORT_CUSTOMS_PENDING',
        'EXPORT_CUSTOMS_CLEARED',
        'EXPORT_CUSTOMS_REJECTED',
        
        -- Shipment statuses
        'SHIPMENT_PENDING',
        'SHIPMENT_SCHEDULED',
        'SHIPPED',
        'IN_TRANSIT',
        'SHIPMENT_REJECTED',
        
        -- Final statuses
        'COMPLETED',
        'DELIVERED',
        'CANCELLED'
    )
);

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Uncomment to insert sample data
/*
UPDATE exports 
SET 
    banking_approved_by = 'bank-officer-001',
    banking_approved_at = CURRENT_TIMESTAMP,
    banking_notes = 'Export approved - LC arranged with importer bank',
    lc_number = 'LC-2026-00001',
    lc_issuing_bank = 'Deutsche Bank AG',
    lc_amount = 55000.00,
    lc_currency = 'USD',
    importer_bank = 'Deutsche Bank AG',
    importer_bank_swift = 'DEUTDEFF',
    payment_method = 'LC',
    documents_verified = TRUE,
    documents_verified_by = 'bank-officer-001',
    documents_verified_at = CURRENT_TIMESTAMP,
    status = 'BANKING_APPROVED'
WHERE export_id = 'sample-export-id';
*/

