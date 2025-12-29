-- ============================================================================
-- Migration: Update Status Constraints for Rejection Support
-- Description: Updates CHECK constraints to include 'REJECTED' status
-- Tables: competence_certificates, export_licenses
-- ============================================================================

-- Update competence_certificates status constraint
ALTER TABLE IF EXISTS competence_certificates
DROP CONSTRAINT IF EXISTS competence_certificates_status_check;

ALTER TABLE IF EXISTS competence_certificates
ADD CONSTRAINT competence_certificates_status_check 
CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'PENDING', 'REJECTED'));

-- Update export_licenses status constraint
ALTER TABLE IF EXISTS export_licenses
DROP CONSTRAINT IF EXISTS export_licenses_status_check;

ALTER TABLE IF EXISTS export_licenses
ADD CONSTRAINT export_licenses_status_check 
CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'PENDING', 'PENDING_REVIEW', 'REJECTED'));

-- Update coffee_laboratories status constraint (if not already done)
ALTER TABLE IF EXISTS coffee_laboratories
DROP CONSTRAINT IF EXISTS coffee_laboratories_status_check;

ALTER TABLE IF EXISTS coffee_laboratories
ADD CONSTRAINT coffee_laboratories_status_check 
CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'PENDING', 'REJECTED'));

-- Update exporter_profiles status constraint (if not already done)
ALTER TABLE IF EXISTS exporter_profiles
DROP CONSTRAINT IF EXISTS exporter_profiles_status_check;

ALTER TABLE IF EXISTS exporter_profiles
ADD CONSTRAINT exporter_profiles_status_check 
CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'PENDING_APPROVAL', 'REJECTED'));

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Status constraints updated to support REJECTED status';
END $$;
