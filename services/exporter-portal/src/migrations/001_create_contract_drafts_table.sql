-- Migration: Create contract_drafts table
-- Description: Creates the main table for storing draft sales contracts
-- Version: 001
-- Created: 2024

CREATE TABLE IF NOT EXISTS contract_drafts (
  draft_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exporter_id UUID NOT NULL,
  buyer_id UUID,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(255) NOT NULL,
  coffee_type VARCHAR(100) NOT NULL,
  quantity_bags INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_terms VARCHAR(50) NOT NULL,
  delivery_location VARCHAR(255) NOT NULL,
  delivery_date DATE NOT NULL,
  lc_number VARCHAR(50),
  ecta_reference_number VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  blockchain_tx_hash VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalized_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT check_quantity_positive CHECK (quantity_bags >= 1),
  CONSTRAINT check_unit_price_positive CHECK (unit_price > 0),
  CONSTRAINT check_valid_status CHECK (status IN ('DRAFT', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'FINALIZED')),
  CONSTRAINT check_valid_currency CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT check_delivery_date_future CHECK (delivery_date > CURRENT_DATE OR status != 'DRAFT')
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_contract_drafts_exporter_id ON contract_drafts(exporter_id);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_buyer_email ON contract_drafts(buyer_email);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_status ON contract_drafts(status);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_created_at ON contract_drafts(created_at);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_ecta_reference ON contract_drafts(ecta_reference_number);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_buyer_id ON contract_drafts(buyer_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_contract_drafts_exporter_status ON contract_drafts(exporter_id, status);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_buyer_email_status ON contract_drafts(buyer_email, status);
