import { Pool, PoolClient } from 'pg';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = createLogger('CertificateDownloadService');

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

export class CertificateDownloadService {
  private pool: Pool;
  private storageBasePath: string;

  constructor() {
    this.pool = getPool();
    this.storageBasePath = path.join(process.cwd(), 'storage');
  }

  /**
   * Download certificate PDF
   * Validates user access and logs download event
   */
  public async downloadCertificate(
    certificateId: string,
    userId: string,
    userRole: string,
    exporterId?: string
  ): Promise<Buffer> {
    const client = await this.pool.connect();
    
    try {
      // Get certificate details
      const certResult = await client.query(
        `SELECT c.*, e.exporter_id, aa.approved_by
         FROM esw_certificates c
         JOIN esw_submissions s ON c.submission_id = s.submission_id
         JOIN exports e ON s.export_id = e.export_id
         JOIN esw_agency_approvals aa ON c.approval_id = aa.approval_id
         WHERE c.certificate_id = $1`,
        [certificateId]
      );

      if (certResult.rows.length === 0) {
        throw new Error('Certificate not found');
      }

      const certificate = certResult.rows[0];

      // Check if certificate is revoked
      if (certificate.status === 'REVOKED') {
        throw new Error('Certificate has been revoked and cannot be downloaded');
      }

      // Validate user access
      // Exporter owns submission OR agency officer created certificate OR agency user
      const hasAccess = 
        (userRole === 'exporter' && exporterId === certificate.exporter_id) ||
        (userRole === 'agency_officer' && userId === certificate.approved_by) ||
        userRole === 'AGENCY_USER' ||  // Agency users can download certificates
        userRole === 'AGENCY_ADMIN' ||  // Agency admins can download certificates
        userRole === 'admin' ||
        userRole === 'supervisor';

      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to download this certificate');
      }

      // Read PDF file from storage
      const filePath = path.join(this.storageBasePath, certificate.file_path);
      const pdfBuffer = await fs.readFile(filePath);

      // Log download event to audit log
      await this.logDownloadEvent(certificateId, userId, client);

      logger.info('Certificate downloaded', {
        certificateId,
        userId,
        certificateNumber: certificate.certificate_number
      });

      return pdfBuffer;
    } finally {
      client.release();
    }
  }

  /**
   * Get certificate metadata
   */
  public async getCertificateMetadata(
    certificateId: string,
    userId: string,
    userRole: string,
    exporterId?: string
  ): Promise<Certificate> {
    const client = await this.pool.connect();
    
    try {
      // Get certificate details with access validation
      const certResult = await client.query(
        `SELECT c.*, e.exporter_id, aa.approved_by
         FROM esw_certificates c
         JOIN esw_submissions s ON c.submission_id = s.submission_id
         JOIN exports e ON s.export_id = e.export_id
         JOIN esw_agency_approvals aa ON c.approval_id = aa.approval_id
         WHERE c.certificate_id = $1`,
        [certificateId]
      );

      if (certResult.rows.length === 0) {
        throw new Error('Certificate not found');
      }

      const certRow = certResult.rows[0];

      // Validate user access
      const hasAccess = 
        (userRole === 'exporter' && exporterId === certRow.exporter_id) ||
        (userRole === 'agency_officer' && userId === certRow.approved_by) ||
        userRole === 'AGENCY_USER' ||  // Agency users can view certificate metadata
        userRole === 'AGENCY_ADMIN' ||  // Agency admins can view certificate metadata
        userRole === 'admin' ||
        userRole === 'supervisor';

      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to view this certificate');
      }

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

      return certificate;
    } finally {
      client.release();
    }
  }

  /**
   * Get all certificates for a submission
   */
  public async getCertificatesBySubmission(
    submissionId: string,
    userId: string,
    userRole: string,
    exporterId?: string
  ): Promise<Certificate[]> {
    const client = await this.pool.connect();
    
    try {
      // Validate submission access
      const submissionResult = await client.query(
        `SELECT s.*, e.exporter_id
         FROM esw_submissions s
         JOIN exports e ON s.export_id = e.export_id
         WHERE s.submission_id = $1`,
        [submissionId]
      );

      if (submissionResult.rows.length === 0) {
        throw new Error('Submission not found');
      }

      const submission = submissionResult.rows[0];

      // Validate user access to submission
      const hasAccess = 
        (userRole === 'exporter' && exporterId === submission.exporter_id) ||
        userRole === 'agency_officer' ||
        userRole === 'AGENCY_USER' ||  // Added for agency users
        userRole === 'ADMIN' ||         // Added for admin users
        userRole === 'APPROVER' ||      // Added for approver users
        userRole === 'admin' ||
        userRole === 'supervisor';

      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to view certificates for this submission');
      }

      // Get certificates
      let query = `
        SELECT c.*, aa.approved_by
        FROM esw_certificates c
        JOIN esw_agency_approvals aa ON c.approval_id = aa.approval_id
        WHERE c.submission_id = $1
      `;

      // Filter by user role
      // Exporters see all certificates for their submission
      // Agency officers see only certificates they created
      if (userRole === 'agency_officer') {
        query += ` AND aa.approved_by = $2`;
      }

      const params = userRole === 'agency_officer' ? [submissionId, userId] : [submissionId];
      const certResult = await client.query(query, params);

      const certificates: Certificate[] = certResult.rows.map(row => ({
        certificateId: row.certificate_id,
        approvalId: row.approval_id,
        submissionId: row.submission_id,
        agencyCode: row.agency_code,
        certificateNumber: row.certificate_number,
        exporterName: row.exporter_name,
        exporterTin: row.exporter_tin,
        eswReferenceNumber: row.esw_reference_number,
        coffeeType: row.coffee_type,
        quantity: row.quantity,
        originRegion: row.origin_region,
        destinationCountry: row.destination_country,
        approvedBy: row.approved_by,
        approvedAt: row.approved_at,
        issuedAt: row.issued_at,
        validityPeriodDays: row.validity_period_days,
        expiresAt: row.expires_at,
        filePath: row.file_path,
        fileSizeBytes: row.file_size_bytes,
        status: row.status,
        revokedAt: row.revoked_at,
        revokedBy: row.revoked_by,
        revocationReason: row.revocation_reason,
        templateId: row.template_id,
        templateVersion: row.template_version,
        agencySpecificData: row.agency_specific_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return certificates;
    } finally {
      client.release();
    }
  }

  /**
   * Log download event to audit log
   */
  private async logDownloadEvent(
    certificateId: string,
    userId: string,
    client: PoolClient
  ): Promise<void> {
    await client.query(
      `INSERT INTO esw_certificate_audit_log (
        certificate_id, action, performed_by, timestamp
      ) VALUES ($1, 'DOWNLOADED', $2, NOW())`,
      [certificateId, userId]
    );
  }
}

export default new CertificateDownloadService();
