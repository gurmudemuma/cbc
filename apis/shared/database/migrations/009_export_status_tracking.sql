-- Export Status Tracking System
-- Tracks all 16 steps of the export process

-- ============================================================================
-- 1. ENHANCE EXPORTS TABLE WITH COMPREHENSIVE STATUS TRACKING
-- ============================================================================

ALTER TABLE exports ADD COLUMN IF NOT EXISTS exporter_id UUID REFERENCES exporter_profiles(exporter_id);
ALTER TABLE exports ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS current_phase VARCHAR(50) DEFAULT 'setup';
ALTER TABLE exports ADD COLUMN IF NOT EXISTS overall_status VARCHAR(50) DEFAULT 'in_progress';

-- Step completion tracking
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_1_business_registration BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_2_capital_verification BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_3_laboratory_setup BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_4_taster_registration BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_5_competence_certificate BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_6_export_license BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_7_coffee_purchase BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_8_quality_inspection BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_9_sales_contract BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_10_certificate_origin BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_11_bank_verification BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_12_fx_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_13_export_permit BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_14_customs_clearance BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_15_shipment BOOLEAN DEFAULT FALSE;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_16_payment_settlement BOOLEAN DEFAULT FALSE;

-- Timestamps for each step
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_1_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_2_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_3_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_4_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_5_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_6_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_7_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_8_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_9_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_10_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_11_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_12_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_13_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_14_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_15_completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS step_16_completed_at TIMESTAMP;

-- Timeline tracking
ALTER TABLE exports ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS total_days INTEGER;

-- Compliance tracking
ALTER TABLE exports ADD COLUMN IF NOT EXISTS contract_notification_compliant BOOLEAN;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS settlement_deadline_compliant BOOLEAN;
ALTER TABLE exports ADD COLUMN IF NOT EXISTS esw_submission_compliant BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_exports_exporter ON exports(exporter_id);
CREATE INDEX IF NOT EXISTS idx_exports_current_step ON exports(current_step);
CREATE INDEX IF NOT EXISTS idx_exports_overall_status ON exports(overall_status);

-- ============================================================================
-- 2. CREATE EXPORT_PROGRESS_LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS export_progress_log (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(50) NOT NULL REFERENCES exports(export_id),
    step_number INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    phase VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'started', 'completed', 'failed', 'skipped'
    completed_by VARCHAR(255),
    notes TEXT,
    duration_hours INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_progress_log_export ON export_progress_log(export_id);
CREATE INDEX idx_progress_log_step ON export_progress_log(step_number);

-- ============================================================================
-- 3. CREATE FUNCTION TO UPDATE EXPORT PROGRESS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_export_progress(
    p_export_id VARCHAR(50),
    p_step_number INTEGER,
    p_completed_by VARCHAR(255) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_step_column VARCHAR(50);
    v_timestamp_column VARCHAR(50);
    v_step_name VARCHAR(100);
    v_phase VARCHAR(50);
BEGIN
    -- Map step number to column names and metadata
    v_step_column := 'step_' || p_step_number || '_completed';
    v_timestamp_column := 'step_' || p_step_number || '_completed_at';
    
    -- Determine step name and phase
    CASE p_step_number
        WHEN 1 THEN v_step_name := 'Business Registration & TIN'; v_phase := 'setup';
        WHEN 2 THEN v_step_name := 'Capital Verification'; v_phase := 'setup';
        WHEN 3 THEN v_step_name := 'Laboratory Setup'; v_phase := 'setup';
        WHEN 4 THEN v_step_name := 'Taster Registration'; v_phase := 'setup';
        WHEN 5 THEN v_step_name := 'Competence Certificate'; v_phase := 'setup';
        WHEN 6 THEN v_step_name := 'Export License'; v_phase := 'setup';
        WHEN 7 THEN v_step_name := 'Coffee Purchase (ECX)'; v_phase := 'procurement';
        WHEN 8 THEN v_step_name := 'Quality Inspection'; v_phase := 'procurement';
        WHEN 9 THEN v_step_name := 'Sales Contract'; v_phase := 'contract';
        WHEN 10 THEN v_step_name := 'Certificate of Origin'; v_phase := 'contract';
        WHEN 11 THEN v_step_name := 'Bank Document Verification'; v_phase := 'financial';
        WHEN 12 THEN v_step_name := 'FX Approval'; v_phase := 'financial';
        WHEN 13 THEN v_step_name := 'Export Permit'; v_phase := 'permit';
        WHEN 14 THEN v_step_name := 'Customs Clearance'; v_phase := 'customs';
        WHEN 15 THEN v_step_name := 'Shipment'; v_phase := 'shipping';
        WHEN 16 THEN v_step_name := 'Payment Settlement'; v_phase := 'settlement';
    END CASE;
    
    -- Update exports table using dynamic SQL
    EXECUTE format('UPDATE exports SET %I = TRUE, %I = NOW(), current_step = $1, current_phase = $2 WHERE export_id = $3',
        v_step_column, v_timestamp_column)
    USING p_step_number, v_phase, p_export_id;
    
    -- Log progress
    INSERT INTO export_progress_log (export_id, step_number, step_name, phase, status, completed_by, notes)
    VALUES (p_export_id, p_step_number, v_step_name, v_phase, 'completed', p_completed_by, p_notes);
    
    -- Update overall status if all steps complete
    IF p_step_number = 16 THEN
        UPDATE exports SET 
            overall_status = 'completed',
            completed_at = NOW(),
            total_days = EXTRACT(DAY FROM (NOW() - started_at))
        WHERE export_id = p_export_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE VIEW FOR EXPORT DASHBOARD
-- ============================================================================

CREATE OR REPLACE VIEW export_dashboard AS
SELECT 
    e.export_id,
    e.exporter_id,
    ep.business_name as exporter_name,
    e.coffee_type,
    e.quantity,
    e.destination,
    e.current_step,
    e.current_phase,
    e.overall_status,
    
    -- Progress percentage
    (
        (CASE WHEN e.step_1_business_registration THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_2_capital_verification THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_3_laboratory_setup THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_4_taster_registration THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_5_competence_certificate THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_6_export_license THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_7_coffee_purchase THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_8_quality_inspection THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_9_sales_contract THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_10_certificate_origin THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_11_bank_verification THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_12_fx_approval THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_13_export_permit THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_14_customs_clearance THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_15_shipment THEN 1 ELSE 0 END) +
        (CASE WHEN e.step_16_payment_settlement THEN 1 ELSE 0 END)
    ) * 100.0 / 16 as progress_percentage,
    
    -- Step statuses
    e.step_1_business_registration, e.step_1_completed_at,
    e.step_2_capital_verification, e.step_2_completed_at,
    e.step_3_laboratory_setup, e.step_3_completed_at,
    e.step_4_taster_registration, e.step_4_completed_at,
    e.step_5_competence_certificate, e.step_5_completed_at,
    e.step_6_export_license, e.step_6_completed_at,
    e.step_7_coffee_purchase, e.step_7_completed_at,
    e.step_8_quality_inspection, e.step_8_completed_at,
    e.step_9_sales_contract, e.step_9_completed_at,
    e.step_10_certificate_origin, e.step_10_completed_at,
    e.step_11_bank_verification, e.step_11_completed_at,
    e.step_12_fx_approval, e.step_12_completed_at,
    e.step_13_export_permit, e.step_13_completed_at,
    e.step_14_customs_clearance, e.step_14_completed_at,
    e.step_15_shipment, e.step_15_completed_at,
    e.step_16_payment_settlement, e.step_16_completed_at,
    
    -- Timeline
    e.started_at,
    e.completed_at,
    e.total_days,
    EXTRACT(DAY FROM (COALESCE(e.completed_at, NOW()) - e.started_at)) as days_in_progress,
    
    -- Compliance
    e.contract_notification_compliant,
    e.settlement_deadline_compliant,
    e.esw_submission_compliant,
    
    -- Next action
    CASE 
        WHEN e.current_step = 1 THEN 'Complete business registration'
        WHEN e.current_step = 2 THEN 'Verify capital'
        WHEN e.current_step = 3 THEN 'Setup laboratory'
        WHEN e.current_step = 4 THEN 'Register taster'
        WHEN e.current_step = 5 THEN 'Apply for competence certificate'
        WHEN e.current_step = 6 THEN 'Apply for export license'
        WHEN e.current_step = 7 THEN 'Purchase coffee from ECX'
        WHEN e.current_step = 8 THEN 'Submit for quality inspection'
        WHEN e.current_step = 9 THEN 'Register sales contract'
        WHEN e.current_step = 10 THEN 'Obtain certificate of origin'
        WHEN e.current_step = 11 THEN 'Submit documents to bank'
        WHEN e.current_step = 12 THEN 'Apply for FX approval'
        WHEN e.current_step = 13 THEN 'Apply for export permit'
        WHEN e.current_step = 14 THEN 'Submit customs declaration'
        WHEN e.current_step = 15 THEN 'Arrange shipment'
        WHEN e.current_step = 16 THEN 'Await payment settlement'
        ELSE 'Export complete'
    END as next_action
    
FROM exports e
LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id;

-- ============================================================================
-- 5. CREATE TRIGGERS TO AUTO-UPDATE PROGRESS
-- ============================================================================

-- Trigger for exporter_profiles (Step 1)
CREATE OR REPLACE FUNCTION trigger_step_1() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ACTIVE' AND NEW.tin IS NOT NULL THEN
        PERFORM update_export_progress(
            (SELECT export_id FROM exports WHERE exporter_id = NEW.exporter_id LIMIT 1),
            1,
            'system',
            'Business registration completed'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_step_1 ON exporter_profiles;
CREATE TRIGGER auto_update_step_1 AFTER INSERT OR UPDATE ON exporter_profiles
FOR EACH ROW EXECUTE FUNCTION trigger_step_1();

-- Trigger for export_licenses (Step 6)
CREATE OR REPLACE FUNCTION trigger_step_6() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ACTIVE' THEN
        PERFORM update_export_progress(
            (SELECT export_id FROM exports WHERE exporter_id = NEW.exporter_id LIMIT 1),
            6,
            NEW.approved_by,
            'Export license issued'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_step_6 ON export_licenses;
CREATE TRIGGER auto_update_step_6 AFTER INSERT OR UPDATE ON export_licenses
FOR EACH ROW EXECUTE FUNCTION trigger_step_6();

-- Similar triggers for other steps...

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Export Status Tracking System Created!';
    RAISE NOTICE '   - Enhanced exports table with 16-step tracking';
    RAISE NOTICE '   - Created export_progress_log table';
    RAISE NOTICE '   - Created update_export_progress() function';
    RAISE NOTICE '   - Created export_dashboard view';
    RAISE NOTICE '   - Created auto-update triggers';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Usage:';
    RAISE NOTICE '   SELECT * FROM export_dashboard;';
    RAISE NOTICE '   SELECT update_export_progress(''EXP001'', 7, ''user@example.com'', ''Coffee purchased'');';
END $$;
