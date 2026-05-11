-- ============================================================================
-- Create Contract Notifications Table
-- Migration 036: Track notifications for contract workflow events
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID REFERENCES contract_drafts(draft_id),
    recipient_organization VARCHAR(100) NOT NULL,
    recipient_user_id UUID,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    status VARCHAR(20) DEFAULT 'UNREAD',
    action_url TEXT,
    metadata JSONB,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT notifications_type_check CHECK (
        notification_type IN (
            'CONTRACT_SUBMITTED', 'CONTRACT_APPROVED', 'CONTRACT_REJECTED',
            'CONTRACT_FINALIZED', 'DOCUMENT_REQUESTED', 'DOCUMENT_SUBMITTED',
            'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'LC_CREATED',
            'SHIPMENT_SCHEDULED', 'QUALITY_INSPECTION', 'GENERAL'
        )
    ),
    CONSTRAINT notifications_priority_check CHECK (
        priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
    ),
    CONSTRAINT notifications_status_check CHECK (
        status IN ('UNREAD', 'READ', 'ARCHIVED')
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_draft ON contract_notifications(draft_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_org ON contract_notifications(recipient_organization);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user ON contract_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON contract_notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON contract_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON contract_notifications(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_timestamp
    BEFORE UPDATE ON contract_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Add comments
COMMENT ON TABLE contract_notifications IS 'Notifications for contract workflow events';
COMMENT ON COLUMN contract_notifications.notification_type IS 'Type of notification event';
COMMENT ON COLUMN contract_notifications.priority IS 'Priority: LOW, NORMAL, HIGH, URGENT';
COMMENT ON COLUMN contract_notifications.status IS 'Status: UNREAD, READ, ARCHIVED';
