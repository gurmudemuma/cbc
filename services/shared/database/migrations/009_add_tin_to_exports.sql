-- ============================================================================
-- MIGRATION 009: Add Exporter TIN to Exports Table
-- ============================================================================
-- Purpose: Link exports directly to business identity (TIN) for blockchain/verification
-- Date: 2026-01-06
-- ============================================================================

-- Add exporter_tin column
ALTER TABLE exports ADD COLUMN IF NOT EXISTS exporter_tin VARCHAR(50);

-- Create index for performance on TIN lookups
CREATE INDEX IF NOT EXISTS idx_exports_exporter_tin ON exports(exporter_tin);

-- Backfill existing data
-- Link with exporter_profiles to get the TIN for existing exports
UPDATE exports e
SET exporter_tin = ep.tin
FROM exporter_profiles ep
WHERE e.exporter_id = ep.exporter_id
AND e.exporter_tin IS NULL;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 009 completed: Added exporter_tin to exports table';
END $$;
