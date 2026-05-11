-- Add missing columns to network_submissions table
ALTER TABLE network_submissions 
ADD COLUMN IF NOT EXISTS esw_reference_number varchar(100),
ADD COLUMN IF NOT EXISTS network_reference_number varchar(100),
ADD COLUMN IF NOT EXISTS exporter_info jsonb,
ADD COLUMN IF NOT EXISTS supporting_documents jsonb,
ADD COLUMN IF NOT EXISTS documents_collected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS required_documents_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS issued_documents_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ecta_status varchar(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS ecta_approved_at timestamp,
ADD COLUMN IF NOT EXISTS ecta_approved_by varchar(255),
ADD COLUMN IF NOT EXISTS bank_status varchar(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS bank_approved_at timestamp,
ADD COLUMN IF NOT EXISTS bank_approved_by varchar(255),
ADD COLUMN IF NOT EXISTS nbe_status varchar(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS nbe_approved_at timestamp,
ADD COLUMN IF NOT EXISTS nbe_approved_by varchar(255),
ADD COLUMN IF NOT EXISTS customs_status varchar(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS customs_approved_at timestamp,
ADD COLUMN IF NOT EXISTS customs_approved_by varchar(255),
ADD COLUMN IF NOT EXISTS shipping_status varchar(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS shipping_approved_at timestamp,
ADD COLUMN IF NOT EXISTS shipping_approved_by varchar(255),
ADD COLUMN IF NOT EXISTS ecx_status varchar(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS ecx_approved_at timestamp,
ADD COLUMN IF NOT EXISTS ecx_approved_by varchar(255);

-- Create indexes for the new status columns
CREATE INDEX IF NOT EXISTS idx_network_submissions_ecta_status ON network_submissions(ecta_status);
CREATE INDEX IF NOT EXISTS idx_network_submissions_bank_status ON network_submissions(bank_status);
CREATE INDEX IF NOT EXISTS idx_network_submissions_nbe_status ON network_submissions(nbe_status);
CREATE INDEX IF NOT EXISTS idx_network_submissions_customs_status ON network_submissions(customs_status);
CREATE INDEX IF NOT EXISTS idx_network_submissions_esw_ref ON network_submissions(esw_reference_number);
CREATE INDEX IF NOT EXISTS idx_network_submissions_network_ref ON network_submissions(network_reference_number);

-- Create submission_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS submission_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id uuid NOT NULL,
    document_id uuid NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_submission_documents_submission ON submission_documents(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_documents_document ON submission_documents(document_id);

-- Seed some sample network submissions for testing
INSERT INTO network_submissions (
    exporter_id,
    esw_reference_number,
    network_reference_number,
    submission_type,
    status,
    documents_collected,
    required_documents_count,
    issued_documents_count,
    ecta_status,
    bank_status,
    nbe_status,
    customs_status,
    shipping_status,
    exporter_info
)
SELECT 
    ep.exporter_id,
    'ESW-2026-' || LPAD((ROW_NUMBER() OVER())::text, 5, '0'),
    'NET-2026-' || LPAD((ROW_NUMBER() OVER())::text, 5, '0'),
    'EXPORT_APPLICATION',
    'PENDING',
    true,
    5,
    3,
    'PENDING',
    'PENDING',
    'PENDING',
    'PENDING',
    'PENDING',
    jsonb_build_object(
        'businessName', ep.business_name,
        'tin', ep.tin,
        'email', ep.email
    )
FROM exporter_profiles ep
LIMIT 5
ON CONFLICT DO NOTHING;

-- Verify the changes
SELECT 
    COUNT(*) as total_submissions,
    COUNT(*) FILTER (WHERE ecta_status = 'PENDING') as ecta_pending,
    COUNT(*) FILTER (WHERE bank_status = 'PENDING') as bank_pending,
    COUNT(*) FILTER (WHERE nbe_status = 'PENDING') as nbe_pending
FROM network_submissions;
