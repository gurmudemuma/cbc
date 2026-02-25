-- Add missing columns to exports table to match controller requirements

ALTER TABLE exports
ADD COLUMN IF NOT EXISTS exporter_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS exporter_tin VARCHAR(50),
ADD COLUMN IF NOT EXISTS export_license_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS ecx_lot_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS warehouse_receipt_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS quality_certificate_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS sales_contract_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS export_permit_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS origin_certificate_number VARCHAR(100);
