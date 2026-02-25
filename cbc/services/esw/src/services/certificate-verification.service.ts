import { Pool, PoolClient } from 'pg';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const logger = createLogger('CertificateVerificationService');

interface Certificate {
  certificateId: string;
  approvalId: string;
  submissionId: string;
  agencyCode: string;
  certificateNumber: string;
  exporterName: string;
  exporterTin: string;
  eswReferenceNumber: string;
  coffeeType?: string;
  quantity?: number;
  originRegion?: string;
  destinationCountry?: string;
  approvedBy: string;
  approvedAt: Date;
  issuedAt: Date;
  validityPeriodDays?: number;
  expiresAt?: Date;
  filePath: string;
  fileSizeBytes?: number;
  status: 'ACTIVE' | 'REVOKED';
  revokedAt?: Date;
  revokedBy?: string;
  revocationReason?: string;
  templateId?: string;
  templateVersion?: number;
  agencySpecificData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface VerificationResult {
  isValid: boolean;
  certificate?: Certificate;
  status: 'VALID' | 'REVOKED' | 'NOT_FOUND' | 'EXPIRED';
  message: string;
  verifiedAt: Date;
}

export class CertificateVerificationService {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  /**
   * Verify certificate by certificate number
   * Checks if certificate exists and is not revoked
   */
  public async verifyCertificate(certificateNumber: string): Promise<VerificationResult> {
    const client = await this.pool.connect();
    
    try {
      // Get certificate details
      const certResult = await client.query(
        `SELECT * FROM esw_certificates WHERE certificate_number = $1`,
        [certificateNumber]
      );

      const verifiedAt = new Date();

      // Certificate not found
      if (certResult.rows.length === 0) {
        logger.info('Certificate verification failed - not found', { certificateNumber });
        
        return {
          isValid: false,
          status: 'NOT_FOUND',
          message: 'Certificate not found in the system',
          verifiedAt
        };
      }

      const certRow = certResult.rows[0];

      // Map database row to Certificate interface
      const certificate: Certificate = {
        certificateId: certRow.certificate_id,
        approvalId: certRow.approval_id,
        submissionId: certRow.submission_id,
        agencyCode: certRow.agency_code,
        certificateNumber: certRow.certificate_number,
        exporterName: certRow.exporter_name,
        exporterTin: certRow.exporter_tin,
        eswReferenceNumber: certRow.esw_reference_number,
        coffeeType: certRow.coffee_type,
        quantity: certRow.quantity,
        originRegion: certRow.origin_region,
        destinationCountry: certRow.destination_country,
        approvedBy: certRow.approved_by,
        approvedAt: certRow.approved_at,
        issuedAt: certRow.issued_at,
        validityPeriodDays: certRow.validity_period_days,
        expiresAt: certRow.expires_at,
        filePath: certRow.file_path,
        fileSizeBytes: certRow.file_size_bytes,
        status: certRow.status,
        revokedAt: certRow.revoked_at,
        revokedBy: certRow.revoked_by,
        revocationReason: certRow.revocation_reason,
        templateId: certRow.template_id,
        templateVersion: certRow.template_version,
        agencySpecificData: certRow.agency_specific_data,
        createdAt: certRow.created_at,
        updatedAt: certRow.updated_at
      };

      // Check if certificate is revoked
      if (certificate.status === 'REVOKED') {
        logger.info('Certificate verification failed - revoked', { 
          certificateNumber,
          revokedAt: certificate.revokedAt,
          revokedBy: certificate.revokedBy
        });
        
        return {
          isValid: false,
          certificate,
          status: 'REVOKED',
          message: `Certificate has been revoked${certificate.revocationReason ? ': ' + certificate.revocationReason : ''}`,
          verifiedAt
        };
      }

      // Check if certificate is expired
      if (certificate.expiresAt && new Date(certificate.expiresAt) < verifiedAt) {
        logger.info('Certificate verification failed - expired', { 
          certificateNumber,
          expiresAt: certificate.expiresAt
        });
        
        return {
          isValid: false,
          certificate,
          status: 'EXPIRED',
          message: `Certificate expired on ${new Date(certificate.expiresAt).toLocaleDateString()}`,
          verifiedAt
        };
      }

      // Certificate is valid
      logger.info('Certificate verification successful', { 
        certificateNumber,
        certificateId: certificate.certificateId
      });
      
      return {
        isValid: true,
        certificate,
        status: 'VALID',
        message: 'Certificate is valid and authentic',
        verifiedAt
      };

    } finally {
      client.release();
    }
  }

  /**
   * Log verification attempt for audit purposes
   * Captures IP address, user agent, and timestamp
   */
  public async logVerificationAttempt(
    certificateNumber: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Get certificate ID if it exists
      const certResult = await client.query(
        `SELECT certificate_id FROM esw_certificates WHERE certificate_number = $1`,
        [certificateNumber]
      );

      const certificateId = certResult.rows.length > 0 ? certResult.rows[0].certificate_id : null;

      // Log verification attempt
      // If certificate doesn't exist, we still log the attempt with null certificate_id
      if (certificateId) {
        await client.query(
          `INSERT INTO esw_certificate_audit_log (
            certificate_id, action, ip_address, user_agent, metadata, timestamp
          ) VALUES ($1, 'VERIFIED', $2, $3, $4, NOW())`,
          [
            certificateId,
            ipAddress || null,
            userAgent || null,
            metadata ? JSON.stringify(metadata) : null
          ]
        );

        logger.info('Verification attempt logged', { 
          certificateNumber,
          certificateId,
          ipAddress
        });
      } else {
        // Log failed verification attempt (certificate not found)
        logger.info('Verification attempt logged (certificate not found)', { 
          certificateNumber,
          ipAddress
        });
      }

    } catch (error: any) {
      // Don't throw error if logging fails - verification should still work
      logger.error('Failed to log verification attempt', { 
        error: error.message,
        certificateNumber
      });
    } finally {
      client.release();
    }
  }
}

export default new CertificateVerificationService();
