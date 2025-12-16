-- Ethiopian eSW Alignment Migration
-- Adds missing fields and tables for full Ethiopian Single Window compliance

-- ============================================================================
-- 1. ENHANCE SALES_CONTRACTS for eSW Compliance
-- ============================================================================

ALTER TABLE sales_contracts ADD COLUMN IF NOT EXISTS notification_date TIMESTAMP;
ALTER TABLE sales_contracts ADD COLUMN IF NOT EXISTS notification_status VARCHAR(50) DEFAULT 'pending' CHECK (notification_status IN ('pending', 'notified', 'approved', 'rejected'));
ALTER TABLE sales_contracts ADD COLUMN IF NOT EXISTS motri_approval_number VARCHAR(100);
ALTER TABLE sales_contracts ADD COLUMN IF NOT EXISTS lc_number VARCHAR(100);
ALTER TABLE sales_contracts ADD COLUMN IF NOT EXISTS lc_opening_date DATE;
ALTER TABLE sales_contracts ADD COLUMN IF NOT EXISTS settlement_deadline DATE;
ALTER TABLE sales_contracts ADD COLUMN IF NOT EXISTS settlement_days INTEGER DEFAULT 90;

COMMENT ON COLUMN sales_contracts.notification_date IS '15-day contract notification requirement to MOTRI';
COMMENT ON COLUMN sales_contracts.lc_number IS 'Letter of Credit number from buyer';
COMMENT ON COLUMN sales_contracts.settlement_deadline IS '90-day settlement deadline per NBE regulations';

-- ============================================================================
-- 2. ENHANCE EXPORT_PERMITS for eSW Tracking
-- ============================================================================

ALTER TABLE export_permits ADD COLUMN IF NOT EXISTS final_declaration_number VARCHAR(100);
ALTER TABLE export_permits ADD COLUMN IF NOT EXISTS final_declaration_date TIMESTAMP;
ALTER TABLE export_permits ADD COLUMN IF NOT EXISTS esw_submission_id VARCHAR(100);
ALTER TABLE export_permits ADD COLUMN IF NOT EXISTS clearance_days INTEGER;

COMMENT ON COLUMN export_permits.final_declaration_number IS 'Final customs declaration number (required for NBE submission)';
COMMENT ON COLUMN export_permits.esw_submission_id IS 'Ethiopian Single Window system tracking ID';
COMMENT ON COLUMN export_permits.clearance_days IS 'Total days from submission to clearance (target: 3 days)';

-- ============================================================================
-- 3. CREATE FX_APPROVALS TABLE (National Bank)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fx_approvals (
    id SERIAL PRIMARY KEY,
    approval_id UUID DEFAULT gen_random_uuid() UNIQUE,
    export_permit_id UUID REFERENCES export_permits(permit_id),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    -- FX Details
    export_value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) NOT NULL,
    local_value DECIMAL(15,2),
    
    -- Payment Method
    payment_method VARCHAR(50) CHECK (payment_method IN ('L/C', 'CAD', 'Advance')),
    lc_number VARCHAR(100),
    bank_permit_number VARCHAR(100),
    
    -- Settlement
    settlement_deadline DATE,
    settlement_days INTEGER DEFAULT 90,
    
    -- Approval
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'settled')),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fx_approvals_exporter ON fx_approvals(exporter_id);
CREATE INDEX idx_fx_approvals_permit ON fx_approvals(export_permit_id);
CREATE INDEX idx_fx_approvals_status ON fx_approvals(approval_status);

COMMENT ON TABLE fx_approvals IS 'National Bank of Ethiopia foreign exchange approvals';

-- ============================================================================
-- 4. CREATE CUSTOMS_CLEARANCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS customs_clearances (
    id SERIAL PRIMARY KEY,
    clearance_id UUID DEFAULT gen_random_uuid() UNIQUE,
    export_permit_id UUID NOT NULL REFERENCES export_permits(permit_id),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    -- Declaration
    declaration_number VARCHAR(100) UNIQUE NOT NULL,
    declaration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tariff_classification VARCHAR(50),
    
    -- Inspection
    inspection_date TIMESTAMP,
    inspection_notes TEXT,
    physical_inspection_passed BOOLEAN,
    
    -- Fees
    customs_duty DECIMAL(15,2) DEFAULT 0,
    vat DECIMAL(15,2) DEFAULT 0,
    excise_tax DECIMAL(15,2) DEFAULT 0,
    warehouse_fees DECIMAL(15,2) DEFAULT 0,
    service_charges DECIMAL(15,2) DEFAULT 0,
    total_fees DECIMAL(15,2),
    
    -- Clearance
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'inspected', 'cleared', 'rejected')),
    release_note_number VARCHAR(100),
    cleared_by VARCHAR(255),
    cleared_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customs_clearances_exporter ON customs_clearances(exporter_id);
CREATE INDEX idx_customs_clearances_permit ON customs_clearances(export_permit_id);
CREATE INDEX idx_customs_clearances_status ON customs_clearances(status);
CREATE INDEX idx_customs_clearances_declaration ON customs_clearances(declaration_number);

COMMENT ON TABLE customs_clearances IS 'Ethiopian Customs Commission clearance records';

-- ============================================================================
-- 5. CREATE SHIPMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    shipment_id UUID DEFAULT gen_random_uuid() UNIQUE,
    export_permit_id UUID NOT NULL REFERENCES export_permits(permit_id),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    -- Booking
    booking_number VARCHAR(100) UNIQUE NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Vessel Details
    vessel_name VARCHAR(255),
    container_number VARCHAR(100),
    
    -- Ports
    departure_port VARCHAR(100) DEFAULT 'Djibouti',
    arrival_port VARCHAR(100),
    
    -- Dates
    departure_date DATE,
    estimated_arrival_date DATE,
    actual_arrival_date DATE,
    
    -- Pre-Shipment Inspection
    pre_shipment_inspection_status VARCHAR(50) CHECK (pre_shipment_inspection_status IN ('pending', 'scheduled', 'passed', 'failed')),
    pre_shipment_inspector VARCHAR(255),
    inspection_date TIMESTAMP,
    inspection_report TEXT,
    
    -- Insurance
    insurance_policy_number VARCHAR(100),
    insurance_value DECIMAL(15,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'booked' CHECK (status IN ('booked', 'loaded', 'in_transit', 'arrived', 'delivered', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipments_exporter ON shipments(exporter_id);
CREATE INDEX idx_shipments_permit ON shipments(export_permit_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_booking ON shipments(booking_number);

COMMENT ON TABLE shipments IS 'Shipping line bookings and pre-shipment inspections';

-- ============================================================================
-- 6. CREATE DOCUMENT_VERIFICATIONS TABLE (Commercial Banks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_verifications (
    id SERIAL PRIMARY KEY,
    verification_id UUID DEFAULT gen_random_uuid() UNIQUE,
    export_permit_id UUID REFERENCES export_permits(permit_id),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    -- Document Details
    document_type VARCHAR(100) NOT NULL,
    document_number VARCHAR(100),
    document_hash VARCHAR(255),
    
    -- Verification
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'requires_correction')),
    verified_by VARCHAR(255),
    verified_at TIMESTAMP,
    verification_notes TEXT,
    
    -- L/C Compliance
    lc_compliant BOOLEAN,
    lc_discrepancies TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_verifications_exporter ON document_verifications(exporter_id);
CREATE INDEX idx_document_verifications_permit ON document_verifications(export_permit_id);
CREATE INDEX idx_document_verifications_status ON document_verifications(verification_status);

COMMENT ON TABLE document_verifications IS 'Commercial bank document verification for L/C compliance';

-- ============================================================================
-- 7. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_fx_approvals_updated_at ON fx_approvals;
CREATE TRIGGER update_fx_approvals_updated_at BEFORE UPDATE ON fx_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customs_clearances_updated_at ON customs_clearances;
CREATE TRIGGER update_customs_clearances_updated_at BEFORE UPDATE ON customs_clearances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_verifications_updated_at ON document_verifications;
CREATE TRIGGER update_document_verifications_updated_at BEFORE UPDATE ON document_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. CREATE VIEW FOR eSW EXPORT READINESS
-- ============================================================================

CREATE OR REPLACE VIEW esw_export_readiness AS
SELECT 
    ep.permit_id,
    ep.permit_number,
    ep.exporter_id,
    exp.business_name,
    exp.tin,
    
    -- Required Documents Status
    CASE WHEN ep.export_license_id IS NOT NULL THEN 'complete' ELSE 'missing' END as export_license_status,
    CASE WHEN ep.competence_certificate_id IS NOT NULL THEN 'complete' ELSE 'missing' END as competence_cert_status,
    CASE WHEN ep.quality_inspection_id IS NOT NULL THEN 'complete' ELSE 'missing' END as quality_inspection_status,
    CASE WHEN ep.sales_contract_id IS NOT NULL THEN 'complete' ELSE 'missing' END as sales_contract_status,
    
    -- Contract Notification (15-day requirement)
    sc.notification_date,
    sc.notification_status,
    CASE 
        WHEN sc.notification_date IS NOT NULL 
        AND sc.notification_date <= sc.registration_date + INTERVAL '15 days'
        THEN 'compliant' 
        ELSE 'non_compliant' 
    END as notification_compliance,
    
    -- FX Approval
    fx.approval_status as fx_status,
    fx.settlement_deadline,
    
    -- Customs Clearance
    cc.status as customs_status,
    cc.release_note_number,
    
    -- Shipment
    sh.status as shipment_status,
    sh.pre_shipment_inspection_status,
    
    -- Document Verification
    COUNT(dv.id) as documents_verified,
    
    -- eSW Tracking
    ep.esw_submission_id,
    ep.clearance_days,
    
    -- Overall Readiness
    CASE 
        WHEN ep.export_license_id IS NOT NULL
        AND ep.competence_certificate_id IS NOT NULL
        AND ep.quality_inspection_id IS NOT NULL
        AND ep.sales_contract_id IS NOT NULL
        AND sc.notification_status = 'approved'
        AND fx.approval_status = 'approved'
        AND cc.status = 'cleared'
        AND sh.pre_shipment_inspection_status = 'passed'
        THEN 'ready_for_export'
        ELSE 'pending_requirements'
    END as export_readiness_status
    
FROM export_permits ep
JOIN exporter_profiles exp ON ep.exporter_id = exp.exporter_id
LEFT JOIN sales_contracts sc ON ep.sales_contract_id = sc.contract_id
LEFT JOIN fx_approvals fx ON ep.permit_id = fx.export_permit_id
LEFT JOIN customs_clearances cc ON ep.permit_id = cc.export_permit_id
LEFT JOIN shipments sh ON ep.permit_id = sh.export_permit_id
LEFT JOIN document_verifications dv ON ep.permit_id = dv.export_permit_id AND dv.verification_status = 'verified'
GROUP BY ep.permit_id, exp.business_name, exp.tin, sc.notification_date, sc.notification_status, 
         sc.registration_date, fx.approval_status, fx.settlement_deadline, cc.status, 
         cc.release_note_number, sh.status, sh.pre_shipment_inspection_status;

COMMENT ON VIEW esw_export_readiness IS 'Ethiopian Single Window export readiness dashboard';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Ethiopian eSW Alignment Migration Complete!';
    RAISE NOTICE '   - Enhanced sales_contracts with L/C and notification tracking';
    RAISE NOTICE '   - Enhanced export_permits with eSW submission tracking';
    RAISE NOTICE '   - Created fx_approvals table (National Bank)';
    RAISE NOTICE '   - Created customs_clearances table (Customs Commission)';
    RAISE NOTICE '   - Created shipments table (Shipping Lines)';
    RAISE NOTICE '   - Created document_verifications table (Commercial Banks)';
    RAISE NOTICE '   - Created esw_export_readiness view';
END $$;
