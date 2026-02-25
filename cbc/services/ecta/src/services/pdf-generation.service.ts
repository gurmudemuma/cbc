import { createLogger } from '@shared/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import QRCode from 'qrcode';
import puppeteer from 'puppeteer';

const logger = createLogger('ECTAPDFGenerationService');

interface CompetenceCertificateData {
  certificateNumber: string;
  issuedDate: Date;
  expiryDate: Date;
  businessName: string;
  businessType: string;
  tin: string;
  registrationNumber?: string;
  exporterCity?: string;
  exporterRegion?: string;
  officeAddress?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  laboratoryName?: string;
  laboratoryCity?: string;
  laboratoryRegion?: string;
  laboratoryAddress?: string;
  laboratoryCertNumber?: string;
  tasterName?: string;
  tasterCertNumber?: string;
  tasterQualification?: string;
  facilityInspectionDate?: Date;
  inspectionPassed?: boolean;
  hasQualityManagementSystem?: boolean;
  storageCapacity?: string;
  approvedBy: string;
  approvedAt: Date;
}

interface ExportLicenseData {
  licenseNumber: string;
  issuedDate: Date;
  expiryDate: Date;
  businessName: string;
  businessType: string;
  tin: string;
  competenceCertificateNumber?: string;
  eicRegistrationNumber: string;
  authorizedCoffeeTypes: string[];
  authorizedOrigins: string[];
  annualQuota?: number;
  approvedBy: string;
  approvedAt: Date;
}

interface TasterProficiencyData {
  certificateNumber: string;
  issuedDate: Date;
  expiryDate: Date;
  tasterName: string;
  dateOfBirth?: Date;
  nationalId?: string;
  qualificationLevel?: string;
  businessName: string;
  businessType: string;
  tin: string;
  employmentStartDate: Date;
  isExclusiveEmployee: boolean;
  email?: string;
  phone?: string;
  approvedBy: string;
  approvedAt: Date;
}

interface LaboratoryCertificationData {
  certificationNumber: string;
  certifiedDate: Date;
  expiryDate: Date;
  laboratoryName: string;
  address: string;
  city?: string;
  region?: string;
  businessName: string;
  businessType: string;
  tin: string;
  hasRoastingFacility: boolean;
  hasCuppingRoom: boolean;
  hasSampleStorage: boolean;
  lastInspectionDate?: Date;
  inspectedBy?: string;
  email?: string;
  phone?: string;
  approvedBy: string;
  approvedAt: Date;
}

/**
 * ECTA PDF Generation Service
 * 
 * Generates professional PDF certificates using:
 * - Puppeteer for HTML-to-PDF rendering
 * - Professional certificate templates
 * - QR codes for verification
 * - Ethiopian Coffee & Tea Authority branding
 */
export class ECTAPDFGenerationService {
  private storageBasePath: string;

  constructor() {
    this.storageBasePath = path.join(process.cwd(), 'storage', 'certificates');
  }

  /**
   * Generate competence certificate PDF
   * Returns the relative file path for storage in database
   */
  public async generateCompetenceCertificatePDF(
    certificateId: string,
    data: CompetenceCertificateData
  ): Promise<{ filePath: string; fileSizeBytes: number }> {
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.storageBasePath, { recursive: true });

      // Generate QR code for verification
      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3003'}/verify/competence/${data.certificateNumber}`;
      const qrCodeData = await this.generateQRCode(data.certificateNumber, verificationUrl);

      // Render PDF using template
      const pdfBuffer = await this.renderCompetenceCertificateTemplate({
        ...data,
        qrCodeData,
        verificationUrl
      });

      // Create filename
      const filename = `competence-cert-${data.certificateNumber}-${certificateId}.pdf`;
      const fullPath = path.join(this.storageBasePath, filename);

      // Write PDF file
      await fs.writeFile(fullPath, pdfBuffer);

      logger.info('Competence certificate PDF generated', {
        certificateId,
        certificateNumber: data.certificateNumber,
        filePath: filename,
        fileSize: pdfBuffer.length
      });

      return {
        filePath: `certificates/${filename}`,
        fileSizeBytes: pdfBuffer.length
      };
    } catch (error: any) {
      logger.error('Failed to generate competence certificate PDF', {
        certificateId,
        error: error.message
      });
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate export license PDF
   * Returns the relative file path for storage in database
   */
  public async generateExportLicensePDF(
    licenseId: string,
    data: ExportLicenseData
  ): Promise<{ filePath: string; fileSizeBytes: number }> {
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.storageBasePath, { recursive: true });

      // Generate QR code for verification
      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3003'}/verify/license/${data.licenseNumber}`;
      const qrCodeData = await this.generateQRCode(data.licenseNumber, verificationUrl);

      // Render PDF using template
      const pdfBuffer = await this.renderExportLicenseTemplate({
        ...data,
        qrCodeData,
        verificationUrl
      });

      // Create filename
      const filename = `export-license-${data.licenseNumber}-${licenseId}.pdf`;
      const fullPath = path.join(this.storageBasePath, filename);

      // Write PDF file
      await fs.writeFile(fullPath, pdfBuffer);

      logger.info('Export license PDF generated', {
        licenseId,
        licenseNumber: data.licenseNumber,
        filePath: filename,
        fileSize: pdfBuffer.length
      });

      return {
        filePath: `certificates/${filename}`,
        fileSizeBytes: pdfBuffer.length
      };
    } catch (error: any) {
      logger.error('Failed to generate export license PDF', {
        licenseId,
        error: error.message
      });
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate taster proficiency certificate PDF
   * Returns the relative file path for storage in database
   */
  public async generateTasterProficiencyPDF(
    tasterId: string,
    data: TasterProficiencyData
  ): Promise<{ filePath: string; fileSizeBytes: number }> {
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.storageBasePath, { recursive: true });

      // Generate QR code for verification
      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3003'}/verify/taster/${data.certificateNumber}`;
      const qrCodeData = await this.generateQRCode(data.certificateNumber, verificationUrl);

      // Render PDF using template
      const pdfBuffer = await this.renderTasterProficiencyTemplate({
        ...data,
        qrCodeData,
        verificationUrl
      });

      // Create filename
      const filename = `taster-cert-${data.certificateNumber}-${tasterId}.pdf`;
      const fullPath = path.join(this.storageBasePath, filename);

      // Write PDF file
      await fs.writeFile(fullPath, pdfBuffer);

      logger.info('Taster proficiency certificate PDF generated', {
        tasterId,
        certificateNumber: data.certificateNumber,
        filePath: filename,
        fileSize: pdfBuffer.length
      });

      return {
        filePath: `certificates/${filename}`,
        fileSizeBytes: pdfBuffer.length
      };
    } catch (error: any) {
      logger.error('Failed to generate taster proficiency certificate PDF', {
        tasterId,
        error: error.message
      });
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate laboratory certification PDF
   * Returns the relative file path for storage in database
   */
  public async generateLaboratoryCertificationPDF(
    laboratoryId: string,
    data: LaboratoryCertificationData
  ): Promise<{ filePath: string; fileSizeBytes: number }> {
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.storageBasePath, { recursive: true });

      // Generate QR code for verification
      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3003'}/verify/laboratory/${data.certificationNumber}`;
      const qrCodeData = await this.generateQRCode(data.certificationNumber, verificationUrl);

      // Render PDF using template
      const pdfBuffer = await this.renderLaboratoryCertificationTemplate({
        ...data,
        qrCodeData,
        verificationUrl
      });

      // Create filename
      const filename = `lab-cert-${data.certificationNumber}-${laboratoryId}.pdf`;
      const fullPath = path.join(this.storageBasePath, filename);

      // Write PDF file
      await fs.writeFile(fullPath, pdfBuffer);

      logger.info('Laboratory certification PDF generated', {
        laboratoryId,
        certificationNumber: data.certificationNumber,
        filePath: filename,
        fileSize: pdfBuffer.length
      });

      return {
        filePath: `certificates/${filename}`,
        fileSizeBytes: pdfBuffer.length
      };
    } catch (error: any) {
      logger.error('Failed to generate laboratory certification PDF', {
        laboratoryId,
        error: error.message
      });
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate QR code containing certificate/license number and verification URL
   */
  private async generateQRCode(identifier: string, verificationUrl: string): Promise<string> {
    const qrData = JSON.stringify({
      identifier,
      verificationUrl,
      timestamp: new Date().toISOString()
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

  /**
   * Render competence certificate HTML template to PDF using Puppeteer
   */
  private async renderCompetenceCertificateTemplate(data: CompetenceCertificateData & { qrCodeData: string; verificationUrl: string }): Promise<Buffer> {
    const templateHtml = this.getCompetenceCertificateHTML(data);

    return await this.renderHTMLToPDF(templateHtml);
  }

  /**
   * Render export license HTML template to PDF using Puppeteer
   */
  private async renderExportLicenseTemplate(data: ExportLicenseData & { qrCodeData: string; verificationUrl: string }): Promise<Buffer> {
    const templateHtml = this.getExportLicenseHTML(data);

    return await this.renderHTMLToPDF(templateHtml);
  }

  /**
   * Render taster proficiency certificate HTML template to PDF using Puppeteer
   */
  private async renderTasterProficiencyTemplate(data: TasterProficiencyData & { qrCodeData: string; verificationUrl: string }): Promise<Buffer> {
    const templateHtml = this.getTasterProficiencyHTML(data);

    return await this.renderHTMLToPDF(templateHtml);
  }

  /**
   * Render laboratory certification HTML template to PDF using Puppeteer
   */
  private async renderLaboratoryCertificationTemplate(data: LaboratoryCertificationData & { qrCodeData: string; verificationUrl: string }): Promise<Buffer> {
    const templateHtml = this.getLaboratoryCertificationHTML(data);

    return await this.renderHTMLToPDF(templateHtml);
  }

  /**
   * Render HTML to PDF using Puppeteer
   */
  private async renderHTMLToPDF(html: string): Promise<Buffer> {
    // Create a unique temporary directory for this browser instance
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const userDataDir = path.join(os.tmpdir(), `puppeteer_ecta_${uniqueId}`);

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
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 120000 // 120 seconds timeout for PDF generation
      });

      // Generate PDF with A4 PORTRAIT format
      const pdfData = await page.pdf({
        format: 'A4',
        landscape: false,
        printBackground: true,
        margin: {
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
          left: '5mm'
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
        logger.warn('Failed to cleanup temporary browser profile', {
          userDataDir,
          error: cleanupError.message
        });
      }
    }

    return pdfBuffer;
  }

  /**
   * Get Competence Certificate HTML template
   * Comprehensive single-page certificate with full details optimized for A4 portrait
   */
  private getCompetenceCertificateHTML(data: CompetenceCertificateData & { qrCodeData: string; verificationUrl: string }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Competence Certificate - ${data.certificateNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', 'Georgia', serif;
      background: #ffffff;
      color: #1a1a1a;
      padding: 0;
      margin: 0;
      font-size: 16pt;
      line-height: 1.4;
    }
    
    .certificate {
      width: 100%;
      min-height: 100vh;
      border: 2pt double #2c5f2d;
      padding: 8mm;
      background: #ffffff;
      position: relative;
      box-sizing: border-box;
    }
    
    .header {
      text-align: center;
      margin-bottom: 3mm;
      border-bottom: 1pt solid #2c5f2d;
      padding-bottom: 2mm;
    }
    
    .logo {
      font-size: 20pt;
      color: #2c5f2d;
      margin-bottom: 1mm;
    }
    
    .authority-name {
      font-size: 14pt;
      font-weight: bold;
      color: #2c5f2d;
      letter-spacing: 0.5pt;
      margin-bottom: 0.5mm;
    }
    
    .authority-name-amharic {
      font-size: 12pt;
      font-weight: bold;
      color: #2c5f2d;
      margin-bottom: 1mm;
    }
    
    .certificate-title {
      font-size: 16pt;
      font-weight: bold;
      color: #1a3a1b;
      margin-top: 1mm;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
    }
    
    .certificate-number {
      font-size: 11pt;
      color: #555;
      margin-top: 1mm;
      font-style: italic;
    }
    
    .content {
      margin: 2mm 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 3mm;
      margin-bottom: 2mm;
    }
    
    .section {
      margin-bottom: 1mm;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #2c5f2d;
      border-bottom: 0.75pt solid #2c5f2d;
      padding-bottom: 0.5mm;
      margin-bottom: 1mm;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
    }
    
    .info-row {
      margin-bottom: 0.8mm;
      font-size: 11pt;
      line-height: 1.4;
    }
    
    .info-label {
      font-weight: 600;
      color: #444;
      display: inline-block;
      min-width: 45pt;
    }
    
    .info-value {
      color: #1a1a1a;
      display: inline;
    }
    
    .certification-statement {
      text-align: justify;
      font-size: 11pt;
      line-height: 1.4;
      margin: 2mm 0;
      padding: 2mm;
      background: #f8f9fa;
      border-left: 1.5pt solid #2c5f2d;
      border-radius: 0.5pt;
    }
    
    .certification-statement ul {
      margin: 1mm 0 0 4mm;
      padding: 0;
    }
    
    .certification-statement li {
      margin-bottom: 0.5mm;
    }
    
    .best-practices {
      font-size: 10pt;
      line-height: 1.3;
      margin: 2mm 0;
      padding: 2mm;
      background: #fffef5;
      border: 0.75pt solid #d4af37;
      border-radius: 0.5pt;
    }
    
    .best-practices-title {
      font-weight: bold;
      color: #2c5f2d;
      margin-bottom: 1mm;
      font-size: 11pt;
    }
    
    .best-practices ul {
      margin: 0.5mm 0 0 4mm;
      padding: 0;
      columns: 2;
      column-gap: 3mm;
    }
    
    .best-practices li {
      margin-bottom: 0.5mm;
      break-inside: avoid;
    }
    
    .validity-box {
      text-align: center;
      margin: 2mm 0;
      padding: 2mm;
      background: linear-gradient(to right, #fff3cd, #fffaeb);
      border: 0.75pt solid #ffc107;
      border-radius: 1pt;
      font-size: 12pt;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 2mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .signature-block {
      text-align: center;
      min-width: 40mm;
    }
    
    .signature-line {
      border-top: 0.5pt solid #333;
      width: 35mm;
      margin: 1mm auto 0.5mm;
    }
    
    .signature-name {
      font-size: 12pt;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 0mm;
    }
    
    .signature-title {
      font-size: 10pt;
      color: #555;
      font-style: italic;
      margin-bottom: 0mm;
    }
    
    .signature-date {
      font-size: 9pt;
      color: #666;
      margin-top: 0.5mm;
    }
    
    .qr-block {
      text-align: center;
    }
    
    .qr-code {
      width: 25mm;
      height: 25mm;
      margin-bottom: 0.5mm;
    }
    
    .qr-text {
      font-size: 9pt;
      color: #666;
    }
    
    .official-seal {
      position: absolute;
      top: 8mm;
      right: 8mm;
      width: 22mm;
      height: 22mm;
      border: 1.5pt solid #2c5f2d;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      font-weight: bold;
      color: #2c5f2d;
      text-align: center;
      background: rgba(255, 255, 255, 0.98);
      line-height: 1.2;
      box-shadow: 0 0 2pt rgba(44, 95, 45, 0.3);
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="official-seal">ECTA<br/>OFFICIAL<br/>SEAL</div>
    
    <div class="header">
      <div class="logo">☕</div>
      <div class="authority-name">ETHIOPIAN COFFEE AND TEA AUTHORITY</div>
      <div class="authority-name-amharic">የኢትዮጵያ ቡና እና ሻይ ባለስልጣን</div>
      <div class="certificate-title">Certificate of Competence for Coffee Export</div>
      <div class="certificate-number">Certificate No: ${data.certificateNumber}</div>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="section">
          <div class="section-title">Exporter Information</div>
          <div class="info-row">
            <span class="info-label">Business Name:</span>
            <span class="info-value">${data.businessName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Business Type:</span>
            <span class="info-value">${data.businessType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">TIN:</span>
            <span class="info-value">${data.tin}</span>
          </div>
          ${data.registrationNumber ? `
          <div class="info-row">
            <span class="info-label">Registration:</span>
            <span class="info-value">${data.registrationNumber}</span>
          </div>
          ` : ''}
          ${data.officeAddress ? `
          <div class="info-row">
            <span class="info-label">Office:</span>
            <span class="info-value">${data.officeAddress}</span>
          </div>
          ` : ''}
          ${data.exporterCity && data.exporterRegion ? `
          <div class="info-row">
            <span class="info-label">Location:</span>
            <span class="info-value">${data.exporterCity}, ${data.exporterRegion}</span>
          </div>
          ` : ''}
          ${data.contactPerson ? `
          <div class="info-row">
            <span class="info-label">Contact:</span>
            <span class="info-value">${data.contactPerson}</span>
          </div>
          ` : ''}
          ${data.phone ? `
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${data.phone}</span>
          </div>
          ` : ''}
          ${data.email ? `
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${data.email}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">Laboratory Qualification</div>
          <div class="info-row">
            <span class="info-label">Laboratory:</span>
            <span class="info-value">${data.laboratoryName || 'Not Specified'}</span>
          </div>
          ${data.laboratoryCertNumber ? `
          <div class="info-row">
            <span class="info-label">Lab Cert No:</span>
            <span class="info-value">${data.laboratoryCertNumber}</span>
          </div>
          ` : ''}
          ${data.laboratoryAddress ? `
          <div class="info-row">
            <span class="info-label">Lab Address:</span>
            <span class="info-value">${data.laboratoryAddress}</span>
          </div>
          ` : ''}
          ${data.laboratoryCity && data.laboratoryRegion ? `
          <div class="info-row">
            <span class="info-label">Lab Location:</span>
            <span class="info-value">${data.laboratoryCity}, ${data.laboratoryRegion}</span>
          </div>
          ` : ''}
          <div class="section-title" style="margin-top: 1mm;">Coffee Taster</div>
          <div class="info-row">
            <span class="info-label">Taster Name:</span>
            <span class="info-value">${data.tasterName || 'Not Specified'}</span>
          </div>
          ${data.tasterCertNumber ? `
          <div class="info-row">
            <span class="info-label">Taster Cert:</span>
            <span class="info-value">${data.tasterCertNumber}</span>
          </div>
          ` : ''}
          ${data.tasterQualification ? `
          <div class="info-row">
            <span class="info-label">Qualification:</span>
            <span class="info-value">${data.tasterQualification}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">Facility & Compliance</div>
          ${data.facilityInspectionDate ? `
          <div class="info-row">
            <span class="info-label">Inspection Date:</span>
            <span class="info-value">${data.facilityInspectionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          ` : ''}
          ${data.inspectionPassed !== undefined ? `
          <div class="info-row">
            <span class="info-label">Inspection:</span>
            <span class="info-value">${data.inspectionPassed ? 'PASSED ✓' : 'PENDING'}</span>
          </div>
          ` : ''}
          ${data.hasQualityManagementSystem !== undefined ? `
          <div class="info-row">
            <span class="info-label">QMS:</span>
            <span class="info-value">${data.hasQualityManagementSystem ? 'CERTIFIED ✓' : 'NOT CERTIFIED'}</span>
          </div>
          ` : ''}
          ${data.storageCapacity ? `
          <div class="info-row">
            <span class="info-label">Storage:</span>
            <span class="info-value">${data.storageCapacity}</span>
          </div>
          ` : ''}
          <div class="section-title" style="margin-top: 1mm;">Approval Details</div>
          <div class="info-row">
            <span class="info-label">Approved By:</span>
            <span class="info-value">${data.approvedBy}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Approval Date:</span>
            <span class="info-value">${data.approvedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
      
      <div class="certification-statement">
        <strong>CERTIFICATION:</strong> This is to certify that the above-named exporter has successfully met all requirements established by the Ethiopian Coffee and Tea Authority for coffee export competence, including:
        <ul>
          <li>Possession of ECTA-certified laboratory facilities with appropriate equipment and quality control systems</li>
          <li>Employment of qualified coffee taster(s) holding valid ECTA proficiency certificates</li>
          <li>Adequate storage capacity and compliance with quality management system standards</li>
          <li>Successful facility inspection and verification of operational readiness</li>
        </ul>
        This certificate authorizes the holder to engage in coffee export activities in accordance with ECTA regulations and Ethiopian export laws.
      </div>
      
      <div class="best-practices">
        <div class="best-practices-title">COMPLIANCE & BEST PRACTICES REQUIREMENTS:</div>
        <ul>
          <li>Maintain laboratory equipment calibration and certification</li>
          <li>Ensure coffee tasters undergo annual proficiency testing</li>
          <li>Implement traceability systems for all coffee batches</li>
          <li>Maintain proper storage conditions (temperature, humidity control)</li>
          <li>Conduct regular quality control testing per ECTA standards</li>
          <li>Keep accurate records of all coffee purchases and sales</li>
          <li>Comply with Ethiopian coffee grading and classification standards</li>
          <li>Report any changes in laboratory or taster status to ECTA</li>
          <li>Renew certificate before expiry date</li>
          <li>Adhere to international coffee quality and safety standards</li>
        </ul>
      </div>
      
      <div class="validity-box">
        <strong>VALIDITY PERIOD:</strong> ${data.issuedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to ${data.expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
    
    <div class="footer">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-name">${data.approvedBy}</div>
        <div class="signature-title">ECTA Authorized Signatory</div>
        <div class="signature-date">${data.approvedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      <div class="qr-block">
        <img src="${data.qrCodeData}" alt="Verification QR Code" class="qr-code"/>
        <div class="qr-text">Scan to verify authenticity</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Get Export License HTML template
   * Comprehensive single-page license with full details optimized for A4 portrait
   */
  private getExportLicenseHTML(data: ExportLicenseData & { qrCodeData: string; verificationUrl: string }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export License - ${data.licenseNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', 'Georgia', serif;
      background: #ffffff;
      color: #1a1a1a;
      padding: 0;
      margin: 0;
      font-size: 11pt;
      line-height: 1.3;
    }
    
    .license {
      width: 100%;
      min-height: 100vh;
      border: 2pt double #1a5490;
      padding: 2mm;
      background: #ffffff;
      position: relative;
      box-sizing: border-box;
    }
    
    .header {
      text-align: center;
      margin-bottom: 1mm;
      border-bottom: 1pt solid #1a5490;
      padding-bottom: 1mm;
    }
    
    .logo {
      font-size: 20pt;
      color: #1a5490;
      margin-bottom: 0.5mm;
    }
    
    .authority-name {
      font-size: 14pt;
      font-weight: bold;
      color: #1a5490;
      letter-spacing: 0.5pt;
      margin-bottom: 0.5mm;
    }
    
    .authority-name-amharic {
      font-size: 12pt;
      font-weight: bold;
      color: #1a5490;
      margin-bottom: 0.5mm;
    }
    
    .license-title {
      font-size: 16pt;
      font-weight: bold;
      color: #0d3a6b;
      margin-top: 0.5mm;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
    }
    
    .license-number {
      font-size: 11pt;
      color: #555;
      margin-top: 0.5mm;
      font-style: italic;
    }
    
    .content {
      margin: 1mm 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 2mm;
      margin-bottom: 1mm;
    }
    
    .section {
      margin-bottom: 0.5mm;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1a5490;
      border-bottom: 0.75pt solid #1a5490;
      padding-bottom: 0.5mm;
      margin-bottom: 0.5mm;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
    }
    
    .info-row {
      margin-bottom: 0.5mm;
      font-size: 11pt;
      line-height: 1.3;
    }
    
    .info-label {
      font-weight: 600;
      color: #444;
      display: inline-block;
      min-width: 45pt;
    }
    
    .info-value {
      color: #1a1a1a;
      display: inline;
    }
    
    .authorization-statement {
      text-align: justify;
      font-size: 11pt;
      line-height: 1.3;
      margin: 1mm 0;
      padding: 1mm;
      background: #f0f7ff;
      border-left: 1.5pt solid #1a5490;
      border-radius: 0.5pt;
    }
    
    .authorization-statement ul {
      margin: 0.5mm 0 0 4mm;
      padding: 0;
    }
    
    .authorization-statement li {
      margin-bottom: 0.3mm;
    }
    
    .best-practices {
      font-size: 10pt;
      line-height: 1.3;
      margin: 1mm 0;
      padding: 1mm;
      background: #fffef5;
      border: 0.75pt solid #d4af37;
      border-radius: 0.5pt;
    }
    
    .best-practices-title {
      font-weight: bold;
      color: #1a5490;
      margin-bottom: 0.5mm;
      font-size: 11pt;
    }
    
    .best-practices ul {
      margin: 0.5mm 0 0 4mm;
      padding: 0;
      columns: 2;
      column-gap: 2mm;
    }
    
    .best-practices li {
      margin-bottom: 0.3mm;
      break-inside: avoid;
    }
    
    .validity-box {
      text-align: center;
      margin: 1mm 0;
      padding: 1mm;
      background: linear-gradient(to right, #d4edda, #e8f5e9);
      border: 0.75pt solid #28a745;
      border-radius: 1pt;
      font-size: 12pt;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 1mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .signature-block {
      text-align: center;
      min-width: 40mm;
    }
    
    .signature-line {
      border-top: 0.5pt solid #333;
      width: 35mm;
      margin: 0.5mm auto 0.5mm;
    }
    
    .signature-name {
      font-size: 12pt;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 0mm;
    }
    
    .signature-title {
      font-size: 10pt;
      color: #555;
      font-style: italic;
      margin-bottom: 0mm;
    }
    
    .signature-date {
      font-size: 9pt;
      color: #666;
      margin-top: 0.5mm;
    }
    
    .qr-block {
      text-align: center;
    }
    
    .qr-code {
      width: 25mm;
      height: 25mm;
      margin-bottom: 0.5mm;
    }
    
    .qr-text {
      font-size: 9pt;
      color: #666;
    }
    
    .official-seal {
      position: absolute;
      top: 2mm;
      right: 2mm;
      width: 22mm;
      height: 22mm;
      border: 1.5pt solid #1a5490;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      font-weight: bold;
      color: #1a5490;
      text-align: center;
      background: rgba(255, 255, 255, 0.98);
      line-height: 1.2;
      box-shadow: 0 0 2pt rgba(26, 84, 144, 0.3);
    }
  </style>
</head>
<body>
  <div class="license">
    <div class="official-seal">ECTA<br/>OFFICIAL<br/>SEAL</div>
    
    <div class="header">
      <div class="logo">☕</div>
      <div class="authority-name">ETHIOPIAN COFFEE AND TEA AUTHORITY</div>
      <div class="authority-name-amharic">የኢትዮጵያ ቡና እና ሻይ ባለስልጣን</div>
      <div class="license-title">Coffee Export License</div>
      <div class="license-number">License No: ${data.licenseNumber}</div>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="section">
          <div class="section-title">Licensed Exporter</div>
          <div class="info-row">
            <span class="info-label">Business Name:</span>
            <span class="info-value">${data.businessName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Business Type:</span>
            <span class="info-value">${data.businessType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">TIN:</span>
            <span class="info-value">${data.tin}</span>
          </div>
          <div class="info-row">
            <span class="info-label">EIC Reg:</span>
            <span class="info-value">${data.eicRegistrationNumber}</span>
          </div>
          ${data.competenceCertificateNumber ? `
          <div class="info-row">
            <span class="info-label">Competence:</span>
            <span class="info-value">${data.competenceCertificateNumber}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">Coffee Export Authorization</div>
          <div class="info-row">
            <span class="info-label">Coffee Types:</span>
            <span class="info-value">${data.authorizedCoffeeTypes.join(', ')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Origins:</span>
            <span class="info-value">${data.authorizedOrigins.length > 0 ? data.authorizedOrigins.join(', ') : 'All Ethiopian Regions'}</span>
          </div>
          ${data.annualQuota ? `
          <div class="info-row">
            <span class="info-label">Annual Quota:</span>
            <span class="info-value">${data.annualQuota.toLocaleString()} kg</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">Approval Details</div>
          <div class="info-row">
            <span class="info-label">Approved By:</span>
            <span class="info-value">${data.approvedBy}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Approval Date:</span>
            <span class="info-value">${data.approvedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Issue Date:</span>
            <span class="info-value">${data.issuedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Expiry Date:</span>
            <span class="info-value">${data.expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
      
      <div class="authorization-statement">
        <strong>AUTHORIZATION:</strong> This license hereby authorizes the above-named exporter to export coffee from the Federal Democratic Republic of Ethiopia in accordance with all applicable ECTA regulations, Ethiopian export laws, and international trade agreements. The license holder is authorized to:
        <ul>
          <li>Export specified coffee types from authorized regions of origin</li>
          <li>Engage in international coffee trade and commerce</li>
          <li>Obtain all necessary export documentation and certifications from ECTA</li>
          <li>Maintain compliance with quality standards and regulatory requirements</li>
          <li>Represent Ethiopian coffee in international markets with integrity</li>
        </ul>
        This license is subject to periodic review and must be renewed in accordance with ECTA regulations.
      </div>
      
      <div class="best-practices">
        <div class="best-practices-title">EXPORT COMPLIANCE & BEST PRACTICES:</div>
        <ul>
          <li>Maintain valid competence certificate throughout license period</li>
          <li>Ensure all coffee exports meet ECTA quality standards</li>
          <li>Obtain export permits for each shipment from ECTA</li>
          <li>Comply with Ethiopian Coffee Grading & Classification System</li>
          <li>Maintain accurate records of all export transactions</li>
          <li>Implement traceability systems for origin verification</li>
          <li>Adhere to international coffee trade agreements and contracts</li>
          <li>Report any changes in business status to ECTA immediately</li>
          <li>Ensure proper packaging and labeling per export regulations</li>
          <li>Maintain insurance coverage for export shipments</li>
          <li>Comply with destination country import requirements</li>
          <li>Renew license before expiry to avoid export disruptions</li>
        </ul>
      </div>
      
      <div class="validity-box">
        <strong>VALIDITY PERIOD:</strong> ${data.issuedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to ${data.expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
    
    <div class="footer">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-name">${data.approvedBy}</div>
        <div class="signature-title">ECTA Authorized Signatory</div>
        <div class="signature-date">${data.approvedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      <div class="qr-block">
        <img src="${data.qrCodeData}" alt="Verification QR Code" class="qr-code"/>
        <div class="qr-text">Scan to verify authenticity</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Get Taster Proficiency Certificate HTML template
   * Professional single-page certificate optimized for A4 portrait
   */
  private getTasterProficiencyHTML(data: TasterProficiencyData & { qrCodeData: string; verificationUrl: string }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Taster Proficiency Certificate - ${data.certificateNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', 'Georgia', serif;
      background: #ffffff;
      color: #1a1a1a;
      padding: 0;
      margin: 0;
      font-size: 11pt;
      line-height: 1.4;
    }
    
    .certificate {
      width: 100%;
      min-height: 100vh;
      border: 2pt double #8b4513;
      padding: 8mm;
      background: #ffffff;
      position: relative;
      box-sizing: border-box;
    }
    
    .header {
      text-align: center;
      margin-bottom: 3mm;
      border-bottom: 1pt solid #8b4513;
      padding-bottom: 2mm;
    }
    
    .logo {
      font-size: 20pt;
      color: #8b4513;
      margin-bottom: 1mm;
    }
    
    .authority-name {
      font-size: 14pt;
      font-weight: bold;
      color: #8b4513;
      letter-spacing: 0.5pt;
      margin-bottom: 0.5mm;
    }
    
    .authority-name-amharic {
      font-size: 12pt;
      font-weight: bold;
      color: #8b4513;
      margin-bottom: 1mm;
    }
    
    .certificate-title {
      font-size: 16pt;
      font-weight: bold;
      color: #5d3a1a;
      margin-top: 1mm;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
    }
    
    .certificate-number {
      font-size: 11pt;
      color: #555;
      margin-top: 1mm;
      font-style: italic;
    }
    
    .content {
      margin: 3mm 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3mm;
      margin-bottom: 3mm;
    }
    
    .section {
      margin-bottom: 2mm;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #8b4513;
      border-bottom: 0.75pt solid #8b4513;
      padding-bottom: 0.5mm;
      margin-bottom: 1mm;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
    }
    
    .info-row {
      margin-bottom: 1mm;
      font-size: 11pt;
      line-height: 1.4;
    }
    
    .info-label {
      font-weight: 600;
      color: #444;
      display: inline-block;
      min-width: 50pt;
    }
    
    .info-value {
      color: #1a1a1a;
      display: inline;
    }
    
    .certification-statement {
      text-align: justify;
      font-size: 11pt;
      line-height: 1.4;
      margin: 3mm 0;
      padding: 2mm;
      background: #fef5e7;
      border-left: 1.5pt solid #8b4513;
      border-radius: 0.5pt;
    }
    
    .requirements {
      font-size: 10pt;
      line-height: 1.3;
      margin: 2mm 0;
      padding: 2mm;
      background: #fff8f0;
      border: 0.75pt solid #d4af37;
      border-radius: 0.5pt;
    }
    
    .requirements-title {
      font-weight: bold;
      color: #8b4513;
      margin-bottom: 1mm;
      font-size: 11pt;
    }
    
    .requirements ul {
      margin: 1mm 0 0 4mm;
      padding: 0;
    }
    
    .requirements li {
      margin-bottom: 0.5mm;
    }
    
    .validity-box {
      text-align: center;
      margin: 3mm 0;
      padding: 2mm;
      background: linear-gradient(to right, #fff3cd, #fffaeb);
      border: 0.75pt solid #ffc107;
      border-radius: 1pt;
      font-size: 12pt;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 3mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .signature-block {
      text-align: center;
      min-width: 40mm;
    }
    
    .signature-line {
      border-top: 0.5pt solid #333;
      width: 35mm;
      margin: 1mm auto 0.5mm;
    }
    
    .signature-name {
      font-size: 12pt;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 0mm;
    }
    
    .signature-title {
      font-size: 10pt;
      color: #555;
      font-style: italic;
      margin-bottom: 0mm;
    }
    
    .signature-date {
      font-size: 9pt;
      color: #666;
      margin-top: 0.5mm;
    }
    
    .qr-block {
      text-align: center;
    }
    
    .qr-code {
      width: 25mm;
      height: 25mm;
      margin-bottom: 0.5mm;
    }
    
    .qr-text {
      font-size: 9pt;
      color: #666;
    }
    
    .official-seal {
      position: absolute;
      top: 8mm;
      right: 8mm;
      width: 22mm;
      height: 22mm;
      border: 1.5pt solid #8b4513;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      font-weight: bold;
      color: #8b4513;
      text-align: center;
      background: rgba(255, 255, 255, 0.98);
      line-height: 1.2;
      box-shadow: 0 0 2pt rgba(139, 69, 19, 0.3);
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="official-seal">ECTA<br/>OFFICIAL<br/>SEAL</div>
    
    <div class="header">
      <div class="logo">☕</div>
      <div class="authority-name">ETHIOPIAN COFFEE AND TEA AUTHORITY</div>
      <div class="authority-name-amharic">የኢትዮጵያ ቡና እና ሻይ ባለስልጣን</div>
      <div class="certificate-title">Coffee Taster Proficiency Certificate</div>
      <div class="certificate-number">Certificate No: ${data.certificateNumber}</div>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="section">
          <div class="section-title">Taster Information</div>
          <div class="info-row">
            <span class="info-label">Full Name:</span>
            <span class="info-value">${data.tasterName}</span>
          </div>
          ${data.dateOfBirth ? `
          <div class="info-row">
            <span class="info-label">Date of Birth:</span>
            <span class="info-value">${data.dateOfBirth.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          ` : ''}
          ${data.nationalId ? `
          <div class="info-row">
            <span class="info-label">National ID:</span>
            <span class="info-value">${data.nationalId}</span>
          </div>
          ` : ''}
          ${data.qualificationLevel ? `
          <div class="info-row">
            <span class="info-label">Qualification:</span>
            <span class="info-value">${data.qualificationLevel}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Employment Start:</span>
            <span class="info-value">${data.employmentStartDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Employment Type:</span>
            <span class="info-value">${data.isExclusiveEmployee ? 'Exclusive Employee ✓' : 'Non-Exclusive'}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Employer Information</div>
          <div class="info-row">
            <span class="info-label">Business Name:</span>
            <span class="info-value">${data.businessName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Business Type:</span>
            <span class="info-value">${data.businessType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">TIN:</span>
            <span class="info-value">${data.tin}</span>
          </div>
          ${data.phone ? `
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${data.phone}</span>
          </div>
          ` : ''}
          ${data.email ? `
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${data.email}</span>
          </div>
          ` : ''}
          <div class="section-title" style="margin-top: 2mm;">Approval Details</div>
          <div class="info-row">
            <span class="info-label">Approved By:</span>
            <span class="info-value">${data.approvedBy}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Approval Date:</span>
            <span class="info-value">${data.approvedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
      
      <div class="certification-statement">
        <strong>CERTIFICATION:</strong> This is to certify that <strong>${data.tasterName}</strong> has successfully completed the Ethiopian Coffee and Tea Authority's coffee taster proficiency assessment and has demonstrated the required knowledge, skills, and sensory abilities to perform professional coffee quality evaluation. The certificate holder is authorized to conduct coffee cupping and quality assessment for export purposes in accordance with ECTA standards and Ethiopian coffee grading protocols.
      </div>
      
      <div class="requirements">
        <div class="requirements-title">PROFICIENCY REQUIREMENTS & RESPONSIBILITIES:</div>
        <ul>
          <li>Conduct sensory evaluation of coffee samples using standardized cupping protocols</li>
          <li>Identify coffee defects, flavor profiles, and quality characteristics accurately</li>
          <li>Assign quality scores and grades according to ECTA classification system</li>
          <li>Maintain calibration through regular proficiency testing and training</li>
          <li>Adhere to ethical standards and avoid conflicts of interest in quality assessment</li>
          <li>Keep accurate cupping records and quality control documentation</li>
          <li>Participate in annual proficiency renewal assessments</li>
          <li>Report any quality issues or irregularities to ECTA immediately</li>
          <li>Maintain exclusive employment with certified exporter (if applicable)</li>
          <li>Stay updated on Ethiopian coffee quality standards and international best practices</li>
        </ul>
      </div>
      
      <div class="validity-box">
        <strong>VALIDITY PERIOD:</strong> ${data.issuedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to ${data.expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
    
    <div class="footer">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-name">${data.approvedBy}</div>
        <div class="signature-title">ECTA Authorized Signatory</div>
        <div class="signature-date">${data.approvedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      <div class="qr-block">
        <img src="${data.qrCodeData}" alt="Verification QR Code" class="qr-code"/>
        <div class="qr-text">Scan to verify authenticity</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Get Laboratory Certification HTML template
   * Professional single-page certificate optimized for A4 portrait
   */
  private getLaboratoryCertificationHTML(data: LaboratoryCertificationData & { qrCodeData: string; verificationUrl: string }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laboratory Certification - ${data.certificationNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', 'Georgia', serif;
      background: #ffffff;
      color: #1a1a1a;
      padding: 0;
      margin: 0;
      font-size: 11pt;
      line-height: 1.4;
    }
    
    .certificate {
      width: 100%;
      min-height: 100vh;
      border: 2pt double #0066cc;
      padding: 8mm;
      background: #ffffff;
      position: relative;
      box-sizing: border-box;
    }
    
    .header {
      text-align: center;
      margin-bottom: 3mm;
      border-bottom: 1pt solid #0066cc;
      padding-bottom: 2mm;
    }
    
    .logo {
      font-size: 20pt;
      color: #0066cc;
      margin-bottom: 1mm;
    }
    
    .authority-name {
      font-size: 14pt;
      font-weight: bold;
      color: #0066cc;
      letter-spacing: 0.5pt;
      margin-bottom: 0.5mm;
    }
    
    .authority-name-amharic {
      font-size: 12pt;
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 1mm;
    }
    
    .certificate-title {
      font-size: 16pt;
      font-weight: bold;
      color: #004080;
      margin-top: 1mm;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
    }
    
    .certificate-number {
      font-size: 11pt;
      color: #555;
      margin-top: 1mm;
      font-style: italic;
    }
    
    .content {
      margin: 3mm 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3mm;
      margin-bottom: 3mm;
    }
    
    .section {
      margin-bottom: 2mm;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #0066cc;
      border-bottom: 0.75pt solid #0066cc;
      padding-bottom: 0.5mm;
      margin-bottom: 1mm;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
    }
    
    .info-row {
      margin-bottom: 1mm;
      font-size: 11pt;
      line-height: 1.4;
    }
    
    .info-label {
      font-weight: 600;
      color: #444;
      display: inline-block;
      min-width: 50pt;
    }
    
    .info-value {
      color: #1a1a1a;
      display: inline;
    }
    
    .certification-statement {
      text-align: justify;
      font-size: 11pt;
      line-height: 1.4;
      margin: 3mm 0;
      padding: 2mm;
      background: #e6f2ff;
      border-left: 1.5pt solid #0066cc;
      border-radius: 0.5pt;
    }
    
    .requirements {
      font-size: 10pt;
      line-height: 1.3;
      margin: 2mm 0;
      padding: 2mm;
      background: #f0f8ff;
      border: 0.75pt solid #4da6ff;
      border-radius: 0.5pt;
    }
    
    .requirements-title {
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 1mm;
      font-size: 11pt;
    }
    
    .requirements ul {
      margin: 1mm 0 0 4mm;
      padding: 0;
    }
    
    .requirements li {
      margin-bottom: 0.5mm;
    }
    
    .validity-box {
      text-align: center;
      margin: 3mm 0;
      padding: 2mm;
      background: linear-gradient(to right, #d4edda, #e8f5e9);
      border: 0.75pt solid #28a745;
      border-radius: 1pt;
      font-size: 12pt;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 3mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .signature-block {
      text-align: center;
      min-width: 40mm;
    }
    
    .signature-line {
      border-top: 0.5pt solid #333;
      width: 35mm;
      margin: 1mm auto 0.5mm;
    }
    
    .signature-name {
      font-size: 12pt;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 0mm;
    }
    
    .signature-title {
      font-size: 10pt;
      color: #555;
      font-style: italic;
      margin-bottom: 0mm;
    }
    
    .signature-date {
      font-size: 9pt;
      color: #666;
      margin-top: 0.5mm;
    }
    
    .qr-block {
      text-align: center;
    }
    
    .qr-code {
      width: 25mm;
      height: 25mm;
      margin-bottom: 0.5mm;
    }
    
    .qr-text {
      font-size: 9pt;
      color: #666;
    }
    
    .official-seal {
      position: absolute;
      top: 8mm;
      right: 8mm;
      width: 22mm;
      height: 22mm;
      border: 1.5pt solid #0066cc;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      font-weight: bold;
      color: #0066cc;
      text-align: center;
      background: rgba(255, 255, 255, 0.98);
      line-height: 1.2;
      box-shadow: 0 0 2pt rgba(0, 102, 204, 0.3);
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="official-seal">ECTA<br/>OFFICIAL<br/>SEAL</div>
    
    <div class="header">
      <div class="logo">☕</div>
      <div class="authority-name">ETHIOPIAN COFFEE AND TEA AUTHORITY</div>
      <div class="authority-name-amharic">የኢትዮጵያ ቡና እና ሻይ ባለስልጣን</div>
      <div class="certificate-title">Coffee Laboratory Certification</div>
      <div class="certificate-number">Certification No: ${data.certificationNumber}</div>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="section">
          <div class="section-title">Laboratory Information</div>
          <div class="info-row">
            <span class="info-label">Laboratory Name:</span>
            <span class="info-value">${data.laboratoryName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${data.address}</span>
          </div>
          ${data.city && data.region ? `
          <div class="info-row">
            <span class="info-label">Location:</span>
            <span class="info-value">${data.city}, ${data.region}</span>
          </div>
          ` : ''}
          <div class="section-title" style="margin-top: 2mm;">Facilities</div>
          <div class="info-row">
            <span class="info-label">Roasting Facility:</span>
            <span class="info-value">${data.hasRoastingFacility ? 'Available ✓' : 'Not Available'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cupping Room:</span>
            <span class="info-value">${data.hasCuppingRoom ? 'Available ✓' : 'Not Available'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Sample Storage:</span>
            <span class="info-value">${data.hasSampleStorage ? 'Available ✓' : 'Not Available'}</span>
          </div>
          ${data.lastInspectionDate ? `
          <div class="info-row">
            <span class="info-label">Last Inspection:</span>
            <span class="info-value">${data.lastInspectionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          ` : ''}
          ${data.inspectedBy ? `
          <div class="info-row">
            <span class="info-label">Inspected By:</span>
            <span class="info-value">${data.inspectedBy}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">Owner Information</div>
          <div class="info-row">
            <span class="info-label">Business Name:</span>
            <span class="info-value">${data.businessName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Business Type:</span>
            <span class="info-value">${data.businessType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">TIN:</span>
            <span class="info-value">${data.tin}</span>
          </div>
          ${data.phone ? `
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${data.phone}</span>
          </div>
          ` : ''}
          ${data.email ? `
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${data.email}</span>
          </div>
          ` : ''}
          <div class="section-title" style="margin-top: 2mm;">Approval Details</div>
          <div class="info-row">
            <span class="info-label">Approved By:</span>
            <span class="info-value">${data.approvedBy}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Approval Date:</span>
            <span class="info-value">${data.approvedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
      
      <div class="certification-statement">
        <strong>CERTIFICATION:</strong> This is to certify that <strong>${data.laboratoryName}</strong> has been inspected and approved by the Ethiopian Coffee and Tea Authority as meeting all requirements for coffee quality testing and analysis. The laboratory is equipped with appropriate facilities, equipment, and qualified personnel to conduct coffee quality assessment, cupping, and grading in accordance with ECTA standards and Ethiopian coffee export regulations.
      </div>
      
      <div class="requirements">
        <div class="requirements-title">CERTIFICATION REQUIREMENTS & RESPONSIBILITIES:</div>
        <ul>
          <li>Maintain laboratory equipment in proper working condition with regular calibration</li>
          <li>Employ qualified coffee tasters with valid ECTA proficiency certificates</li>
          <li>Conduct coffee quality testing using standardized protocols and procedures</li>
          <li>Maintain proper sample storage conditions and chain of custody documentation</li>
          <li>Keep accurate records of all coffee samples tested and quality assessments</li>
          <li>Participate in ECTA proficiency testing and quality assurance programs</li>
          <li>Report any equipment failures or quality issues to ECTA immediately</li>
          <li>Allow ECTA inspectors access to facilities for periodic audits and inspections</li>
          <li>Maintain hygiene and safety standards in all laboratory operations</li>
          <li>Renew certification before expiry date and undergo re-inspection as required</li>
          <li>Adhere to ethical standards and avoid conflicts of interest in quality assessment</li>
          <li>Stay updated on ECTA standards and international coffee quality best practices</li>
        </ul>
      </div>
      
      <div class="validity-box">
        <strong>VALIDITY PERIOD:</strong> ${data.certifiedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to ${data.expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
    
    <div class="footer">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-name">${data.approvedBy}</div>
        <div class="signature-title">ECTA Authorized Signatory</div>
        <div class="signature-date">${data.approvedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      <div class="qr-block">
        <img src="${data.qrCodeData}" alt="Verification QR Code" class="qr-code"/>
        <div class="qr-text">Scan to verify authenticity</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export default new ECTAPDFGenerationService();
