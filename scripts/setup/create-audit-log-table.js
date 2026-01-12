/**
 * Create ECTA Audit Log Table
 * 
 * Creates the audit log table for ECTA compliance tracking
 * with 7-year retention policy and immutable records
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

async function createAuditLogTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating ECTA Audit Log table...\n');
    
    // Create the audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ecta_audit_log (
        log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exporter_id UUID NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        action_description TEXT NOT NULL,
        performed_by VARCHAR(100) NOT NULL,
        performed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        entity_type VARCHAR(50),
        entity_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        retention_until DATE NOT NULL,
        is_immutable BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_exporter FOREIGN KEY (exporter_id) 
          REFERENCES exporter_profiles(exporter_id) ON DELETE RESTRICT
      );
    `);
    
    console.log('✅ Table created');
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_exporter 
        ON ecta_audit_log(exporter_id);
      
      CREATE INDEX IF NOT EXISTS idx_audit_action_type 
        ON ecta_audit_log(action_type);
      
      CREATE INDEX IF NOT EXISTS idx_audit_performed_at 
        ON ecta_audit_log(performed_at);
      
      CREATE INDEX IF NOT EXISTS idx_audit_entity 
        ON ecta_audit_log(entity_type, entity_id);
      
      CREATE INDEX IF NOT EXISTS idx_audit_retention 
        ON ecta_audit_log(retention_until);
    `);
    
    console.log('✅ Indexes created');
    
    // Create a function to prevent updates/deletes on immutable records
    await client.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_modification()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.is_immutable = true THEN
          RAISE EXCEPTION 'Audit log records are immutable and cannot be modified or deleted';
        END IF;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS audit_log_immutable ON ecta_audit_log;
      
      CREATE TRIGGER audit_log_immutable
      BEFORE UPDATE OR DELETE ON ecta_audit_log
      FOR EACH ROW
      EXECUTE FUNCTION prevent_audit_modification();
    `);
    
    console.log('✅ Immutability trigger created');
    
    // Verify table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ecta_audit_log'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Table Structure:');
    console.table(tableInfo.rows);
    
    console.log('\n✅ ECTA Audit Log table is ready for use');
    
  } catch (error) {
    console.error('❌ Error creating audit log table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAuditLogTable().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
