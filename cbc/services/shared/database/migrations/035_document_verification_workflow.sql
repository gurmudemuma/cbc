-- ============================================================================
-- Document Verification & Payment Workflow
-- Migration 035: Add document verification and payment initiation workflow
-- ============================================================================

-- ============================================================================
-- 1. DOCUMENT SUBMISSION BATCHES
-- Tracks when exporters submit collected documents for verification
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_submission_batches (
  batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
  contract_reference VARCHAR(255) NOT NULL, -- ECTA reference number
  submission_reference VARCHAR(255) NOT NULL UNIQUE, -- DSB-2026-00001
  submission_status VARCHAR(50) DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_VERIFICATION, VERIFIED, REJECTED, PAYMENT_INITIATED
  total_documents INTEGER DEFAULT 0,
  verified_documents INTEGER DEFAULT 0,
  rejected_documents INTEGER DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verification_completed_at TIMESTAMP,
  payment_initiated_at TIMESTAMP,
  payment_initiated_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_doc_submission_exporter 
    FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doc_submission_exporter 
  ON document_submission_batches(exporter_id);

CREATE INDEX IF NOT EXISTS idx_doc_submission_status 
  ON document_submission_batches(submission_status);

CREATE INDEX IF NOT EXISTS idx_doc_submission_contract 
  ON document_submission_batches(contract_reference);

COMMENT ON TABLE document_submission_batches IS 'Tracks exporter document submissions for network verification';
COMMENT ON COLUMN document_submission_batches.submission_status IS 'Status: SUBMITTED, UNDER_VERIFICATION, VERIFIED, REJECTED, PAYMENT_INITIATED';


-- ============================================================================
-- 2. DOCUMENT VERIFICATIONS
-- Tracks verification of each document by each network member
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_verifications (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES document_submission_batches(batch_id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES issued_documents(document_id) ON DELETE CASCADE,
  verifier_member_code VARCHAR(50) NOT NULL, -- ECTA, CBE, NBE, CUSTOMS, SHIPPING, ECX
  verification_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
  verification_method VARCHAR(100), -- SIGNATURE_CHECK, HASH_VERIFICATION, BLOCKCHAIN_VERIFICATION, MSP_SIGNATURE
  verification_notes TEXT,
  verified_at TIMESTAMP,
  verified_by VARCHAR(255), -- User who performed verification
  rejection_reason TEXT,
  verification_data JSONB, -- Additional verification details
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_doc_verification_batch 
    FOREIGN KEY (batch_id) REFERENCES document_submission_batches(batch_id) ON DELETE CASCADE,
  CONSTRAINT fk_doc_verification_document 
    FOREIGN KEY (document_id) REFERENCES issued_documents(document_id) ON DELETE CASCADE,
  CONSTRAINT unique_verification_per_member 
    UNIQUE (batch_id, document_id, verifier_member_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doc_verification_batch 
  ON document_verifications(batch_id);

CREATE INDEX IF NOT EXISTS idx_doc_verification_document 
  ON document_verifications(document_id);

CREATE INDEX IF NOT EXISTS idx_doc_verification_member 
  ON document_verifications(verifier_member_code);

CREATE INDEX IF NOT EXISTS idx_doc_verification_status 
  ON document_verifications(verification_status);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_doc_verification_member_status 
  ON document_verifications(verifier_member_code, verification_status);

COMMENT ON TABLE document_verifications IS 'Tracks document verification by each network member';
COMMENT ON COLUMN document_verifications.verification_status IS 'Status: PENDING, VERIFIED, REJECTED';
COMMENT ON COLUMN document_verifications.verification_method IS 'Method: SIGNATURE_CHECK, HASH_VERIFICATION, BLOCKCHAIN_VERIFICATION, MSP_SIGNATURE';


-- ============================================================================
-- 3. PAYMENT INITIATIONS
-- Tracks payment initiation by exporter bank (CBE) after verification
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_initiations (
  initiation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES document_submission_batches(batch_id) ON DELETE CASCADE,
  exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
  contract_reference VARCHAR(255) NOT NULL,
  payment_reference VARCHAR(255) NOT NULL UNIQUE, -- PAY-2026-00001
  payment_amount DECIMAL(15, 2),
  payment_currency VARCHAR(10),
  importer_bank_name VARCHAR(255),
  importer_bank_country VARCHAR(100),
  importer_bank_swift VARCHAR(50),
  payment_method VARCHAR(100), -- LC, TT, DP, DA
  payment_terms TEXT,
  documents_package_url TEXT, -- URL to document package for importer bank
  initiated_by VARCHAR(255) NOT NULL, -- CBE user who initiated
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_status VARCHAR(50) DEFAULT 'INITIATED', -- INITIATED, DOCUMENTS_SENT, CONFIRMED, COMPLETED, FAILED
  confirmed_at TIMESTAMP,
  completed_at TIMESTAMP,
  failure_reason TEXT,
  blockchain_tx_id VARCHAR(255), -- Blockchain transaction ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_payment_initiation_batch 
    FOREIGN KEY (batch_id) REFERENCES document_submission_batches(batch_id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_initiation_exporter 
    FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_initiation_batch 
  ON payment_initiations(batch_id);

CREATE INDEX IF NOT EXISTS idx_payment_initiation_exporter 
  ON payment_initiations(exporter_id);

CREATE INDEX IF NOT EXISTS idx_payment_initiation_status 
  ON payment_initiations(payment_status);

CREATE INDEX IF NOT EXISTS idx_payment_initiation_contract 
  ON payment_initiations(contract_reference);

COMMENT ON TABLE payment_initiations IS 'Tracks payment initiation by exporter bank after document verification';
COMMENT ON COLUMN payment_initiations.payment_status IS 'Status: INITIATED, DOCUMENTS_SENT, CONFIRMED, COMPLETED, FAILED';


-- ============================================================================
-- 4. PAYMENT DOCUMENTS
-- Links documents to payment initiations for importer bank
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_initiation_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiation_id UUID NOT NULL REFERENCES payment_initiations(initiation_id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES issued_documents(document_id) ON DELETE CASCADE,
  document_category VARCHAR(100), -- EXPORT_LICENSE, CERTIFICATE_OF_ORIGIN, PHYTOSANITARY, etc.
  required_for_payment BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_payment_document 
    UNIQUE (initiation_id, document_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_doc_initiation 
  ON payment_initiation_documents(initiation_id);

CREATE INDEX IF NOT EXISTS idx_payment_doc_document 
  ON payment_initiation_documents(document_id);

COMMENT ON TABLE payment_initiation_documents IS 'Links verified documents to payment initiations';


-- ============================================================================
-- 5. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Trigger for document_submission_batches updated_at
CREATE OR REPLACE FUNCTION update_doc_submission_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER doc_submission_batches_updated_at
BEFORE UPDATE ON document_submission_batches
FOR EACH ROW
EXECUTE FUNCTION update_doc_submission_batches_updated_at();

-- Trigger for document_verifications updated_at
CREATE OR REPLACE FUNCTION update_doc_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER doc_verifications_updated_at
BEFORE UPDATE ON document_verifications
FOR EACH ROW
EXECUTE FUNCTION update_doc_verifications_updated_at();

-- Trigger for payment_initiations updated_at
CREATE OR REPLACE FUNCTION update_payment_initiations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_initiations_updated_at
BEFORE UPDATE ON payment_initiations
FOR EACH ROW
EXECUTE FUNCTION update_payment_initiations_updated_at();


-- ============================================================================
-- 6. HELPER VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Document verification progress per batch
CREATE OR REPLACE VIEW v_batch_verification_progress AS
SELECT 
  dsb.batch_id,
  dsb.submission_reference,
  dsb.exporter_id,
  dsb.contract_reference,
  dsb.submission_status,
  dsb.total_documents,
  COUNT(DISTINCT dv.verification_id) as total_verifications,
  COUNT(DISTINCT CASE WHEN dv.verification_status = 'PENDING' THEN dv.verification_id END) as pending_verifications,
  COUNT(DISTINCT CASE WHEN dv.verification_status = 'VERIFIED' THEN dv.verification_id END) as verified_verifications,
  COUNT(DISTINCT CASE WHEN dv.verification_status = 'REJECTED' THEN dv.verification_id END) as rejected_verifications,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN dv.verification_status = 'PENDING' THEN dv.verification_id END) = 0 
      AND COUNT(DISTINCT CASE WHEN dv.verification_status = 'REJECTED' THEN dv.verification_id END) = 0
      AND COUNT(DISTINCT dv.verification_id) > 0
    THEN TRUE
    ELSE FALSE
  END as all_verified
FROM document_submission_batches dsb
LEFT JOIN document_verifications dv ON dsb.batch_id = dv.batch_id
GROUP BY dsb.batch_id, dsb.submission_reference, dsb.exporter_id, dsb.contract_reference, dsb.submission_status, dsb.total_documents;

COMMENT ON VIEW v_batch_verification_progress IS 'Verification progress summary per document submission batch';

-- View: Pending verifications by network member
CREATE OR REPLACE VIEW v_pending_verifications_by_member AS
SELECT 
  dv.verification_id,
  dv.verifier_member_code,
  dv.batch_id,
  dsb.submission_reference,
  dsb.contract_reference,
  dv.document_id,
  id.document_type,
  id.document_number,
  id.issuer_member_code,
  ep.business_name as exporter_name,
  ep.tin as exporter_tin,
  dsb.submitted_at
FROM document_verifications dv
JOIN document_submission_batches dsb ON dv.batch_id = dsb.batch_id
JOIN issued_documents id ON dv.document_id = id.document_id
JOIN exporter_profiles ep ON dsb.exporter_id = ep.exporter_id
WHERE dv.verification_status = 'PENDING'
ORDER BY dsb.submitted_at ASC;

COMMENT ON VIEW v_pending_verifications_by_member IS 'All pending document verifications with details';

-- View: Batches ready for payment initiation
CREATE OR REPLACE VIEW v_batches_ready_for_payment AS
SELECT 
  dsb.batch_id,
  dsb.submission_reference,
  dsb.exporter_id,
  ep.business_name as exporter_name,
  dsb.contract_reference,
  dsb.total_documents,
  dsb.submitted_at,
  dsb.verification_completed_at,
  COUNT(DISTINCT dv.verification_id) as total_verifications,
  COUNT(DISTINCT CASE WHEN dv.verification_status = 'VERIFIED' THEN dv.verification_id END) as verified_count
FROM document_submission_batches dsb
JOIN exporter_profiles ep ON dsb.exporter_id = ep.exporter_id
LEFT JOIN document_verifications dv ON dsb.batch_id = dv.batch_id
WHERE dsb.submission_status = 'VERIFIED'
  AND dsb.payment_initiated_at IS NULL
GROUP BY dsb.batch_id, dsb.submission_reference, dsb.exporter_id, ep.business_name, dsb.contract_reference, dsb.total_documents, dsb.submitted_at, dsb.verification_completed_at
HAVING COUNT(DISTINCT CASE WHEN dv.verification_status = 'VERIFIED' THEN dv.verification_id END) = COUNT(DISTINCT dv.verification_id);

COMMENT ON VIEW v_batches_ready_for_payment IS 'Document batches that are fully verified and ready for payment initiation';

-- ============================================================================
-- Migration 035 Complete
-- ============================================================================
