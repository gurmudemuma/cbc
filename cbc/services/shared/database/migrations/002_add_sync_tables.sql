-- Migration: Add Blockchain Bridge Sync Tables
-- Version: 002
-- Description: Tables for tracking synchronization between Fabric and CBC

-- Sync Log Table
CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    error_message TEXT,
    data JSONB,
    retry_count INT DEFAULT 0,
    synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for sync_log
CREATE INDEX idx_sync_log_status ON sync_log(status, synced_at);
CREATE INDEX idx_sync_log_type ON sync_log(sync_type, entity_id);
CREATE INDEX idx_sync_log_retry ON sync_log(status, retry_count) WHERE status = 'failed';

-- Comments
COMMENT ON TABLE sync_log IS 'Tracks all synchronization attempts between Fabric and CBC';
COMMENT ON COLUMN sync_log.sync_type IS 'Type of sync: exporter_update, license_update, certificate_issued, etc.';
COMMENT ON COLUMN sync_log.entity_id IS 'ID of the entity being synced';
COMMENT ON COLUMN sync_log.status IS 'Sync status: success, failed, pending';
COMMENT ON COLUMN sync_log.retry_count IS 'Number of retry attempts';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON sync_log TO postgres;
GRANT USAGE, SELECT ON SEQUENCE sync_log_id_seq TO postgres;
