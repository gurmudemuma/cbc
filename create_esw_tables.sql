-- Create remaining ESW tables

-- ESW Agency Approvals
CREATE TABLE IF NOT EXISTS esw_agency_approvals (
    approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES esw_submissions(submission_id) ON DELETE CASCADE,
    agency_name VARCHAR(100) NOT NULL,
    agency_code VARCHAR(20) NOT NULL,
    agency_type VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    additional_info_request TEXT,
    response_deadline TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, agency_code)
);

-- Export Certificates
CREATE TABLE IF NOT EXISTS export_certificates (
    certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID NOT NULL REFERENCES exports(export_id) ON DELETE CASCADE,
    certificate_type VARCHAR(50) NOT NULL,
    certificate_number VARCHAR(100) NOT NULL,
    issued_by VARCHAR(255) NOT NULL,
    issuing_authority VARCHAR(255),
    issued_at TIMESTAMP NOT NULL,
    expiry_date DATE,
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(export_id, certificate_type)
);

-- ESW Agencies Master Data
CREATE TABLE IF NOT EXISTS esw_agencies (
    agency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_code VARCHAR(20) UNIQUE NOT NULL,
    agency_name VARCHAR(100) NOT NULL,
    agency_name_amharic VARCHAR(100),
    agency_type VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    typical_processing_days INTEGER,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_esw_submissions_export_id ON esw_submissions(export_id);
CREATE INDEX IF NOT EXISTS idx_esw_submissions_reference ON esw_submissions(esw_reference_number);
CREATE INDEX IF NOT EXISTS idx_esw_submissions_status ON esw_submissions(status);

CREATE INDEX IF NOT EXISTS idx_esw_agency_approvals_submission ON esw_agency_approvals(submission_id);
CREATE INDEX IF NOT EXISTS idx_esw_agency_approvals_agency ON esw_agency_approvals(agency_code);
CREATE INDEX IF NOT EXISTS idx_esw_agency_approvals_status ON esw_agency_approvals(status);

CREATE INDEX IF NOT EXISTS idx_export_documents_export_id ON export_documents(export_id);
CREATE INDEX IF NOT EXISTS idx_export_documents_type ON export_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_export_documents_status ON export_documents(status);

CREATE INDEX IF NOT EXISTS idx_export_certificates_export_id ON export_certificates(export_id);
CREATE INDEX IF NOT EXISTS idx_export_certificates_type ON export_certificates(certificate_type);

CREATE INDEX IF NOT EXISTS idx_exports_esw_reference ON exports(esw_reference_number);

-- Seed ESW Agencies
INSERT INTO esw_agencies (agency_code, agency_name, agency_type, is_mandatory, typical_processing_days, description) VALUES
    ('MOT', 'Ministry of Trade and Regional Integration', 'TRADE', true, 2, 'Reviews export declarations and trade compliance'),
    ('ERCA', 'Ethiopian Revenues and Customs Authority', 'CUSTOMS', true, 3, 'Handles customs clearance and export duties'),
    ('NBE', 'National Bank of Ethiopia', 'BANKING', true, 2, 'Approves foreign exchange and monitors export proceeds'),
    ('MOA', 'Ministry of Agriculture', 'AGRICULTURE', true, 2, 'Issues phytosanitary certificates for agricultural products'),
    ('MOH', 'Ministry of Health', 'HEALTH', false, 2, 'Issues health certificates when required'),
    ('EIC', 'Ethiopian Investment Commission', 'REGULATORY', false, 1, 'Reviews investment-related exports'),
    ('ESLSE', 'Ethiopian Shipping & Logistics Services Enterprise', 'TRANSPORT', true, 1, 'Coordinates shipping and logistics'),
    ('EPA', 'Environmental Protection Authority', 'REGULATORY', false, 2, 'Environmental compliance for certain exports'),
    ('ECTA', 'Ethiopian Coffee and Tea Authority', 'REGULATORY', true, 3, 'Coffee quality certification and licensing'),
    ('ECX', 'Ethiopian Commodity Exchange', 'TRADE', true, 1, 'Commodity grading and trading platform'),
    ('MOFED', 'Ministry of Finance and Economic Development', 'REGULATORY', false, 2, 'Economic policy and development oversight'),
    ('MOTI', 'Ministry of Transport and Infrastructure', 'TRANSPORT', false, 1, 'Transport infrastructure and logistics'),
    ('MIDROC', 'Ministry of Industry', 'REGULATORY', false, 2, 'Industrial product standards and compliance'),
    ('QSAE', 'Quality and Standards Authority of Ethiopia', 'REGULATORY', false, 2, 'Product quality standards verification'),
    ('FDRE_CUSTOMS', 'Federal Democratic Republic of Ethiopia Customs', 'CUSTOMS', true, 2, 'Federal customs oversight'),
    ('TRADE_REMEDY', 'Trade Remedy and Quality Compliance Directorate', 'TRADE', false, 1, 'Trade remedy measures and compliance')
ON CONFLICT (agency_code) DO NOTHING;

SELECT 'ESW tables and agencies created successfully' as result;
