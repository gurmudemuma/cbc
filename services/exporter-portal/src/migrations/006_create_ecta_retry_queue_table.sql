-- Create ECTA retry queue table
CREATE TABLE IF NOT EXISTS ecta_retry_queue (
  id UUID PRIMARY KEY,
  draft_id UUID NOT NULL,
  blockchain_tx_hash VARCHAR(255) NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMP NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (draft_id) REFERENCES contract_drafts(draft_id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ecta_retry_queue_next_retry_at 
  ON ecta_retry_queue(next_retry_at);

CREATE INDEX IF NOT EXISTS idx_ecta_retry_queue_draft_id 
  ON ecta_retry_queue(draft_id);

CREATE INDEX IF NOT EXISTS idx_ecta_retry_queue_status 
  ON ecta_retry_queue(attempt, max_attempts);
