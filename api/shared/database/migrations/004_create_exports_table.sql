-- ============================================================================
-- EXPORTS TABLE - Core export request management
-- ============================================================================
CREATE TABLE IF NOT EXISTS exports (
    export_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id) ON DELETE CASCADE,
    
    -- Export Details
    coffee_type VARCHAR(100) NOT NULL,
    origin_region VARCHAR(100),
    quantity DECIMAL(15, 2) NOT NULL,
    unit_of_measure VARCHAR(20) DEFAULT 'KG' CHECK (unit_of_measure IN ('KG', 'BAGS', 'TONS')),
    destination_country VARCHAR(100) NOT NULL,
    estimated_value DECIMAL(15, 2),
    
    -- Buyer Information
    buyer_name VARCHAR(500),
    buyer_country VARCHAR(100),
    buyer_email VARCHAR(255),
    
    -- Status Workflow
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN (
            'PENDING',
            'FX_APPROVED',
            'QUALITY_CERTIFIED',
            'SHIPMENT_SCHEDULED',
            'SHIPPED',
            'COMPLETED',
            'FX_REJECTED',
            'QUALITY_REJECTED',
            'CANCELLED'
        )
    ),
    
    -- FX Approval (National Bank)
    fx_approved_by VARCHAR(255),
    fx_approved_at TIMESTAMP,
    fx_rejection_reason TEXT,
    
    -- Quality Certification (ECTA)
    quality_approved_by VARCHAR(255),
    quality_approved_at TIMESTAMP,
    quality_rejection_reason TEXT,
    quality_grade VARCHAR(50),
    
    -- Shipment (Shipping Line)
    shipment_scheduled_by VARCHAR(255),
    shipment_scheduled_at TIMESTAMP,
    vessel_name VARCHAR(255),
    departure_date DATE,
    arrival_date DATE,
    
    shipment_confirmed_by VARCHAR(255),
    shipment_confirmed_at TIMESTAMP,
    
    -- Customs (Custom Authorities)
    customs_cleared_by VARCHAR(255),
    customs_cleared_at TIMESTAMP,
    customs_clearance_number VARCHAR(100),
    
    -- Completion
    completed_by VARCHAR(255),
    completed_at TIMESTAMP,
    
    -- Cancellation
    cancelled_by VARCHAR(255),
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exports_exporter_id ON exports(exporter_id);
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_exports_created_at ON exports(created_at);
CREATE INDEX idx_exports_destination ON exports(destination_country);

-- ============================================================================
-- EXPORT STATUS HISTORY - Audit trail for all status changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS export_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID NOT NULL REFERENCES exports(export_id) ON DELETE CASCADE,
    
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    organization VARCHAR(100),
    reason TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_export_status_history_export_id ON export_status_history(export_id);
CREATE INDEX idx_export_status_history_created_at ON export_status_history(created_at);

-- ============================================================================
-- EXPORT DOCUMENTS - Link documents to exports
-- ============================================================================
CREATE TABLE IF NOT EXISTS export_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID NOT NULL REFERENCES exports(export_id) ON DELETE CASCADE,
    
    document_type VARCHAR(100) NOT NULL CHECK (
        document_type IN (
            'INVOICE',
            'PACKING_LIST',
            'QUALITY_CERTIFICATE',
            'EXPORT_LICENSE',
            'SALES_CONTRACT',
            'BILL_OF_LADING',
            'CERTIFICATE_OF_ORIGIN',
            'CUSTOMS_DECLARATION',
            'OTHER'
        )
    ),
    
    document_name VARCHAR(255) NOT NULL,
    document_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- IPFS storage (optional)
    ipfs_hash VARCHAR(255),
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_export_documents_export_id ON export_documents(export_id);
CREATE INDEX idx_export_documents_type ON export_documents(document_type);

-- ============================================================================
-- EXPORT APPROVALS - Track all approvals with details
-- ============================================================================
CREATE TABLE IF NOT EXISTS export_approvals (
    approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID NOT NULL REFERENCES exports(export_id) ON DELETE CASCADE,
    
    approval_type VARCHAR(50) NOT NULL CHECK (
        approval_type IN (
            'FX_APPROVAL',
            'QUALITY_CERTIFICATION',
            'SHIPMENT_SCHEDULING',
            'CUSTOMS_CLEARANCE',
            'EXPORT_COMPLETION'
        )
    ),
    
    organization VARCHAR(100) NOT NULL,
    approved_by VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    
    approval_date TIMESTAMP,
    rejection_reason TEXT,
    
    -- Additional data
    approval_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_export_approvals_export_id ON export_approvals(export_id);
CREATE INDEX idx_export_approvals_type ON export_approvals(approval_type);
CREATE INDEX idx_export_approvals_status ON export_approvals(status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_exports_updated_at BEFORE UPDATE ON exports 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_export_approvals_updated_at BEFORE UPDATE ON export_approvals 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Pending Approvals by Organization
CREATE OR REPLACE VIEW pending_approvals_by_org AS
SELECT 
    ea.approval_id,
    ea.export_id,
    e.exporter_id,
    ep.business_name as exporter_name,
    ea.approval_type,
    ea.organization,
    e.coffee_type,
    e.quantity,
    e.destination_country,
    e.created_at as export_created_at,
    ea.created_at as approval_created_at
FROM export_approvals ea
JOIN exports e ON ea.export_id = e.export_id
JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
WHERE ea.status = 'PENDING'
ORDER BY ea.created_at ASC;

-- View: Export Summary
CREATE OR REPLACE VIEW export_summary AS
SELECT 
    e.export_id,
    e.exporter_id,
    ep.business_name as exporter_name,
    e.coffee_type,
    e.quantity,
    e.destination_country,
    e.status,
    COUNT(CASE WHEN ea.status = 'APPROVED' THEN 1 END) as approvals_count,
    COUNT(CASE WHEN ea.status = 'PENDING' THEN 1 END) as pending_approvals,
    COUNT(ed.document_id) as documents_count,
    e.created_at,
    e.updated_at
FROM exports e
JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
LEFT JOIN export_approvals ea ON e.export_id = ea.export_id
LEFT JOIN export_documents ed ON e.export_id = ed.export_id
GROUP BY e.export_id, e.exporter_id, ep.business_name;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE exports IS 'Core export requests with complete workflow tracking';
COMMENT ON TABLE export_status_history IS 'Immutable audit trail of all status changes';
COMMENT ON TABLE export_documents IS 'Documents attached to exports (invoices, certificates, etc)';
COMMENT ON TABLE export_approvals IS 'Approval tracking for each stage of export workflow';
