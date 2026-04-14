-- Add FINALIZED status to contract_drafts if not already present
-- This ensures the status constraint includes FINALIZED for auto-finalization workflow

-- Drop existing constraint
ALTER TABLE contract_drafts DROP CONSTRAINT IF EXISTS contract_drafts_status_check;

-- Add new constraint with FINALIZED included
ALTER TABLE contract_drafts ADD CONSTRAINT contract_drafts_status_check CHECK (
    status IN ('DRAFT', 'OFFERED', 'COUNTERED', 'ACCEPTED', 'REJECTED', 
               'EXPIRED', 'WITHDRAWN', 'FINALIZED', 'REGISTERED')
);

-- Note: REGISTERED status added for contracts registered with ECTA
