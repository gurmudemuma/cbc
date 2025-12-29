-- ============================================================================
-- Migration: Add Rejection and Resubmission Tracking
-- Description: Adds fields to track rejection reasons, history, and resubmissions
-- Tables: exporter_profiles, coffee_laboratories, coffee_tasters, 
--         competence_certificates, export_licenses
-- ============================================================================

-- Add rejection and resubmission tracking to exporter_profiles
ALTER TABLE IF EXISTS exporter_profiles
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS resubmission_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_resubmitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_history JSONB DEFAULT '[]'::jsonb;

-- Add rejection tracking to coffee_laboratories
ALTER TABLE IF EXISTS coffee_laboratories
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS resubmission_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_resubmitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_history JSONB DEFAULT '[]'::jsonb;

-- Add rejection tracking to coffee_tasters
ALTER TABLE IF EXISTS coffee_tasters
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS resubmission_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_resubmitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_history JSONB DEFAULT '[]'::jsonb;

-- Add rejection tracking to competence_certificates
ALTER TABLE IF EXISTS competence_certificates
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS resubmission_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_resubmitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_history JSONB DEFAULT '[]'::jsonb;

-- Add rejection tracking to export_licenses
ALTER TABLE IF EXISTS export_licenses
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS resubmission_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_resubmitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_history JSONB DEFAULT '[]'::jsonb;

-- Create indexes for faster rejection queries
CREATE INDEX IF NOT EXISTS idx_exporter_profiles_status ON exporter_profiles(status);
CREATE INDEX IF NOT EXISTS idx_coffee_laboratories_status ON coffee_laboratories(status);
CREATE INDEX IF NOT EXISTS idx_coffee_tasters_status ON coffee_tasters(status);
CREATE INDEX IF NOT EXISTS idx_competence_certificates_status ON competence_certificates(status);
CREATE INDEX IF NOT EXISTS idx_export_licenses_status ON export_licenses(status);

-- Add comments for documentation
COMMENT ON COLUMN exporter_profiles.rejection_reason IS 'Detailed reason for rejection provided by ECTA admin';
COMMENT ON COLUMN exporter_profiles.rejected_by IS 'Username of ECTA admin who rejected the application';
COMMENT ON COLUMN exporter_profiles.rejected_at IS 'Timestamp when the application was rejected';
COMMENT ON COLUMN exporter_profiles.resubmission_count IS 'Number of times this application has been resubmitted';
COMMENT ON COLUMN exporter_profiles.last_resubmitted_at IS 'Timestamp of the most recent resubmission';
COMMENT ON COLUMN exporter_profiles.rejection_history IS 'JSON array of all past rejections with reasons and timestamps';

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Rejection and resubmission tracking fields added';
END $$;
