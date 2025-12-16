-- ============================================================================
-- ECTA Stage Tracking Migration
-- Adds stage tracking columns to exporter_profiles table
-- ============================================================================

-- Add stage tracking columns to exporter_profiles
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS current_stage INT DEFAULT 1;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_1_submitted_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_1_approved_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_1_rejected_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_1_rejection_reason TEXT;

ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_2_submitted_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_2_approved_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_2_rejected_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_2_rejection_reason TEXT;

ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_3_submitted_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_3_approved_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_3_rejected_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_3_rejection_reason TEXT;

ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_4_submitted_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_4_approved_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_4_rejected_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_4_rejection_reason TEXT;

ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_5_submitted_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_5_approved_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_5_rejected_at TIMESTAMP;
ALTER TABLE exporter_profiles ADD COLUMN IF NOT EXISTS stage_5_rejection_reason TEXT;

-- Create index for stage queries
CREATE INDEX IF NOT EXISTS idx_exporter_profiles_current_stage ON exporter_profiles(current_stage);
CREATE INDEX IF NOT EXISTS idx_exporter_profiles_status ON exporter_profiles(status);

-- ============================================================================
-- Compliance Tables
-- ============================================================================

-- Create quarterly_reports table
CREATE TABLE IF NOT EXISTS quarterly_reports (
  report_id UUID PRIMARY KEY,
  exporter_id UUID NOT NULL,
  quarter INT NOT NULL,
  year INT NOT NULL,
  total_exports DECIMAL(15, 2),
  destination_countries TEXT[],
  average_prices DECIMAL(10, 2),
  quality_metrics JSONB,
  issues TEXT,
  submitted_by VARCHAR(255),
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id),
  UNIQUE(exporter_id, quarter, year)
);

CREATE INDEX IF NOT EXISTS idx_quarterly_reports_exporter_id ON quarterly_reports(exporter_id);
CREATE INDEX IF NOT EXISTS idx_quarterly_reports_year_quarter ON quarterly_reports(year, quarter);

-- Create annual_audits table
CREATE TABLE IF NOT EXISTS annual_audits (
  audit_id UUID PRIMARY KEY,
  exporter_id UUID NOT NULL,
  audit_year INT NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  inspection_report TEXT,
  documentation_review TEXT,
  quality_testing TEXT,
  findings JSONB,
  scheduled_by VARCHAR(255),
  completed_by VARCHAR(255),
  scheduled_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id),
  UNIQUE(exporter_id, audit_year)
);

CREATE INDEX IF NOT EXISTS idx_annual_audits_exporter_id ON annual_audits(exporter_id);
CREATE INDEX IF NOT EXISTS idx_annual_audits_status ON annual_audits(status);

-- Create compliance_violations table
CREATE TABLE IF NOT EXISTS compliance_violations (
  violation_id UUID PRIMARY KEY,
  exporter_id UUID NOT NULL,
  category VARCHAR(1) NOT NULL CHECK (category IN ('A', 'B', 'C')),
  description TEXT NOT NULL,
  penalty_amount DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  recorded_by VARCHAR(255),
  resolved_by VARCHAR(255),
  recorded_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_violations_exporter_id ON compliance_violations(exporter_id);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_category ON compliance_violations(category);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_status ON compliance_violations(status);

-- ============================================================================
-- Facility Inspections Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS facility_inspections (
  inspection_id UUID PRIMARY KEY,
  exporter_id UUID NOT NULL,
  inspection_stage INT NOT NULL,
  inspection_date DATE,
  inspector_name VARCHAR(255),
  inspection_result VARCHAR(50),
  inspection_report_cid VARCHAR(255),
  warehouse_location TEXT,
  storage_capacity DECIMAL(15, 2),
  environmental_conditions JSONB,
  equipment_list TEXT[],
  findings JSONB,
  scheduled_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id)
);

CREATE INDEX IF NOT EXISTS idx_facility_inspections_exporter_id ON facility_inspections(exporter_id);
CREATE INDEX IF NOT EXISTS idx_facility_inspections_stage ON facility_inspections(inspection_stage);
CREATE INDEX IF NOT EXISTS idx_facility_inspections_result ON facility_inspections(inspection_result);

-- ============================================================================
-- Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ecta_audit_log (
  log_id UUID PRIMARY KEY,
  exporter_id UUID NOT NULL,
  action VARCHAR(255) NOT NULL,
  stage INT,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  actor VARCHAR(255),
  actor_role VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id)
);

CREATE INDEX IF NOT EXISTS idx_ecta_audit_log_exporter_id ON ecta_audit_log(exporter_id);
CREATE INDEX IF NOT EXISTS idx_ecta_audit_log_action ON ecta_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_ecta_audit_log_created_at ON ecta_audit_log(created_at);

-- ============================================================================
-- Migration Complete
-- ============================================================================
