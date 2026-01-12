const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

async function checkAuditTable() {
  const client = await pool.connect();
  
  try {
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ecta_audit_log'
      );
    `);
    
    console.log('Table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      const count = await client.query('SELECT COUNT(*) FROM ecta_audit_log');
      console.log('Records:', count.rows[0].count);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

checkAuditTable().catch(console.error);
