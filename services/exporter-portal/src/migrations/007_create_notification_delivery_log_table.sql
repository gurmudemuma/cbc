-- Create notification delivery log table
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id UUID PRIMARY KEY,
  notification_id UUID NOT NULL,
  delivery_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  bounced_at TIMESTAMP,
  opened_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (notification_id) REFERENCES contract_notifications(notification_id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_notification_id 
  ON notification_delivery_log(notification_id);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_status 
  ON notification_delivery_log(delivery_status);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_sent_at 
  ON notification_delivery_log(sent_at);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_created_at 
  ON notification_delivery_log(created_at);
