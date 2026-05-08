-- Create blockchain retry queue table
CREATE TABLE IF NOT EXISTS blockchain_retry_queue (
  id UUID PRIMARY KEY,
  draft_id UUID NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMP NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (draft_id) REFERENCES contract_drafts(draft_id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_blockchain_retry_queue_next_retry_at 
  ON blockchain_retry_queue(next_retry_at);

CREATE INDEX IF NOT EXISTS idx_blockchain_retry_queue_draft_id 
  ON blockchain_retry_queue(draft_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_retry_queue_status 
  ON blockchain_retry_queue(attempt, max_attempts);
