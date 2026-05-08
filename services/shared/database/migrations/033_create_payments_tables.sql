-- ============================================================================
-- Migration: Create Payments Tables
-- Description: Creates tables for payment management system
-- ============================================================================

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID REFERENCES exports(export_id),
    contract_id UUID REFERENCES sales_contracts(contract_id),
    exporter_id UUID NOT NULL,
    buyer_id UUID,
    
    -- Payment details
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('LC', 'TT', 'CAD', 'DP', 'DA', 'OTHER')),
    payment_terms TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    exchange_rate DECIMAL(10, 4),
    amount_etb DECIMAL(15, 2),
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED' CHECK (status IN (
        'INITIATED', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 
        'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    
    -- LC Details
    lc_number VARCHAR(100),
    lc_issuing_bank VARCHAR(255),
    lc_advising_bank VARCHAR(255),
    lc_opening_date DATE,
    lc_expiry_date DATE,
    lc_amount DECIMAL(15, 2),
    
    -- Timestamps
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    documents_submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Metadata
    notes TEXT,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_documents table
CREATE TABLE IF NOT EXISTS payment_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT,
    document_hash VARCHAR(255),
    
    review_status VARCHAR(50) DEFAULT 'PENDING' CHECK (review_status IN (
        'PENDING', 'APPROVED', 'REJECTED'
    )),
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    
    submitted_by VARCHAR(100) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_milestones table
CREATE TABLE IF NOT EXISTS payment_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    milestone_name VARCHAR(255) NOT NULL,
    milestone_description TEXT,
    amount DECIMAL(15, 2),
    percentage DECIMAL(5, 2),
    
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    )),
    
    due_date DATE,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'PAYMENT', 'REFUND', 'FEE', 'ADJUSTMENT'
    )),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    
    transaction_reference VARCHAR(255),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    
    notes TEXT,
    processed_by VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_audit_log table
CREATE TABLE IF NOT EXISTS payment_audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    action VARCHAR(100) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    
    performed_by VARCHAR(100) NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_export_id ON payments(export_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_exporter_id ON payments(exporter_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_lc_number ON payments(lc_number);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_documents_payment_id ON payment_documents(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_documents_review_status ON payment_documents(review_status);

CREATE INDEX IF NOT EXISTS idx_payment_milestones_payment_id ON payment_milestones(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_status ON payment_milestones(status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

CREATE INDEX IF NOT EXISTS idx_payment_audit_log_payment_id ON payment_audit_log(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_performed_at ON payment_audit_log(performed_at);

-- Add comments
COMMENT ON TABLE payments IS 'Main payments table for tracking export payments';
COMMENT ON TABLE payment_documents IS 'Documents submitted for payment verification';
COMMENT ON TABLE payment_milestones IS 'Payment milestones and installments';
COMMENT ON TABLE payment_transactions IS 'Individual payment transactions';
COMMENT ON TABLE payment_audit_log IS 'Audit trail for payment changes';

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE payments TO postgres;
GRANT ALL PRIVILEGES ON TABLE payment_documents TO postgres;
GRANT ALL PRIVILEGES ON TABLE payment_milestones TO postgres;
GRANT ALL PRIVILEGES ON TABLE payment_transactions TO postgres;
GRANT ALL PRIVILEGES ON TABLE payment_audit_log TO postgres;
