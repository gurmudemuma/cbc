-- Add soft delete and change tracking support to all tables

-- ============================================================================
-- 1. ADD SOFT DELETE COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Exporter Profiles
ALTER TABLE exporter_profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_exporter_profiles_deleted_at ON exporter_profiles(deleted_at);

-- Coffee Laboratories
ALTER TABLE coffee_laboratories
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_coffee_laboratories_deleted_at ON coffee_laboratories(deleted_at);

-- Coffee Tasters
ALTER TABLE coffee_tasters
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_coffee_tasters_deleted_at ON coffee_tasters(deleted_at);

-- Competence Certificates
ALTER TABLE competence_certificates
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_competence_certificates_deleted_at ON competence_certificates(deleted_at);

-- Export Licenses
ALTER TABLE export_licenses
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_export_licenses_deleted_at ON export_licenses(deleted_at);

-- Coffee Lots
ALTER TABLE coffee_lots
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_coffee_lots_deleted_at ON coffee_lots(deleted_at);

-- Quality Inspections
ALTER TABLE quality_inspections
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_quality_inspections_deleted_at ON quality_inspections(deleted_at);

-- Sales Contracts
ALTER TABLE sales_contracts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_sales_contracts_deleted_at ON sales_contracts(deleted_at);

-- Export Permits
ALTER TABLE export_permits
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_export_permits_deleted_at ON export_permits(deleted_at);

-- Certificates of Origin
ALTER TABLE certificates_of_origin
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_certificates_of_origin_deleted_at ON certificates_of_origin(deleted_at);

-- ============================================================================
-- 2. CREATE CHANGE HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity Information
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    
    -- Change Information
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- User Information
    changed_by VARCHAR(255) NOT NULL,
    changed_by_id VARCHAR(255),
    
    -- Timestamp
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    reason TEXT
);

-- Indexes for efficient querying
CREATE INDEX idx_change_history_entity ON change_history(entity_type, entity_id);
CREATE INDEX idx_change_history_timestamp ON change_history(changed_at DESC);
CREATE INDEX idx_change_history_changed_by ON change_history(changed_by);
CREATE INDEX idx_change_history_operation ON change_history(operation);

-- Composite indexes
CREATE INDEX idx_change_history_entity_timestamp ON change_history(entity_type, entity_id, changed_at DESC);

-- ============================================================================
-- 3. CREATE CHANGE TRACKING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION track_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO change_history (
        entity_type,
        entity_id,
        operation,
        old_values,
        new_values,
        changed_by,
        changed_at
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
        COALESCE(current_setting('app.current_user', true), 'SYSTEM'),
        CURRENT_TIMESTAMP
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE TRIGGERS FOR CHANGE TRACKING
-- ============================================================================

-- Exporter Profiles
DROP TRIGGER IF EXISTS track_exporter_profiles_changes ON exporter_profiles;
CREATE TRIGGER track_exporter_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON exporter_profiles
FOR EACH ROW EXECUTE FUNCTION track_changes();

-- Coffee Laboratories
DROP TRIGGER IF EXISTS track_coffee_laboratories_changes ON coffee_laboratories;
CREATE TRIGGER track_coffee_laboratories_changes
AFTER INSERT OR UPDATE OR DELETE ON coffee_laboratories
FOR EACH ROW EXECUTE FUNCTION track_changes();

-- Coffee Tasters
DROP TRIGGER IF EXISTS track_coffee_tasters_changes ON coffee_tasters;
CREATE TRIGGER track_coffee_tasters_changes
AFTER INSERT OR UPDATE OR DELETE ON coffee_tasters
FOR EACH ROW EXECUTE FUNCTION track_changes();

-- Competence Certificates
DROP TRIGGER IF EXISTS track_competence_certificates_changes ON competence_certificates;
CREATE TRIGGER track_competence_certificates_changes
AFTER INSERT OR UPDATE OR DELETE ON competence_certificates
FOR EACH ROW EXECUTE FUNCTION track_changes();

-- Export Licenses
DROP TRIGGER IF EXISTS track_export_licenses_changes ON export_licenses;
CREATE TRIGGER track_export_licenses_changes
AFTER INSERT OR UPDATE OR DELETE ON export_licenses
FOR EACH ROW EXECUTE FUNCTION track_changes();

-- Coffee Lots
DROP TRIGGER IF EXISTS track_coffee_lots_changes ON coffee_lots;
CREATE TRIGGER track_coffee_lots_changes
AFTER INSERT OR UPDATE OR DELETE ON coffee_lots
FOR EACH ROW EXECUTE FUNCTION track_changes();

-- Quality Inspections
DROP TRIGGER IF EXISTS track_quality_inspections_changes ON quality_inspections;
CREATE TRIGGER track_quality_inspections_changes
AFTER INSERT OR UPDATE OR DELETE ON quality_inspections
FOR EACH ROW EXECUTE FUNCTION track_changes();

-- Sales Contracts
DROP TRIGGER IF EXISTS track_sales_contracts_changes ON sales_contracts;
CREATE TRIGGER track_sales_contracts_changes
AFTER INSERT OR UPDATE OR DELETE ON sales_contracts
FOR EACH ROW EXECUTE FUNCTION track_changes();

-- Export Permits
DROP TRIGGER IF EXISTS track_export_permits_changes ON export_permits;
CREATE TRIGGER track_export_permits_changes
AFTER INSERT OR UPDATE OR DELETE ON export_permits
FOR EACH ROW EXECUTE FUNCTION track_changes();

-- Certificates of Origin
DROP TRIGGER IF EXISTS track_certificates_of_origin_changes ON certificates_of_origin;
CREATE TRIGGER track_certificates_of_origin_changes
AFTER INSERT OR UPDATE OR DELETE ON certificates_of_origin
FOR EACH ROW EXECUTE FUNCTION track_changes();

-- ============================================================================
-- 5. CREATE SOFT DELETE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_record(
    p_table_name TEXT,
    p_id UUID,
    p_deleted_by VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
    EXECUTE format(
        'UPDATE %I SET deleted_at = CURRENT_TIMESTAMP, deleted_by = %L WHERE id = %L',
        p_table_name,
        p_deleted_by,
        p_id
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREATE RESTORE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION restore_record(
    p_table_name TEXT,
    p_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    EXECUTE format(
        'UPDATE %I SET deleted_at = NULL, deleted_by = NULL WHERE id = %L',
        p_table_name,
        p_id
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. CREATE VIEWS FOR ACTIVE RECORDS ONLY
-- ============================================================================

CREATE OR REPLACE VIEW active_exporter_profiles AS
SELECT * FROM exporter_profiles WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_coffee_laboratories AS
SELECT * FROM coffee_laboratories WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_coffee_tasters AS
SELECT * FROM coffee_tasters WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_competence_certificates AS
SELECT * FROM competence_certificates WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_export_licenses AS
SELECT * FROM export_licenses WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_coffee_lots AS
SELECT * FROM coffee_lots WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_quality_inspections AS
SELECT * FROM quality_inspections WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_sales_contracts AS
SELECT * FROM sales_contracts WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_export_permits AS
SELECT * FROM export_permits WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_certificates_of_origin AS
SELECT * FROM certificates_of_origin WHERE deleted_at IS NULL;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE change_history IS 'Tracks all changes to entities for audit and compliance';
COMMENT ON COLUMN change_history.entity_type IS 'Type of entity that was changed';
COMMENT ON COLUMN change_history.entity_id IS 'ID of the entity that was changed';
COMMENT ON COLUMN change_history.operation IS 'Type of operation: INSERT, UPDATE, or DELETE';
COMMENT ON COLUMN change_history.old_values IS 'Previous values before the change';
COMMENT ON COLUMN change_history.new_values IS 'New values after the change';
COMMENT ON COLUMN change_history.changed_by IS 'User who made the change';
COMMENT ON FUNCTION track_changes() IS 'Automatically tracks changes to entities';
COMMENT ON FUNCTION soft_delete_record(TEXT, UUID, VARCHAR) IS 'Soft delete a record instead of permanently deleting it';
COMMENT ON FUNCTION restore_record(TEXT, UUID) IS 'Restore a soft-deleted record';
