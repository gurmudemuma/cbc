-- Rollback Migration: Drop contract_drafts table
-- Description: Removes the contract_drafts table and all associated indexes
-- Version: 001 Rollback
-- Created: 2024

-- Drop indexes first
DROP INDEX IF EXISTS idx_contract_drafts_buyer_email_status;
DROP INDEX IF EXISTS idx_contract_drafts_exporter_status;
DROP INDEX IF EXISTS idx_contract_drafts_buyer_id;
DROP INDEX IF EXISTS idx_contract_drafts_ecta_reference;
DROP INDEX IF EXISTS idx_contract_drafts_created_at;
DROP INDEX IF EXISTS idx_contract_drafts_status;
DROP INDEX IF EXISTS idx_contract_drafts_buyer_email;
DROP INDEX IF EXISTS idx_contract_drafts_exporter_id;

-- Drop table (CASCADE will handle dependent tables if needed)
DROP TABLE IF EXISTS contract_drafts CASCADE;
