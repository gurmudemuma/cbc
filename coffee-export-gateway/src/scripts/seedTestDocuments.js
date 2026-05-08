/**
 * Seed Test Documents
 * Creates test documents for exporter1 to test download functionality
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function seedTestDocuments() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding test documents...\n');
    
    // Get exporter1's UUID
    const exporterQuery = 'SELECT exporter_id, business_name FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, ['exporter1']);
    
    if (exporterResult.rows.length === 0) {
      console.log('❌ Exporter1 not found. Please run pre-registration first.');
      return;
    }
    
    const exporterUuid = exporterResult.rows[0].exporter_id;
    const businessName = exporterResult.rows[0].business_name;
    
    console.log(`✓ Found exporter: ${businessName} (${exporterUuid})\n`);
    
    // Define test documents to create
    const testDocuments = [
      {
        type: 'EXPORT_LICENSE',
        number: 'EL-2026-TEST-001',
        issuer: 'ECTA',
        issuedBy: 'ECTA Officer',
        expiryDays: 365,
        metadata: {
          licenseType: 'Standard Export License',
          productCategory: 'Coffee',
          annualQuota: 'Unlimited',
          authorizedMarkets: 'All International Markets'
        }
      },
      {
        type: 'QUALITY_CERTIFICATE',
        number: 'QC-2026-TEST-001',
        issuer: 'ECX',
        issuedBy: 'ECX Quality Inspector',
        expiryDays: 90,
        metadata: {
          coffeeType: 'Arabica',
          grade: 'Grade 1',
          cuppingScore: '85',
          screenSize: '15+',
          moistureContent: '11.5%',
          defectCount: '0'
        }
      },
      {
        type: 'CERTIFICATE_OF_ORIGIN',
        number: 'COO-2026-TEST-001',
        issuer: 'ECTA',
        issuedBy: 'ECTA Certification Officer',
        expiryDays: 180,
        metadata: {
          coffeeType: 'Arabica',
          origin: 'Ethiopia',
          geographicalDesignation: 'Ethiopian Highlands',
          quantity: '18000 kg',
          destinationCountry: 'Germany'
        }
      },
      {
        type: 'PHYTOSANITARY_CERTIFICATE',
        number: 'PC-2026-TEST-001',
        issuer: 'MOA',
        issuedBy: 'MOA Plant Inspector',
        expiryDays: 90,
        metadata: {
          inspectionDate: new Date().toISOString().split('T')[0],
          inspectorName: 'MOA Inspector',
          pestStatus: 'Free from quarantine pests',
          treatment: 'None required',
          quantity: '18000 kg'
        }
      },
      {
        type: 'WEIGHT_CERTIFICATE',
        number: 'WC-2026-TEST-001',
        issuer: 'ECX',
        issuedBy: 'ECX Weighing Officer',
        expiryDays: 30,
        metadata: {
          numberOfBags: '300',
          grossWeight: '18300',
          tareWeight: '300',
          netWeight: '18000',
          weighingDate: new Date().toISOString().split('T')[0],
          weighingLocation: 'ECX Warehouse',
          coffeeType: 'Arabica',
          grade: 'Grade 1'
        }
      }
    ];
    
    let created = 0;
    let skipped = 0;
    
    for (const doc of testDocuments) {
      // Check if document already exists
      const checkQuery = `
        SELECT document_id FROM issued_documents 
        WHERE exporter_id = $1 AND document_type = $2 AND status = 'ACTIVE'
      `;
      const checkResult = await client.query(checkQuery, [exporterUuid, doc.type]);
      
      if (checkResult.rows.length > 0) {
        console.log(`⏭️  ${doc.type} already exists, skipping...`);
        skipped++;
        continue;
      }
      
      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + doc.expiryDays);
      
      // Generate document hash
      const crypto = require('crypto');
      const hashData = `${doc.type}-${doc.number}-${exporterUuid}-${Date.now()}`;
      const documentHash = crypto.createHash('sha256').update(hashData).digest('hex');
      
      // Insert document
      const insertQuery = `
        INSERT INTO issued_documents (
          exporter_id,
          document_type,
          document_number,
          document_hash,
          issuer_member_code,
          issued_by,
          issued_at,
          expiry_date,
          status,
          document_metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, 'ACTIVE', $8)
        RETURNING document_id
      `;
      
      const result = await client.query(insertQuery, [
        exporterUuid,
        doc.type,
        doc.number,
        documentHash,
        doc.issuer,
        doc.issuedBy,
        expiryDate,
        JSON.stringify(doc.metadata)
      ]);
      
      console.log(`✓ Created ${doc.type}: ${doc.number} (${result.rows[0].document_id})`);
      created++;
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${testDocuments.length}`);
    console.log(`\n✅ Test documents seeded successfully!`);
    
  } catch (error) {
    console.error('❌ Error seeding test documents:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedTestDocuments()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedTestDocuments };
