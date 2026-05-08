-- Rollback Migration: Drop contract_notifications table
-- Description: Removes the contract_notifications table and all associated indexes
-- Version: 003 Rollback
-- Created: 2024

-- Drop indexes first
DROP INDEX IF EXISTS idx_contract_notifications_draft_type;
DROP INDEX IF EXISTS idx_contract_notifications_recipient_unread;
DROP INDEX IF EXISTS idx_contract_notifications_is_read;
DROP INDEX IF EXISTS idx_contract_notifications_sent_at;
DROP INDEX IF EXISTS idx_contract_notifications_recipient_email;
DROP INDEX IF EXISTS idx_contract_notifications_recipient_id;
DROP INDEX IF EXISTS idx_contract_notifications_draft_id;

-- Drop table
DROP TABLE IF EXISTS contract_notifications CASCADE;
