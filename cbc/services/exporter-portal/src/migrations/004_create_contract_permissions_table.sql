-- Migration: Create contract_permissions table
-- Description: Creates table for managing access control and permissions for contracts
-- Version: 004
-- Created: 2024

CREATE TABLE IF NOT EXISTS contract_permissions (
  permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_email VARCHAR(255),
  permission_type VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_contract_permissions_draft FOREIGN KEY (draft_id) 
    REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
  CONSTRAINT check_valid_permission_type CHECK (permission_type IN (
    'VIEW', 
    'EDIT', 
    'RESPOND', 
    'FINALIZE', 
    'ADMIN'
  ))
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_contract_permissions_draft_id ON contract_permissions(draft_id);
CREATE INDEX IF NOT EXISTS idx_contract_permissions_user_id ON contract_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_permissions_user_email ON contract_permissions(user_email);
CREATE INDEX IF NOT EXISTS idx_contract_permissions_granted_at ON contract_permissions(granted_at);
CREATE INDEX IF NOT EXISTS idx_contract_permissions_expires_at ON contract_permissions(expires_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contract_permissions_user_draft ON contract_permissions(user_id, draft_id);
CREATE INDEX IF NOT EXISTS idx_contract_permissions_draft_type ON contract_permissions(draft_id, permission_type);
