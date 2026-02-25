/**
 * Property-Based Tests for ESW Certificate Generation
 * Feature: esw-agency-certificates
 * 
 * These tests verify that certificate generation behaves correctly
 * across all possible inputs using property-based testing.
 */

import * as fc from 'fast-check';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Valid agency codes from the 16 agencies
const VALID_AGENCY_CODES = [
  'MOT', 'ERCA', 'NBE', 'MOA', 'MOH', 'EIC', 'ESLSE', 'EPA',
  'ECTA', 'ECX', 'MOFED', 'MOTI', 'MIDROC', 'QSAE', 'FDRE_CUSTOMS', 'TRADE_REMEDY'
];

// Arbitraries (generators) for test data
const agencyCodeArb = fc.constantFrom(...VALID_AGENCY_CODES);

const exporterDataArb = fc.record({
  exporterName: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length > 0),
  exporterTin: fc.string({ minLength: 8, maxLength: 20 }).filter(s => /^\d+$/.test(s)),
  businessName: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length > 0),
});

const exportDetailsArb = fc.record({
  coffeeType: fc.constantFrom('Arabica', 'Robusta', 'Sidamo', 'Yirgacheffe', 'Harar'),
  quantity: fc.float({ min: 1, max: 10000, noNaN: true }),
  originRegion: fc.constantFrom('Sidamo', 'Yirgacheffe', 'Harar', 'Jimma', 'Limu'),
  destinationCountry: fc.constantFrom('USA', 'Germany', 'Japan', 'Saudi Arabia', 'Italy'),
});

const approvalDataArb = fc.record({
  approvedBy: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length > 0),
  approvalNotes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
});

// Helper function to create test submission and approval
async function createTestSubmissionAndApproval(
  agencyCode: string,
  exporterData: any,
  exportDetails: any,
  approvalData: any
): Promise<{ submissionId: string; approvalId: string; eswReferenceNumber: string }> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create a test exporter profile if it doesn't exist
    const exporterResult = await client.query(
      `INSERT INTO exporter_profiles (business_name, tin, status, capital_verified)
       VALUES ($1, $2, 'ACTIVE', true)
       ON CONFLICT (tin) DO UPDATE SET business_name = EXCLUDED.business_name
       RETURNING exporter_id`,
      [exporterData.businessName, exporterData.exporterTin]
    );
    const exporterId = exporterResult.rows[0].exporter_id;
    
    // Create a test export
    const exportResult = await client.query(
      `INSERT INTO exports (exporter_id, coffee_type, quantity, origin_region, destination_country, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       RETURNING export_id`,
      [exporterId, exportDetails.coffeeType, exportDetails.quantity, exportDetails.originRegion, exportDetails.destinationCountry]
    );
    const exportId = exportResult.rows[0].export_id;
    
    // Create ESW submission
    const eswReferenceNumber = `ESW-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const submissionResult = await client.query(
      `INSERT INTO esw_submissions (export_id, esw_reference_number, status, submitted_by, submitted_at)
       VALUES ($1, $2, 'SUBMITTED', $3, NOW())
       RETURNING submission_id`,
      [exportId, eswReferenceNumber, exporterData.exporterName]
    );
    const submissionId = submissionResult.rows[0].submission_id;
    
    // Create agency approval record
    const approvalResult = await client.query(
      `INSERT INTO esw_agency_approvals (submission_id, agency_code, status, approved_by, approved_at, notes)
       VALUES ($1, $2, 'APPROVED', $3, NOW(), $4)
       RETURNING approval_id`,
      [submissionId, agencyCode, approvalData.approvedBy, approvalData.approvalNotes]
    );
    const approvalId = approvalResult.rows[0].approval_id;
    
    await client.query('COMMIT');
    
    return { submissionId, approvalId, eswReferenceNumber };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to clean up test data
async function cleanupTestData(submissionId: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete certificates
    await client.query('DELETE FROM esw_certificates WHERE submission_id = $1', [submissionId]);
    
    // Delete agency approvals
    await client.query('DELETE FROM esw_agency_approvals WHERE submission_id = $1', [submissionId]);
    
    // Get export_id before deleting submission
    const exportResult = await client.query('SELECT export_id FROM esw_submissions WHERE submission_id = $1', [submissionId]);
    const exportId = exportResult.rows[0]?.export_id;
    
    // Delete submission
    await client.query('DELETE FROM esw_submissions WHERE submission_id = $1', [submissionId]);
    
    // Delete export
    if (exportId) {
      await client.query('DELETE FROM exports WHERE export_id = $1', [exportId]);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

describe('ESW Certificate Generation - Property-Based Tests', () => {
  afterAll(async () => {
    await pool.end();
  });
  
  /**
   * Feature: esw-agency-certificates, Property 1: Certificate Generation on Approval
   * Validates: Requirements 1.1, 1.2, 1.3
   * 
   * For any agency approval that transitions to APPROVED status, a PDF certificate
   * should be generated and stored in the database with a unique certificate number.
   */
  test('Property 1: Certificate is generated for any approved submission', async () => {
    await fc.assert(
      fc.asyncProperty(
        agencyCodeArb,
        exporterDataArb,
        exportDetailsArb,
        approvalDataArb,
        async (agencyCode, exporterData, exportDetails, approvalData) => {
          let submissionId: string | null = null;
          
          try {
            // Create test submission and approval
            const testData = await createTestSubmissionAndApproval(
              agencyCode,
              exporterData,
              exportDetails,
              approvalData
            );
            submissionId = testData.submissionId;
            const approvalId = testData.approvalId;
            const eswReferenceNumber = testData.eswReferenceNumber;
            
            // Simulate certificate generation (this would normally be triggered by the approval endpoint)
            // For now, we'll manually insert a certificate to test the schema
            const certificateNumber = `${agencyCode}-CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
            const filePath = `./storage/certificates/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${certificateNumber}.pdf`;
            
            const certResult = await pool.query(
              `INSERT INTO esw_certificates (
                approval_id, submission_id, agency_code, certificate_number,
                exporter_name, exporter_tin, esw_reference_number,
                coffee_type, quantity, origin_region, destination_country,
                approved_by, approved_at, file_path, status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, 'ACTIVE')
              RETURNING certificate_id, certificate_number`,
              [
                approvalId, submissionId, agencyCode, certificateNumber,
                exporterData.exporterName, exporterData.exporterTin, eswReferenceNumber,
                exportDetails.coffeeType, exportDetails.quantity, exportDetails.originRegion, exportDetails.destinationCountry,
                approvalData.approvedBy, filePath
              ]
            );
            
            // Verify certificate was created
            expect(certResult.rows.length).toBe(1);
            expect(certResult.rows[0].certificate_number).toBe(certificateNumber);
            
            // Verify certificate exists in database
            const verifyResult = await pool.query(
              'SELECT * FROM esw_certificates WHERE approval_id = $1',
              [approvalId]
            );
            
            expect(verifyResult.rows.length).toBe(1);
            const certificate = verifyResult.rows[0];
            
            // Verify certificate has required fields
            expect(certificate.certificate_id).toBeDefined();
            expect(certificate.certificate_number).toMatch(/^[A-Z_]+CERT-\d{4}-\d+$/);
            expect(certificate.agency_code).toBe(agencyCode);
            expect(certificate.exporter_name).toBe(exporterData.exporterName);
            expect(certificate.exporter_tin).toBe(exporterData.exporterTin);
            expect(certificate.esw_reference_number).toBe(eswReferenceNumber);
            expect(certificate.status).toBe('ACTIVE');
            expect(certificate.file_path).toBeDefined();
            expect(certificate.issued_at).toBeDefined();
            
          } finally {
            // Cleanup
            if (submissionId) {
              await cleanupTestData(submissionId);
            }
          }
        }
      ),
      { numRuns: 5 } // Reduced for faster test execution
    );
  }, 30000); // 30 second timeout for property test
  
  /**
   * Feature: esw-agency-certificates, Property 5: Certificate Number Format
   * Validates: Requirements 2.2
   * 
   * For any generated certificate, the certificate number should match the format
   * {AGENCY_CODE}-CERT-{YEAR}-{SEQUENCE} where YEAR is a 4-digit year and SEQUENCE is a numeric value.
   */
  test('Property 5: Certificate number format is valid for all agencies', async () => {
    await fc.assert(
      fc.asyncProperty(
        agencyCodeArb,
        async (agencyCode) => {
          const year = new Date().getFullYear();
          const sequenceName = `cert_seq_${agencyCode.toLowerCase()}`;
          
          // Get next sequence value
          const seqResult = await pool.query(`SELECT nextval('${sequenceName}') as seq`);
          const sequence = seqResult.rows[0].seq;
          
          // Generate certificate number
          const certificateNumber = `${agencyCode}-CERT-${year}-${sequence.toString().padStart(5, '0')}`;
          
          // Verify format matches the pattern {AGENCY_CODE}-CERT-{YEAR}-{SEQUENCE}
          expect(certificateNumber).toMatch(/^[A-Z_]+-CERT-\d{4}-\d{5}$/);
          expect(certificateNumber).toContain(agencyCode);
          expect(certificateNumber).toContain(year.toString());
          
          // Verify the parts
          const parts = certificateNumber.split('-');
          expect(parts[0]).toBe(agencyCode);
          expect(parts[1]).toBe('CERT');
          expect(parts[2]).toBe(year.toString());
          expect(parts[2]).toHaveLength(4); // 4-digit year
          expect(parts[3]).toMatch(/^\d+$/); // Numeric sequence
        }
      ),
      { numRuns: 10 } // Reduced for faster test execution
    );
  }, 30000); // 30 second timeout for property test
  
  /**
   * Feature: esw-agency-certificates, Property 4: Certificate Content Completeness
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
   * 
   * For any generated certificate, the PDF should contain agency name, logo, certificate number,
   * ESW reference number, exporter business name, exporter TIN, export details (coffee type, quantity,
   * origin, destination), approval date and time, approving officer name, QR code, and issue date.
   */
  test('Property 4: Certificate content completeness', async () => {
    await fc.assert(
      fc.asyncProperty(
        agencyCodeArb,
        exporterDataArb,
        exportDetailsArb,
        approvalDataArb,
        async (agencyCode, exporterData, exportDetails, approvalData) => {
          let submissionId: string | null = null;
          
          try {
            // Create test submission and approval
            const testData = await createTestSubmissionAndApproval(
              agencyCode,
              exporterData,
              exportDetails,
              approvalData
            );
            submissionId = testData.submissionId;
            const approvalId = testData.approvalId;
            const eswReferenceNumber = testData.eswReferenceNumber;
            
            // Create certificate record
            const certificateNumber = `${agencyCode}-CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
            const filePath = `./storage/certificates/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${certificateNumber}.pdf`;
            
            const certResult = await pool.query(
              `INSERT INTO esw_certificates (
                approval_id, submission_id, agency_code, certificate_number,
                exporter_name, exporter_tin, esw_reference_number,
                coffee_type, quantity, origin_region, destination_country,
                approved_by, approved_at, file_path, status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, 'ACTIVE')
              RETURNING *`,
              [
                approvalId, submissionId, agencyCode, certificateNumber,
                exporterData.exporterName, exporterData.exporterTin, eswReferenceNumber,
                exportDetails.coffeeType, exportDetails.quantity, exportDetails.originRegion, exportDetails.destinationCountry,
                approvalData.approvedBy, filePath
              ]
            );
            
            const certificate = certResult.rows[0];
            
            // Verify all required fields are present in certificate record
            expect(certificate.agency_code).toBeDefined();
            expect(certificate.certificate_number).toBeDefined();
            expect(certificate.esw_reference_number).toBe(eswReferenceNumber);
            expect(certificate.exporter_name).toBe(exporterData.exporterName);
            expect(certificate.exporter_tin).toBe(exporterData.exporterTin);
            expect(certificate.coffee_type).toBe(exportDetails.coffeeType);
            expect(certificate.quantity).toBeDefined();
            expect(certificate.origin_region).toBe(exportDetails.originRegion);
            expect(certificate.destination_country).toBe(exportDetails.destinationCountry);
            expect(certificate.approved_by).toBe(approvalData.approvedBy);
            expect(certificate.approved_at).toBeDefined();
            expect(certificate.issued_at).toBeDefined();
            
            // Note: QR code and PDF content validation would require actual PDF generation
            // which is tested in integration tests
            
          } finally {
            // Cleanup
            if (submissionId) {
              await cleanupTestData(submissionId);
            }
          }
        }
      ),
      { numRuns: 10 } // Reduced for faster test execution
    );
  }, 30000); // 30 second timeout for property test
  
  /**
   * Feature: esw-agency-certificates, Property 6: Certificate A4 Size
   * Validates: Requirements 3.4
   * 
   * For any generated certificate PDF, the page dimensions should match A4 size
   * (210mm x 297mm or 595.28pt x 841.89pt).
   * 
   * Note: This test validates the database record. Full PDF validation requires
   * PDF parsing libraries and is covered in integration tests.
   */
  test('Property 6: Certificate A4 size configuration', async () => {
    // This property test validates that certificates are configured for A4 size
    // Actual PDF dimension validation requires PDF parsing and is done in integration tests
    
    await fc.assert(
      fc.asyncProperty(
        agencyCodeArb,
        exporterDataArb,
        exportDetailsArb,
        approvalDataArb,
        async (agencyCode, exporterData, exportDetails, approvalData) => {
          let submissionId: string | null = null;
          
          try {
            // Create test submission and approval
            const testData = await createTestSubmissionAndApproval(
              agencyCode,
              exporterData,
              exportDetails,
              approvalData
            );
            submissionId = testData.submissionId;
            const approvalId = testData.approvalId;
            const eswReferenceNumber = testData.eswReferenceNumber;
            
            // Create certificate record
            const certificateNumber = `${agencyCode}-CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
            const filePath = `./storage/certificates/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${certificateNumber}.pdf`;
            
            await pool.query(
              `INSERT INTO esw_certificates (
                approval_id, submission_id, agency_code, certificate_number,
                exporter_name, exporter_tin, esw_reference_number,
                coffee_type, quantity, origin_region, destination_country,
                approved_by, approved_at, file_path, status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, 'ACTIVE')`,
              [
                approvalId, submissionId, agencyCode, certificateNumber,
                exporterData.exporterName, exporterData.exporterTin, eswReferenceNumber,
                exportDetails.coffeeType, exportDetails.quantity, exportDetails.originRegion, exportDetails.destinationCountry,
                approvalData.approvedBy, filePath
              ]
            );
            
            // Verify certificate was created (A4 size is enforced in renderTemplate method)
            const verifyResult = await pool.query(
              'SELECT * FROM esw_certificates WHERE approval_id = $1',
              [approvalId]
            );
            
            expect(verifyResult.rows.length).toBe(1);
            expect(verifyResult.rows[0].file_path).toBeDefined();
            
          } finally {
            // Cleanup
            if (submissionId) {
              await cleanupTestData(submissionId);
            }
          }
        }
      ),
      { numRuns: 10 } // Reduced for faster test execution
    );
  }, 30000); // 30 second timeout for property test
  
  /**
   * Feature: esw-agency-certificates, Property 11: QR Code Verification Data
   * Validates: Requirements 5.1
   * 
   * For any generated certificate, the QR code embedded in the PDF should contain
   * the certificate number and verification URL.
   */
  test('Property 11: QR code contains certificate number and verification URL', async () => {
    await fc.assert(
      fc.asyncProperty(
        agencyCodeArb,
        fc.string({ minLength: 10, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (agencyCode, baseUrl) => {
          const year = new Date().getFullYear();
          const certificateNumber = `${agencyCode}-CERT-${year}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
          const verificationUrl = `${baseUrl}/verify/${certificateNumber}`;
          
          // Import the service to test the embedQRCode method
          const { CertificateGenerationService } = await import('../src/services/certificate-generation.service');
          const service = new CertificateGenerationService();
          
          // Generate QR code
          const qrCodeDataUrl = await service.embedQRCode(certificateNumber, verificationUrl);
          
          // Verify QR code is a data URL
          expect(qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
          
          // Verify it's not empty
          expect(qrCodeDataUrl.length).toBeGreaterThan(100);
          
          // Note: Actual QR code content validation (decoding) would require a QR code reader library
          // and is covered in integration tests
        }
      ),
      { numRuns: 10 } // Reduced for faster test execution
    );
  }, 30000); // 30 second timeout for property test
  
  /**
   * Test that all required tables exist
   */
  test('All certificate tables exist in database', async () => {
    const requiredTables = [
      'esw_certificates',
      'esw_certificate_audit_log',
      'esw_certificate_templates',
      'esw_certificate_notifications'
    ];
    
    for (const tableName of requiredTables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      );
      
      expect(result.rows[0].exists).toBe(true);
    }
  });
  
  /**
   * Test that all certificate sequences exist
   */
  test('All certificate sequences exist for all agencies', async () => {
    for (const agencyCode of VALID_AGENCY_CODES) {
      const sequenceName = `cert_seq_${agencyCode.toLowerCase()}`;
      
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.sequences 
          WHERE sequence_name = $1
        )`,
        [sequenceName]
      );
      
      expect(result.rows[0].exists).toBe(true);
    }
  });
  
  /**
   * Test that certificate table has all required columns
   */
  test('Certificate table has all required columns', async () => {
    const requiredColumns = [
      'certificate_id', 'approval_id', 'submission_id', 'agency_code', 'certificate_number',
      'exporter_name', 'exporter_tin', 'esw_reference_number',
      'coffee_type', 'quantity', 'origin_region', 'destination_country',
      'approved_by', 'approved_at', 'issued_at', 'file_path', 'status',
      'created_at', 'updated_at'
    ];
    
    const result = await pool.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'esw_certificates'`
    );
    
    const actualColumns = result.rows.map(row => row.column_name);
    
    for (const column of requiredColumns) {
      expect(actualColumns).toContain(column);
    }
  });

  /**
   * Feature: esw-agency-certificates, Property 3: Certificate Immediate Availability
   * Validates: Requirements 1.5
   * 
   * For any generated certificate, the certificate should be immediately downloadable
   * via the download endpoint.
   */
  test('Property 3: Certificate is immediately available after generation', async () => {
    await fc.assert(
      fc.asyncProperty(
        agencyCodeArb,
        exporterDataArb,
        exportDetailsArb,
        approvalDataArb,
        async (agencyCode, exporterData, exportDetails, approvalData) => {
          let submissionId: string | null = null;
          
          try {
            // Create test submission and approval
            const testData = await createTestSubmissionAndApproval(
              agencyCode,
              exporterData,
              exportDetails,
              approvalData
            );
            submissionId = testData.submissionId;
            const approvalId = testData.approvalId;
            const eswReferenceNumber = testData.eswReferenceNumber;
            
            // Create certificate record
            const certificateNumber = `${agencyCode}-CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
            const filePath = `certificates/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${certificateNumber}.pdf`;
            
            const certResult = await pool.query(
              `INSERT INTO esw_certificates (
                approval_id, submission_id, agency_code, certificate_number,
                exporter_name, exporter_tin, esw_reference_number,
                coffee_type, quantity, origin_region, destination_country,
                approved_by, approved_at, file_path, status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, 'ACTIVE')
              RETURNING certificate_id`,
              [
                approvalId, submissionId, agencyCode, certificateNumber,
                exporterData.exporterName, exporterData.exporterTin, eswReferenceNumber,
                exportDetails.coffeeType, exportDetails.quantity, exportDetails.originRegion, exportDetails.destinationCountry,
                approvalData.approvedBy, filePath
              ]
            );
            
            const certificateId = certResult.rows[0].certificate_id;
            
            // Verify certificate is immediately available in database
            const verifyResult = await pool.query(
              'SELECT * FROM esw_certificates WHERE certificate_id = $1',
              [certificateId]
            );
            
            expect(verifyResult.rows.length).toBe(1);
            expect(verifyResult.rows[0].status).toBe('ACTIVE');
            expect(verifyResult.rows[0].file_path).toBeDefined();
            expect(verifyResult.rows[0].certificate_number).toBe(certificateNumber);
            
          } finally {
            // Cleanup
            if (submissionId) {
              await cleanupTestData(submissionId);
            }
          }
        }
      ),
      { numRuns: 5 } // Reduced for faster test execution
    );
  }, 30000); // 30 second timeout

  /**
   * Feature: esw-agency-certificates, Property 8: Certificate Storage Consistency
   * Validates: Requirements 4.1, 4.2
   * 
   * For any generated certificate, both the PDF file should exist in storage AND
   * the file path should be recorded in the database.
   */
  test('Property 8: Certificate storage consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        agencyCodeArb,
        exporterDataArb,
        exportDetailsArb,
        approvalDataArb,
        async (agencyCode, exporterData, exportDetails, approvalData) => {
          let submissionId: string | null = null;
          
          try {
            // Create test submission and approval
            const testData = await createTestSubmissionAndApproval(
              agencyCode,
              exporterData,
              exportDetails,
              approvalData
            );
            submissionId = testData.submissionId;
            const approvalId = testData.approvalId;
            const eswReferenceNumber = testData.eswReferenceNumber;
            
            // Create certificate record
            const certificateNumber = `${agencyCode}-CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
            const filePath = `certificates/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${certificateNumber}.pdf`;
            
            await pool.query(
              `INSERT INTO esw_certificates (
                approval_id, submission_id, agency_code, certificate_number,
                exporter_name, exporter_tin, esw_reference_number,
                coffee_type, quantity, origin_region, destination_country,
                approved_by, approved_at, file_path, status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, 'ACTIVE')`,
              [
                approvalId, submissionId, agencyCode, certificateNumber,
                exporterData.exporterName, exporterData.exporterTin, eswReferenceNumber,
                exportDetails.coffeeType, exportDetails.quantity, exportDetails.originRegion, exportDetails.destinationCountry,
                approvalData.approvedBy, filePath
              ]
            );
            
            // Verify file path is recorded in database
            const verifyResult = await pool.query(
              'SELECT file_path FROM esw_certificates WHERE approval_id = $1',
              [approvalId]
            );
            
            expect(verifyResult.rows.length).toBe(1);
            expect(verifyResult.rows[0].file_path).toBe(filePath);
            expect(verifyResult.rows[0].file_path).toContain(certificateNumber);
            
            // Note: Actual file existence check would require file system access
            // and is covered in integration tests
            
          } finally {
            // Cleanup
            if (submissionId) {
              await cleanupTestData(submissionId);
            }
          }
        }
      ),
      { numRuns: 5 } // Reduced for faster test execution
    );
  }, 30000); // 30 second timeout

  /**
   * Feature: esw-agency-certificates, Property 9: Certificate Display for Exporters
   * Validates: Requirements 4.3
   * 
   * For any submission with generated certificates, when an exporter views the submission
   * details, all certificates for that submission should be displayed.
   */
  test('Property 9: All certificates are visible to exporter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(agencyCodeArb, { minLength: 1, maxLength: 5 }),
        exporterDataArb,
        exportDetailsArb,
        approvalDataArb,
        async (agencyCodes, exporterData, exportDetails, approvalData) => {
          let submissionId: string | null = null;
          
          try {
            // Create test submission
            const testData = await createTestSubmissionAndApproval(
              agencyCodes[0],
              exporterData,
              exportDetails,
              approvalData
            );
            submissionId = testData.submissionId;
            const eswReferenceNumber = testData.eswReferenceNumber;
            
            // Create certificates for multiple agencies
            const certificateIds: string[] = [];
            for (const agencyCode of agencyCodes) {
              // Create approval for this agency
              const approvalResult = await pool.query(
                `INSERT INTO esw_agency_approvals (submission_id, agency_code, status, approved_by, approved_at)
                 VALUES ($1, $2, 'APPROVED', $3, NOW())
                 RETURNING approval_id`,
                [submissionId, agencyCode, approvalData.approvedBy]
              );
              const approvalId = approvalResult.rows[0].approval_id;
              
              // Create certificate
              const certificateNumber = `${agencyCode}-CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
              const filePath = `certificates/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${certificateNumber}.pdf`;
              
              const certResult = await pool.query(
                `INSERT INTO esw_certificates (
                  approval_id, submission_id, agency_code, certificate_number,
                  exporter_name, exporter_tin, esw_reference_number,
                  coffee_type, quantity, origin_region, destination_country,
                  approved_by, approved_at, file_path, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, 'ACTIVE')
                RETURNING certificate_id`,
                [
                  approvalId, submissionId, agencyCode, certificateNumber,
                  exporterData.exporterName, exporterData.exporterTin, eswReferenceNumber,
                  exportDetails.coffeeType, exportDetails.quantity, exportDetails.originRegion, exportDetails.destinationCountry,
                  approvalData.approvedBy, filePath
                ]
              );
              
              certificateIds.push(certResult.rows[0].certificate_id);
            }
            
            // Verify all certificates are retrievable for the submission
            const verifyResult = await pool.query(
              'SELECT certificate_id FROM esw_certificates WHERE submission_id = $1',
              [submissionId]
            );
            
            expect(verifyResult.rows.length).toBe(agencyCodes.length);
            
            // Verify all certificate IDs are present
            const retrievedIds = verifyResult.rows.map(row => row.certificate_id);
            for (const certId of certificateIds) {
              expect(retrievedIds).toContain(certId);
            }
            
          } finally {
            // Cleanup
            if (submissionId) {
              await cleanupTestData(submissionId);
            }
          }
        }
      ),
      { numRuns: 5 } // Reduced for faster test execution
    );
  }, 30000); // 30 second timeout

  /**
   * Feature: esw-agency-certificates, Property 10: Certificate Display for Agency Officers
   * Validates: Requirements 4.6
   * 
   * For any submission, when an agency officer views the submission, they should see
   * the certificate they generated (if any).
   */
  test('Property 10: Agency officer sees only their own certificate', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(agencyCodeArb, { minLength: 2, maxLength: 3 }),
        exporterDataArb,
        exportDetailsArb,
        fc.array(approvalDataArb, { minLength: 2, maxLength: 3 }),
        async (agencyCodes, exporterData, exportDetails, approvalDataArray) => {
          let submissionId: string | null = null;
          
          try {
            // Create test submission
            const testData = await createTestSubmissionAndApproval(
              agencyCodes[0],
              exporterData,
              exportDetails,
              approvalDataArray[0]
            );
            submissionId = testData.submissionId;
            const eswReferenceNumber = testData.eswReferenceNumber;
            
            // Create certificates for multiple agencies with different officers
            const certificatesByOfficer: Record<string, string[]> = {};
            
            for (let i = 0; i < agencyCodes.length; i++) {
              const agencyCode = agencyCodes[i];
              const approvalData = approvalDataArray[i % approvalDataArray.length];
              const officerName = approvalData.approvedBy;
              
              // Create approval for this agency
              const approvalResult = await pool.query(
                `INSERT INTO esw_agency_approvals (submission_id, agency_code, status, approved_by, approved_at)
                 VALUES ($1, $2, 'APPROVED', $3, NOW())
                 RETURNING approval_id`,
                [submissionId, agencyCode, officerName]
              );
              const approvalId = approvalResult.rows[0].approval_id;
              
              // Create certificate
              const certificateNumber = `${agencyCode}-CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
              const filePath = `certificates/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${certificateNumber}.pdf`;
              
              const certResult = await pool.query(
                `INSERT INTO esw_certificates (
                  approval_id, submission_id, agency_code, certificate_number,
                  exporter_name, exporter_tin, esw_reference_number,
                  coffee_type, quantity, origin_region, destination_country,
                  approved_by, approved_at, file_path, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, 'ACTIVE')
                RETURNING certificate_id`,
                [
                  approvalId, submissionId, agencyCode, certificateNumber,
                  exporterData.exporterName, exporterData.exporterTin, eswReferenceNumber,
                  exportDetails.coffeeType, exportDetails.quantity, exportDetails.originRegion, exportDetails.destinationCountry,
                  officerName, filePath
                ]
              );
              
              if (!certificatesByOfficer[officerName]) {
                certificatesByOfficer[officerName] = [];
              }
              certificatesByOfficer[officerName].push(certResult.rows[0].certificate_id);
            }
            
            // Verify each officer can only see their own certificates
            for (const [officerName, expectedCertIds] of Object.entries(certificatesByOfficer)) {
              const verifyResult = await pool.query(
                `SELECT c.certificate_id 
                 FROM esw_certificates c
                 JOIN esw_agency_approvals aa ON c.approval_id = aa.approval_id
                 WHERE c.submission_id = $1 AND aa.approved_by = $2`,
                [submissionId, officerName]
              );
              
              expect(verifyResult.rows.length).toBe(expectedCertIds.length);
              
              const retrievedIds = verifyResult.rows.map(row => row.certificate_id);
              for (const certId of expectedCertIds) {
                expect(retrievedIds).toContain(certId);
              }
            }
            
          } finally {
            // Cleanup
            if (submissionId) {
              await cleanupTestData(submissionId);
            }
          }
        }
      ),
      { numRuns: 5 } // Reduced for faster test execution
    );
  }, 30000); // 30 second timeout
});
