
import { Pool } from 'pg';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import QRCode from 'qrcode';
import puppeteer from 'puppeteer';

// Database configuration from env
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'coffee_export_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

class LocalPDFService {
  private storageBasePath: string;

  constructor() {
    this.storageBasePath = path.join(process.cwd(), 'storage', 'certificates');
  }

  private async generateQRCode(text: string, verifyUrl: string): Promise<string> {
    const qrData = JSON.stringify({
      id: text,
      url: verifyUrl,
      timestamp: new Date().toISOString()
    });
    return await QRCode.toDataURL(qrData);
  }

  public async generatePDF(
    id: string,
    data: any,
    type: 'certificate' | 'license'
  ): Promise<{ filePath: string; fileSizeBytes: number }> {
    // Ensure storage directory exists
    if (!existsSync(this.storageBasePath)) {
      await fs.mkdir(this.storageBasePath, { recursive: true });
    }

    // Generate QR code for verification
    const verificationUrl = `http://localhost:3003/verify/${type}/${data.number}`;
    const qrCodeData = await this.generateQRCode(data.number, verificationUrl);

    const title = type === 'certificate' ? 'COMPETENCE CERTIFICATE' : 'EXPORT LICENSE';
    const filenamePrefix = type === 'certificate' ? 'competence' : 'license';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; }
    .title { font-size: 32px; font-weight: bold; color: #2C3E50; margin: 10px 0; }
    .subtitle { font-size: 18px; color: #7F8C8D; letter-spacing: 2px; }
    .content { padding: 20px; line-height: 1.6; }
    .certificate-details { background: #f9f9f9; padding: 20px; border: 1px solid #eee; margin: 20px 0; }
    .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
    .signature-line { border-top: 1px solid #333; width: 200px; margin-bottom: 5px; }
    .qr-section { text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${title}</div>
    <div class="subtitle">ETHIOPIAN COFFEE & TEA AUTHORITY</div>
    <div>No: ${data.number}</div>
  </div>
  
  <div class="content">
    <p>This is to certify that:</p>
    <h2>${data.businessName}</h2>
    <p>TIN: ${data.tin}</p>
    <p>Has successfully met all the requirements...</p>
    
    <div class="certificate-details">
      <p><strong>Business Type:</strong> ${data.businessType}</p>
      <p><strong>Valid From:</strong> ${data.issuedDate.toLocaleDateString()}</p>
      <p><strong>Valid Until:</strong> ${data.expiryDate.toLocaleDateString()}</p>
    </div>
  </div>
  
  <div class="footer">
    <div>
      <div class="signature-line"></div>
      <div>Authorized Signature</div>
      <div>Date: ${new Date().toLocaleDateString()}</div>
    </div>
    <div class="qr-section">
      <img src="${qrCodeData}" width="100" />
    </div>
  </div>
</body>
</html>
     `;

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent);

    const fileName = `${filenamePrefix}-${id}.pdf`;
    const filePath = path.join(this.storageBasePath, fileName);

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    await browser.close();
    const stats = await fs.stat(filePath);

    return {
      filePath: fileName, // Return relative path as stored in DB
      fileSizeBytes: stats.size
    };
  }
}

const pdfService = new LocalPDFService();

async function regenerateEverything() {
  const TARGET_EXPORTER_ID = 'ea36ffad-3a08-44ac-867a-df98f0c46df3';

  try {
    console.log('Connecting to database...');

    // 1. Get Exporter Details
    const exporterRes = await pool.query(`SELECT business_name, tin, business_type FROM exporter_profiles WHERE exporter_id::text = $1`, [TARGET_EXPORTER_ID]);
    const exporter = exporterRes.rows[0];

    if (!exporter) {
      console.log('Exporter not found!');
      process.exit(1);
    }

    console.log(`Processing for: ${exporter.business_name}`);

    // 2. Repair Competence Certificate
    console.log('--- Repairing Competence Certificate ---');
    const certQuery = `SELECT certificate_id, certificate_number, valid_from, valid_until FROM competence_certificates WHERE exporter_id::text = $1 AND status = 'ACTIVE'`;
    const certRes = await pool.query(certQuery, [TARGET_EXPORTER_ID]);

    if (certRes.rows.length > 0) {
      const cert = certRes.rows[0];
      console.log(`Found Certificate: ${cert.certificate_number}`);

      const result = await pdfService.generatePDF(cert.certificate_id, {
        number: cert.certificate_number,
        issuedDate: new Date(cert.valid_from),
        expiryDate: new Date(cert.valid_until),
        businessName: exporter.business_name,
        businessType: exporter.business_type || 'Coffee Exporter',
        tin: exporter.tin || 'N/A'
      }, 'certificate');

      console.log(`Certificate PDF Generated: ${result.filePath}`);

      await pool.query(
        `UPDATE competence_certificates SET file_path = $1, file_size_bytes = $2 WHERE certificate_id::text = $3`,
        [result.filePath, result.fileSizeBytes, cert.certificate_id]
      );
      console.log('Certificate DB updated.');
    } else {
      console.log('No active certificate found.');
    }

    // 3. Repair Export License
    console.log('--- Repairing Export License ---');
    const licQuery = `SELECT license_id, license_number, issue_date, expiry_date FROM export_licenses WHERE exporter_id::text = $1 AND status = 'ACTIVE'`;
    const licRes = await pool.query(licQuery, [TARGET_EXPORTER_ID]);

    if (licRes.rows.length > 0) {
      const lic = licRes.rows[0];
      console.log(`Found License: ${lic.license_number}`);

      const result = await pdfService.generatePDF(lic.license_id, {
        number: lic.license_number,
        issuedDate: new Date(lic.issue_date),
        expiryDate: new Date(lic.expiry_date),
        businessName: exporter.business_name,
        businessType: exporter.business_type || 'Coffee Exporter',
        tin: exporter.tin || 'N/A'
      }, 'license');

      console.log(`License PDF Generated: ${result.filePath}`);

      await pool.query(
        `UPDATE export_licenses SET file_path = $1, file_size_bytes = $2 WHERE license_id::text = $3`,
        [result.filePath, result.fileSizeBytes, lic.license_id]
      );
      console.log('License DB updated.');
    } else {
      console.log('No active license found.');
    }

  } catch (error: any) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

regenerateEverything();
