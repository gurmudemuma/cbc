-- Migration 013: Add FULLY_QUALIFIED status to exporter_profiles
-- This allows the system to automatically mark exporters as "Fully Qualified"
-- when they meet all pre-registration requirements

-- Add FULLY_QUALIFIED to the status constraint
ALTER TABLE exporter_profiles 
DROP CONSTRAINT IF EXISTS exporter_profiles_status_check;

ALTER TABLE exporter_profiles 
ADD CONSTRAINT exporter_profiles_status_check 
CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'PENDING_APPROVAL', 'FULLY_QUALIFIED'));

-- Update the qualified_exporters view to use the new status
CREATE OR REPLACE VIEW qualified_exporters AS
SELECT 
    ep.exporter_id,
    ep.business_name,
    ep.tin,
    ep.business_type,
    ep.status as profile_status,
    cl.laboratory_id,
    cl.status as lab_status,
    ct.taster_id,
    ct.status as taster_status,
    cc.certificate_id as competence_certificate_id,
    cc.status as competence_status,
    el.license_id as export_license_id,
    el.status as license_status,
    CASE 
        WHEN ep.status = 'FULLY_QUALIFIED' THEN TRUE
        WHEN ep.status = 'ACTIVE' 
        AND (ep.business_type = 'FARMER' OR (ep.capital_verified AND cl.status = 'ACTIVE' AND ct.status = 'ACTIVE'))
        AND cc.status = 'ACTIVE' 
        AND el.status = 'ACTIVE'
        AND cc.expiry_date > CURRENT_DATE
        AND el.expiry_date > CURRENT_DATE
        THEN TRUE 
        ELSE FALSE 
    END as is_qualified
FROM exporter_profiles ep
LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id AND cl.status = 'ACTIVE'
LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id AND ct.status = 'ACTIVE'
LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id AND cc.status = 'ACTIVE'
LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id AND el.status = 'ACTIVE';

-- Add comment
COMMENT ON COLUMN exporter_profiles.status IS 'Exporter status: PENDING_APPROVAL, ACTIVE, FULLY_QUALIFIED, SUSPENDED, REVOKED';