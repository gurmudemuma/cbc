-- ECTA Pre-Registration Database Schema
-- Based on Ethiopian Coffee & Tea Authority real-world regulations
-- Directive 1106/2025 compliance

-- ============================================================================
-- 1. EXPORTER PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS exporter_profiles (
    exporter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    business_name VARCHAR(500) NOT NULL,
    tin VARCHAR(50) NOT NULL UNIQUE,
    registration_number VARCHAR(100) NOT NULL UNIQUE,
    business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('PRIVATE', 'TRADE_ASSOCIATION', 'JOINT_STOCK', 'LLC', 'FARMER')),
    
    -- Capital Requirements (Directive 1106/2025)
    minimum_capital DECIMAL(15, 2) NOT NULL DEFAULT 0,
    capital_verified BOOLEAN NOT NULL DEFAULT FALSE,
    capital_verification_date TIMESTAMP,
    capital_proof_document TEXT,
    
    -- Contact Information
    office_address TEXT NOT NULL,
    city VARCHAR(100),
    region VARCHAR(100),
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'PENDING_APPROVAL')),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exporter_profiles_user_id ON exporter_profiles(user_id);
CREATE INDEX idx_exporter_profiles_status ON exporter_profiles(status);
CREATE INDEX idx_exporter_profiles_tin ON exporter_profiles(tin);

-- ============================================================================
-- 2. COFFEE LABORATORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS coffee_laboratories (
    laboratory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE,
    laboratory_name VARCHAR(500) NOT NULL,
    address TEXT NOT NULL,
    
    -- Certification
    certification_number VARCHAR(100) UNIQUE,
    certified_date TIMESTAMP,
    expiry_date TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'PENDING')),
    
    -- Equipment and Facilities
    equipment JSONB DEFAULT '[]',
    has_roasting_facility BOOLEAN DEFAULT FALSE,
    has_cupping_room BOOLEAN DEFAULT FALSE,
    has_sample_storage BOOLEAN DEFAULT FALSE,
    
    -- Inspection
    last_inspection_date TIMESTAMP,
    inspection_reports JSONB DEFAULT '[]',
    inspected_by VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_active_lab_per_exporter UNIQUE (exporter_id, status)
);

CREATE INDEX idx_laboratories_exporter_id ON coffee_laboratories(exporter_id);
CREATE INDEX idx_laboratories_status ON coffee_laboratories(status);
CREATE INDEX idx_laboratories_certification_number ON coffee_laboratories(certification_number);

-- ============================================================================
-- 3. COFFEE TASTERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS coffee_tasters (
    taster_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE,
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    national_id VARCHAR(50),
    
    -- Qualifications
    qualification_level VARCHAR(50) CHECK (qualification_level IN ('DIPLOMA', 'DEGREE', 'MASTER', 'CERTIFICATE')),
    qualification_document TEXT,
    
    -- Proficiency Certificate
    proficiency_certificate_number VARCHAR(100) NOT NULL,
    certificate_issue_date DATE NOT NULL,
    certificate_expiry_date DATE NOT NULL,
    last_renewal_date DATE,
    
    -- Employment
    employment_start_date DATE NOT NULL,
    employment_contract TEXT,
    is_exclusive_employee BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'PENDING')),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_active_taster_per_exporter UNIQUE (exporter_id, status)
);

CREATE INDEX idx_tasters_exporter_id ON coffee_tasters(exporter_id);
CREATE INDEX idx_tasters_status ON coffee_tasters(status);
CREATE INDEX idx_tasters_certificate_number ON coffee_tasters(proficiency_certificate_number);

-- ============================================================================
-- 4. COMPETENCE CERTIFICATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS competence_certificates (
    certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    
    -- Validity
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'PENDING')),
    
    -- Requirements
    laboratory_id UUID REFERENCES coffee_laboratories(laboratory_id),
    taster_id UUID REFERENCES coffee_tasters(taster_id),
    
    -- Facility Inspection
    facility_inspection_date DATE,
    inspection_report TEXT,
    inspected_by VARCHAR(255),
    inspection_passed BOOLEAN DEFAULT FALSE,
    
    -- Quality Management System
    has_quality_management_system BOOLEAN DEFAULT FALSE,
    qms_documentation TEXT,
    
    -- Storage Facilities
    storage_capacity DECIMAL(15, 2),
    storage_conditions TEXT,
    
    -- Approval
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Renewal History
    renewal_history JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competence_certificates_exporter_id ON competence_certificates(exporter_id);
CREATE INDEX idx_competence_certificates_status ON competence_certificates(status);
CREATE INDEX idx_competence_certificates_number ON competence_certificates(certificate_number);

-- ============================================================================
-- 5. EXPORT LICENSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS export_licenses (
    license_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    
    -- Validity
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'PENDING')),
    
    -- Requirements
    competence_certificate_id UUID REFERENCES competence_certificates(certificate_id),
    eic_registration_number VARCHAR(100) NOT NULL,
    
    -- Authorization
    authorized_coffee_types JSONB DEFAULT '[]',
    authorized_origins JSONB DEFAULT '[]',
    annual_quota DECIMAL(15, 2),
    
    -- Approval
    approved_by VARCHAR(255) NOT NULL,
    approved_at TIMESTAMP NOT NULL,
    rejection_reason TEXT,
    
    -- Renewal History
    renewal_history JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_export_licenses_exporter_id ON export_licenses(exporter_id);
CREATE INDEX idx_export_licenses_status ON export_licenses(status);
CREATE INDEX idx_export_licenses_number ON export_licenses(license_number);

-- ============================================================================
-- 6. COFFEE LOTS (from ECX)
-- ============================================================================
CREATE TABLE IF NOT EXISTS coffee_lots (
    lot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ecx_lot_number VARCHAR(100) NOT NULL UNIQUE,
    warehouse_receipt_number VARCHAR(100) NOT NULL,
    
    -- Location
    warehouse_location VARCHAR(255) NOT NULL,
    warehouse_name VARCHAR(255),
    
    -- Coffee Details
    coffee_type VARCHAR(100) NOT NULL,
    origin_region VARCHAR(100) NOT NULL,
    processing_method VARCHAR(50) CHECK (processing_method IN ('WASHED', 'NATURAL', 'HONEY')),
    quantity DECIMAL(15, 2) NOT NULL,
    preliminary_grade VARCHAR(50),
    
    -- Purchase
    purchase_date DATE NOT NULL,
    purchased_by UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    purchase_price DECIMAL(15, 2),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'IN_WAREHOUSE' CHECK (status IN ('IN_WAREHOUSE', 'INSPECTED', 'RESERVED_FOR_EXPORT', 'EXPORTED')),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coffee_lots_ecx_number ON coffee_lots(ecx_lot_number);
CREATE INDEX idx_coffee_lots_purchased_by ON coffee_lots(purchased_by);
CREATE INDEX idx_coffee_lots_status ON coffee_lots(status);

-- ============================================================================
-- 7. QUALITY INSPECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS quality_inspections (
    inspection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES coffee_lots(lot_id) ON DELETE CASCADE,
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    -- Inspection Details
    inspection_date DATE NOT NULL,
    inspection_center VARCHAR(255) NOT NULL,
    inspector VARCHAR(255) NOT NULL,
    
    -- Physical Analysis
    bean_size VARCHAR(50),
    moisture_content DECIMAL(5, 2),
    defect_count INTEGER,
    primary_defects INTEGER,
    secondary_defects INTEGER,
    foreign_matter DECIMAL(10, 2),
    
    -- Cupping Evaluation
    cupping_score DECIMAL(5, 2),
    flavor_profile TEXT,
    aroma_score DECIMAL(4, 2),
    acidity_score DECIMAL(4, 2),
    body_score DECIMAL(4, 2),
    balance_score DECIMAL(4, 2),
    clean_cup_score DECIMAL(4, 2),
    sweetness_score DECIMAL(4, 2),
    uniformity_score DECIMAL(4, 2),
    
    -- Results
    final_grade VARCHAR(50) NOT NULL,
    quality_certificate_number VARCHAR(100) NOT NULL UNIQUE,
    passed BOOLEAN NOT NULL,
    remarks TEXT,
    
    -- Documents
    inspection_report TEXT,
    cupping_form TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quality_inspections_lot_id ON quality_inspections(lot_id);
CREATE INDEX idx_quality_inspections_exporter_id ON quality_inspections(exporter_id);
CREATE INDEX idx_quality_inspections_certificate_number ON quality_inspections(quality_certificate_number);

-- ============================================================================
-- 8. SALES CONTRACTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_contracts (
    contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    contract_number VARCHAR(100) NOT NULL UNIQUE,
    
    -- Buyer Information
    buyer_name VARCHAR(500) NOT NULL,
    buyer_country VARCHAR(100) NOT NULL,
    buyer_address TEXT,
    buyer_email VARCHAR(255),
    buyer_phone VARCHAR(50),
    
    -- Contract Details
    coffee_type VARCHAR(100) NOT NULL,
    origin_region VARCHAR(100),
    quantity DECIMAL(15, 2) NOT NULL,
    contract_value DECIMAL(15, 2) NOT NULL,
    price_per_kg DECIMAL(10, 2),
    
    -- Terms
    payment_terms VARCHAR(255),
    incoterms VARCHAR(50),
    delivery_date DATE,
    port_of_loading VARCHAR(255),
    port_of_discharge VARCHAR(255),
    
    -- Registration
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED')),
    rejection_reason TEXT,
    
    -- Documents
    contract_document TEXT,
    buyer_proof_of_business TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_contracts_exporter_id ON sales_contracts(exporter_id);
CREATE INDEX idx_sales_contracts_contract_number ON sales_contracts(contract_number);
CREATE INDEX idx_sales_contracts_status ON sales_contracts(status);

-- ============================================================================
-- 9. EXPORT PERMITS
-- ============================================================================
CREATE TABLE IF NOT EXISTS export_permits (
    permit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permit_number VARCHAR(100) NOT NULL UNIQUE,
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    -- Required Pre-existing Documents
    export_license_id UUID NOT NULL REFERENCES export_licenses(license_id),
    competence_certificate_id UUID NOT NULL REFERENCES competence_certificates(certificate_id),
    quality_inspection_id UUID NOT NULL REFERENCES quality_inspections(inspection_id),
    sales_contract_id UUID NOT NULL REFERENCES sales_contracts(contract_id),
    lot_id UUID NOT NULL REFERENCES coffee_lots(lot_id),
    
    -- Permit Details
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    
    -- Shipment Details
    coffee_type VARCHAR(100) NOT NULL,
    quantity DECIMAL(15, 2) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'USED', 'EXPIRED', 'CANCELLED')),
    used_date DATE,
    
    -- Approval
    issued_by VARCHAR(255) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_export_permits_exporter_id ON export_permits(exporter_id);
CREATE INDEX idx_export_permits_permit_number ON export_permits(permit_number);
CREATE INDEX idx_export_permits_status ON export_permits(status);

-- ============================================================================
-- 10. CERTIFICATES OF ORIGIN
-- ============================================================================
CREATE TABLE IF NOT EXISTS certificates_of_origin (
    certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    export_permit_id UUID NOT NULL REFERENCES export_permits(permit_id),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    -- Exporter Details
    exporter_name VARCHAR(500) NOT NULL,
    exporter_address TEXT NOT NULL,
    
    -- Buyer Details
    buyer_name VARCHAR(500) NOT NULL,
    buyer_country VARCHAR(100) NOT NULL,
    buyer_address TEXT,
    
    -- Coffee Details
    coffee_type VARCHAR(100) NOT NULL,
    origin_region VARCHAR(100) NOT NULL,
    quantity DECIMAL(15, 2) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    processing_method VARCHAR(50),
    
    -- Issuance
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_by VARCHAR(255) NOT NULL,
    
    -- Documents
    certificate_document TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certificates_of_origin_exporter_id ON certificates_of_origin(exporter_id);
CREATE INDEX idx_certificates_of_origin_certificate_number ON certificates_of_origin(certificate_number);
CREATE INDEX idx_certificates_of_origin_export_permit_id ON certificates_of_origin(export_permit_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exporter_profiles_updated_at BEFORE UPDATE ON exporter_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coffee_laboratories_updated_at BEFORE UPDATE ON coffee_laboratories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coffee_tasters_updated_at BEFORE UPDATE ON coffee_tasters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competence_certificates_updated_at BEFORE UPDATE ON competence_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_export_licenses_updated_at BEFORE UPDATE ON export_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coffee_lots_updated_at BEFORE UPDATE ON coffee_lots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quality_inspections_updated_at BEFORE UPDATE ON quality_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_contracts_updated_at BEFORE UPDATE ON sales_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_export_permits_updated_at BEFORE UPDATE ON export_permits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_of_origin_updated_at BEFORE UPDATE ON certificates_of_origin FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Qualified Exporters (ready to create exports)
CREATE OR REPLACE VIEW qualified_exporters AS
SELECT 
    ep.exporter_id,
    ep.business_name,
    ep.tin,
    ep.business_type,
    ep.status as profile_status,
    cl.laboratory_id,
    cl.status as lab_status,
    ct.taster_id,
    ct.status as taster_status,
    cc.certificate_id as competence_certificate_id,
    cc.status as competence_status,
    el.license_id as export_license_id,
    el.status as license_status,
    CASE 
        WHEN ep.status = 'ACTIVE' 
        AND (ep.business_type = 'FARMER' OR (ep.capital_verified AND cl.status = 'ACTIVE' AND ct.status = 'ACTIVE'))
        AND cc.status = 'ACTIVE' 
        AND el.status = 'ACTIVE'
        AND cc.expiry_date > CURRENT_DATE
        AND el.expiry_date > CURRENT_DATE
        THEN TRUE 
        ELSE FALSE 
    END as is_qualified
FROM exporter_profiles ep
LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id AND cl.status = 'ACTIVE'
LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id AND ct.status = 'ACTIVE'
LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id AND cc.status = 'ACTIVE'
LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id AND el.status = 'ACTIVE';

-- View: Export Readiness (lots ready for export)
CREATE OR REPLACE VIEW export_ready_lots AS
SELECT 
    cl.lot_id,
    cl.ecx_lot_number,
    cl.purchased_by as exporter_id,
    ep.business_name as exporter_name,
    qi.inspection_id,
    qi.quality_certificate_number,
    qi.final_grade,
    sc.contract_id,
    sc.contract_number,
    sc.status as contract_status,
    CASE 
        WHEN cl.status = 'INSPECTED'
        AND qi.passed = TRUE
        AND sc.status = 'APPROVED'
        THEN TRUE
        ELSE FALSE
    END as ready_for_permit
FROM coffee_lots cl
JOIN exporter_profiles ep ON cl.purchased_by = ep.exporter_id
LEFT JOIN quality_inspections qi ON cl.lot_id = qi.lot_id
LEFT JOIN sales_contracts sc ON cl.purchased_by = sc.exporter_id AND sc.status = 'APPROVED';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE exporter_profiles IS 'Exporter business profiles with capital requirements per Directive 1106/2025';
COMMENT ON TABLE coffee_laboratories IS 'ECTA-certified coffee laboratories (mandatory for non-farmer exporters)';
COMMENT ON TABLE coffee_tasters IS 'Qualified coffee tasters with proficiency certificates (one per exporter)';
COMMENT ON TABLE competence_certificates IS 'Exporter competence certificates issued after facility inspection';
COMMENT ON TABLE export_licenses IS 'Export licenses issued by ECTA (annual authorization)';
COMMENT ON TABLE coffee_lots IS 'Coffee lots purchased from ECX';
COMMENT ON TABLE quality_inspections IS 'ECTA quality inspections with cupping evaluations';
COMMENT ON TABLE sales_contracts IS 'Sales contracts registered with ECTA';
COMMENT ON TABLE export_permits IS 'Per-shipment export permits (requires all pre-existing documents)';
COMMENT ON TABLE certificates_of_origin IS 'Certificates of origin issued by ECTA';
