-- ============================================================================
-- Universal Certificate Renewal Management System
-- Handles renewals for all certificate types in one unified table
-- ============================================================================

-- Drop the old taster-specific table if it exists
DROP TABLE IF EXISTS taster_renewal_requests CASCADE;

-- Create unified renewal requests table
CREATE TABLE IF NOT EXISTS certificate_renewal_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE,
    
    -- Certificate type and reference
    certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN (
        'TASTER_PROFICIENCY',
        'LABORATORY_CERTIFICATION', 
        'COMPETENCE_CERTIFICATE',
        'EXPORT_LICENSE'
    )),
    certificate_id UUID NOT NULL, -- References the specific certificate table
    entity_name VARCHAR(255), -- Name of taster, lab, etc.
    
    -- Current certificate info
    current_certificate_number VARCHAR(100) NOT NULL,
    current_issue_date DATE,
    current_expiry_date DATE NOT NULL,
    
    -- Requested renewal info
    new_certificate_number VARCHAR(100),
    requested_issue_date DATE,
    requested_expiry_date DATE NOT NULL,
    renewal_reason TEXT,
    supporting_documents JSONB, -- Array of document hashes/URLs
    
    -- Request status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    
    -- Request tracking
    requested_by VARCHAR(255) NOT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Approval tracking
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    final_certificate_number VARCHAR(100),
    final_issue_date DATE,
    final_expiry_date DATE,
    
    -- Rejection tracking
    rejected_by VARCHAR(255),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_cert_renewal_exporter_id ON certificate_renewal_requests(exporter_id);
CREATE INDEX idx_cert_renewal_cert_type ON certificate_renewal_requests(certificate_type);
CREATE INDEX idx_cert_renewal_cert_id ON certificate_renewal_requests(certificate_id);
CREATE INDEX idx_cert_renewal_status ON certificate_renewal_requests(status);
CREATE INDEX idx_cert_renewal_requested_at ON certificate_renewal_requests(requested_at);
CREATE INDEX idx_cert_renewal_expiry ON certificate_renewal_requests(current_expiry_date);

-- Composite index for common queries
CREATE INDEX idx_cert_renewal_type_status ON certificate_renewal_requests(certificate_type, status);

-- Comments
COMMENT ON TABLE certificate_renewal_requests IS 'Universal table for tracking all certificate renewal requests across the system';
COMMENT ON COLUMN certificate_renewal_requests.certificate_type IS 'Type of certificate: TASTER_PROFICIENCY, LABORATORY_CERTIFICATION, COMPETENCE_CERTIFICATE, EXPORT_LICENSE';
COMMENT ON COLUMN certificate_renewal_requests.certificate_id IS 'UUID reference to the specific certificate in its respective table';
COMMENT ON COLUMN certificate_renewal_requests.status IS 'PENDING: Awaiting ECTA review, APPROVED: Renewal approved and certificate updated, REJECTED: Renewal request rejected, CANCELLED: Request cancelled by exporter';
COMMENT ON COLUMN certificate_renewal_requests.supporting_documents IS 'JSON array of supporting document references (IPFS hashes, file paths, etc.)';

-- Create view for easy querying of expiring certificates
CREATE OR REPLACE VIEW expiring_certificates AS
SELECT 
    'TASTER_PROFICIENCY' as certificate_type,
    ct.taster_id as certificate_id,
    ct.exporter_id,
    ct.full_name as entity_name,
    ct.proficiency_certificate_number as certificate_number,
    ct.certificate_issue_date as issue_date,
    ct.certificate_expiry_date as expiry_date,
    ct.status,
    (ct.certificate_expiry_date - CURRENT_DATE) as days_until_expiry,
    ep.business_name as exporter_name,
    ep.email as exporter_email
FROM coffee_tasters ct
INNER JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id
WHERE ct.status = 'ACTIVE'
  AND ct.certificate_expiry_date <= CURRENT_DATE + INTERVAL '90 days'

UNION ALL

SELECT 
    'LABORATORY_CERTIFICATION' as certificate_type,
    cl.laboratory_id as certificate_id,
    cl.exporter_id,
    cl.laboratory_name as entity_name,
    cl.certification_number as certificate_number,
    cl.certified_date::DATE as issue_date,
    cl.expiry_date::DATE as expiry_date,
    cl.status,
    (cl.expiry_date::DATE - CURRENT_DATE) as days_until_expiry,
    ep.business_name as exporter_name,
    ep.email as exporter_email
FROM coffee_laboratories cl
INNER JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id
WHERE cl.status = 'ACTIVE'
  AND cl.expiry_date IS NOT NULL
  AND cl.expiry_date::DATE <= CURRENT_DATE + INTERVAL '90 days'

UNION ALL

SELECT 
    'COMPETENCE_CERTIFICATE' as certificate_type,
    cc.certificate_id,
    cc.exporter_id,
    ep.business_name as entity_name,
    cc.certificate_number,
    cc.issued_date as issue_date,
    cc.expiry_date,
    cc.status,
    (cc.expiry_date - CURRENT_DATE) as days_until_expiry,
    ep.business_name as exporter_name,
    ep.email as exporter_email
FROM competence_certificates cc
INNER JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
WHERE cc.status = 'ACTIVE'
  AND cc.expiry_date <= CURRENT_DATE + INTERVAL '90 days'

UNION ALL

SELECT 
    'EXPORT_LICENSE' as certificate_type,
    el.license_id as certificate_id,
    el.exporter_id,
    ep.business_name as entity_name,
    el.license_number as certificate_number,
    el.issued_date as issue_date,
    el.expiry_date,
    el.status,
    (el.expiry_date - CURRENT_DATE) as days_until_expiry,
    ep.business_name as exporter_name,
    ep.email as exporter_email
FROM export_licenses el
INNER JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
WHERE el.status = 'ACTIVE'
  AND el.expiry_date <= CURRENT_DATE + INTERVAL '90 days';

COMMENT ON VIEW expiring_certificates IS 'Unified view of all certificates expiring within 90 days across all certificate types';
