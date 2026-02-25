/**
 * Property-Based Tests for ESW Certificate Verification
 * Feature: esw-agency-certificates
 * 
 * These tests verify that certificate verification behaves correctly
 * across all possible inputs using property-based testing.
 */

import * as fc from 'fast-check';
import { Pool } from 'pg';
import { CertificateVerificationService } from '../src/services/certificate-verification.service';

const certificateVerificationService = new CertificateVerificationService();

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

// Helper function to create test certificate
async function createTestCertificate(
  agencyCode: string,
  exporterData: any,
  exportDetails: any,
  approvalData: any,
  status: 'ACTIVE' | 'REVOKED' = 'ACTIVE'
): Promise<{ certificateId: string; certificateNumber: string; submissionId: string }> {
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
    
    // Create certificate
    const certificateNumber = `${agencyCode}-CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    const filePath = `certificates/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${certificateNumber}.pdf`;
    
    const certResult = await client.query(
      `INSERT INTO esw_certificates (
        approval_id, submission_id, agency_code, certificate_number,
        exporter_name, exporter_tin, esw_reference_number,
        coffee_type, quantity, origin_region, destination_country,
        approved_by, approved_at, file_path, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, $14)
      RETURNING certificate_id`,
      [
        approvalId, submissionId, agencyCode, certificateNumber,
        exporterData.exporterName, exporterData.exporterTin, eswReferenceNumber,
        exportDetails.coffeeType, exportDetails.quantity, exportDetails.originRegion, exportDetails.destinationCountry,
        approvalData.approvedBy, filePath, status
      ]
    );
    
    const certificateId = certResult.rows[0].certificate_id;
    
    await client.query('COMMIT');
    
    return { certificateId, certificateNumber, submissionId };
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
    
    // Delete audit logs
    await client.query(
      `DELETE FROM esw_certificate_audit_log 
       WHERE certificate_id IN (SELECT certificate_id FROM esw_certificates WHERE submission_id = $1)`,
      [submissionId]
    );
    
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

describe('ESW Certificate Verification - Property-Based Tests', () => {
  afterAll(async () => {
    await pool.end();
  });
  
  /**
   * Feature: esw-agency-certificates, Property 12: Verification Endpoint Response
   * Validates: Requirements 5.2, 5.3
   * 
   * For any valid certificate number, the verification endpoint should return
   * certificate details and confirm authenticity.
   */
  test('Property 12: Verification endpoint returns correct response for valid certificates', async () => {
    await fc.assert(
      fc.asyncProperty(
        agencyCodeArb,
        exporterDataArb,
        exportDetailsArb,
        approvalDataArb,
        async (agencyCode, exporterData, exportDetails, approvalData) => {
          let submissionId: string | null = null;
          
          try {
            // Create test certificate
            const testData = await createTestCertificate(
              agencyCode,
              exporterData,
              exportDetails,
              approvalData,
              'ACTIVE'
            );
            submissionId = testData.submissionId;
            const certificateNumber = testData.certificateNumber;
            
            // Verify certificate
            const verificationResult = await certificateVerificationService.verifyCertificate(certificateNumber);
            
            // Verify response structure
            expect(verificationResult).toBeDefined();
            expect(verificationResult.isValid).toBe(true);
            expect(verificationResult.status).toBe('VALID');
            expect(verificationResult.message).toBeDefined();
            expect(verificationResult.verifiedAt).toBeDefined();
            expect(verificationResult.certificate).toBeDefined();
            
            // Verify certificate details
            expect(verificationResult.certificate?.certificateNumber).toBe(certificateNumber);
            expect(verificationResult.certificate?.agencyCode).toBe(agencyCode);
            expect(verificationResult.certificate?.exporterName).toBe(exporterData.exporterName);
            expect(verificationResult.certificate?.exporterTin).toBe(exporterData.exporterTin);
            expect(verificationResult.certificate?.status).toBe('ACTIVE');
            
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
   * Feature: esw-agency-certificates, Property 12: Verification Endpoint Response (NOT_FOUND)
   * Validates: Requirements 5.2, 5.3
   * 
   * For any invalid certificate number, the verification endpoint should return
   * NOT_FOUND status.
   */
  test('Property 12: Verification endpoint returns NOT_FOUND for invalid certificates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }).filter(s => !s.includes('CERT')),
        async (invalidCertNumber) => {
          // Verify non-existent certificate
          const verificationResult = await certificateVerificationService.verifyCertificate(invalidCertNumber);
          
          // Verify response structure
          expect(verificationResult).toBeDefined();
          expect(verificationResult.isValid).toBe(false);
          expect(verificationResult.status).toBe('NOT_FOUND');
          expect(verificationResult.message).toBeDefined();
          expect(verificationResult.verifiedAt).toBeDefined();
          expect(verificationResult.certificate).toBeUndefined();
        }
      ),
      { numRuns: 10 } // Reduced for faster test execution
    );
  }, 30000); // 30 second timeout for property test
  
  /**
   * Feature: esw-agency-certificates, Property 13: Revoked Certificate Verification
   * Validates: Requirements 5.4
   * 
   * For any revoked certificate, the verification endpoint should display REVOKED status.
   */
  test('Property 13: Verification endpoint returns REVOKED for revoked certificates', async () => {
    await fc.assert(
      fc.asyncProperty(
        agencyCodeArb,
        exporterDataArb,
        exportDetailsArb,
        approvalDataArb,
        async (agencyCode, exporterData, exportDetails, approvalData) => {
          let submissionId: string | null = null;
          
          try {
            // Create test certificate with REVOKED status
            const testData = await createTestCertificate(
              agencyCode,
              exporterData,
              exportDetails,
              approvalData,
              'REVOKED'
            );
            submissionId = testData.submissionId;
            const certificateNumber = testData.certificateNumber;
            
            // Verify certificate
            const verificationResult = await certificateVerificationService.verifyCertificate(certificateNumber);
            
            // Verify response structure
            expect(verificationResult).toBeDefined();
            expect(verificationResult.isValid).toBe(false);
            expect(verificationResult.status).toBe('REVOKED');
            expect(verificationResult.message).toBeDefined();
            expect(verificationResult.message).toContain('revoked');
            expect(verificationResult.verifiedAt).toBeDefined();
            expect(verificationResult.certificate).toBeDefined();
            
            // Verify certificate details
            expect(verificationResult.certificate?.certificateNumber).toBe(certificateNumber);
            expect(verificationResult.certificate?.status).toBe('REVOKED');
            
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
   * Feature: esw-agency-certificates, Property 14: Verification Audit Logging
   * Validates: Requirements 5.5
   * 
   * For any certificate verification attempt, an audit log entry should be created
   * with timestamp, IP address, and certificate number.
   */
  test('Property 14: Verification attempts are logged to audit log', async () => {
    await fc.assert(
      fc.asyncProperty(
        agencyCodeArb,
        exporterDataArb,
        exportDetailsArb,
        approvalDataArb,
        fc.ipV4(),
        fc.string({ minLength: 10, maxLength: 200 }),
        async (agencyCode, exporterData, exportDetails, approvalData, ipAddress, userAgent) => {
          let submissionId: string | null = null;
          
          try {
            // Create test certificate
            const testData = await createTestCertificate(
              agencyCode,
              exporterData,
              exportDetails,
              approvalData,
              'ACTIVE'
            );
            submissionId = testData.submissionId;
            const certificateNumber = testData.certificateNumber;
            const certificateId = testData.certificateId;
            
            // Log verification attempt
            await certificateVerificationService.logVerificationAttempt(
              certificateNumber,
              ipAddress,
              userAgent,
              { testRun: true }
            );
            
            // Verify audit log entry was created
            const auditResult = await pool.query(
              `SELECT * FROM esw_certificate_audit_log 
               WHERE certificate_id = $1 AND action = 'VERIFIED'
               ORDER BY timestamp DESC LIMIT 1`,
              [certificateId]
            );
            
            expect(auditResult.rows.length).toBeGreaterThan(0);
            
            const auditEntry = auditResult.rows[0];
            expect(auditEntry.certificate_id).toBe(certificateId);
            expect(auditEntry.action).toBe('VERIFIED');
            expect(auditEntry.ip_address).toBe(ipAddress);
            expect(auditEntry.user_agent).toBe(userAgent);
            expect(auditEntry.timestamp).toBeDefined();
            expect(auditEntry.metadata).toBeDefined();
            
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
   * Test that verification works for all agency codes
   */
  test('Verification works for certificates from all agencies', async () => {
    const submissionIds: string[] = [];
    
    try {
      for (const agencyCode of VALID_AGENCY_CODES) {
        // Create test certificate
        const testData = await createTestCertificate(
          agencyCode,
          {
            exporterName: 'Test Exporter',
            exporterTin: '1234567890',
            businessName: 'Test Business'
          },
          {
            coffeeType: 'Arabica',
            quantity: 1000,
            originRegion: 'Sidamo',
            destinationCountry: 'USA'
          },
          {
            approvedBy: 'Test Officer',
            approvalNotes: null
          },
          'ACTIVE'
        );
        
        submissionIds.push(testData.submissionId);
        const certificateNumber = testData.certificateNumber;
        
        // Verify certificate
        const verificationResult = await certificateVerificationService.verifyCertificate(certificateNumber);
        
        expect(verificationResult.isValid).toBe(true);
        expect(verificationResult.status).toBe('VALID');
        expect(verificationResult.certificate?.agencyCode).toBe(agencyCode);
      }
    } finally {
      // Cleanup all test data
      for (const submissionId of submissionIds) {
        await cleanupTestData(submissionId);
      }
    }
  }, 60000); // 60 second timeout
  
  /**
   * Test that verification handles expired certificates
   */
  test('Verification returns EXPIRED for expired certificates', async () => {
    let submissionId: string | null = null;
    
    try {
      // Create test certificate
      const testData = await createTestCertificate(
        'ECTA',
        {
          exporterName: 'Test Exporter',
          exporterTin: '1234567890',
          businessName: 'Test Business'
        },
        {
          coffeeType: 'Arabica',
          quantity: 1000,
          originRegion: 'Sidamo',
          destinationCountry: 'USA'
        },
        {
          approvedBy: 'Test Officer',
          approvalNotes: null
        },
        'ACTIVE'
      );
      
      submissionId = testData.submissionId;
      const certificateNumber = testData.certificateNumber;
      const certificateId = testData.certificateId;
      
      // Set expiration date to past
      await pool.query(
        `UPDATE esw_certificates 
         SET expires_at = NOW() - INTERVAL '1 day', validity_period_days = 30
         WHERE certificate_id = $1`,
        [certificateId]
      );
      
      // Verify certificate
      const verificationResult = await certificateVerificationService.verifyCertificate(certificateNumber);
      
      expect(verificationResult.isValid).toBe(false);
      expect(verificationResult.status).toBe('EXPIRED');
      expect(verificationResult.message).toContain('expired');
      
    } finally {
      // Cleanup
      if (submissionId) {
        await cleanupTestData(submissionId);
      }
    }
  }, 30000); // 30 second timeout
});
