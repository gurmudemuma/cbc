-- ============================================================================
-- Migration: Enhance export_documents for Payment Verification
-- ============================================================================
-- This migration adds fields required for comprehensive payment verification:
-- 1. Digital signature tracking
-- 2. LC number (ECTA reference) linking
-- 3. Contract ID linking
-- 4. Document status tracking
-- 5. Network member approval tracking
-- ============================================================================

-- Add new columns to export_documents table
ALTER TABLE export_documents 
ADD COLUMN IF NOT EXISTS contract_id UUID,
ADD COLUMN IF NOT EXISTS lc_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS signed_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS signature_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS signature_timestamp TIMESTAMP,
ADD COLUMN IF NOT EXISTS signature_hash TEXT,
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraint for contract_id
ALTER TABLE export_documents 
ADD CONSTRAINT fk_export_documents_contract 
FOREIGN KEY (contract_id) REFERENCES contract_drafts(contract_id) ON DELETE SET NULL;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_export_documents_contract_id 
ON export_documents(contract_id);

CREATE INDEX IF NOT EXISTS idx_export_documents_lc_number 
ON export_documents(lc_number) WHERE lc_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_export_documents_status 
ON export_documents(status);

CREATE INDEX IF NOT EXISTS idx_export_documents_signed_by 
ON export_documents(signed_by) WHERE signed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_export_documents_signature_verified 
ON export_documents(signature_verified) WHERE signature_verified = TRUE;

-- Add composite index for payment verification queries
CREATE INDEX IF NOT EXISTS idx_export_documents_verification 
ON export_documents(export_id, contract_id, lc_number, status, signature_verified);

-- Expand document_type CHECK constraint to include all required types
ALTER TABLE export_documents 
DROP CONSTRAINT IF EXISTS export_documents_document_type_check;

ALTER TABLE export_documents 
ADD CONSTRAINT export_documents_document_type_check CHECK (
    document_type IN (
        -- Original types
        'INVOICE',
        'PACKING_LIST',
        'QUALITY_CERTIFICATE',
        'EXPORT_LICENSE',
        'SALES_CONTRACT',
        'BILL_OF_LADING',
        'CERTIFICATE_OF_ORIGIN',
        'CUSTOMS_DECLARATION',
        'OTHER',
        -- ECTA Documents
        'ORIGIN_CERTIFICATE',
        -- ECX Documents
        'WAREHOUSE_RECEIPT',
        'ECX_QUALITY_VERIFICATION',
        'LOT_CERTIFICATION',
        -- ERCA (Customs) Documents
        'EXPORT_PERMIT',
        'TAX_CLEARANCE',
        -- Quality Authority Documents
        'QUALITY_INSPECTION',
        'PHYTOSANITARY_CERTIFICATE',
        'HEALTH_CERTIFICATE',
        -- Shipping Documents
        'BOOKING_CONFIRMATION',
        'BILL_OF_LADING_DRAFT',
        -- Bank Documents
        'BANK_ACCOUNT_VERIFICATION'
    )
);

-- Add status CHECK constraint
ALTER TABLE export_documents 
ADD CONSTRAINT export_documents_status_check CHECK (
    status IN (
        'PENDING',
        'SUBMITTED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'EXPIRED'
    )
);

-- Add comments for documentation
COMMENT ON COLUMN export_documents.contract_id IS 'Links document to sales contract';
COMMENT ON COLUMN export_documents.lc_number IS 'LC Number (ECTA reference) from registered sales contract';
COMMENT ON COLUMN export_documents.status IS 'Document approval status: PENDING, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, EXPIRED';
COMMENT ON COLUMN export_documents.signed_by IS 'Network member who digitally signed the document (e.g., ECTA, ECX, ERCA)';
COMMENT ON COLUMN export_documents.signature_verified IS 'Whether the digital signature has been cryptographically verified';
COMMENT ON COLUMN export_documents.signature_timestamp IS 'When the document was digitally signed';
COMMENT ON COLUMN export_documents.signature_hash IS 'Cryptographic hash of the digital signature for verification';
COMMENT ON COLUMN export_documents.approved_by IS 'User who approved the document';
COMMENT ON COLUMN export_documents.approved_at IS 'When the document was approved';
COMMENT ON COLUMN export_documents.rejection_reason IS 'Reason for document rejection if status is REJECTED';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_export_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_export_documents_updated_at ON export_documents;
CREATE TRIGGER trigger_update_export_documents_updated_at
    BEFORE UPDATE ON export_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_export_documents_updated_at();

-- ============================================================================
-- Create export_network_processing table for tracking network member tasks
-- ============================================================================
CREATE TABLE IF NOT EXISTS export_network_processing (
    processing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID NOT NULL REFERENCES exports(export_id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contract_drafts(contract_id) ON DELETE SET NULL,
    lc_number VARCHAR(100),
    
    -- Network member information
    network_member_id VARCHAR(50) NOT NULL,
    member_name VARCHAR(100) NOT NULL,
    member_type VARCHAR(50) NOT NULL CHECK (
        member_type IN (
            'ECTA',
            'ECX',
            'ERCA',
            'QUALITY_AUTHORITY',
            'SHIPPING',
            'BANK',
            'NBE',
            'OTHER'
        )
    ),
    
    -- Processing status
    processing_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (
        processing_status IN (
            'PENDING',
            'IN_PROGRESS',
            'COMPLETED',
            'APPROVED',
            'REJECTED',
            'ON_HOLD'
        )
    ),
    
    -- Task details
    task_description TEXT,
    assigned_to VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (
        priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
    ),
    
    -- Timestamps
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,
    
    -- Additional information
    notes TEXT,
    rejection_reason TEXT,
    documents_required TEXT[], -- Array of required document types
    documents_submitted TEXT[], -- Array of submitted document IDs
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Create indexes for export_network_processing
CREATE INDEX idx_network_processing_export_id 
ON export_network_processing(export_id);

CREATE INDEX idx_network_processing_contract_id 
ON export_network_processing(contract_id);

CREATE INDEX idx_network_processing_lc_number 
ON export_network_processing(lc_number) WHERE lc_number IS NOT NULL;

CREATE INDEX idx_network_processing_member 
ON export_network_processing(network_member_id, member_name);

CREATE INDEX idx_network_processing_status 
ON export_network_processing(processing_status);

CREATE INDEX idx_network_processing_member_status 
ON export_network_processing(network_member_id, processing_status);

-- Composite index for payment verification queries
CREATE INDEX idx_network_processing_verification 
ON export_network_processing(export_id, contract_id, lc_number, processing_status);

-- Add comments
COMMENT ON TABLE export_network_processing IS 'Tracks processing tasks by network members for each export';
COMMENT ON COLUMN export_network_processing.lc_number IS 'LC Number (ECTA reference) from registered sales contract';
COMMENT ON COLUMN export_network_processing.network_member_id IS 'Unique identifier for network member (e.g., ECTA, ECX, ERCA)';
COMMENT ON COLUMN export_network_processing.member_name IS 'Display name of network member';
COMMENT ON COLUMN export_network_processing.processing_status IS 'Current status: PENDING, IN_PROGRESS, COMPLETED, APPROVED, REJECTED, ON_HOLD';
COMMENT ON COLUMN export_network_processing.documents_required IS 'Array of document types required from this network member';
COMMENT ON COLUMN export_network_processing.documents_submitted IS 'Array of document IDs submitted by this network member';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_network_processing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_network_processing_updated_at ON export_network_processing;
CREATE TRIGGER trigger_update_network_processing_updated_at
    BEFORE UPDATE ON export_network_processing
    FOR EACH ROW
    EXECUTE FUNCTION update_network_processing_updated_at();

-- ============================================================================
-- Sample data for testing (optional - comment out for production)
-- ============================================================================

-- Insert sample network member processing records for existing exports
-- This helps with testing the payment verification system

/*
INSERT INTO export_network_processing (
    export_id, 
    network_member_id, 
    member_name, 
    member_type,
    processing_status,
    task_description,
    documents_required
)
SELECT 
    e.export_id,
    'ECTA',
    'Ethiopian Coffee & Tea Authority',
    'ECTA',
    'COMPLETED',
    'Provide export license, quality certificate, and origin certificate',
    ARRAY['EXPORT_LICENSE', 'QUALITY_CERTIFICATE', 'ORIGIN_CERTIFICATE']
FROM exports e
WHERE e.status IN ('APPROVED', 'SHIPPED', 'DELIVERED')
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- Verification queries for testing
-- ============================================================================

-- Query to check enhanced export_documents structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'export_documents'
-- ORDER BY ordinal_position;

-- Query to check export_network_processing structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'export_network_processing'
-- ORDER BY ordinal_position;

-- Query to test payment verification prerequisites
-- SELECT 
--     e.export_id,
--     cd.lc_number,
--     COUNT(DISTINCT ed.document_type) as documents_collected,
--     COUNT(DISTINCT ed.document_type) FILTER (WHERE ed.signature_verified = TRUE) as documents_signed,
--     COUNT(DISTINCT enp.network_member_id) FILTER (WHERE enp.processing_status = 'COMPLETED') as members_completed
-- FROM exports e
-- LEFT JOIN contract_drafts cd ON e.contract_id = cd.contract_id
-- LEFT JOIN export_documents ed ON e.export_id = ed.export_id AND ed.status = 'APPROVED'
-- LEFT JOIN export_network_processing enp ON e.export_id = enp.export_id
-- WHERE e.status = 'APPROVED'
-- GROUP BY e.export_id, cd.lc_number;
