-- Create ECTA Contract Submissions Table
-- This table tracks all finalized contracts submitted to ECTA for registration

CREATE TABLE IF NOT EXISTS ecta_contract_submissions (
  submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES contract_drafts(draft_id),
  ecta_reference_number VARCHAR(50),
  exporter_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  submission_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REGISTRATION',
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  registered_at TIMESTAMP,
  registered_by VARCHAR(255),
  lc_number VARCHAR(100),
  registration_notes TEXT,
  contract_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT ecta_submissions_status_check CHECK (
    submission_status IN (
      'PENDING_REGISTRATION',
      'REGISTERED',
      'REJECTED',
      'CANCELLED'
    )
  )
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ecta_submissions_draft ON ecta_contract_submissions(draft_id);
CREATE INDEX IF NOT EXISTS idx_ecta_submissions_status ON ecta_contract_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_ecta_submissions_exporter ON ecta_contract_submissions(exporter_id);
CREATE INDEX IF NOT EXISTS idx_ecta_submissions_reference ON ecta_contract_submissions(ecta_reference_number);
CREATE INDEX IF NOT EXISTS idx_ecta_submissions_submitted_at ON ecta_contract_submissions(submitted_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ecta_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ecta_submissions_timestamp
BEFORE UPDATE ON ecta_contract_submissions
FOR EACH ROW
EXECUTE FUNCTION update_ecta_submissions_updated_at();

-- Add comment
COMMENT ON TABLE ecta_contract_submissions IS 'Tracks finalized sales contracts submitted to ECTA for official registration';
