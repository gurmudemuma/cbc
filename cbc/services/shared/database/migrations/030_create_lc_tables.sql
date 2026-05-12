-- ============================================================================
-- LETTER OF CREDIT (LC) TRACKING SYSTEM
-- Phase 3A: LC Issuance for Foreign Buyers (UCP 600 / eUCP)
-- ============================================================================

-- ============================================================================
-- 1. LETTER OF CREDIT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS letter_of_credit (
    lc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contract Linkage
    contract_id UUID NOT NULL REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    -- LC Identification
    lc_number VARCHAR(100) NOT NULL UNIQUE,
    lc_type VARCHAR(50) NOT NULL CHECK (lc_type IN (
        'IRREVOCABLE', 'REVOCABLE', 'CONFIRMED', 'UNCONFIRMED', 
        'TRANSFERABLE', 'NON_TRANSFERABLE', 'REVOLVING', 'STANDBY'
    )),
    
    -- Issuing Bank Information
    issuing_bank_name VARCHAR(500) NOT NULL,
    issuing_bank_swift_code VARCHAR(11) NOT NULL,
    issuing_bank_country VARCHAR(100) NOT NULL,
    issuing_bank_address TEXT,
    
    -- Advising Bank (CBE)
    advising_bank_name VARCHAR(500) DEFAULT 'Commercial Bank of Ethiopia',
    advising_bank_swift_code VARCHAR(11) DEFAULT 'CBETETAA',
    advising_bank_branch VARCHAR(255),
    
    -- Confirming Bank (if applicable)
    confirming_bank_name VARCHAR(500),
    confirming_bank_swift_code VARCHAR(11),
    
    -- Beneficiary (Exporter)
    beneficiary_name VARCHAR(500) NOT NULL,
    beneficiary_account VARCHAR(100),
    beneficiary_address TEXT NOT NULL,
    
    -- Applicant (Buyer)
    applicant_name VARCHAR(500) NOT NULL,
    applicant_address TEXT NOT NULL,
    applicant_country VARCHAR(100) NOT NULL,
    
    -- LC Amount
    lc_amount DECIMAL(15, 2) NOT NULL,
    lc_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    tolerance_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Validity
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    latest_shipment_date DATE,
    presentation_period_days INTEGER DEFAULT 21,
    
    -- Payment Terms
    payment_terms VARCHAR(100) NOT NULL CHECK (payment_terms IN (
        'AT_SIGHT', 'DEFERRED_PAYMENT', 'ACCEPTANCE', 'NEGOTIATION'
    )),
    tenor_days INTEGER,
    
    -- Incoterms
    incoterms VARCHAR(10) NOT NULL CHECK (incoterms IN (
        'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 
        'FAS', 'FOB', 'CFR', 'CIF'
    )),
    port_of_loading VARCHAR(255),
    port_of_discharge VARCHAR(255),
    
    -- Shipment Details
    partial_shipments_allowed BOOLEAN DEFAULT FALSE,
    transshipment_allowed BOOLEAN DEFAULT FALSE,
    goods_description TEXT NOT NULL,
    
    -- Required Documents
    required_documents JSONB DEFAULT '[]'::jsonb,
    -- Example: ["Commercial Invoice", "Bill of Lading", "Certificate of Origin", "Packing List", "Quality Certificate"]
    
    -- Special Conditions
    special_conditions TEXT,
    additional_terms TEXT,
    
    -- SWIFT MT700 Message
    mt700_message TEXT,
    mt700_received_at TIMESTAMP,
    
    -- Status Tracking
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING',           -- LC application submitted
        'ISSUED',            -- LC issued by issuing bank
        'ADVISED',           -- LC advised to beneficiary by CBE
        'ACCEPTED',          -- Exporter accepted LC terms
        'AMENDED',           -- LC amended
        'DOCUMENTS_PRESENTED', -- Documents presented to bank
        'DISCREPANCY',       -- Discrepancies found
        'ACCEPTED_WITH_DISCREPANCY', -- Accepted despite discrepancies
        'PAID',              -- Payment made
        'EXPIRED',           -- LC expired
        'CANCELLED',         -- LC cancelled
        'REJECTED'           -- Exporter rejected LC terms
    )),
    
    -- NBE Forex Approval
    nbe_approval_status VARCHAR(50) DEFAULT 'PENDING' CHECK (nbe_approval_status IN (
        'PENDING', 'APPROVED', 'REJECTED', 'NOT_REQUIRED'
    )),
    nbe_approval_date TIMESTAMP,
    nbe_approval_reference VARCHAR(100),
    nbe_approved_by VARCHAR(255),
    nbe_rejection_reason TEXT,
    
    -- Exporter Response
    exporter_response VARCHAR(50) CHECK (exporter_response IN (
        'PENDING', 'ACCEPTED', 'REJECTED', 'AMENDMENT_REQUESTED'
    )),
    exporter_response_date TIMESTAMP,
    exporter_response_notes TEXT,
    
    -- Amendment History
    amendment_count INTEGER DEFAULT 0,
    last_amendment_date TIMESTAMP,
    
    -- Document Presentation
    documents_presented_date TIMESTAMP,
    documents_presented_by VARCHAR(255),
    
    -- Discrepancy Management
    discrepancies JSONB DEFAULT '[]'::jsonb,
    discrepancy_waived BOOLEAN DEFAULT FALSE,
    discrepancy_waived_by VARCHAR(255),
    discrepancy_waived_date TIMESTAMP,
    
    -- Payment Information
    payment_date TIMESTAMP,
    payment_amount DECIMAL(15, 2),
    payment_reference VARCHAR(100),
    payment_swift_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    
    -- Constraints
    CONSTRAINT lc_amount_positive CHECK (lc_amount > 0),
    CONSTRAINT expiry_after_issue CHECK (expiry_date > issue_date),
    CONSTRAINT shipment_before_expiry CHECK (latest_shipment_date IS NULL OR latest_shipment_date <= expiry_date)
);

-- Indexes
CREATE INDEX idx_lc_contract_id ON letter_of_credit(contract_id);
CREATE INDEX idx_lc_exporter_id ON letter_of_credit(exporter_id);
CREATE INDEX idx_lc_number ON letter_of_credit(lc_number);
CREATE INDEX idx_lc_status ON letter_of_credit(status);
CREATE INDEX idx_lc_nbe_approval_status ON letter_of_credit(nbe_approval_status);
CREATE INDEX idx_lc_issue_date ON letter_of_credit(issue_date);
CREATE INDEX idx_lc_expiry_date ON letter_of_credit(expiry_date);

-- ============================================================================
-- 2. LC AMENDMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lc_amendments (
    amendment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lc_id UUID NOT NULL REFERENCES letter_of_credit(lc_id) ON DELETE CASCADE,
    
    -- Amendment Details
    amendment_number INTEGER NOT NULL,
    amendment_date DATE NOT NULL,
    amendment_type VARCHAR(50) NOT NULL CHECK (amendment_type IN (
        'AMOUNT_INCREASE', 'AMOUNT_DECREASE', 'EXPIRY_EXTENSION', 
        'SHIPMENT_DATE_EXTENSION', 'TERMS_MODIFICATION', 'DOCUMENTS_CHANGE',
        'BENEFICIARY_CHANGE', 'OTHER'
    )),
    
    -- Changes
    changes_description TEXT NOT NULL,
    previous_values JSONB,
    new_values JSONB,
    
    -- SWIFT MT707 Message
    mt707_message TEXT,
    mt707_received_at TIMESTAMP,
    
    -- Approval
    exporter_response VARCHAR(50) CHECK (exporter_response IN (
        'PENDING', 'ACCEPTED', 'REJECTED'
    )),
    exporter_response_date TIMESTAMP,
    exporter_response_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    
    CONSTRAINT unique_amendment_per_lc UNIQUE (lc_id, amendment_number)
);

CREATE INDEX idx_lc_amendments_lc_id ON lc_amendments(lc_id);
CREATE INDEX idx_lc_amendments_date ON lc_amendments(amendment_date);

-- ============================================================================
-- 3. LC DOCUMENT PRESENTATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lc_document_presentations (
    presentation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lc_id UUID NOT NULL REFERENCES letter_of_credit(lc_id) ON DELETE CASCADE,
    
    -- Presentation Details
    presentation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    presented_by VARCHAR(255) NOT NULL,
    presentation_bank VARCHAR(500),
    
    -- Documents Submitted
    documents_submitted JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example: [{"type": "Commercial Invoice", "document_id": "uuid", "file_url": "..."}]
    
    -- Compliance Check
    compliance_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (compliance_status IN (
        'PENDING', 'COMPLIANT', 'DISCREPANT', 'UNDER_REVIEW'
    )),
    checked_by VARCHAR(255),
    checked_at TIMESTAMP,
    
    -- Discrepancies
    discrepancies_found JSONB DEFAULT '[]'::jsonb,
    -- Example: [{"document": "Bill of Lading", "issue": "Late shipment date", "severity": "MAJOR"}]
    
    -- Bank Decision
    bank_decision VARCHAR(50) CHECK (bank_decision IN (
        'PENDING', 'ACCEPTED', 'REJECTED', 'ACCEPTED_WITH_DISCREPANCY', 'REFERRED_TO_APPLICANT'
    )),
    bank_decision_date TIMESTAMP,
    bank_decision_notes TEXT,
    
    -- Payment
    payment_authorized BOOLEAN DEFAULT FALSE,
    payment_authorized_by VARCHAR(255),
    payment_authorized_date TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lc_doc_presentations_lc_id ON lc_document_presentations(lc_id);
CREATE INDEX idx_lc_doc_presentations_date ON lc_document_presentations(presentation_date);
CREATE INDEX idx_lc_doc_presentations_status ON lc_document_presentations(compliance_status);

-- ============================================================================
-- 4. LC HISTORY/AUDIT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lc_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lc_id UUID NOT NULL REFERENCES letter_of_credit(lc_id) ON DELETE CASCADE,
    
    -- Event Details
    event_type VARCHAR(100) NOT NULL,
    event_description TEXT NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    
    -- Actor
    actor_type VARCHAR(50) NOT NULL CHECK (actor_type IN (
        'SYSTEM', 'EXPORTER', 'BANK', 'NBE', 'BUYER', 'ADMIN'
    )),
    actor_id VARCHAR(255),
    actor_name VARCHAR(255),
    
    -- Additional Data
    event_data JSONB,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT
);

CREATE INDEX idx_lc_history_lc_id ON lc_history(lc_id);
CREATE INDEX idx_lc_history_created_at ON lc_history(created_at);
CREATE INDEX idx_lc_history_event_type ON lc_history(event_type);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for letter_of_credit
CREATE OR REPLACE FUNCTION update_lc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lc_updated_at
BEFORE UPDATE ON letter_of_credit
FOR EACH ROW
EXECUTE FUNCTION update_lc_updated_at();

-- Auto-create history entry on LC status change
CREATE OR REPLACE FUNCTION log_lc_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO lc_history (
            lc_id, event_type, event_description, 
            previous_status, new_status, actor_type
        ) VALUES (
            NEW.lc_id,
            'STATUS_CHANGE',
            'LC status changed from ' || OLD.status || ' to ' || NEW.status,
            OLD.status,
            NEW.status,
            'SYSTEM'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_lc_status_change
AFTER UPDATE ON letter_of_credit
FOR EACH ROW
EXECUTE FUNCTION log_lc_status_change();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE letter_of_credit IS 'Tracks Letter of Credit (LC) issuance and lifecycle for foreign buyer payments';
COMMENT ON COLUMN letter_of_credit.mt700_message IS 'SWIFT MT700 message content (LC issuance)';
COMMENT ON COLUMN letter_of_credit.nbe_approval_status IS 'National Bank of Ethiopia forex approval status';
COMMENT ON TABLE lc_amendments IS 'Tracks amendments to LCs (SWIFT MT707)';
COMMENT ON TABLE lc_document_presentations IS 'Tracks document presentations against LC terms';
COMMENT ON TABLE lc_history IS 'Audit trail for all LC-related events';
