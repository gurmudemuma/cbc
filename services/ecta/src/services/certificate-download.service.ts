import { Pool } from 'pg';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import pdfGenerationService from './pdf-generation.service';

const logger = createLogger('ECTACertificateDownloadService');
// Force reload - updated

interface CompetenceCertificate {
  certificateId: string;
  exporterId: string;
  certificateNumber: string;
  issuedDate: Date;
  expiryDate: Date;
  status: string;
  filePath?: string;
  fileSizeBytes?: number;
  laboratoryId?: string;
  tasterId?: string;
  facilityInspectionDate?: Date;
  inspectionReport?: string;
  inspectedBy?: string;
  inspectionPassed?: boolean;
  hasQualityManagementSystem?: boolean;
  qmsDocumentation?: string;
  storageCapacity?: number;
  storageConditions?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  renewalHistory?: any[];
  businessName?: string;
  businessType?: string;
  tin?: string;
  laboratoryName?: string;
  laboratoryStatus?: string;
  tasterName?: string;
  tasterStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ExportLicense {
  licenseId: string;
  exporterId: string;
  licenseNumber: string;
  issuedDate: Date;
  expiryDate: Date;
  status: string;
  filePath?: string;
  fileSizeBytes?: number;
  competenceCertificateId?: string;
  eicRegistrationNumber?: string;
  authorizedCoffeeTypes?: string[];
  authorizedOrigins?: string[];
  annualQuota?: number;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  renewalHistory?: any[];
  businessName?: string;
  businessType?: string;
  tin?: string;
  competenceCertificateNumber?: string;
  competenceCertificateStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ECTACertificateDownloadService {
  private pool: Pool;
  private storageBasePath: string;

  constructor() {
    this.pool = getPool();
    // Storage is in the service directory, not project root
    // When running as a service, cwd is already services/ecta
    this.storageBasePath = path.join(process.cwd(), 'storage');
  }

  public async downloadCompetenceCertificate(
    certificateIdOrNumber: string,
    userId: string,
    userRole: string,
    exporterId?: string
  ): Promise<Buffer> {
    console.log('=== DOWNLOAD COMPETENCE CERTIFICATE CALLED ===');
    console.log('Certificate ID:', certificateIdOrNumber);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);
    console.log('Exporter ID:', exporterId);
    
    const client = await this.pool.connect();
    
    try {
      // Support both certificate_id (UUID) and certificate_number
      const certResult = await client.query(
        `SELECT cc.*, ep.exporter_id
         FROM competence_certificates cc
         JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
         WHERE cc.certificate_id::text = $1 OR cc.certificate_number = $1`,
        [certificateIdOrNumber]
      );

      if (certResult.rows.length === 0) {
        throw new Error('Certificate not found');
      }

      const certificate = certResult.rows[0];

      if (certificate.status === 'REVOKED' || certificate.status === 'EXPIRED') {
        throw new Error(`Certificate has been ${certificate.status.toLowerCase()} and cannot be downloaded`);
      }

      const hasAccess = 
        (userRole === 'exporter' && exporterId === certificate.exporter_id) ||
        userRole === 'ECTA_OFFICER' ||
        userRole === 'ECTA_ADMIN' ||
        userRole === 'ecta_official' || // Add legacy ECTA role
        userRole === 'AGENCY_USER' ||
        userRole === 'AGENCY_ADMIN' ||
        userRole === 'admin' ||
        userRole === 'supervisor';

      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to download this certificate');
      }

      // Check if PDF file exists, regenerate if missing
      let pdfBuffer: Buffer;
      let filePath: string | null = null;
      
      if (certificate.file_path) {
        filePath = path.join(this.storageBasePath, certificate.file_path);
        try {
          pdfBuffer = await fs.readFile(filePath);
          logger.info('PDF file found and read successfully', { filePath });
        } catch (fileError: any) {
          if (fileError.code === 'ENOENT') {
            logger.warn('PDF file not found, regenerating...', { 
              certificateId: certificate.certificate_id,
              expectedPath: filePath 
            });
            pdfBuffer = await this.regenerateCompetenceCertificatePDF(certificate.certificate_id, client);
          } else {
            throw fileError;
          }
        }
      } else {
        logger.warn('No file path in database, generating PDF...', { 
          certificateId: certificate.certificate_id 
        });
        pdfBuffer = await this.regenerateCompetenceCertificatePDF(certificate.certificate_id, client);
      }

      await this.logDownloadEvent('competence_certificate', certificate.certificate_id, userId, client);

      logger.info('Competence certificate downloaded', {
        certificateId: certificate.certificate_id,
        certificateIdOrNumber: certificateIdOrNumber,
        userId,
        certificateNumber: certificate.certificate_number
      });

      return pdfBuffer;
    } finally {
      client.release();
    }
  }

  public async downloadExportLicense(
    licenseIdOrNumber: string,
    userId: string,
    userRole: string,
    exporterId?: string
  ): Promise<Buffer> {
    const client = await this.pool.connect();
    
    try {
      // Support both license_id (UUID) and license_number
      const licenseResult = await client.query(
        `SELECT el.*, ep.exporter_id
         FROM export_licenses el
         JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
         WHERE el.license_id::text = $1 OR el.license_number = $1`,
        [licenseIdOrNumber]
      );

      if (licenseResult.rows.length === 0) {
        throw new Error('Export license not found');
      }

      const license = licenseResult.rows[0];

      if (license.status === 'REVOKED' || license.status === 'EXPIRED') {
        throw new Error(`License has been ${license.status.toLowerCase()} and cannot be downloaded`);
      }

      const hasAccess = 
        (userRole === 'exporter' && exporterId === license.exporter_id) ||
        userRole === 'ECTA_OFFICER' ||
        userRole === 'ECTA_ADMIN' ||
        userRole === 'ecta_official' || // Add legacy ECTA role
        userRole === 'AGENCY_USER' ||
        userRole === 'AGENCY_ADMIN' ||
        userRole === 'admin' ||
        userRole === 'supervisor';

      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to download this license');
      }

      // Check if PDF file exists, regenerate if missing
      let pdfBuffer: Buffer;
      let filePath: string | null = null;
      
      if (license.file_path) {
        filePath = path.join(this.storageBasePath, license.file_path);
        try {
          pdfBuffer = await fs.readFile(filePath);
          logger.info('PDF file found and read successfully', { filePath });
        } catch (fileError: any) {
          if (fileError.code === 'ENOENT') {
            logger.warn('PDF file not found, regenerating...', { 
              licenseId: license.license_id,
              expectedPath: filePath 
            });
            pdfBuffer = await this.regenerateExportLicensePDF(license.license_id, client);
          } else {
            throw fileError;
          }
        }
      } else {
        logger.warn('No file path in database, generating PDF...', { 
          licenseId: license.license_id 
        });
        pdfBuffer = await this.regenerateExportLicensePDF(license.license_id, client);
      }

      await this.logDownloadEvent('export_license', license.license_id, userId, client);

      logger.info('Export license downloaded', {
        licenseId: license.license_id,
        licenseIdOrNumber: licenseIdOrNumber,
        userId,
        licenseNumber: license.license_number
      });

      return pdfBuffer;
    } finally {
      client.release();
    }
  }

  public async getCompetenceCertificateMetadata(
    certificateIdOrNumber: string,
    userId: string,
    userRole: string,
    exporterId?: string
  ): Promise<CompetenceCertificate> {
    const client = await this.pool.connect();
    
    try {
      // Support both certificate_id (UUID) and certificate_number
      const certResult = await client.query(
        `SELECT 
          cc.*,
          ep.exporter_id,
          ep.business_name,
          ep.business_type,
          ep.tin,
          cl.laboratory_name,
          cl.status as laboratory_status,
          ct.full_name as taster_name,
          ct.status as taster_status
         FROM competence_certificates cc
         JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
         LEFT JOIN coffee_laboratories cl ON cc.laboratory_id = cl.laboratory_id
         LEFT JOIN coffee_tasters ct ON cc.taster_id = ct.taster_id
         WHERE cc.certificate_id::text = $1 OR cc.certificate_number = $1`,
        [certificateIdOrNumber]
      );

      if (certResult.rows.length === 0) {
        throw new Error('Certificate not found');
      }

      const certRow = certResult.rows[0];

      const hasAccess = 
        (userRole === 'exporter' && exporterId === certRow.exporter_id) ||
        userRole === 'ECTA_OFFICER' ||
        userRole === 'ECTA_ADMIN' ||
        userRole === 'ecta_official' || // Add legacy ECTA role
        userRole === 'AGENCY_USER' ||
        userRole === 'AGENCY_ADMIN' ||
        userRole === 'admin' ||
        userRole === 'supervisor';

      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to view this certificate');
      }

      const certificate: CompetenceCertificate = {
        certificateId: certRow.certificate_id,
        exporterId: certRow.exporter_id,
        certificateNumber: certRow.certificate_number,
        issuedDate: certRow.issued_date,
        expiryDate: certRow.expiry_date,
        status: certRow.status,
        filePath: certRow.file_path,
        fileSizeBytes: certRow.file_size_bytes,
        laboratoryId: certRow.laboratory_id,
        tasterId: certRow.taster_id,
        facilityInspectionDate: certRow.facility_inspection_date,
        inspectionReport: certRow.inspection_report,
        inspectedBy: certRow.inspected_by,
        inspectionPassed: certRow.inspection_passed,
        hasQualityManagementSystem: certRow.has_quality_management_system,
        qmsDocumentation: certRow.qms_documentation,
        storageCapacity: certRow.storage_capacity,
        storageConditions: certRow.storage_conditions,
        approvedBy: certRow.approved_by,
        approvedAt: certRow.approved_at,
        rejectionReason: certRow.rejection_reason,
        renewalHistory: certRow.renewal_history || [],
        businessName: certRow.business_name,
        businessType: certRow.business_type,
        tin: certRow.tin,
        laboratoryName: certRow.laboratory_name,
        laboratoryStatus: certRow.laboratory_status,
        tasterName: certRow.taster_name,
        tasterStatus: certRow.taster_status,
        createdAt: certRow.created_at,
        updatedAt: certRow.updated_at
      };

      return certificate;
    } finally {
      client.release();
    }
  }

  public async getExportLicenseMetadata(
    licenseIdOrNumber: string,
    userId: string,
    userRole: string,
    exporterId?: string
  ): Promise<ExportLicense> {
    const client = await this.pool.connect();
    
    try {
      // Support both license_id (UUID) and license_number
      const licenseResult = await client.query(
        `SELECT 
          el.*,
          ep.exporter_id,
          ep.business_name,
          ep.business_type,
          ep.tin,
          cc.certificate_number as competence_certificate_number,
          cc.status as competence_certificate_status
         FROM export_licenses el
         JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
         LEFT JOIN competence_certificates cc ON el.competence_certificate_id = cc.certificate_id
         WHERE el.license_id::text = $1 OR el.license_number = $1`,
        [licenseIdOrNumber]
      );

      if (licenseResult.rows.length === 0) {
        throw new Error('Export license not found');
      }

      const licenseRow = licenseResult.rows[0];

      const hasAccess = 
        (userRole === 'exporter' && exporterId === licenseRow.exporter_id) ||
        userRole === 'ECTA_OFFICER' ||
        userRole === 'ECTA_ADMIN' ||
        userRole === 'ecta_official' || // Add legacy ECTA role
        userRole === 'AGENCY_USER' ||
        userRole === 'AGENCY_ADMIN' ||
        userRole === 'admin' ||
        userRole === 'supervisor';

      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to view this license');
      }

      const license: ExportLicense = {
        licenseId: licenseRow.license_id,
        exporterId: licenseRow.exporter_id,
        licenseNumber: licenseRow.license_number,
        issuedDate: licenseRow.issued_date,
        expiryDate: licenseRow.expiry_date,
        status: licenseRow.status,
        filePath: licenseRow.file_path,
        fileSizeBytes: licenseRow.file_size_bytes,
        competenceCertificateId: licenseRow.competence_certificate_id,
        eicRegistrationNumber: licenseRow.eic_registration_number,
        authorizedCoffeeTypes: licenseRow.authorized_coffee_types || [],
        authorizedOrigins: licenseRow.authorized_origins || [],
        annualQuota: licenseRow.annual_quota,
        approvedBy: licenseRow.approved_by,
        approvedAt: licenseRow.approved_at,
        rejectionReason: licenseRow.rejection_reason,
        renewalHistory: licenseRow.renewal_history || [],
        businessName: licenseRow.business_name,
        businessType: licenseRow.business_type,
        tin: licenseRow.tin,
        competenceCertificateNumber: licenseRow.competence_certificate_number,
        competenceCertificateStatus: licenseRow.competence_certificate_status,
        createdAt: licenseRow.created_at,
        updatedAt: licenseRow.updated_at
      };

      return license;
    } finally {
      client.release();
    }
  }

  private async logDownloadEvent(
    certificateType: 'competence_certificate' | 'export_license',
    certificateId: string,
    userId: string,
    client: any
  ): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ecta_certificate_audit_log (
        log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        certificate_type VARCHAR(50) NOT NULL,
        certificate_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL,
        performed_by VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(
      `INSERT INTO ecta_certificate_audit_log (
        certificate_type, certificate_id, action, performed_by, timestamp
      ) VALUES ($1, $2, 'DOWNLOADED', $3, NOW())`,
      [certificateType, certificateId, userId]
    );
  }

  /**
   * Regenerate competence certificate PDF if missing
   */
  private async regenerateCompetenceCertificatePDF(
    certificateId: string,
    client: any
  ): Promise<Buffer> {
    logger.info('Regenerating competence certificate PDF', { certificateId });

    // Get complete certificate data with all related information
    const certData = await client.query(
      `SELECT 
        cc.*,
        ep.business_name,
        ep.business_type,
        ep.tin,
        ep.registration_number,
        ep.city as exporter_city,
        ep.region as exporter_region,
        ep.office_address,
        ep.contact_person,
        ep.email,
        ep.phone,
        cl.laboratory_name,
        COALESCE(cl.city, ep.city, '') as laboratory_city,
        COALESCE(cl.region, ep.region, '') as laboratory_region,
        COALESCE(cl.address, ep.office_address, '') as laboratory_address,
        cl.certification_number as laboratory_cert_number,
        ct.full_name as taster_name,
        ct.proficiency_certificate_number as taster_cert_number,
        ct.qualification_level as taster_qualification
       FROM competence_certificates cc
       JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
       LEFT JOIN coffee_laboratories cl ON cc.laboratory_id = cl.laboratory_id
       LEFT JOIN coffee_tasters ct ON cc.taster_id = ct.taster_id
       WHERE cc.certificate_id = $1`,
      [certificateId]
    );

    if (certData.rows.length === 0) {
      throw new Error('Certificate data not found for regeneration');
    }

    const cert = certData.rows[0];

    // Generate PDF
    const pdfResult = await pdfGenerationService.generateCompetenceCertificatePDF(
      certificateId,
      {
        certificateNumber: cert.certificate_number,
        issuedDate: new Date(cert.issued_date),
        expiryDate: new Date(cert.expiry_date),
        businessName: cert.business_name,
        businessType: cert.business_type,
        tin: cert.tin,
        registrationNumber: cert.registration_number,
        exporterCity: cert.exporter_city,
        exporterRegion: cert.exporter_region,
        officeAddress: cert.office_address,
        contactPerson: cert.contact_person,
        email: cert.email,
        phone: cert.phone,
        laboratoryName: cert.laboratory_name,
        laboratoryCity: cert.laboratory_city,
        laboratoryRegion: cert.laboratory_region,
        laboratoryAddress: cert.laboratory_address,
        laboratoryCertNumber: cert.laboratory_cert_number,
        tasterName: cert.taster_name,
        tasterCertNumber: cert.taster_cert_number,
        tasterQualification: cert.taster_qualification,
        approvedBy: cert.approved_by || 'ECTA',
        approvedAt: cert.approved_at ? new Date(cert.approved_at) : new Date(cert.issued_date)
      }
    );

    // Update database with new file path
    await client.query(
      `UPDATE competence_certificates 
       SET file_path = $1, file_size_bytes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE certificate_id = $3`,
      [pdfResult.filePath, pdfResult.fileSizeBytes, certificateId]
    );

    // Read the newly generated file
    const filePath = path.join(this.storageBasePath, pdfResult.filePath);
    const pdfBuffer = await fs.readFile(filePath);

    logger.info('PDF regenerated successfully', {
      certificateId,
      filePath: pdfResult.filePath,
      fileSize: pdfResult.fileSizeBytes
    });

    return pdfBuffer;
  }

  /**
   * Regenerate export license PDF if missing
   */
  private async regenerateExportLicensePDF(
    licenseId: string,
    client: any
  ): Promise<Buffer> {
    logger.info('Regenerating export license PDF', { licenseId });

    // Get complete license data with all related information
    const licenseData = await client.query(
      `SELECT 
        el.*,
        ep.business_name,
        ep.business_type,
        ep.tin,
        cc.certificate_number as competence_cert_number
       FROM export_licenses el
       JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
       LEFT JOIN competence_certificates cc ON el.competence_certificate_id = cc.certificate_id
       WHERE el.license_id = $1`,
      [licenseId]
    );

    if (licenseData.rows.length === 0) {
      throw new Error('License data not found for regeneration');
    }

    const license = licenseData.rows[0];

    // Generate PDF
    const pdfResult = await pdfGenerationService.generateExportLicensePDF(
      licenseId,
      {
        licenseNumber: license.license_number,
        issuedDate: new Date(license.issued_date),
        expiryDate: new Date(license.expiry_date),
        businessName: license.business_name,
        businessType: license.business_type,
        tin: license.tin,
        competenceCertificateNumber: license.competence_cert_number,
        eicRegistrationNumber: license.eic_registration_number,
        authorizedCoffeeTypes: license.authorized_coffee_types || ['Arabica'],
        authorizedOrigins: license.authorized_origins || [],
        annualQuota: license.annual_quota,
        approvedBy: license.approved_by || 'ECTA',
        approvedAt: license.approved_at ? new Date(license.approved_at) : new Date(license.issued_date)
      }
    );

    // Update database with new file path
    await client.query(
      `UPDATE export_licenses 
       SET file_path = $1, file_size_bytes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE license_id = $3`,
      [pdfResult.filePath, pdfResult.fileSizeBytes, licenseId]
    );

    // Read the newly generated file
    const filePath = path.join(this.storageBasePath, pdfResult.filePath);
    const pdfBuffer = await fs.readFile(filePath);

    logger.info('PDF regenerated successfully', {
      licenseId,
      filePath: pdfResult.filePath,
      fileSize: pdfResult.fileSizeBytes
    });

    return pdfBuffer;
  }
}

export default new ECTACertificateDownloadService();
