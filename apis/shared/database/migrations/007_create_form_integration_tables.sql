-- Customs Clearances Table
CREATE TABLE IF NOT EXISTS customs_clearances (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(100) NOT NULL,
    declaration_number VARCHAR(100) UNIQUE NOT NULL,
    inspection_notes TEXT,
    duty_paid DECIMAL(15,2),
    tax_paid DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'pending',
    cleared_by INTEGER,
    cleared_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customs_clearances_export_id ON customs_clearances(export_id);
CREATE INDEX idx_customs_clearances_status ON customs_clearances(status);

-- Shipments Table
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(100) NOT NULL,
    booking_number VARCHAR(100) UNIQUE NOT NULL,
    vessel_name VARCHAR(255),
    departure_port VARCHAR(100),
    arrival_port VARCHAR(100),
    departure_date DATE,
    arrival_date DATE,
    estimated_arrival_date DATE,
    container_number VARCHAR(100),
    container_type VARCHAR(50),
    seal_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled',
    tracking_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipments_export_id ON shipments(export_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_booking_number ON shipments(booking_number);

-- Document Verifications Table
CREATE TABLE IF NOT EXISTS document_verifications (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(100) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255),
    document_hash VARCHAR(255),
    ipfs_hash VARCHAR(255),
    verification_status VARCHAR(50) DEFAULT 'pending',
    verified_by INTEGER,
    verification_notes TEXT,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_verifications_export_id ON document_verifications(export_id);
CREATE INDEX idx_document_verifications_status ON document_verifications(verification_status);

-- FX Approvals Table
CREATE TABLE IF NOT EXISTS fx_approvals (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(100) NOT NULL,
    export_value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    exchange_rate DECIMAL(10,4),
    local_value DECIMAL(15,2),
    approval_status VARCHAR(50) DEFAULT 'pending',
    approved_by INTEGER,
    approval_notes TEXT,
    rejection_reason TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fx_approvals_export_id ON fx_approvals(export_id);
CREATE INDEX idx_fx_approvals_status ON fx_approvals(approval_status);

-- Exports Master Table (if not exists)
CREATE TABLE IF NOT EXISTS exports (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(100) UNIQUE NOT NULL,
    exporter_id INTEGER,
    exporter_name VARCHAR(255),
    coffee_type VARCHAR(100),
    quantity DECIMAL(15,2),
    destination_country VARCHAR(100),
    estimated_value DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exports_export_id ON exports(export_id);
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_exports_exporter_id ON exports(exporter_id);
