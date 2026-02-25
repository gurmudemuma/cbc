-- Migration 012: Add Blockchain User Synchronization Fields
-- Purpose: Add required fields for user synchronization between PostgreSQL and Hyperledger Fabric
-- Created: 2026-02-20

-- Add missing columns to users table for blockchain sync
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tin VARCHAR(100),
  ADD COLUMN IF NOT EXISTS capital_etb DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_approval';

-- Add unique constraint on TIN
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_tin_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_tin_key UNIQUE (tin);
  END IF;
END $$;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Create index on TIN for lookups
CREATE INDEX IF NOT EXISTS idx_users_tin ON users(tin);

-- Update existing admin user with required fields
UPDATE users 
SET 
  phone = '+251911234567',
  company_name = 'ECTA',
  tin = 'TIN_ADMIN_001',
  capital_etb = 50000000,
  address = 'Addis Ababa, Ethiopia',
  contact_person = 'System Administrator',
  status = 'approved'
WHERE username = 'admin' AND phone IS NULL;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO postgres;

SELECT 'Migration 012: Blockchain user fields added successfully' as status;
