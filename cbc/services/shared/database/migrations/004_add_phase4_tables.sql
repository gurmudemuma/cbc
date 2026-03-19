-- Migration: Add Phase 4 Customs & Logistics Tables
-- Version: 004
-- Description: Complete CBC persistence for customs and logistics operations

-- Customs Declarations Table
CREATE TABLE IF NOT EXISTS customs_declarations (
    declaration_id VARCHAR(100) PRIMARY KEY,
    shipment_id VARCHAR(100),
    exporter_id UUID,
    declaration_number VARCHAR(50),
    declaration_type VARCHAR(50) NOT NULL,
    customs_office VARCHAR(100),
    
    -- Declaration Details
    total_value DECIMAL(15, 2),
    currency VARCHAR(3),
    hs_code VARCHAR(20),
    goods_description TEXT,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CLEARED', 'REJECTED')),
    submitted_at TIMESTAMP,
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    cleared_by VARCHAR(100),
    cleared_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id)
);

-- Fumigation Certificates Table
CREATE TABLE IF NOT EXISTS fumigation_certificates (
    fumigation_id VARCHAR(100) PRIMARY KEY,
    shipment_id VARCHAR(100),
    certificate_number VARCHAR(50) UNIQUE,
    
    -- Fumigation Details
    fumigation_date DATE NOT NULL,
    fumigation_location VARCHAR(200),
    fumigant_used VARCHAR(100),
    concentration VARCHAR(50),
    exposure_time VARCHAR(50),
    temperature VARCHAR(50),
    
    -- Inspector Details
    inspector_name VARCHAR(100),
    inspector_license VARCHAR(50),
    inspection_company VARCHAR(200),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ISSUED', 'EXPIRED', 'REVOKED')),
    issued_at TIMESTAMP,
    expiry_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Shipping Instructions Table
CREATE TABLE IF NOT EXISTS shipping_instructions (
    instruction_id VARCHAR(100) PRIMARY KEY,
    shipment_id VARCHAR(100),
    
    -- Shipper Details
    shipper_name VARCHAR(200) NOT NULL,
    shipper_address TEXT,
    shipper_contact VARCHAR(100),
    
    -- Consignee Details
    consignee_name VARCHAR(200) NOT NULL,
    consignee_address TEXT,
    consignee_contact VARCHAR(100),
    
    -- Notify Party
    notify_party_name VARCHAR(200),
    notify_party_address TEXT,
    notify_party_contact VARCHAR(100),
    
    -- Shipping Details
    port_of_loading VARCHAR(100),
    port_of_discharge VARCHAR(100),
    final_destination VARCHAR(100),
    shipping_line VARCHAR(100),
    vessel_name VARCHAR(100),
    voyage_number VARCHAR(50),
    
    -- Container Details
    container_type VARCHAR(50),
    number_of_containers INT,
    
    -- Special Instructions
    special_instructions TEXT,
    freight_terms VARCHAR(50),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'CANCELLED')),
    submitted_at TIMESTAMP,
    confirmed_by VARCHAR(100),
    confirmed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bill of Lading Table
CREATE TABLE IF NOT EXISTS bills_of_lading (
    bl_id VARCHAR(100) PRIMARY KEY,
    bl_number VARCHAR(50) UNIQUE NOT NULL,
    shipment_id VARCHAR(100),
    instruction_id VARCHAR(100),
    
    -- BL Type
    bl_type VARCHAR(50) NOT NULL CHECK (bl_type IN ('ORIGINAL', 'COPY', 'SEAWAY', 'TELEX_RELEASE')),
    
    -- Parties
    shipper_name VARCHAR(200) NOT NULL,
    consignee_name VARCHAR(200) NOT NULL,
    notify_party VARCHAR(200),
    
    -- Voyage Details
    vessel_name VARCHAR(100) NOT NULL,
    voyage_number VARCHAR(50),
    port_of_loading VARCHAR(100) NOT NULL,
    port_of_discharge VARCHAR(100) NOT NULL,
    place_of_delivery VARCHAR(100),
    
    -- Cargo Details
    description_of_goods TEXT NOT NULL,
    gross_weight DECIMAL(10, 2),
    measurement DECIMAL(10, 2),
    number_of_packages INT,
    
    -- Container Details
    container_numbers TEXT[], -- Array of container numbers
    seal_numbers TEXT[], -- Array of seal numbers
    
    -- Freight
    freight_payable_at VARCHAR(100),
    freight_amount DECIMAL(15, 2),
    freight_currency VARCHAR(3),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ISSUED', 'SURRENDERED', 'CANCELLED')),
    issued_at TIMESTAMP,
    issued_by VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Containers Table
CREATE TABLE IF NOT EXISTS containers (
    container_id VARCHAR(100) PRIMARY KEY,
    shipment_id VARCHAR(100),
    container_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Container Details
    container_type VARCHAR(50) NOT NULL,
    container_size VARCHAR(20) NOT NULL,
    tare_weight DECIMAL(10, 2),
    max_payload DECIMAL(10, 2),
    
    -- Seal Details
    seal_number VARCHAR(50),
    seal_type VARCHAR(50),
    sealed_by VARCHAR(100),
    sealed_at TIMESTAMP,
    
    -- Loading Details
    loading_date DATE,
    loading_location VARCHAR(200),
    loaded_by VARCHAR(100),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'LOADED', 'SEALED', 'IN_TRANSIT', 'DELIVERED', 'EMPTY_RETURNED')),
    current_location VARCHAR(200),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Container Tracking Table
CREATE TABLE IF NOT EXISTS container_tracking (
    tracking_id SERIAL PRIMARY KEY,
    container_id VARCHAR(100) NOT NULL,
    
    -- Location
    location VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Status
    status VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    
    -- Timestamp
    event_timestamp TIMESTAMP NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by VARCHAR(100),
    
    FOREIGN KEY (container_id) REFERENCES containers(container_id)
);

-- Vessels Table
CREATE TABLE IF NOT EXISTS vessels (
    vessel_id VARCHAR(100) PRIMARY KEY,
    vessel_name VARCHAR(100) NOT NULL,
    imo_number VARCHAR(20) UNIQUE,
    
    -- Vessel Details
    vessel_type VARCHAR(50),
    flag VARCHAR(50),
    gross_tonnage DECIMAL(10, 2),
    net_tonnage DECIMAL(10, 2),
    year_built INT,
    
    -- Operator
    operator_name VARCHAR(200),
    operator_contact VARCHAR(100),
    
    -- Current Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IN_PORT', 'AT_SEA', 'MAINTENANCE', 'INACTIVE')),
    current_location VARCHAR(200),
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vessel Tracking Table
CREATE TABLE IF NOT EXISTS vessel_tracking (
    tracking_id SERIAL PRIMARY KEY,
    vessel_id VARCHAR(100) NOT NULL,
    
    -- Location
    location VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Status
    status VARCHAR(50) NOT NULL,
    speed_knots DECIMAL(5, 2),
    heading_degrees DECIMAL(5, 2),
    
    -- Timestamp
    position_timestamp TIMESTAMP NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vessel_id) REFERENCES vessels(vessel_id)
);

-- Indexes
CREATE INDEX idx_customs_declarations_shipment ON customs_declarations(shipment_id);
CREATE INDEX idx_customs_declarations_status ON customs_declarations(status);
CREATE INDEX idx_fumigation_certificates_shipment ON fumigation_certificates(shipment_id);
CREATE INDEX idx_shipping_instructions_shipment ON shipping_instructions(shipment_id);
CREATE INDEX idx_bills_of_lading_shipment ON bills_of_lading(shipment_id);
CREATE INDEX idx_containers_shipment ON containers(shipment_id);
CREATE INDEX idx_container_tracking_container ON container_tracking(container_id, event_timestamp DESC);
CREATE INDEX idx_vessel_tracking_vessel ON vessel_tracking(vessel_id, position_timestamp DESC);

-- Comments
COMMENT ON TABLE customs_declarations IS 'Customs declaration records for exports';
COMMENT ON TABLE fumigation_certificates IS 'Fumigation certificates for shipments';
COMMENT ON TABLE shipping_instructions IS 'Shipping instructions from exporters';
COMMENT ON TABLE bills_of_lading IS 'Bills of lading for shipments';
COMMENT ON TABLE containers IS 'Container assignments and tracking';
COMMENT ON TABLE container_tracking IS 'Container location and status history';
COMMENT ON TABLE vessels IS 'Vessel master data';
COMMENT ON TABLE vessel_tracking IS 'Vessel location and status history';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON customs_declarations TO postgres;
GRANT SELECT, INSERT, UPDATE ON fumigation_certificates TO postgres;
GRANT SELECT, INSERT, UPDATE ON shipping_instructions TO postgres;
GRANT SELECT, INSERT, UPDATE ON bills_of_lading TO postgres;
GRANT SELECT, INSERT, UPDATE ON containers TO postgres;
GRANT SELECT, INSERT, UPDATE ON container_tracking TO postgres;
GRANT SELECT, INSERT, UPDATE ON vessels TO postgres;
GRANT SELECT, INSERT, UPDATE ON vessel_tracking TO postgres;
GRANT USAGE, SELECT ON SEQUENCE container_tracking_tracking_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE vessel_tracking_tracking_id_seq TO postgres;
