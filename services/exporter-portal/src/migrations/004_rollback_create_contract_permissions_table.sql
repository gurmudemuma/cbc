-- Rollback Migration: Drop contract_permissions table
-- Description: Removes the contract_permissions table and all associated indexes
-- Version: 004 Rollback
-- Created: 2024

-- Drop indexes first
DROP INDEX IF EXISTS idx_contract_permissions_draft_type;
DROP INDEX IF EXISTS idx_contract_permissions_user_draft;
DROP INDEX IF EXISTS idx_contract_permissions_expires_at;
DROP INDEX IF EXISTS idx_contract_permissions_granted_at;
DROP INDEX IF EXISTS idx_contract_permissions_user_email;
DROP INDEX IF EXISTS idx_contract_permissions_user_id;
DROP INDEX IF EXISTS idx_contract_permissions_draft_id;

-- Drop table
DROP TABLE IF EXISTS contract_permissions CASCADE;
