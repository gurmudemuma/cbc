-- ============================================================================
-- Document Issuance & Authentication System
-- Migration 020: Add document request, issuance, and authentication tables
-- ============================================================================

-- ============================================================================
-- 1. DOCUMENT REQUESTS TABLE
-- Tracks exporter requests for documents from network members
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
  network_member_code VARCHAR(50) NOT NULL, -- ECTA, MOH, MOA, BANK, SHIPPING, etc.
  document_type VARCHAR(100) NOT NULL, -- EXPORT_LICENSE, PHYTOSANITARY, HEALTH_CERT, etc.
  request_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, UNDER_REVIEW, ISSUED, REJECTED
  request_notes TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(255),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_document_requests_exporter 
    FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_document_requests_exporter 
  ON document_requests(exporter_id);

CREATE INDEX IF NOT EXISTS idx_document_requests_member 
  ON document_requests(network_member_code);

CREATE INDEX IF NOT EXISTS idx_document_requests_status 
  ON document_requests(request_status);

CREATE INDEX IF NOT EXISTS idx_document_requests_type 
  ON document_requests(document_type);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_document_requests_member_status 
  ON document_requests(network_member_code, request_status);

-- Comments for documentation
COMMENT ON TABLE document_requests IS 'Tracks exporter requests for documents from network members';
COMMENT ON COLUMN document_requests.network_member_code IS 'Network member code: ECTA, MOH, MOA, BANK, SHIPPING, NBE, CUSTOMS, ECX';
COMMENT ON COLUMN document_requests.document_type IS 'Type of document requested';
COMMENT ON COLUMN document_requests.request_status IS 'Status: PENDING, UNDER_REVIEW, ISSUED, REJECTED';


-- ============================================================================
-- 2. ISSUED DOCUMENTS TABLE
-- Stores documents issued by network members to exporters
-- ============================================================================

CREATE TABLE IF NOT EXISTS issued_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES document_requests(request_id) ON DELETE SET NULL,
  exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
  issuer_member_code VARCHAR(50) NOT NULL, -- ECTA, MOH, MOA, BANK, SHIPPING
  document_type VARCHAR(100) NOT NULL,
  document_number VARCHAR(255) NOT NULL UNIQUE, -- Certificate/License number
  document_hash VARCHAR(255) NOT NULL, -- SHA-256 hash for tamper detection
  issuer_signature TEXT, -- Digital signature
  document_url TEXT, -- S3/storage URL for PDF
  document_metadata JSONB, -- Additional document details
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP,
  blockchain_tx_id VARCHAR(255), -- Blockchain transaction ID
  status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, REVOKED
  issued_by VARCHAR(255) NOT NULL, -- User who issued
  revoked_at TIMESTAMP,
  revoked_by VARCHAR(255),
  revocation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_issued_documents_exporter 
    FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_issued_documents_exporter 
  ON issued_documents(exporter_id);

CREATE INDEX IF NOT EXISTS idx_issued_documents_issuer 
  ON issued_documents(issuer_member_code);

CREATE INDEX IF NOT EXISTS idx_issued_documents_number 
  ON issued_documents(document_number);

CREATE INDEX IF NOT EXISTS idx_issued_documents_status 
  ON issued_documents(status);

CREATE INDEX IF NOT EXISTS idx_issued_documents_type 
  ON issued_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_issued_documents_request 
  ON issued_documents(request_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_issued_documents_exporter_status 
  ON issued_documents(exporter_id, status);

-- Comments for documentation
COMMENT ON TABLE issued_documents IS 'Stores documents issued by network members with blockchain verification';
COMMENT ON COLUMN issued_documents.document_hash IS 'SHA-256 hash of document for tamper detection';
COMMENT ON COLUMN issued_documents.issuer_signature IS 'Digital signature of issuing network member';
COMMENT ON COLUMN issued_documents.blockchain_tx_id IS 'Blockchain transaction ID for immutable record';
COMMENT ON COLUMN issued_documents.status IS 'Status: ACTIVE, EXPIRED, REVOKED';


-- ============================================================================
-- 3. DOCUMENT AUTHENTICATIONS TABLE
-- Tracks authentication of issued documents during Network Submission
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_authentications (
  authentication_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id VARCHAR(255) NOT NULL, -- Network Submission reference
  document_id UUID NOT NULL REFERENCES issued_documents(document_id),
  authenticator_member_code VARCHAR(50) NOT NULL,
  authentication_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, VERIFIED, FAILED
  verification_method VARCHAR(100), -- BLOCKCHAIN, SIGNATURE, HASH
  verification_result JSONB, -- Detailed verification results
  authenticated_at TIMESTAMP,
  authenticated_by VARCHAR(255),
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_document_authentications_document 
    FOREIGN KEY (document_id) REFERENCES issued_documents(document_id) ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_document_auth_submission 
  ON document_authentications(submission_id);

CREATE INDEX IF NOT EXISTS idx_document_auth_document 
  ON document_authentications(document_id);

CREATE INDEX IF NOT EXISTS idx_document_auth_status 
  ON document_authentications(authentication_status);

CREATE INDEX IF NOT EXISTS idx_document_auth_member 
  ON document_authentications(authenticator_member_code);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_document_auth_submission_status 
  ON document_authentications(submission_id, authentication_status);

-- Comments for documentation
COMMENT ON TABLE document_authentications IS 'Tracks authentication of issued documents during Network Submission';
COMMENT ON COLUMN document_authentications.authentication_status IS 'Status: PENDING, VERIFIED, FAILED';
COMMENT ON COLUMN document_authentications.verification_method IS 'Method used: BLOCKCHAIN, SIGNATURE, HASH';
COMMENT ON COLUMN document_authentications.verification_result IS 'JSON object with detailed verification results';


-- ============================================================================
-- 4. MODIFY EXISTING TABLES
-- Add document collection tracking to network submissions
-- ============================================================================

-- Check if network_submissions table exists, if not create it
CREATE TABLE IF NOT EXISTS network_submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(50) NOT NULL UNIQUE,
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add document collection fields to network_submissions
ALTER TABLE network_submissions 
  ADD COLUMN IF NOT EXISTS documents_collected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS required_documents_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS issued_documents_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS collection_completed_at TIMESTAMP;

-- Add index for document collection status
CREATE INDEX IF NOT EXISTS idx_network_submissions_documents_collected 
  ON network_submissions(documents_collected);

-- Comments for new columns
COMMENT ON COLUMN network_submissions.documents_collected IS 'Whether all required documents have been collected';
COMMENT ON COLUMN network_submissions.required_documents_count IS 'Total number of required documents';
COMMENT ON COLUMN network_submissions.issued_documents_count IS 'Number of documents issued to exporter';
COMMENT ON COLUMN network_submissions.collection_completed_at IS 'Timestamp when all documents were collected';


-- ============================================================================
-- 5. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Trigger for document_requests updated_at
CREATE OR REPLACE FUNCTION update_document_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_requests_updated_at
BEFORE UPDATE ON document_requests
FOR EACH ROW
EXECUTE FUNCTION update_document_requests_updated_at();

-- Trigger for issued_documents updated_at
CREATE OR REPLACE FUNCTION update_issued_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER issued_documents_updated_at
BEFORE UPDATE ON issued_documents
FOR EACH ROW
EXECUTE FUNCTION update_issued_documents_updated_at();

-- Trigger for document_authentications updated_at
CREATE OR REPLACE FUNCTION update_document_authentications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_authentications_updated_at
BEFORE UPDATE ON document_authentications
FOR EACH ROW
EXECUTE FUNCTION update_document_authentications_updated_at();


-- ============================================================================
-- 6. HELPER VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Document collection status per exporter
CREATE OR REPLACE VIEW v_exporter_document_collection AS
SELECT 
  ep.exporter_id,
  ep.user_id,
  ep.business_name,
  COUNT(DISTINCT dr.request_id) as total_requests,
  COUNT(DISTINCT CASE WHEN dr.request_status = 'PENDING' THEN dr.request_id END) as pending_requests,
  COUNT(DISTINCT CASE WHEN dr.request_status = 'ISSUED' THEN dr.request_id END) as issued_requests,
  COUNT(DISTINCT id.document_id) as total_issued_documents,
  COUNT(DISTINCT CASE WHEN id.status = 'ACTIVE' THEN id.document_id END) as active_documents,
  COUNT(DISTINCT CASE WHEN id.status = 'EXPIRED' THEN id.document_id END) as expired_documents,
  COUNT(DISTINCT CASE WHEN id.status = 'REVOKED' THEN id.document_id END) as revoked_documents
FROM exporter_profiles ep
LEFT JOIN document_requests dr ON ep.exporter_id = dr.exporter_id
LEFT JOIN issued_documents id ON ep.exporter_id = id.exporter_id
GROUP BY ep.exporter_id, ep.user_id, ep.business_name;

COMMENT ON VIEW v_exporter_document_collection IS 'Summary of document collection status per exporter';

-- View: Pending document requests by network member
CREATE OR REPLACE VIEW v_pending_document_requests AS
SELECT 
  dr.request_id,
  dr.network_member_code,
  dr.document_type,
  dr.requested_at,
  ep.exporter_id,
  ep.user_id,
  ep.business_name,
  ep.tin,
  ep.status as exporter_status
FROM document_requests dr
JOIN exporter_profiles ep ON dr.exporter_id = ep.exporter_id
WHERE dr.request_status = 'PENDING'
ORDER BY dr.requested_at ASC;

COMMENT ON VIEW v_pending_document_requests IS 'All pending document requests with exporter details';

-- View: Document authentication status per submission
CREATE OR REPLACE VIEW v_submission_authentication_status AS
SELECT 
  da.submission_id,
  COUNT(DISTINCT da.authentication_id) as total_authentications,
  COUNT(DISTINCT CASE WHEN da.authentication_status = 'PENDING' THEN da.authentication_id END) as pending_authentications,
  COUNT(DISTINCT CASE WHEN da.authentication_status = 'VERIFIED' THEN da.authentication_id END) as verified_authentications,
  COUNT(DISTINCT CASE WHEN da.authentication_status = 'FAILED' THEN da.authentication_id END) as failed_authentications,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN da.authentication_status = 'PENDING' THEN da.authentication_id END) = 0 
      AND COUNT(DISTINCT CASE WHEN da.authentication_status = 'FAILED' THEN da.authentication_id END) = 0
    THEN TRUE
    ELSE FALSE
  END as all_verified
FROM document_authentications da
GROUP BY da.submission_id;

COMMENT ON VIEW v_submission_authentication_status IS 'Authentication status summary per Network Submission';

-- ============================================================================
-- 7. GRANT PERMISSIONS (if needed)
-- ============================================================================

-- Grant permissions to application user (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON document_requests TO coffee_export_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON issued_documents TO coffee_export_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON document_authentications TO coffee_export_app;
-- GRANT SELECT ON v_exporter_document_collection TO coffee_export_app;
-- GRANT SELECT ON v_pending_document_requests TO coffee_export_app;
-- GRANT SELECT ON v_submission_authentication_status TO coffee_export_app;

-- ============================================================================
-- Migration Complete
-- ============================================================================


-- ============================================================================
-- 8. SUBMISSION DOCUMENTS JUNCTION TABLE
-- Links issued documents to Network Submissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS submission_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id VARCHAR(255) NOT NULL,
  document_id UUID NOT NULL REFERENCES issued_documents(document_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_submission_document UNIQUE (submission_id, document_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_submission_documents_submission 
  ON submission_documents(submission_id);

CREATE INDEX IF NOT EXISTS idx_submission_documents_document 
  ON submission_documents(document_id);

COMMENT ON TABLE submission_documents IS 'Junction table linking issued documents to Network Submissions';

-- ============================================================================
-- 9. NETWORK SUBMISSIONS TABLE (if not exists)
-- Stores Network Submission records with document collection tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS network_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id VARCHAR(255) NOT NULL UNIQUE,
  exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
  esw_reference_number VARCHAR(255),
  network_reference_number VARCHAR(255),
  exporter_info JSONB,
  supporting_documents JSONB,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'SUBMITTED',
  documents_collected BOOLEAN DEFAULT FALSE,
  required_documents_count INTEGER DEFAULT 0,
  issued_documents_count INTEGER DEFAULT 0,
  collection_completed_at TIMESTAMP,
  
  -- Network member approval statuses
  ecta_status VARCHAR(50) DEFAULT 'PENDING',
  ecta_approved_at TIMESTAMP,
  ecta_approved_by VARCHAR(255),
  ecta_notes TEXT,
  
  bank_status VARCHAR(50) DEFAULT 'PENDING',
  bank_approved_at TIMESTAMP,
  bank_approved_by VARCHAR(255),
  bank_notes TEXT,
  
  nbe_status VARCHAR(50) DEFAULT 'PENDING',
  nbe_approved_at TIMESTAMP,
  nbe_approved_by VARCHAR(255),
  nbe_notes TEXT,
  
  customs_status VARCHAR(50) DEFAULT 'PENDING',
  customs_approved_at TIMESTAMP,
  customs_approved_by VARCHAR(255),
  customs_notes TEXT,
  
  shipping_status VARCHAR(50) DEFAULT 'PENDING',
  shipping_approved_at TIMESTAMP,
  shipping_approved_by VARCHAR(255),
  shipping_notes TEXT,
  
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_network_submissions_exporter 
  ON network_submissions(exporter_id);

CREATE INDEX IF NOT EXISTS idx_network_submissions_status 
  ON network_submissions(status);

CREATE INDEX IF NOT EXISTS idx_network_submissions_submitted_at 
  ON network_submissions(submitted_at);

COMMENT ON TABLE network_submissions IS 'Network Submissions with issued document tracking and network member approvals';

-- ============================================================================
-- Migration 020 Complete
-- ============================================================================
