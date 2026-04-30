-- Create contract_exports junction table to link contracts to export shipments
CREATE TABLE IF NOT EXISTS contract_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(255) NOT NULL REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
  export_id VARCHAR(255) NOT NULL,
  exporter_id VARCHAR(255) NOT NULL REFERENCES exporters(exporter_id) ON DELETE CASCADE,
  
  -- Validation fields
  coffee_type_match BOOLEAN NOT NULL DEFAULT true,
  quantity_match BOOLEAN NOT NULL DEFAULT true,
  quantity_variance DECIMAL(5, 2) DEFAULT 0, -- Percentage variance allowed
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'LINKED', -- LINKED, VERIFIED, SHIPPED, COMPLETED
  linked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  shipped_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Audit fields
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(contract_id, export_id),
  CONSTRAINT fk_contract_exports_exporter FOREIGN KEY (exporter_id) REFERENCES exporters(exporter_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_contract_exports_contract_id ON contract_exports(contract_id);
CREATE INDEX idx_contract_exports_export_id ON contract_exports(export_id);
CREATE INDEX idx_contract_exports_exporter_id ON contract_exports(exporter_id);
CREATE INDEX idx_contract_exports_status ON contract_exports(status);
CREATE INDEX idx_contract_exports_linked_at ON contract_exports(linked_at);
CREATE INDEX idx_contract_exports_contract_export ON contract_exports(contract_id, export_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contract_exports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_exports_updated_at_trigger
BEFORE UPDATE ON contract_exports
FOR EACH ROW
EXECUTE FUNCTION update_contract_exports_updated_at();

-- Rollback script
-- DROP TRIGGER IF EXISTS contract_exports_updated_at_trigger ON contract_exports;
-- DROP FUNCTION IF EXISTS update_contract_exports_updated_at();
-- DROP TABLE IF EXISTS contract_exports;
