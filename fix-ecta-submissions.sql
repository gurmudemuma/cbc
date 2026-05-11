-- Add all missing columns to ecta_contract_submissions table
ALTER TABLE ecta_contract_submissions 
ADD COLUMN IF NOT EXISTS buyer_id uuid,
ADD COLUMN IF NOT EXISTS buyer_name varchar(255),
ADD COLUMN IF NOT EXISTS coffee_type varchar(100),
ADD COLUMN IF NOT EXISTS quantity numeric(15,2),
ADD COLUMN IF NOT EXISTS total_value numeric(15,2),
ADD COLUMN IF NOT EXISTS currency varchar(10),
ADD COLUMN IF NOT EXISTS approved_by varchar(255),
ADD COLUMN IF NOT EXISTS approved_at timestamp;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ecta_submissions_buyer ON ecta_contract_submissions(buyer_id);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ecta_contract_submissions' 
ORDER BY ordinal_position;
