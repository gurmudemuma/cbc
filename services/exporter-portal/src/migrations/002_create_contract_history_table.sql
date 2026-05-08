-- Migration: Create contract_history table
-- Description: Creates table for version control and audit trail of contract changes
-- Version: 002
-- Created: 2024

CREATE TABLE IF NOT EXISTS contract_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  actor_type VARCHAR(20) NOT NULL,
  actor_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  rejection_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_contract_history_draft FOREIGN KEY (draft_id) 
    REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
  CONSTRAINT check_valid_actor_type CHECK (actor_type IN ('EXPORTER', 'BUYER', 'SYSTEM')),
  CONSTRAINT check_valid_action CHECK (action IN ('CREATED', 'MODIFIED', 'SENT', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'FINALIZED')),
  CONSTRAINT unique_draft_version UNIQUE(draft_id, version_number)
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_contract_history_draft_id ON contract_history(draft_id);
CREATE INDEX IF NOT EXISTS idx_contract_history_created_at ON contract_history(created_at);
CREATE INDEX IF NOT EXISTS idx_contract_history_actor_id ON contract_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_contract_history_status ON contract_history(status);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_contract_history_draft_version ON contract_history(draft_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_contract_history_draft_action ON contract_history(draft_id, action);
