-- ============================================================================
-- Migration: Add Taster Verification Tracking
-- Description: Adds verified_by and verified_at columns to coffee_tasters table
-- ============================================================================

-- Add verification tracking to coffee_tasters
ALTER TABLE IF EXISTS coffee_tasters
ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Add status 'REJECTED' to the CHECK constraint if not already present
-- First, drop the existing constraint
ALTER TABLE IF EXISTS coffee_tasters
DROP CONSTRAINT IF EXISTS coffee_tasters_status_check;

-- Then add the updated constraint with REJECTED status
ALTER TABLE IF EXISTS coffee_tasters
ADD CONSTRAINT coffee_tasters_status_check 
CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'PENDING', 'REJECTED'));

-- Add comments for documentation
COMMENT ON COLUMN coffee_tasters.verified_by IS 'Username of ECTA admin who verified the taster credentials';
COMMENT ON COLUMN coffee_tasters.verified_at IS 'Timestamp when the taster was verified by ECTA';

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Taster verification tracking fields added';
END $$;
