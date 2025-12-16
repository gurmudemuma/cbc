-- Migration: Create license_applications table
-- Purpose: Store export license application submissions before approval
-- Date: 2025-11-26

-- ============================================================================
-- LICENSE APPLICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS license_applications (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE,
    eic_registration_number VARCHAR(100) NOT NULL,
    requested_coffee_types JSONB DEFAULT '[]',
    requested_origins JSONB DEFAULT '[]',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    application_date TIMESTAMP NOT NULL,
    applicant_user_id VARCHAR(255) NOT NULL,
    
    -- Review tracking
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    approval_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_license_applications_exporter_id ON license_applications(exporter_id);
CREATE INDEX idx_license_applications_status ON license_applications(status);
CREATE INDEX idx_license_applications_applicant_user_id ON license_applications(applicant_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_license_applications_updated_at 
    BEFORE UPDATE ON license_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE license_applications IS 'Export license applications submitted by exporters awaiting ECTA review';
COMMENT ON COLUMN license_applications.eic_registration_number IS 'Ethiopian Investment Commission registration number';
COMMENT ON COLUMN license_applications.requested_coffee_types IS 'JSON array of coffee types requested for export authorization';
COMMENT ON COLUMN license_applications.requested_origins IS 'JSON array of origin regions requested for export authorization';
