-- Payment System Implementation
-- Migration: 030_payment_system.sql
-- Description: Complete payment tracking and management system

-- ============================================
-- 1. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID REFERENCES exports(export_id) ON DELETE SET NULL,
    contract_id UUID, -- References sales_contracts if exists
    exporter_id UUID REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES buyer_registry(buyer_id) ON DELETE SET NULL,
    
    -- Payment Details
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('LC', 'TT', 'CAD', 'DP', 'DA', 'OA')),
    payment_terms VARCHAR(100), -- Net 30, Net 60, Advance, etc.
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10, 4),
    amount_etb DECIMAL(15, 2), -- Amount in Ethiopian Birr
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'INITIATED' CHECK (status IN (
        'INITIATED', 'LC_OPENED', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW',
        'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'DISPUTED', 'REFUNDED'
    )),
    
    -- LC Specific Fields
    lc_number VARCHAR(100),
    lc_issuing_bank VARCHAR(255),
    lc_advising_bank VARCHAR(255),
    lc_opening_date TIMESTAMP,
    lc_expiry_date TIMESTAMP,
    lc_amount DECIMAL(15, 2),
    
    -- Document Submission
    documents_submitted_at TIMESTAMP,
    documents_approved_at TIMESTAMP,
    documents_rejected_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Payment Processing
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    
    -- Bank Details
    processing_bank VARCHAR(255),
    bank_reference VARCHAR(100),
    swift_code VARCHAR(20),
    
    -- Compliance
    nbe_approval_status VARCHAR(50) DEFAULT 'PENDING' CHECK (nbe_approval_status IN (
        'PENDING', 'APPROVED', 'REJECTED', 'NOT_REQUIRED'
    )),
    nbe_approval_date TIMESTAMP,
    nbe_reference VARCHAR(100),
    
    -- Audit
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Blockchain
    blockchain_tx_id VARCHAR(255),
    blockchain_synced BOOLEAN DEFAULT FALSE,
    
    -- Additional Info
    notes TEXT,
    metadata JSONB
);

-- Indexes for payments
CREATE INDEX idx_payments_export ON payments(export_id);
CREATE INDEX idx_payments_exporter ON payments(exporter_id);
CREATE INDEX idx_payments_buyer ON payments(buyer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_nbe_status ON payments(nbe_approval_status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_lc_number ON payments(lc_number) WHERE lc_number IS NOT NULL;

-- ============================================
-- 2. PAYMENT MILESTONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    milestone_type VARCHAR(50) NOT NULL CHECK (milestone_type IN (
        'ADVANCE', 'SHIPMENT', 'DELIVERY', 'FINAL', 'CUSTOM'
    )),
    milestone_name VARCHAR(255),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    percentage DECIMAL(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
    due_date TIMESTAMP,
    
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'DUE', 'PAID', 'OVERDUE', 'WAIVED'
    )),
    paid_at TIMESTAMP,
    paid_amount DECIMAL(15, 2),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_milestones_payment ON payment_milestones(payment_id);
CREATE INDEX idx_payment_milestones_status ON payment_milestones(status);
CREATE INDEX idx_payment_milestones_due_date ON payment_milestones(due_date);

-- ============================================
-- 3. PAYMENT DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT,
    document_hash VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    submitted_by VARCHAR(255),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    review_status VARCHAR(50) DEFAULT 'PENDING' CHECK (review_status IN (
        'PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_RESUBMISSION'
    )),
    review_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_documents_payment ON payment_documents(payment_id);
CREATE INDEX idx_payment_documents_status ON payment_documents(review_status);
CREATE INDEX idx_payment_documents_type ON payment_documents(document_type);

-- ============================================
-- 4. PAYMENT TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'DEBIT', 'CREDIT', 'FEE', 'REFUND', 'REVERSAL'
    )),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    from_account VARCHAR(255),
    to_account VARCHAR(255),
    
    bank_reference VARCHAR(100),
    swift_reference VARCHAR(100),
    
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    processed_at TIMESTAMP,
    
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_transactions_payment ON payment_transactions(payment_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_type ON payment_transactions(transaction_type);

-- ============================================
-- 5. PAYMENT AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    action VARCHAR(100) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    
    performed_by VARCHAR(255) NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT
);

CREATE INDEX idx_payment_audit_payment ON payment_audit_log(payment_id);
CREATE INDEX idx_payment_audit_performed_at ON payment_audit_log(performed_at DESC);
CREATE INDEX idx_payment_audit_performed_by ON payment_audit_log(performed_by);

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Update timestamp trigger for payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Audit log trigger for payments
CREATE OR REPLACE FUNCTION log_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO payment_audit_log (
            payment_id, action, old_status, new_status, performed_by, details
        ) VALUES (
            NEW.payment_id,
            'STATUS_CHANGE',
            OLD.status,
            NEW.status,
            NEW.updated_by,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'timestamp', CURRENT_TIMESTAMP
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_status_audit
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_payment_changes();

-- ============================================
-- 7. VIEWS
-- ============================================

-- View for pending payments
CREATE OR REPLACE VIEW v_pending_payments AS
SELECT 
    p.*,
    ep.business_name as exporter_name,
    br.company_name as buyer_name,
    e.coffee_type,
    e.quantity,
    COUNT(pd.document_id) as documents_count,
    COUNT(pd.document_id) FILTER (WHERE pd.review_status = 'APPROVED') as approved_documents_count
FROM payments p
LEFT JOIN exporter_profiles ep ON p.exporter_id = ep.exporter_id
LEFT JOIN buyer_registry br ON p.buyer_id = br.buyer_id
LEFT JOIN exports e ON p.export_id = e.export_id
LEFT JOIN payment_documents pd ON p.payment_id = pd.payment_id
WHERE p.status IN ('INITIATED', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW')
GROUP BY p.payment_id, ep.business_name, br.company_name, e.coffee_type, e.quantity;

-- View for payment statistics
CREATE OR REPLACE VIEW v_payment_statistics AS
SELECT 
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_payments,
    COUNT(*) FILTER (WHERE status IN ('INITIATED', 'UNDER_REVIEW', 'PROCESSING')) as pending_payments,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed_payments,
    SUM(amount) FILTER (WHERE status = 'COMPLETED') as total_completed_amount,
    SUM(amount) FILTER (WHERE status IN ('INITIATED', 'UNDER_REVIEW', 'PROCESSING')) as total_pending_amount,
    AVG(EXTRACT(EPOCH FROM (completed_at - initiated_at))/86400) FILTER (WHERE status = 'COMPLETED') as avg_processing_days
FROM payments;

-- View for exporter payment summary
CREATE OR REPLACE VIEW v_exporter_payment_summary AS
SELECT 
    ep.exporter_id,
    ep.business_name,
    COUNT(p.payment_id) as total_payments,
    COUNT(p.payment_id) FILTER (WHERE p.status = 'COMPLETED') as completed_payments,
    SUM(p.amount) FILTER (WHERE p.status = 'COMPLETED') as total_received,
    SUM(p.amount) FILTER (WHERE p.status IN ('INITIATED', 'UNDER_REVIEW', 'PROCESSING')) as pending_amount,
    MAX(p.completed_at) as last_payment_date
FROM exporter_profiles ep
LEFT JOIN payments p ON ep.exporter_id = p.exporter_id
GROUP BY ep.exporter_id, ep.business_name;

-- ============================================
-- 8. COMMENTS
-- ============================================

COMMENT ON TABLE payments IS 'Main payment tracking table for export transactions';
COMMENT ON TABLE payment_milestones IS 'Payment milestones for staged payments';
COMMENT ON TABLE payment_documents IS 'Documents submitted for payment processing';
COMMENT ON TABLE payment_transactions IS 'Individual financial transactions related to payments';
COMMENT ON TABLE payment_audit_log IS 'Audit trail for all payment-related actions';

COMMENT ON COLUMN payments.payment_method IS 'LC=Letter of Credit, TT=Telegraphic Transfer, CAD=Cash Against Documents, DP=Documents Against Payment, DA=Documents Against Acceptance, OA=Open Account';
COMMENT ON COLUMN payments.nbe_approval_status IS 'NBE (National Bank of Ethiopia) foreign exchange approval status';
COMMENT ON COLUMN payments.blockchain_synced IS 'Whether payment has been synced to blockchain';

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================

-- Grant permissions to application user (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'coffee_app') THEN
        GRANT SELECT, INSERT, UPDATE ON payments TO coffee_app;
        GRANT SELECT, INSERT, UPDATE ON payment_milestones TO coffee_app;
        GRANT SELECT, INSERT, UPDATE ON payment_documents TO coffee_app;
        GRANT SELECT, INSERT, UPDATE ON payment_transactions TO coffee_app;
        GRANT SELECT, INSERT ON payment_audit_log TO coffee_app;
    END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
