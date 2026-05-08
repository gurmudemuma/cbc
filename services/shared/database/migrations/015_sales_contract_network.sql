-- ============================================================================
-- Sales Contract Network Approval System
-- Migration 015: Add reference number tracking and Network Submissions
-- ============================================================================

-- Add reference number and registration tracking to contract_drafts
ALTER TABLE contract_drafts 
ADD COLUMN IF NOT EXISTS ecta_reference_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS registered_by UUID,
ADD COLUMN IF NOT EXISTS registration_notes TEXT,
ADD COLUMN IF NOT EXISTS network_submission_id UUID;

CREATE INDEX IF NOT EXISTS idx_contract_drafts_reference 
ON contract_drafts(ecta_reference_number);

-- Create Network Submissions table for network approval tracking
CREATE TABLE IF NOT EXISTS network_submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(50) NOT NULL UNIQUE,
    contract_id UUID NOT NULL REFERENCES contract_drafts(draft_id),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    -- Submission details
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_by UUID NOT NULL,
    documents JSONB,
    
    -- ECTA (already approved during registration)
    ecta_status VARCHAR(50) DEFAULT 'APPROVED',
    ecta_approved_at TIMESTAMP,
    ecta_approved_by UUID,
    ecta_notes TEXT,
    
    -- Commercial Bank
    bank_status VARCHAR(50) DEFAULT 'PENDING',
    bank_approved_at TIMESTAMP,
    bank_approved_by UUID,
    bank_lc_number VARCHAR(100),
    bank_lc_amount DECIMAL(15,2),
    bank_notes TEXT,
    
    -- National Bank of Ethiopia
    nbe_status VARCHAR(50) DEFAULT 'PENDING',
    nbe_approved_at TIMESTAMP,
    nbe_approved_by UUID,
    nbe_fx_allocation DECIMAL(15,2),
    nbe_fx_rate DECIMAL(10,4),
    nbe_repatriation_deadline DATE,
    nbe_notes TEXT,
    
    -- Customs Authority
    customs_status VARCHAR(50) DEFAULT 'PENDING',
    customs_approved_at TIMESTAMP,
    customs_approved_by UUID,
    customs_sad_number VARCHAR(100),
    customs_duty_paid DECIMAL(15,2),
    customs_tax_clearance VARCHAR(100),
    customs_notes TEXT,
    
    -- Shipping Line
    shipping_status VARCHAR(50) DEFAULT 'PENDING',
    shipping_approved_at TIMESTAMP,
    shipping_approved_by UUID,
    shipping_booking_number VARCHAR(100),
    shipping_bl_number VARCHAR(100),
    shipping_vessel_name VARCHAR(200),
    shipping_container_number VARCHAR(100),
    shipping_departure_date DATE,
    shipping_arrival_date DATE,
    shipping_notes TEXT,
    
    -- Overall status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_network_submissions_reference 
ON network_submissions(reference_number);

CREATE INDEX IF NOT EXISTS idx_network_submissions_exporter 
ON network_submissions(exporter_id);

CREATE INDEX IF NOT EXISTS idx_network_submissions_status 
ON network_submissions(status);

CREATE INDEX IF NOT EXISTS idx_network_submissions_bank_status 
ON network_submissions(bank_status);

CREATE INDEX IF NOT EXISTS idx_network_submissions_nbe_status 
ON network_submissions(nbe_status);

CREATE INDEX IF NOT EXISTS idx_network_submissions_customs_status 
ON network_submissions(customs_status);

CREATE INDEX IF NOT EXISTS idx_network_submissions_shipping_status 
ON network_submissions(shipping_status);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_network_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER network_submissions_updated_at
BEFORE UPDATE ON network_submissions
FOR EACH ROW
EXECUTE FUNCTION update_network_submissions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE network_submissions IS 'Tracks export submissions through network approval process';
COMMENT ON COLUMN network_submissions.reference_number IS 'ECTA-generated reference number (ECTA-SC-YYYY-XXXXX)';
COMMENT ON COLUMN network_submissions.status IS 'Overall status: PENDING, EXPORT_APPROVED, REJECTED';
COMMENT ON COLUMN contract_drafts.ecta_reference_number IS 'ECTA-generated reference number after registration';
