-- Rollback Migration: Drop contract_history table
-- Description: Removes the contract_history table and all associated indexes
-- Version: 002 Rollback
-- Created: 2024

-- Drop indexes first
DROP INDEX IF EXISTS idx_contract_history_draft_action;
DROP INDEX IF EXISTS idx_contract_history_draft_version;
DROP INDEX IF EXISTS idx_contract_history_status;
DROP INDEX IF EXISTS idx_contract_history_actor_id;
DROP INDEX IF EXISTS idx_contract_history_created_at;
DROP INDEX IF EXISTS idx_contract_history_draft_id;

-- Drop table
DROP TABLE IF EXISTS contract_history CASCADE;
