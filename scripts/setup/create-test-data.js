#!/usr/bin/env node

/**
 * Create Test Data Script
 * Populates the database with sample exporters and exports
 * to demonstrate the complete workflow
 */

const http = require('http');
const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

function makeRequest(hostname, port, path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function login(username, password, port) {
  try {
    const response = await makeRequest('localhost', port, '/api/auth/login', 'POST', {
      username,
      password
    });
    
    if (response.statusCode === 200 && response.data.data?.token) {
      return response.data.data.token;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function createTestExports() {
  console.log('\n=== Creating Test Export Data ===\n');
  
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    
    // Get existing exporters
    const exportersResult = await client.query('SELECT exporter_id, business_name FROM exporter_profiles LIMIT 3');
    
    if (exportersResult.rows.length === 0) {
      console.log('❌ No exporters found. Please register exporters first.');
      client.release();
      await pool.end();
      return;
    }
    
    console.log(`✅ Found ${exportersResult.rows.length} exporters`);
    
    // Create sample exports for each exporter
    const statuses = ['PENDING', 'FX_APPROVED', 'QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED', 'SHIPPED'];
    const coffeeTypes = ['Arabica', 'Robusta', 'Sidamo', 'Yirgacheffe', 'Harar'];
    const destinations = ['USA', 'Germany', 'Japan', 'Italy', 'South Korea'];
    
    let createdCount = 0;
    
    for (let i = 0; i < exportersResult.rows.length; i++) {
      const exporter = exportersResult.rows[i];
      
      // Create 2-3 exports per exporter
      const numExports = Math.floor(Math.random() * 2) + 2;
      
      for (let j = 0; j < numExports; j++) {
        const exportId = `EXP-${Date.now()}-${i}-${j}`;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const coffeeType = coffeeTypes[Math.floor(Math.random() * coffeeTypes.length)];
        const destination = destinations[Math.floor(Math.random() * destinations.length)];
        const quantity = Math.floor(Math.random() * 5000) + 1000;
        const pricePerKg = (Math.random() * 10 + 5).toFixed(2);
        const estimatedValue = (quantity * pricePerKg).toFixed(2);
        
        try {
          await client.query('BEGIN');
          
          // Insert export
          await client.query(`
            INSERT INTO exports (
              export_id, exporter_id, exporter_name, coffee_type, quantity,
              destination_country, estimated_value, status,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          `, [
            exportId,
            exporter.exporter_id,
            exporter.business_name,
            coffeeType,
            quantity,
            destination,
            estimatedValue,
            status
          ]);
          
          // Insert status history
          await client.query(`
            INSERT INTO export_status_history (
              export_id, old_status, new_status, changed_by, created_at
            ) VALUES ($1, $2, $3, $4, NOW())
          `, [exportId, 'NONE', status, 'system']);
          
          await client.query('COMMIT');
          
          console.log(`✅ Created export ${exportId} (${status}) for ${exporter.business_name}`);
          createdCount++;
          
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Failed to create export: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✅ Successfully created ${createdCount} test exports`);
    
    // Show summary
    const summaryResult = await client.query(`
      SELECT status, COUNT(*) as count
      FROM exports
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Export Status Summary:');
    console.table(summaryResult.rows);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
    await pool.end();
  }
}

async function createTestExportViaAPI() {
  console.log('\n=== Creating Test Export via API ===\n');
  
  // Login as exporter
  console.log('Logging in as exporter...');
  const token = await login('exporter1', 'password123', 3004);
  
  if (!token) {
    console.log('❌ Login failed. Cannot create export via API.');
    return;
  }
  
  console.log('✅ Login successful');
  
  // Create export request
  const exportData = {
    coffeeType: 'Arabica',
    originRegion: 'Sidamo',
    quantity: 2500,
    destinationCountry: 'USA',
    buyerName: 'Test Coffee Importers Inc',
    buyerCountry: 'USA',
    buyerEmail: 'buyer@testcoffee.com',
    estimatedValue: 25000,
    exportLicenseNumber: 'EL-2024-001',
    competenceCertificateNumber: 'CC-2024-001',
    ecxLotNumber: 'ECX-LOT-001',
    warehouseReceiptNumber: 'WR-001',
    qualityCertificateNumber: 'QC-001',
    salesContractNumber: 'SC-001',
    exportPermitNumber: 'EP-001',
    originCertificateNumber: 'OC-001'
  };
  
  console.log('Creating export request...');
  
  try {
    const response = await makeRequest('localhost', 3004, '/api/exports', 'POST', exportData, token);
    
    if (response.statusCode === 201 || response.statusCode === 200) {
      console.log('✅ Export created successfully via API');
      console.log('Export ID:', response.data.data?.id || response.data.data?.exportId);
    } else {
      console.log('⚠️  Export creation response:', response.statusCode);
      console.log('Message:', response.data.message || 'Unknown error');
      if (response.data.reason) {
        console.log('Reason:', response.data.reason);
      }
    }
  } catch (error) {
    console.error('❌ Failed to create export via API:', error.message);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              Create Test Data for CBC System               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Create test exports directly in database
  await createTestExports();
  
  // Try to create one via API (may fail if pre-qualification not met)
  await createTestExportViaAPI();
  
  console.log('\n✅ Test data creation complete!');
  console.log('\nRun verification again to see the results:');
  console.log('  node comprehensive-verification.js\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
