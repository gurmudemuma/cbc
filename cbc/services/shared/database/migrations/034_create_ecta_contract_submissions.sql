-- ============================================================================
-- Create ECTA Contract Submissions Table
-- Migration 034: Track contract submissions to ECTA for registration
-- ============================================================================

CREATE TABLE IF NOT EXISTS ecta_contract_submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES contract_drafts(draft_id),
    contract_number VARCHAR(100),
    ecta_reference_number VARCHAR(100),
    submission_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    submitted_by UUID,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    registration_date TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ecta_submissions_status_check CHECK (
        submission_status IN ('PENDING', 'UNDER_REVIEW', 'REGISTERED', 'REJECTED', 'CANCELLED')
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ecta_submissions_draft ON ecta_contract_submissions(draft_id);
CREATE INDEX IF NOT EXISTS idx_ecta_submissions_status ON ecta_contract_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_ecta_submissions_reference ON ecta_contract_submissions(ecta_reference_number);
CREATE INDEX IF NOT EXISTS idx_ecta_submissions_submitted_at ON ecta_contract_submissions(submitted_at);

-- Create trigger for updated_at
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

-- Add comments
COMMENT ON TABLE ecta_contract_submissions IS 'Tracks contract submissions to ECTA for registration';
COMMENT ON COLUMN ecta_contract_submissions.submission_status IS 'Status: PENDING, UNDER_REVIEW, REGISTERED, REJECTED, CANCELLED';
