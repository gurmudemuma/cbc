import { Pool, PoolClient } from 'pg';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import QRCode from 'qrcode';
import puppeteer from 'puppeteer';

const logger = createLogger('CertificateGenerationService');

interface CertificateData {
  // Agency info
  agencyName: string;
  agencyCode: string;
  agencyLogo?: string;
  agencySeal?: string;

  // Certificate info
  certificateNumber: string;
  issueDate: Date;
  validityPeriod?: string;

  // Exporter info
  exporterName: string;
  exporterTin: string;

  // Export details
  eswReferenceNumber: string;
  coffeeType: string;
  quantity: number;
  originRegion: string;
  destinationCountry: string;

  // Approval info
  approvedBy: string;
  approvalDate: Date;
  officerSignature?: string;

  // Verification
  qrCodeData: string;
  verificationUrl: string;

  // Agency-specific fields
  agencySpecificFields?: Record<string, any>;
}

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

export class CertificateGenerationService {
  private pool: Pool;
  private storageBasePath: string;

  constructor() {
    this.pool = getPool();
    this.storageBasePath = path.join(process.cwd(), 'storage', 'certificates');
  }

  /**
   * Generate certificate for an approval (with provided client for transaction sharing)
   */
  public async generateCertificateWithClient(approvalId: string, client: PoolClient): Promise<Certificate> {
    try {
      // Get approval details with submission and export info
      const approvalResult = await client.query(
        `SELECT 
          aa.approval_id, aa.submission_id, aa.agency_code, aa.agency_name,
          aa.approved_by, aa.approved_at, aa.notes,
          s.esw_reference_number, s.export_id,
          e.coffee_type, e.quantity, e.origin_region, e.destination_country,
          ep.business_name as exporter_name, ep.tin as exporter_tin
         FROM esw_agency_approvals aa
         JOIN esw_submissions s ON aa.submission_id = s.submission_id
         JOIN exports e ON s.export_id = e.export_id
         LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
         WHERE aa.approval_id = $1 AND aa.status = 'APPROVED'`,
        [approvalId]
      );

      if (approvalResult.rows.length === 0) {
        throw new Error('Approval not found or not in APPROVED status');
      }

      const approval = approvalResult.rows[0];

      // Generate certificate number
      const certificateNumber = await this.generateCertificateNumber(approval.agency_code, client);

      // Generate QR code
      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${certificateNumber}`;
      const qrCodeData = await this.embedQRCode(certificateNumber, verificationUrl);

      // Prepare certificate data
      const certificateData: CertificateData = {
        agencyName: approval.agency_name,
        agencyCode: approval.agency_code,
        certificateNumber,
        issueDate: new Date(),
        exporterName: approval.exporter_name,
        exporterTin: approval.exporter_tin,
        eswReferenceNumber: approval.esw_reference_number,
        coffeeType: approval.coffee_type || 'N/A',
        quantity: approval.quantity || 0,
        originRegion: approval.origin_region || 'Ethiopia',
        destinationCountry: approval.destination_country || 'N/A',
        approvedBy: approval.approved_by,
        approvalDate: approval.approved_at,
        qrCodeData,
        verificationUrl
      };

      // Render PDF
      const pdfBuffer = await this.renderTemplate(certificateData);

      // Store certificate using the provided client
      const certificate = await this.storeCertificate(
        pdfBuffer,
        {
          approvalId: approval.approval_id,
          submissionId: approval.submission_id,
          agencyCode: approval.agency_code,
          certificateNumber,
          exporterName: approval.exporter_name,
          exporterTin: approval.exporter_tin,
          eswReferenceNumber: approval.esw_reference_number,
          coffeeType: approval.coffee_type,
          quantity: approval.quantity,
          originRegion: approval.origin_region,
          destinationCountry: approval.destination_country,
          approvedBy: approval.approved_by,
          approvedAt: approval.approved_at
        },
        client
      );

      logger.info('Certificate generated successfully', {
        certificateId: certificate.certificateId,
        certificateNumber,
        approvalId
      });

      return certificate;
    } catch (error: any) {
      logger.error('Failed to generate certificate', { error: error.message, approvalId });
      throw error;
    }
  }

  /**
   * Generate certificate for an approval
   */
  public async generateCertificate(approvalId: string): Promise<Certificate> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get approval details with submission and export info
      const approvalResult = await client.query(
        `SELECT 
          aa.approval_id, aa.submission_id, aa.agency_code, aa.agency_name,
          aa.approved_by, aa.approved_at, aa.notes,
          s.esw_reference_number, s.export_id,
          e.coffee_type, e.quantity, e.origin_region, e.destination_country,
          ep.business_name as exporter_name, ep.tin as exporter_tin
         FROM esw_agency_approvals aa
         JOIN esw_submissions s ON aa.submission_id = s.submission_id
         JOIN exports e ON s.export_id = e.export_id
         LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
         WHERE aa.approval_id = $1 AND aa.status = 'APPROVED'`,
        [approvalId]
      );

      if (approvalResult.rows.length === 0) {
        throw new Error('Approval not found or not in APPROVED status');
      }

      const approval = approvalResult.rows[0];

      // Generate certificate number
      const certificateNumber = await this.generateCertificateNumber(approval.agency_code, client);

      // Generate QR code
      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${certificateNumber}`;
      const qrCodeData = await this.embedQRCode(certificateNumber, verificationUrl);

      // Prepare certificate data
      const certificateData: CertificateData = {
        agencyName: approval.agency_name,
        agencyCode: approval.agency_code,
        certificateNumber,
        issueDate: new Date(),
        exporterName: approval.exporter_name,
        exporterTin: approval.exporter_tin,
        eswReferenceNumber: approval.esw_reference_number,
        coffeeType: approval.coffee_type || 'N/A',
        quantity: approval.quantity || 0,
        originRegion: approval.origin_region || 'Ethiopia',
        destinationCountry: approval.destination_country || 'N/A',
        approvedBy: approval.approved_by,
        approvalDate: approval.approved_at,
        qrCodeData,
        verificationUrl
      };

      // Render PDF (will be implemented in subtask 2.6)
      const pdfBuffer = await this.renderTemplate(certificateData);

      // Store certificate
      const certificate = await this.storeCertificate(
        pdfBuffer,
        {
          approvalId: approval.approval_id,
          submissionId: approval.submission_id,
          agencyCode: approval.agency_code,
          certificateNumber,
          exporterName: approval.exporter_name,
          exporterTin: approval.exporter_tin,
          eswReferenceNumber: approval.esw_reference_number,
          coffeeType: approval.coffee_type,
          quantity: approval.quantity,
          originRegion: approval.origin_region,
          destinationCountry: approval.destination_country,
          approvedBy: approval.approved_by,
          approvedAt: approval.approved_at
        },
        client
      );

      await client.query('COMMIT');

      logger.info('Certificate generated successfully', {
        certificateId: certificate.certificateId,
        certificateNumber,
        approvalId
      });

      return certificate;
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Failed to generate certificate', { error: error.message, approvalId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate unique certificate number using PostgreSQL sequences
   */
  public async generateCertificateNumber(agencyCode: string, client: PoolClient): Promise<string> {
    const year = new Date().getFullYear();
    const sequenceName = `cert_seq_${agencyCode.toLowerCase()}`;

    // Create sequence if it doesn't exist
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS ${sequenceName} START 1
    `);

    // Get next sequence value
    const result = await client.query(`SELECT nextval('${sequenceName}') as seq`);
    const sequence = result.rows[0].seq;

    // Format: {AGENCY_CODE}-CERT-{YEAR}-{SEQUENCE}
    const certificateNumber = `${agencyCode}-CERT-${year}-${sequence.toString().padStart(5, '0')}`;

    return certificateNumber;
  }

  /**
   * Store certificate PDF and create database record
   */
  public async storeCertificate(
    pdfBuffer: Buffer,
    metadata: {
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
      templateId?: string;
      templateVersion?: number;
      agencySpecificData?: Record<string, any>;
    },
    client: PoolClient
  ): Promise<Certificate> {
    // Create storage directory structure: ./storage/certificates/{year}/{month}/
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const dirPath = path.join(this.storageBasePath, year, month);

    await fs.mkdir(dirPath, { recursive: true });

    // Generate unique filename
    const filename = `${metadata.certificateNumber.replace(/\//g, '-')}.pdf`;
    const filePath = path.join(dirPath, filename);

    // Write PDF to file system
    await fs.writeFile(filePath, pdfBuffer);

    // Store relative path for database
    const relativeFilePath = path.join('certificates', year, month, filename);

    // Create database record
    const result = await client.query(
      `INSERT INTO esw_certificates (
        approval_id, submission_id, agency_code, certificate_number,
        exporter_name, exporter_tin, esw_reference_number,
        coffee_type, quantity, origin_region, destination_country,
        approved_by, approved_at, issued_at,
        file_path, file_size_bytes, status,
        template_id, template_version, agency_specific_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14, $15, 'ACTIVE', $16, $17, $18)
      RETURNING *`,
      [
        metadata.approvalId,
        metadata.submissionId,
        metadata.agencyCode,
        metadata.certificateNumber,
        metadata.exporterName,
        metadata.exporterTin,
        metadata.eswReferenceNumber,
        metadata.coffeeType,
        metadata.quantity,
        metadata.originRegion,
        metadata.destinationCountry,
        metadata.approvedBy,
        metadata.approvedAt,
        relativeFilePath,
        pdfBuffer.length,
        metadata.templateId,
        metadata.templateVersion,
        metadata.agencySpecificData ? JSON.stringify(metadata.agencySpecificData) : null
      ]
    );

    const certificate: Certificate = {
      certificateId: result.rows[0].certificate_id,
      approvalId: result.rows[0].approval_id,
      submissionId: result.rows[0].submission_id,
      agencyCode: result.rows[0].agency_code,
      certificateNumber: result.rows[0].certificate_number,
      exporterName: result.rows[0].exporter_name,
      exporterTin: result.rows[0].exporter_tin,
      eswReferenceNumber: result.rows[0].esw_reference_number,
      coffeeType: result.rows[0].coffee_type,
      quantity: result.rows[0].quantity,
      originRegion: result.rows[0].origin_region,
      destinationCountry: result.rows[0].destination_country,
      approvedBy: result.rows[0].approved_by,
      approvedAt: result.rows[0].approved_at,
      issuedAt: result.rows[0].issued_at,
      validityPeriodDays: result.rows[0].validity_period_days,
      expiresAt: result.rows[0].expires_at,
      filePath: result.rows[0].file_path,
      fileSizeBytes: result.rows[0].file_size_bytes,
      status: result.rows[0].status,
      revokedAt: result.rows[0].revoked_at,
      revokedBy: result.rows[0].revoked_by,
      revocationReason: result.rows[0].revocation_reason,
      templateId: result.rows[0].template_id,
      templateVersion: result.rows[0].template_version,
      agencySpecificData: result.rows[0].agency_specific_data,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    return certificate;
  }

  /**
   * Render HTML template to PDF using Puppeteer
   */
  private async renderTemplate(data: CertificateData): Promise<Buffer> {
    // Read the default template
    const templatePath = path.join(__dirname, '../templates/default-certificate.html');
    let templateHtml = await fs.readFile(templatePath, 'utf-8');

    // Replace template variables with actual data
    templateHtml = templateHtml
      .replace(/{{agencyName}}/g, data.agencyName)
      .replace(/{{agencyCode}}/g, data.agencyCode)
      .replace(/{{certificateNumber}}/g, data.certificateNumber)
      .replace(/{{exporterName}}/g, data.exporterName)
      .replace(/{{exporterTin}}/g, data.exporterTin)
      .replace(/{{eswReferenceNumber}}/g, data.eswReferenceNumber)
      .replace(/{{coffeeType}}/g, data.coffeeType)
      .replace(/{{quantity}}/g, data.quantity.toString())
      .replace(/{{originRegion}}/g, data.originRegion)
      .replace(/{{destinationCountry}}/g, data.destinationCountry)
      .replace(/{{approvedBy}}/g, data.approvedBy)
      .replace(/{{approvalDate}}/g, data.approvalDate.toLocaleDateString())
      .replace(/{{issueDate}}/g, data.issueDate.toLocaleDateString())
      .replace(/{{qrCodeData}}/g, data.qrCodeData);

    // Create a unique temporary directory for this browser instance
    // This prevents "browser is already running" errors during concurrent certificate generation
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const userDataDir = path.join(os.tmpdir(), `puppeteer_cert_${uniqueId}`);

    // Launch Puppeteer with unique userDataDir
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      userDataDir
    });

    let pdfBuffer: Buffer;

    try {
      const page = await browser.newPage();

      // Set content with optimized wait strategy and timeout
      // 'domcontentloaded' is much faster than 'networkidle0' and doesn't wait for external resources
      await page.setContent(templateHtml, {
        waitUntil: 'domcontentloaded',
        timeout: 120000 // 120 seconds timeout for PDF generation
      });

      // Generate PDF with A4 portrait format
      const pdfData = await page.pdf({
        format: 'A4',
        landscape: false,
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        },
        timeout: 120000 // 120 seconds timeout for PDF generation
      });

      pdfBuffer = Buffer.from(pdfData);
    } finally {
      // Close browser first
      await browser.close();

      // Clean up the temporary userDataDir
      try {
        await fs.rm(userDataDir, { recursive: true, force: true });
        logger.debug('Cleaned up temporary browser profile', { userDataDir });
      } catch (cleanupError: any) {
        // Log but don't fail if cleanup fails
        logger.warn('Failed to cleanup temporary browser profile', {
          userDataDir,
          error: cleanupError.message
        });
      }
    }

    return pdfBuffer;
  }

  /**
   * Generate QR code containing certificate number and verification URL
   */
  public async embedQRCode(certificateNumber: string, verificationUrl: string): Promise<string> {
    const qrData = JSON.stringify({
      certificateNumber,
      verificationUrl
    });

    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
      margin: 1
    });

    return qrCodeDataUrl;
  }
}

export default new CertificateGenerationService();
