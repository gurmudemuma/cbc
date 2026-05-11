-- Create issued_documents table for network member signed documents
CREATE TABLE IF NOT EXISTS issued_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    document_type VARCHAR(100) NOT NULL,
    document_number VARCHAR(100) NOT NULL UNIQUE,
    document_hash VARCHAR(255),
    document_url TEXT,
    issuer_member_code VARCHAR(50) NOT NULL,
    issued_by VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    document_metadata JSONB,
    request_id VARCHAR(100),
    revoked_at TIMESTAMP,
    revocation_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT issued_doc_status_check CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED'))
);

CREATE INDEX IF NOT EXISTS idx_issued_documents_exporter ON issued_documents(exporter_id);
CREATE INDEX IF NOT EXISTS idx_issued_documents_type ON issued_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_issued_documents_issuer ON issued_documents(issuer_member_code);
CREATE INDEX IF NOT EXISTS idx_issued_documents_status ON issued_documents(status);
CREATE INDEX IF NOT EXISTS idx_issued_documents_number ON issued_documents(document_number);

COMMENT ON TABLE issued_documents IS 'Documents issued and signed by network members (ECTA, MOA, MOH, etc.)';
