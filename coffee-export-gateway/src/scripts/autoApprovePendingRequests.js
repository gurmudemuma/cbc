const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// Valid export document types
const VALID_DOCUMENT_TYPES = [
  'EXPORT_LICENSE',
  'PHYTOSANITARY_CERTIFICATE',
  'HEALTH_CERTIFICATE',
  'FUMIGATION_CERTIFICATE',
  'QUALITY_CERTIFICATE',
  'CERTIFICATE_OF_ORIGIN',
  'BANK_GUARANTEE',
  'SHIPPING_BOOKING',
  'BILL_OF_LADING',
  'CUSTOMS_CLEARANCE',
  'WEIGHT_CERTIFICATE',
  'EXPORT_PERMIT',
  'PAYMENT_GUARANTEE',
  'CARGO_MANIFEST'
];

// Valid network member codes
const VALID_MEMBER_CODES = ['ECTA', 'MOA', 'MOH', 'ECX', 'BANK', 'SHIPPING', 'ERCA', 'CUSTOMS', 'NBE'];

async function autoApprovePendingRequests() {
  const client = await pool.connect();
  
  try {
    console.log('Starting auto-approval of pending document requests...');
    
    // Get all pending requests with valid document types and member codes
    const query = `
      SELECT dr.*, ep.business_name, ep.tin
      FROM document_requests dr
      JOIN exporter_profiles ep ON dr.exporter_id = ep.exporter_id
      WHERE dr.request_status = 'PENDING'
        AND dr.document_type = ANY($1)
        AND dr.network_member_code = ANY($2)
      ORDER BY dr.requested_at
    `;
    
    const result = await client.query(query, [VALID_DOCUMENT_TYPES, VALID_MEMBER_CODES]);
    
    console.log(`Found ${result.rows.length} valid pending requests to process`);
    
    for (const request of result.rows) {
      try {
        console.log(`\nProcessing request ${request.request_id}:`);
        console.log(`  - Document Type: ${request.document_type}`);
        console.log(`  - Network Member: ${request.network_member_code}`);
        console.log(`  - Exporter: ${request.business_name}`);
        
        await client.query('BEGIN');
        
        // Update request to UNDER_REVIEW
        await client.query(
          `UPDATE document_requests 
           SET request_status = 'UNDER_REVIEW', 
               reviewed_at = CURRENT_TIMESTAMP,
               reviewed_by = 'SYSTEM_AUTO_APPROVAL'
           WHERE request_id = $1`,
          [request.request_id]
        );
        
        // Generate document number
        const timestamp = Date.now();
        const docPrefix = {
          'EXPORT_LICENSE': 'EXL',
          'PHYTOSANITARY_CERTIFICATE': 'PHY',
          'HEALTH_CERTIFICATE': 'HLT',
          'FUMIGATION_CERTIFICATE': 'FUM',
          'QUALITY_CERTIFICATE': 'QUA',
          'CERTIFICATE_OF_ORIGIN': 'COO',
          'BANK_GUARANTEE': 'BGT',
          'SHIPPING_BOOKING': 'SHP',
          'CUSTOMS_CLEARANCE': 'CUS',
          'WEIGHT_CERTIFICATE': 'WGT',
          'EXPORT_PERMIT': 'EXP',
          'PAYMENT_GUARANTEE': 'PGT',
          'CARGO_MANIFEST': 'CGO'
        };
        const prefix = docPrefix[request.document_type] || 'DOC';
        const documentNumber = `${prefix}-${timestamp}`;
        
        // Calculate expiry date (1 year from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        // Create document hash
        const hashData = `${documentNumber}-${request.exporter_id}-${request.document_type}-${timestamp}`;
        const documentHash = crypto.createHash('sha256').update(hashData).digest('hex');
        
        // Issue the document
        const issueQuery = `
          INSERT INTO issued_documents (
            request_id,
            exporter_id,
            issuer_member_code,
            document_type,
            document_number,
            document_hash,
            document_metadata,
            issued_at,
            expiry_date,
            status,
            issued_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, 'ACTIVE', 'SYSTEM_AUTO_APPROVAL')
          RETURNING document_id
        `;
        
        const metadata = {
          exporterName: request.business_name,
          exporterTin: request.tin,
          issuanceMethod: 'AUTO_APPROVAL_SCRIPT',
          autoApprovedAt: new Date().toISOString(),
          note: 'Retroactively auto-approved for qualified exporter'
        };
        
        const issueResult = await client.query(issueQuery, [
          request.request_id,
          request.exporter_id,
          request.network_member_code,
          request.document_type,
          documentNumber,
          documentHash,
          JSON.stringify(metadata),
          expiryDate
        ]);
        
        const documentId = issueResult.rows[0].document_id;
        
        // Update request status to ISSUED (no need to store document_id in request)
        await client.query(
          `UPDATE document_requests 
           SET request_status = 'ISSUED'
           WHERE request_id = $1`,
          [request.request_id]
        );
        
        await client.query('COMMIT');
        
        console.log(`  ✓ Issued document ${documentId} (${documentNumber})`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`  ✗ Failed to process request ${request.request_id}:`, error.message);
      }
    }
    
    console.log('\n✓ Auto-approval process completed');
    
  } catch (error) {
    console.error('Auto-approval script error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
autoApprovePendingRequests()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
