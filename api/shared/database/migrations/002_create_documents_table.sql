-- Documents table for pre-registration system
-- Stores metadata for all documents uploaded to IPFS

CREATE TABLE IF NOT EXISTS preregistration_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('exporter_profile', 'laboratory', 'taster', 'competence_certificate', 'export_license')),
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('capital_proof', 'business_registration', 'laboratory_certificate', 'taster_qualification', 'competence_certificate', 'export_license', 'inspection_report', 'contract_document')),
    
    -- File Information
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- IPFS Information
    ipfs_hash VARCHAR(100) NOT NULL UNIQUE,
    ipfs_url TEXT NOT NULL,
    
    -- Upload Information
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deactivated_by VARCHAR(255),
    deactivated_at TIMESTAMP,
    deactivation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_preregistration_documents_entity_id ON preregistration_documents(entity_id);
CREATE INDEX idx_preregistration_documents_entity_type ON preregistration_documents(entity_type);
CREATE INDEX idx_preregistration_documents_document_type ON preregistration_documents(document_type);
CREATE INDEX idx_preregistration_documents_ipfs_hash ON preregistration_documents(ipfs_hash);
CREATE INDEX idx_preregistration_documents_is_active ON preregistration_documents(is_active);
CREATE INDEX idx_preregistration_documents_uploaded_by ON preregistration_documents(uploaded_by);

-- Trigger for updated_at
CREATE TRIGGER update_preregistration_documents_updated_at 
    BEFORE UPDATE ON preregistration_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE preregistration_documents IS 'Document metadata for pre-registration system files stored on IPFS';
COMMENT ON COLUMN preregistration_documents.entity_id IS 'ID of the related entity (exporter, laboratory, etc.)';
COMMENT ON COLUMN preregistration_documents.entity_type IS 'Type of entity this document belongs to';
COMMENT ON COLUMN preregistration_documents.document_type IS 'Type of document (capital proof, certificate, etc.)';
COMMENT ON COLUMN preregistration_documents.ipfs_hash IS 'IPFS hash for retrieving the document';
COMMENT ON COLUMN preregistration_documents.is_active IS 'Whether the document is currently active (soft delete)';
