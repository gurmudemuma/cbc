-- ============================================================================
-- DOCUMENT REQUEST WORKFLOW TABLES
-- These tables manage the document request and issuance workflow
-- ============================================================================

-- Document Request Batches
-- Groups multiple document requests from a single contract
CREATE TABLE IF NOT EXISTS document_request_batches (
    batch_id VARCHAR(100) PRIMARY KEY,
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    contract_reference UUID REFERENCES contract_drafts(draft_id),
    ecta_reference_number VARCHAR(100),
    total_documents INTEGER NOT NULL DEFAULT 0,
    completed_documents INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    CONSTRAINT batch_status_check CHECK (status IN (
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED',
        'PARTIALLY_COMPLETED',
        'CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_doc_request_batches_exporter ON document_request_batches(exporter_id);
CREATE INDEX IF NOT EXISTS idx_doc_request_batches_contract ON document_request_batches(contract_reference);
CREATE INDEX IF NOT EXISTS idx_doc_request_batches_status ON document_request_batches(status);

-- Document Requests
-- Individual document requests sent to network agencies
CREATE TABLE IF NOT EXISTS document_requests (
    request_id VARCHAR(100) PRIMARY KEY,
    batch_id VARCHAR(100) NOT NULL REFERENCES document_request_batches(batch_id) ON DELETE CASCADE,
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    document_type VARCHAR(100) NOT NULL,
    issuer_agency VARCHAR(50) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    required_data JSONB,
    contract_reference UUID REFERENCES contract_drafts(draft_id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(255),
    issued_document_id UUID REFERENCES issued_documents(document_id),
    completed_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    
    CONSTRAINT request_status_check CHECK (status IN (
        'PENDING',
        'ACKNOWLEDGED',
        'IN_PROGRESS',
        'COMPLETED',
        'REJECTED',
        'CANCELLED'
    )),
    
    CONSTRAINT request_priority_check CHECK (priority IN (
        'LOW',
        'MEDIUM',
        'HIGH',
        'URGENT'
    )),
    
    CONSTRAINT request_agency_check CHECK (issuer_agency IN (
        'ECTA',
        'MOA',
        'MOH',
        'ECX',
        'BANK',
        'NBE',
        'CUSTOMS',
        'SHIPPING',
        'QUALITY_LAB'
    ))
);

CREATE INDEX IF NOT EXISTS idx_doc_requests_batch ON document_requests(batch_id);
CREATE INDEX IF NOT EXISTS idx_doc_requests_exporter ON document_requests(exporter_id);
CREATE INDEX IF NOT EXISTS idx_doc_requests_agency ON document_requests(issuer_agency);
CREATE INDEX IF NOT EXISTS idx_doc_requests_status ON document_requests(status);
CREATE INDEX IF NOT EXISTS idx_doc_requests_type ON document_requests(document_type);
CREATE INDEX IF NOT EXISTS idx_doc_requests_issued_doc ON document_requests(issued_document_id);

-- Document Request History
-- Tracks status changes and actions on document requests
CREATE TABLE IF NOT EXISTS document_request_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(100) NOT NULL REFERENCES document_requests(request_id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    performed_by VARCHAR(255) NOT NULL,
    performed_by_role VARCHAR(50),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT history_action_check CHECK (action IN (
        'CREATED',
        'ACKNOWLEDGED',
        'STARTED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
        'DOCUMENT_ISSUED',
        'COMMENT_ADDED',
        'STATUS_CHANGED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_doc_request_history_request ON document_request_history(request_id);
CREATE INDEX IF NOT EXISTS idx_doc_request_history_action ON document_request_history(action);
CREATE INDEX IF NOT EXISTS idx_doc_request_history_created ON document_request_history(created_at);

-- Trigger to update batch status when requests are completed
CREATE OR REPLACE FUNCTION update_batch_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update completed_documents count
    UPDATE document_request_batches
    SET 
        completed_documents = (
            SELECT COUNT(*) 
            FROM document_requests 
            WHERE batch_id = NEW.batch_id AND status = 'COMPLETED'
        ),
        status = CASE
            WHEN (SELECT COUNT(*) FROM document_requests WHERE batch_id = NEW.batch_id AND status = 'COMPLETED') = total_documents
            THEN 'COMPLETED'
            WHEN (SELECT COUNT(*) FROM document_requests WHERE batch_id = NEW.batch_id AND status = 'COMPLETED') > 0
            THEN 'IN_PROGRESS'
            ELSE 'PENDING'
        END,
        completed_at = CASE
            WHEN (SELECT COUNT(*) FROM document_requests WHERE batch_id = NEW.batch_id AND status = 'COMPLETED') = total_documents
            THEN CURRENT_TIMESTAMP
            ELSE NULL
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE batch_id = NEW.batch_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_batch_completion ON document_requests;
CREATE TRIGGER trigger_update_batch_completion
AFTER UPDATE OF status ON document_requests
FOR EACH ROW
WHEN (NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED')
EXECUTE FUNCTION update_batch_completion();

-- Trigger to log document request history
CREATE OR REPLACE FUNCTION log_document_request_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO document_request_history (
            request_id,
            action,
            new_status,
            performed_by,
            notes
        ) VALUES (
            NEW.request_id,
            'CREATED',
            NEW.status,
            'SYSTEM',
            'Document request created'
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO document_request_history (
            request_id,
            action,
            old_status,
            new_status,
            performed_by,
            notes
        ) VALUES (
            NEW.request_id,
            'STATUS_CHANGED',
            OLD.status,
            NEW.status,
            COALESCE(NEW.acknowledged_by, 'SYSTEM'),
            'Status changed from ' || OLD.status || ' to ' || NEW.status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_document_request_history ON document_requests;
CREATE TRIGGER trigger_log_document_request_history
AFTER INSERT OR UPDATE ON document_requests
FOR EACH ROW
EXECUTE FUNCTION log_document_request_history();

-- Comments
COMMENT ON TABLE document_request_batches IS 'Groups multiple document requests from a single sales contract';
COMMENT ON TABLE document_requests IS 'Individual document requests sent to network agencies for signing/issuance';
COMMENT ON TABLE document_request_history IS 'Audit trail of all actions performed on document requests';

COMMENT ON COLUMN document_requests.required_data IS 'JSON data required by the agency to issue the document (contract details, quantities, etc.)';
COMMENT ON COLUMN document_requests.issued_document_id IS 'Links to the issued_documents table once the agency signs/issues the document';
