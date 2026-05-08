-- Create exporter_qualifications table for tracking pre-registration stages
-- This table consolidates the 5 qualification stages into a single tracking table

CREATE TABLE IF NOT EXISTS exporter_qualifications (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    stage VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_at TIMESTAMP,
    approved_by VARCHAR(255),
    comments TEXT,
    certificate_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_username_stage UNIQUE (username, stage)
);

CREATE INDEX idx_exporter_qualifications_username ON exporter_qualifications(username);
CREATE INDEX idx_exporter_qualifications_status ON exporter_qualifications(status);
CREATE INDEX idx_exporter_qualifications_stage ON exporter_qualifications(stage);

-- Trigger for updated_at
CREATE TRIGGER update_exporter_qualifications_updated_at 
    BEFORE UPDATE ON exporter_qualifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE exporter_qualifications IS 'Tracks the 5 pre-registration qualification stages for exporters';
COMMENT ON COLUMN exporter_qualifications.stage IS 'One of: profile_certificate, laboratory_certificate, taster_certificate, competence_certificate, export_license';
