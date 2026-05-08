/**
 * Database Schema Initialization
 * Initializes all required tables for the Sales Contract Workflow feature
 */

import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const logger = createLogger('SchemaInitializer');

/**
 * Initialize all contract-related tables
 */
export async function initializeContractSchema(): Promise<void> {
  const pool = getPool();

  try {
    logger.info('Initializing contract schema...');

    // Create contract_drafts table
    await pool.query(`
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
        
        CONSTRAINT check_quantity_positive CHECK (quantity_bags >= 1),
        CONSTRAINT check_unit_price_positive CHECK (unit_price > 0),
        CONSTRAINT check_valid_status CHECK (status IN ('DRAFT', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'FINALIZED')),
        CONSTRAINT check_valid_currency CHECK (currency ~ '^[A-Z]{3}$'),
        CONSTRAINT check_delivery_date_future CHECK (delivery_date > CURRENT_DATE OR status != 'DRAFT')
      )
    `);
    logger.info('✅ contract_drafts table created');

    // Create indexes for contract_drafts
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_contract_drafts_exporter_id ON contract_drafts(exporter_id);
      CREATE INDEX IF NOT EXISTS idx_contract_drafts_buyer_email ON contract_drafts(buyer_email);
      CREATE INDEX IF NOT EXISTS idx_contract_drafts_status ON contract_drafts(status);
      CREATE INDEX IF NOT EXISTS idx_contract_drafts_created_at ON contract_drafts(created_at);
      CREATE INDEX IF NOT EXISTS idx_contract_drafts_ecta_reference ON contract_drafts(ecta_reference_number);
      CREATE INDEX IF NOT EXISTS idx_contract_drafts_buyer_id ON contract_drafts(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_contract_drafts_exporter_status ON contract_drafts(exporter_id, status);
      CREATE INDEX IF NOT EXISTS idx_contract_drafts_buyer_email_status ON contract_drafts(buyer_email, status)
    `);
    logger.info('✅ contract_drafts indexes created');

    // Create contract_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contract_history (
        history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        draft_id UUID NOT NULL,
        version_number INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        actor_type VARCHAR(20) NOT NULL,
        actor_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL,
        changes JSONB,
        rejection_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_contract_history_draft FOREIGN KEY (draft_id) 
          REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
        CONSTRAINT check_valid_actor_type CHECK (actor_type IN ('EXPORTER', 'BUYER', 'SYSTEM')),
        CONSTRAINT check_valid_action CHECK (action IN ('CREATED', 'MODIFIED', 'SENT', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'FINALIZED')),
        CONSTRAINT unique_draft_version UNIQUE(draft_id, version_number)
      )
    `);
    logger.info('✅ contract_history table created');

    // Create indexes for contract_history
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_contract_history_draft_id ON contract_history(draft_id);
      CREATE INDEX IF NOT EXISTS idx_contract_history_created_at ON contract_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_contract_history_actor_id ON contract_history(actor_id);
      CREATE INDEX IF NOT EXISTS idx_contract_history_status ON contract_history(status);
      CREATE INDEX IF NOT EXISTS idx_contract_history_draft_version ON contract_history(draft_id, version_number DESC);
      CREATE INDEX IF NOT EXISTS idx_contract_history_draft_action ON contract_history(draft_id, action)
    `);
    logger.info('✅ contract_history indexes created');

    // Create contract_notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contract_notifications (
        notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        draft_id UUID NOT NULL,
        recipient_id UUID NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        action_link VARCHAR(500),
        is_read BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP,
        
        CONSTRAINT fk_contract_notifications_draft FOREIGN KEY (draft_id) 
          REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
        CONSTRAINT check_valid_notification_type CHECK (notification_type IN (
          'CONTRACT_SENT', 
          'CONTRACT_ACCEPTED', 
          'CONTRACT_REJECTED', 
          'CONTRACT_COUNTERED', 
          'COUNTER_ACCEPTED', 
          'CONTRACT_FINALIZED', 
          'ECTA_REGISTERED', 
          'CERTIFICATE_READY'
        ))
      )
    `);
    logger.info('✅ contract_notifications table created');

    // Create indexes for contract_notifications
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_contract_notifications_draft_id ON contract_notifications(draft_id);
      CREATE INDEX IF NOT EXISTS idx_contract_notifications_recipient_id ON contract_notifications(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_contract_notifications_recipient_email ON contract_notifications(recipient_email);
      CREATE INDEX IF NOT EXISTS idx_contract_notifications_sent_at ON contract_notifications(sent_at);
      CREATE INDEX IF NOT EXISTS idx_contract_notifications_is_read ON contract_notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_contract_notifications_recipient_unread ON contract_notifications(recipient_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_contract_notifications_draft_type ON contract_notifications(draft_id, notification_type)
    `);
    logger.info('✅ contract_notifications indexes created');

    // Create contract_permissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contract_permissions (
        permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        draft_id UUID NOT NULL,
        user_id UUID NOT NULL,
        user_email VARCHAR(255),
        permission_type VARCHAR(50) NOT NULL,
        granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        
        CONSTRAINT fk_contract_permissions_draft FOREIGN KEY (draft_id) 
          REFERENCES contract_drafts(draft_id) ON DELETE CASCADE,
        CONSTRAINT check_valid_permission_type CHECK (permission_type IN (
          'VIEW', 
          'EDIT', 
          'RESPOND', 
          'FINALIZE', 
          'ADMIN'
        ))
      )
    `);
    logger.info('✅ contract_permissions table created');

    // Create indexes for contract_permissions
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_contract_permissions_draft_id ON contract_permissions(draft_id);
      CREATE INDEX IF NOT EXISTS idx_contract_permissions_user_id ON contract_permissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_contract_permissions_user_email ON contract_permissions(user_email);
      CREATE INDEX IF NOT EXISTS idx_contract_permissions_granted_at ON contract_permissions(granted_at);
      CREATE INDEX IF NOT EXISTS idx_contract_permissions_expires_at ON contract_permissions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_contract_permissions_user_draft ON contract_permissions(user_id, draft_id);
      CREATE INDEX IF NOT EXISTS idx_contract_permissions_draft_type ON contract_permissions(draft_id, permission_type)
    `);
    logger.info('✅ contract_permissions indexes created');

    logger.info('✅ Contract schema initialization completed successfully');
  } catch (error) {
    logger.error('❌ Error initializing contract schema', { error });
    throw error;
  }
}

/**
 * Drop all contract-related tables (for cleanup/testing)
 */
export async function dropContractSchema(): Promise<void> {
  const pool = getPool();

  try {
    logger.info('Dropping contract schema...');

    // Drop tables in reverse order of creation (respecting foreign keys)
    await pool.query('DROP TABLE IF EXISTS contract_permissions CASCADE');
    logger.info('✅ contract_permissions table dropped');

    await pool.query('DROP TABLE IF EXISTS contract_notifications CASCADE');
    logger.info('✅ contract_notifications table dropped');

    await pool.query('DROP TABLE IF EXISTS contract_history CASCADE');
    logger.info('✅ contract_history table dropped');

    await pool.query('DROP TABLE IF EXISTS contract_drafts CASCADE');
    logger.info('✅ contract_drafts table dropped');

    logger.info('✅ Contract schema dropped successfully');
  } catch (error) {
    logger.error('❌ Error dropping contract schema', { error });
    throw error;
  }
}
