-- Migration: Create contract_notifications table
-- Description: Creates table for tracking notifications sent to parties about contract activity
-- Version: 003
-- Created: 2024

CREATE TABLE IF NOT EXISTS contract_notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_contract_notifications_draft FOREIGN KEY (draft_id) 
    REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
  CONSTRAINT check_valid_notification_type CHECK (notification_type IN (
    'CONTRACT_SENT', 
    'CONTRACT_ACCEPTED', 
    'CONTRACT_REJECTED', 
    'CONTRACT_COUNTERED', 
    'COUNTER_ACCEPTED', 
    'CONTRACT_FINALIZED', 
    'ECTA_REGISTERED', 
    'CERTIFICATE_READY'
  ))
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_contract_notifications_draft_id ON contract_notifications(draft_id);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_recipient_id ON contract_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_recipient_email ON contract_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_sent_at ON contract_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_is_read ON contract_notifications(is_read);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contract_notifications_recipient_unread ON contract_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_draft_type ON contract_notifications(draft_id, notification_type);
