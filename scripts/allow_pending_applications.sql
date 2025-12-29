-- ============================================================================
-- Migration: Allow Pending Applications
-- Description: Makes certificate/license fields nullable to support PENDING status
--              and adds application-specific columns
-- ============================================================================

-- 1. COMPETENCE CERTIFICATES
-- Make fields nullable
ALTER TABLE competence_certificates 
    ALTER COLUMN certificate_number DROP NOT NULL,
    ALTER COLUMN issued_date DROP NOT NULL,
    ALTER COLUMN expiry_date DROP NOT NULL;

-- Add application tracking columns
ALTER TABLE competence_certificates 
    ADD COLUMN IF NOT EXISTS application_reason TEXT,
    ADD COLUMN IF NOT EXISTS additional_documents JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS facility_description TEXT,
    ADD COLUMN IF NOT EXISTS application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS applicant_user_id VARCHAR(255);

-- 2. EXPORT LICENSES
-- Make fields nullable
ALTER TABLE export_licenses 
    ALTER COLUMN license_number DROP NOT NULL,
    ALTER COLUMN issued_date DROP NOT NULL,
    ALTER COLUMN expiry_date DROP NOT NULL;

-- Add application tracking columns
ALTER TABLE export_licenses 
    ADD COLUMN IF NOT EXISTS requested_coffee_types JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS requested_origins JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS applicant_user_id VARCHAR(255);

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Certificate/License tables now support pending applications';
END $$;
