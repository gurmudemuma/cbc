-- ============================================================================
-- Rollback Migration: Enhance export_documents for Payment Verification
-- ============================================================================
-- This rollback removes all enhancements added in migration 032
-- ============================================================================

-- Drop export_network_processing table
DROP TRIGGER IF EXISTS trigger_update_network_processing_updated_at ON export_network_processing;
DROP FUNCTION IF EXISTS update_network_processing_updated_at();
DROP TABLE IF EXISTS export_network_processing CASCADE;

-- Drop trigger and function for export_documents
DROP TRIGGER IF EXISTS trigger_update_export_documents_updated_at ON export_documents;
DROP FUNCTION IF EXISTS update_export_documents_updated_at();

-- Drop indexes from export_documents
DROP INDEX IF EXISTS idx_export_documents_verification;
DROP INDEX IF EXISTS idx_export_documents_signature_verified;
DROP INDEX IF EXISTS idx_export_documents_signed_by;
DROP INDEX IF EXISTS idx_export_documents_status;
DROP INDEX IF EXISTS idx_export_documents_lc_number;
DROP INDEX IF EXISTS idx_export_documents_contract_id;

-- Drop foreign key constraint
ALTER TABLE export_documents 
DROP CONSTRAINT IF EXISTS fk_export_documents_contract;

-- Remove new columns from export_documents
ALTER TABLE export_documents 
DROP COLUMN IF EXISTS updated_at,
DROP COLUMN IF EXISTS rejection_reason,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS signature_hash,
DROP COLUMN IF EXISTS signature_timestamp,
DROP COLUMN IF EXISTS signature_verified,
DROP COLUMN IF EXISTS signed_by,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS lc_number,
DROP COLUMN IF EXISTS contract_id;

-- Restore original document_type CHECK constraint
ALTER TABLE export_documents 
DROP CONSTRAINT IF EXISTS export_documents_document_type_check;

ALTER TABLE export_documents 
ADD CONSTRAINT export_documents_document_type_check CHECK (
    document_type IN (
        'INVOICE',
        'PACKING_LIST',
        'QUALITY_CERTIFICATE',
        'EXPORT_LICENSE',
        'SALES_CONTRACT',
        'BILL_OF_LADING',
        'CERTIFICATE_OF_ORIGIN',
        'CUSTOMS_DECLARATION',
        'OTHER'
    )
);

-- Remove status CHECK constraint
ALTER TABLE export_documents 
DROP CONSTRAINT IF EXISTS export_documents_status_check;
