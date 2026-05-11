-- Create contract_notifications table for network notifications
CREATE TABLE IF NOT EXISTS contract_notifications (
    notification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id uuid,
    member_code varchar(50) NOT NULL,
    notification_type varchar(50) NOT NULL,
    notification_status varchar(50) DEFAULT 'UNREAD',
    title varchar(255),
    message text,
    metadata jsonb,
    sent_at timestamp DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_notifications_member ON contract_notifications(member_code);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_status ON contract_notifications(notification_status);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_contract ON contract_notifications(contract_id);

-- Create network_statistics table for agency dashboard stats
CREATE TABLE IF NOT EXISTS network_statistics (
    stat_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_code varchar(50) NOT NULL,
    stat_type varchar(100) NOT NULL,
    stat_value numeric,
    stat_data jsonb,
    period_start timestamp,
    period_end timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_network_statistics_member ON network_statistics(member_code);
CREATE INDEX IF NOT EXISTS idx_network_statistics_type ON network_statistics(stat_type);

-- Create document_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS document_requests (
    request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id uuid,
    export_id uuid,
    requesting_member_code varchar(50) NOT NULL,
    target_member_code varchar(50),
    document_type varchar(100) NOT NULL,
    request_status varchar(50) DEFAULT 'PENDING',
    priority varchar(20) DEFAULT 'NORMAL',
    requested_by integer,
    request_message text,
    response_message text,
    due_date timestamp,
    completed_at timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_document_requests_contract ON document_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_export ON document_requests(export_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_requesting ON document_requests(requesting_member_code);
CREATE INDEX IF NOT EXISTS idx_document_requests_target ON document_requests(target_member_code);
CREATE INDEX IF NOT EXISTS idx_document_requests_status ON document_requests(request_status);

-- Seed some sample contract notifications for testing
INSERT INTO contract_notifications (member_code, notification_type, notification_status, title, message, metadata)
VALUES 
    ('ECTA', 'CONTRACT_SUBMITTED', 'UNREAD', 'New Contract Submitted', 'A new sales contract has been submitted for registration', '{"priority": "high"}'::jsonb),
    ('ECTA', 'CONTRACT_APPROVED', 'READ', 'Contract Approved', 'Sales contract has been approved', '{"priority": "normal"}'::jsonb),
    ('NBE', 'FX_REQUEST', 'UNREAD', 'Foreign Exchange Request', 'New FX allocation request pending', '{"priority": "high"}'::jsonb),
    ('ERCA', 'CUSTOMS_CLEARANCE', 'UNREAD', 'Customs Clearance Required', 'Export shipment awaiting customs clearance', '{"priority": "urgent"}'::jsonb),
    ('ECX', 'QUALITY_VERIFICATION', 'UNREAD', 'Quality Certificate Needed', 'Quality verification required for export', '{"priority": "normal"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT 'contract_notifications' as table_name, COUNT(*) as row_count FROM contract_notifications
UNION ALL
SELECT 'network_statistics', COUNT(*) FROM network_statistics
UNION ALL
SELECT 'document_requests', COUNT(*) FROM document_requests
UNION ALL
SELECT 'network_members', COUNT(*) FROM network_members
UNION ALL
SELECT 'user_network_members', COUNT(*) FROM user_network_members;
