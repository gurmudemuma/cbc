-- Drop and recreate contract_notifications with all required columns
DROP TABLE IF EXISTS contract_notifications CASCADE;

CREATE TABLE contract_notifications (
    notification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id uuid,
    exporter_id uuid,
    ecta_reference_number varchar(100),
    recipient_member_code varchar(50) NOT NULL,
    notification_type varchar(50) NOT NULL,
    notification_status varchar(50) DEFAULT 'UNREAD',
    notification_message text,
    metadata jsonb,
    sent_at timestamp DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp,
    acknowledged_at timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_notifications_member ON contract_notifications(recipient_member_code);
CREATE INDEX idx_contract_notifications_status ON contract_notifications(notification_status);
CREATE INDEX idx_contract_notifications_contract ON contract_notifications(contract_id);
CREATE INDEX idx_contract_notifications_exporter ON contract_notifications(exporter_id);

-- Seed sample notifications with proper data
INSERT INTO contract_notifications (
    recipient_member_code, 
    notification_type, 
    notification_status, 
    notification_message, 
    metadata,
    exporter_id,
    ecta_reference_number
)
SELECT 
    'ECTA',
    'CONTRACT_SUBMITTED',
    'UNREAD',
    'New sales contract submitted for registration',
    '{"priority": "high"}'::jsonb,
    ep.exporter_id,
    'ECTA-2026-' || LPAD((ROW_NUMBER() OVER())::text, 5, '0')
FROM exporter_profiles ep
LIMIT 3;

INSERT INTO contract_notifications (
    recipient_member_code, 
    notification_type, 
    notification_status, 
    notification_message, 
    metadata
)
VALUES 
    ('NBE', 'FX_REQUEST', 'UNREAD', 'New foreign exchange allocation request pending approval', '{"priority": "high"}'::jsonb),
    ('ERCA', 'CUSTOMS_CLEARANCE', 'UNREAD', 'Export shipment awaiting customs clearance', '{"priority": "urgent"}'::jsonb),
    ('ECX', 'QUALITY_VERIFICATION', 'UNREAD', 'Quality verification required for export lot', '{"priority": "normal"}'::jsonb),
    ('ECTA', 'CONTRACT_APPROVED', 'READ', 'Sales contract has been approved and registered', '{"priority": "normal"}'::jsonb);

-- Verify
SELECT COUNT(*) as notification_count FROM contract_notifications;
SELECT recipient_member_code, COUNT(*) as count 
FROM contract_notifications 
GROUP BY recipient_member_code 
ORDER BY recipient_member_code;
