-- Migration: Contract Notifications System
-- Description: Create notification system for sales contract registration
-- Date: 2026-04-09

-- Create contract_notifications table
CREATE TABLE IF NOT EXISTS contract_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL,
    ecta_reference_number VARCHAR(100) NOT NULL,
    exporter_id UUID NOT NULL,
    recipient_member_code VARCHAR(50) NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'CONTRACT_REGISTERED',
    notification_status VARCHAR(50) DEFAULT 'SENT', -- SENT, READ, ACKNOWLEDGED
    notification_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
    FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_member_code) REFERENCES network_members(member_code) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX idx_contract_notifications_contract ON contract_notifications(contract_id);
CREATE INDEX idx_contract_notifications_reference ON contract_notifications(ecta_reference_number);
CREATE INDEX idx_contract_notifications_recipient ON contract_notifications(recipient_member_code);
CREATE INDEX idx_contract_notifications_status ON contract_notifications(notification_status);
CREATE INDEX idx_contract_notifications_exporter ON contract_notifications(exporter_id);

-- Create contract_permissions table to track which members have verified/approved
CREATE TABLE IF NOT EXISTS contract_permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL,
    ecta_reference_number VARCHAR(100) NOT NULL,
    exporter_id UUID NOT NULL,
    member_code VARCHAR(50) NOT NULL,
    permission_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, VERIFIED, APPROVED, REJECTED
    verified_at TIMESTAMP,
    verified_by UUID,
    approval_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
    FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE,
    FOREIGN KEY (member_code) REFERENCES network_members(member_code) ON DELETE CASCADE,
    UNIQUE(contract_id, member_code)
);

-- Create indexes
CREATE INDEX idx_contract_permissions_contract ON contract_permissions(contract_id);
CREATE INDEX idx_contract_permissions_reference ON contract_permissions(ecta_reference_number);
CREATE INDEX idx_contract_permissions_member ON contract_permissions(member_code);
CREATE INDEX idx_contract_permissions_exporter ON contract_permissions(exporter_id);
CREATE INDEX idx_contract_permissions_status ON contract_permissions(permission_status);

-- Add comments
COMMENT ON TABLE contract_notifications IS 'Notifications sent to network members when contracts are registered';
COMMENT ON TABLE contract_permissions IS 'Track contract verification and approval status by each network member';
