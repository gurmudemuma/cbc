/**
 * Compact Single-Page Certificate PDF Generator
 * Generates professional single-page certificates following best practices
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Ensure certificates directory exists
const CERT_DIR = path.join(__dirname, '../../certificates');
if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
}

/**
 * Generate QR code as data URL
 */
async function generateQRCode(data) {
    try {
        return await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 150,
            margin: 1
        });
    } catch (error) {
        console.error('QR code generation error:', error);
        throw error;
    }
}

/**
 * Generate Competence Certificate (Single Page - Two Column Layout)
 */
async function generateCompetenceCertificate(certificate, exporterData) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `COMP-${certificate.certificateId}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ 
                margin: 25,
                size: 'A4',
                bufferPages: true
            });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('COMPETENCE CERTIFICATE', 25, 25, { align: 'center' });
            
            doc.fontSize(6)
               .font('Helvetica')
               .text('Ethiopian Coffee & Tea Authority', 25, 40, { align: 'center' });
            
            // Horizontal line
            doc.moveTo(25, 50).lineTo(575, 50).stroke();
            
            let y = 58;
            const col1X = 25;
            const col2X = 310;
            const colWidth = 260;
            
            // Certificate Number & Issue Date
            doc.fontSize(6).font('Helvetica-Bold').text('Certificate Number:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(certificate.certificateId, col1X + 85, y);
            
            doc.fontSize(6).font('Helvetica-Bold').text('Issue Date:', col2X, y);
            doc.fontSize(6).font('Helvetica').text(new Date(certificate.issuedAt).toLocaleDateString(), col2X + 55, y);
            
            y += 10;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Valid Until:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(new Date(certificate.expiryDate).toLocaleDateString(), col1X + 85, y);
            
            doc.fontSize(6).font('Helvetica-Bold').text('Status:', col2X, y);
            doc.fontSize(6).font('Helvetica').text('APPROVED', col2X + 55, y);
            
            y += 15;
            
            // EXPORTER INFORMATION (Left Column)
            doc.fontSize(6).font('Helvetica-Bold').text('EXPORTER INFORMATION', col1X, y);
            y += 9;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Company Name:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(exporterData.business_name || 'N/A', col1X + 85, y);
            y += 8;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Exporter ID:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(exporterData.username || 'N/A', col1X + 85, y);
            y += 8;
            
            doc.fontSize(6).font('Helvetica-Bold').text('TIN:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(exporterData.tin || 'N/A', col1X + 85, y);
            y += 8;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Business Type:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(exporterData.business_type || 'N/A', col1X + 85, y);
            
            // QUALIFICATION DETAILS (Right Column)
            let ry = y - 32;
            doc.fontSize(6).font('Helvetica-Bold').text('QUALIFICATION DETAILS', col2X, ry);
            ry += 9;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Training Program:', col2X, ry);
            doc.fontSize(6).font('Helvetica').text('Coffee Export Competence', col2X + 85, ry);
            ry += 8;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Training Duration:', col2X, ry);
            doc.fontSize(6).font('Helvetica').text('40 hours', col2X + 85, ry);
            ry += 8;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Training Provider:', col2X, ry);
            doc.fontSize(6).font('Helvetica').text('ECTA Training Center', col2X + 85, ry);
            ry += 8;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Assessment Score:', col2X, ry);
            doc.fontSize(6).font('Helvetica').text('Pass', col2X + 85, ry);
            ry += 8;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Assessment Date:', col2X, ry);
            doc.fontSize(6).font('Helvetica').text(new Date(certificate.issuedAt).toLocaleDateString(), col2X + 85, ry);
            
            y += 40;
            
            // COMPETENCIES COVERED (Full Width)
            doc.fontSize(6).font('Helvetica-Bold').text('COMPETENCIES COVERED', col1X, y);
            y += 9;
            
            const competencies = [
                '1. Coffee Quality Standards and Grading',
                '2. Ethiopian Coffee Export Regulations',
                '3. International Trade Documentation',
                '4. Supply Chain Management',
                '5. Quality Control and Assurance',
                '6. Traceability and Certification Requirements',
                '7. EUDR Compliance and GPS Tracking',
                '8. Export Procedures and Customs Clearance'
            ];
            
            // Split into 2 columns
            const mid = Math.ceil(competencies.length / 2);
            const col1Competencies = competencies.slice(0, mid);
            const col2Competencies = competencies.slice(mid);
            
            let cy = y;
            col1Competencies.forEach(comp => {
                doc.fontSize(6).font('Helvetica').text(comp, col1X, cy, { width: colWidth });
                cy += 8;
            });
            
            cy = y;
            col2Competencies.forEach(comp => {
                doc.fontSize(6).font('Helvetica').text(comp, col2X, cy, { width: colWidth });
                cy += 8;
            });
            
            y += 40;
            
            // Certification Statement
            doc.fontSize(6).font('Helvetica-Bold').text('CERTIFICATION STATEMENT', col1X, y);
            y += 8;
            
            const statement = 'This certificate confirms that the holder has successfully completed the Coffee Export Competence Training program and demonstrated proficiency in all required competencies. The holder is authorized to perform coffee quality assessment, grading, and export certification activities in accordance with Ethiopian coffee export regulations and international standards.';
            
            doc.fontSize(6).font('Helvetica').text(statement, col1X, y, { 
                width: 550, 
                align: 'justify',
                lineGap: 1.5
            });
            
            y += 28;
            
            // Signature area
            doc.moveTo(col1X, y).lineTo(575, y).stroke();
            y += 4;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Authorized by ECTA', col1X, y);
            doc.fontSize(6).font('Helvetica').text('Date: ' + new Date().toLocaleDateString(), col2X, y);
            
            // QR Code (bottom right)
            const qrCodeData = await generateQRCode(`https://ecta.gov.et/verify/${certificate.certificateId}`);
            const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
            doc.image(qrImage, 500, 745, { width: 50, height: 50 });
            
            doc.fontSize(6).font('Helvetica').text('Scan to verify', 500, 800, { width: 50, align: 'center' });
            
            doc.end();
            
            stream.on('finish', () => {
                resolve({ filepath, filename });
            });
            
            stream.on('error', reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Export License (Single Page)
 */
async function generateExportLicense(certificate, exporterData) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `LIC-${certificate.licenseId}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ 
                margin: 25,
                size: 'A4',
                bufferPages: true
            });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('EXPORT LICENSE', 30, 30, { align: 'center' });
            
            doc.fontSize(6)
               .font('Helvetica')
               .text('Ethiopian Coffee & Tea Authority', 30, 48, { align: 'center' });
            
            // Horizontal line
            doc.moveTo(30, 60).lineTo(570, 60).stroke();
            
            let y = 70;
            
            // License Details (2 columns)
            const col1X = 30;
            const col2X = 310;
            
            doc.fontSize(6).font('Helvetica-Bold').text('License Number:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(certificate.licenseId, col1X + 110, y);
            
            doc.fontSize(6).font('Helvetica-Bold').text('Issue Date:', col2X, y);
            doc.fontSize(6).font('Helvetica').text(new Date(certificate.issuedAt).toLocaleDateString(), col2X + 70, y);
            
            y += 15;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Exporter:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(exporterData.businessName || 'N/A', col1X + 110, y);
            
            doc.fontSize(6).font('Helvetica-Bold').text('Expiry Date:', col2X, y);
            doc.fontSize(6).font('Helvetica').text(new Date(certificate.expiryDate).toLocaleDateString(), col2X + 70, y);
            
            y += 15;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Registration No:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(exporterData.registrationNumber || 'N/A', col1X + 110, y);
            
            doc.fontSize(6).font('Helvetica-Bold').text('Status:', col2X, y);
            doc.fontSize(6).font('Helvetica').text('ACTIVE', col2X + 70, y);
            
            y += 20;
            
            // License Details
            doc.fontSize(6).font('Helvetica-Bold').text('License Details', 30, y);
            y += 12;
            
            doc.fontSize(6).font('Helvetica-Bold').text('License Type:', col1X, y);
            doc.fontSize(6).font('Helvetica').text('General Export', col1X + 110, y);
            
            doc.fontSize(6).font('Helvetica-Bold').text('License Category:', col2X, y);
            doc.fontSize(6).font('Helvetica').text('Commercial', col2X + 70, y);
            
            y += 15;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Annual Quota:', col1X, y);
            doc.fontSize(6).font('Helvetica').text('Unlimited', col1X + 110, y);
            
            doc.fontSize(6).font('Helvetica-Bold').text('Validity Period:', col2X, y);
            doc.fontSize(6).font('Helvetica').text('1 Year', col2X + 70, y);
            
            y += 20;
            
            // Authorized Products
            doc.fontSize(6).font('Helvetica-Bold').text('Authorized Products', 30, y);
            y += 12;
            
            const products = [
                '• Arabica Coffee (Washed & Natural)',
                '• Robusta Coffee',
                '• Coffee Derivatives (Instant, Roasted)',
                '• Coffee By-products'
            ];
            
            products.forEach(product => {
                doc.fontSize(6).font('Helvetica').text(product, 40, y);
                y += 10;
            });
            
            y += 5;
            
            // License Terms
            doc.fontSize(6).font('Helvetica-Bold').text('License Terms & Conditions', 30, y);
            y += 10;
            
            const terms = 'This license authorizes the holder to export coffee and coffee products in accordance with Ethiopian export regulations. The holder must maintain quality standards, comply with all documentation requirements, and renew the license annually.';
            
            doc.fontSize(6).font('Helvetica').text(terms, 30, y, { 
                width: 540, 
                align: 'justify',
                lineGap: 2
            });
            
            y += 30;
            
            // Signature area
            doc.moveTo(30, y).lineTo(570, y).stroke();
            y += 5;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Authorized by ECTA', 30, y);
            doc.fontSize(6).font('Helvetica').text('Date: ' + new Date().toLocaleDateString(), 200, y);
            
            // QR Code
            const qrCodeData = await generateQRCode(`https://ecta.gov.et/verify/${certificate.licenseId}`);
            const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
            doc.image(qrImage, 490, 720, { width: 60, height: 60 });
            
            doc.fontSize(6).font('Helvetica').text('Scan to verify', 490, 785, { width: 60, align: 'center' });
            
            doc.end();
            
            stream.on('finish', () => {
                resolve({ filepath, filename });
            });
            
            stream.on('error', reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Laboratory Certificate (Single Page)
 */
async function generateLaboratoryCertificate(certificate, exporterData) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `LAB-${certificate.certificateNumber}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({
                margin: 25,
                size: 'A4',
                bufferPages: true
            });
            const stream = fs.createWriteStream(filepath);

            doc.pipe(stream);

            // Header
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('LABORATORY CERTIFICATE', 25, 25, { align: 'center' });

            doc.fontSize(6)
               .font('Helvetica')
               .text('Ethiopian Coffee & Tea Authority', 25, 40, { align: 'center' });

            // Horizontal line
            doc.moveTo(25, 50).lineTo(575, 50).stroke();

            let y = 58;
            const col1X = 25;
            const col2X = 310;
            const colWidth = 260;

            // Certificate Details
            doc.fontSize(6).font('Helvetica-Bold').text('Certificate Number:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(certificate.certificateNumber, col1X + 85, y);

            doc.fontSize(6).font('Helvetica-Bold').text('Issue Date:', col2X, y);
            doc.fontSize(6).font('Helvetica').text(new Date(certificate.issuedAt).toLocaleDateString(), col2X + 55, y);

            y += 10;

            doc.fontSize(6).font('Helvetica-Bold').text('Valid Until:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(new Date(certificate.expiryDate).toLocaleDateString(), col1X + 85, y);

            doc.fontSize(6).font('Helvetica-Bold').text('Status:', col2X, y);
            doc.fontSize(6).font('Helvetica').text('APPROVED', col2X + 55, y);

            y += 15;

            // EXPORTER INFORMATION (Left Column)
            doc.fontSize(6).font('Helvetica-Bold').text('EXPORTER INFORMATION', col1X, y);
            y += 9;

            doc.fontSize(6).font('Helvetica-Bold').text('Company Name:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(exporterData.business_name || 'N/A', col1X + 85, y);
            y += 8;

            doc.fontSize(6).font('Helvetica-Bold').text('Exporter ID:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(exporterData.username || 'N/A', col1X + 85, y);
            y += 8;

            doc.fontSize(6).font('Helvetica-Bold').text('TIN:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(exporterData.tin || 'N/A', col1X + 85, y);
            y += 8;

            doc.fontSize(6).font('Helvetica-Bold').text('Contact Person:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(exporterData.contact_person || 'N/A', col1X + 85, y);

            // LABORATORY ACCREDITATION (Right Column)
            let ry = y - 32;
            doc.fontSize(6).font('Helvetica-Bold').text('LABORATORY ACCREDITATION', col2X, ry);
            ry += 9;

            doc.fontSize(6).font('Helvetica-Bold').text('Laboratory Name:', col2X, ry);
            doc.fontSize(6).font('Helvetica').text('ECTA Certified Lab', col2X + 85, ry);
            ry += 8;

            doc.fontSize(6).font('Helvetica-Bold').text('Accreditation:', col2X, ry);
            doc.fontSize(6).font('Helvetica').text('ISO 17025 Certified', col2X + 85, ry);
            ry += 8;

            doc.fontSize(6).font('Helvetica-Bold').text('Scope:', col2X, ry);
            doc.fontSize(6).font('Helvetica').text('Coffee Quality Testing', col2X + 85, ry);
            ry += 8;

            doc.fontSize(6).font('Helvetica-Bold').text('Accreditation Body:', col2X, ry);
            doc.fontSize(6).font('Helvetica').text('ECTA', col2X + 85, ry);

            y += 40;

            // TESTING CAPABILITIES (Full Width)
            doc.fontSize(6).font('Helvetica-Bold').text('TESTING CAPABILITIES', col1X, y);
            y += 9;

            const capabilities = [
                '1. Physical & Sensory Analysis',
                '2. Moisture & Defect Analysis',
                '3. Chemical Composition Testing',
                '4. Microbial & Pesticide Analysis',
                '5. Cupping & Flavor Profiling',
                '6. Screen Size & Density Testing'
            ];

            // Split into 2 columns
            const mid = Math.ceil(capabilities.length / 2);
            const col1Caps = capabilities.slice(0, mid);
            const col2Caps = capabilities.slice(mid);

            let cy = y;
            col1Caps.forEach(cap => {
                doc.fontSize(6).font('Helvetica').text(cap, col1X, cy, { width: colWidth });
                cy += 8;
            });

            cy = y;
            col2Caps.forEach(cap => {
                doc.fontSize(6).font('Helvetica').text(cap, col2X, cy, { width: colWidth });
                cy += 8;
            });

            y += 30;

            // Certification Statement
            doc.fontSize(6).font('Helvetica-Bold').text('CERTIFICATION STATEMENT', col1X, y);
            y += 8;

            const statement = 'This certificate confirms that the laboratory is accredited to perform coffee quality testing and analysis. All tests are conducted according to international standards (ISO 17025) and ECTA guidelines. The laboratory maintains strict quality control procedures and participates in regular proficiency testing programs.';

            doc.fontSize(6).font('Helvetica').text(statement, col1X, y, {
                width: 550,
                align: 'justify',
                lineGap: 1.5
            });

            y += 25;

            // Signature area
            doc.moveTo(col1X, y).lineTo(575, y).stroke();
            y += 4;

            doc.fontSize(6).font('Helvetica-Bold').text('Authorized by ECTA', col1X, y);
            doc.fontSize(6).font('Helvetica').text('Date: ' + new Date().toLocaleDateString(), col2X, y);

            // QR Code
            const qrCodeData = await generateQRCode(`https://ecta.gov.et/verify/${certificate.certificateNumber}`);
            const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
            doc.image(qrImage, 500, 745, { width: 50, height: 50 });

            doc.fontSize(6).font('Helvetica').text('Scan to verify', 500, 800, { width: 50, align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve({ filepath, filename });
            });

            stream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
}


/**
 * Generate Taster Certificate (Single Page)
 */
async function generateTasterCertificate(certificate, exporterData) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `TASTER-${certificate.certificateNumber}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ 
                margin: 25,
                size: 'A4',
                bufferPages: true
            });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('TASTER CERTIFICATE', 30, 30, { align: 'center' });
            
            doc.fontSize(6)
               .font('Helvetica')
               .text('Ethiopian Coffee & Tea Authority', 30, 48, { align: 'center' });
            
            // Horizontal line
            doc.moveTo(30, 60).lineTo(570, 60).stroke();
            
            let y = 70;
            
            // Certificate Details
            const col1X = 30;
            const col2X = 310;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Certificate Number:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(certificate.certificateNumber, col1X + 110, y);
            
            doc.fontSize(6).font('Helvetica-Bold').text('Issue Date:', col2X, y);
            doc.fontSize(6).font('Helvetica').text(new Date(certificate.issuedAt).toLocaleDateString(), col2X + 70, y);
            
            y += 15;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Exporter:', col1X, y);
            doc.fontSize(6).font('Helvetica').text(exporterData.businessName || 'N/A', col1X + 110, y);
            
            doc.fontSize(6).font('Helvetica-Bold').text('Expiry Date:', col2X, y);
            doc.fontSize(6).font('Helvetica').text(new Date(certificate.expiryDate).toLocaleDateString(), col2X + 70, y);
            
            y += 20;
            
            // Taster Qualification
            doc.fontSize(6).font('Helvetica-Bold').text('Taster Qualification', 30, y);
            y += 12;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Qualification Level:', col1X, y);
            doc.fontSize(6).font('Helvetica').text('Professional Cupper', col1X + 110, y);
            
            doc.fontSize(6).font('Helvetica-Bold').text('Certification Type:', col2X, y);
            doc.fontSize(6).font('Helvetica').text('ECTA Certified', col2X + 70, y);
            
            y += 15;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Training Hours:', col1X, y);
            doc.fontSize(6).font('Helvetica').text('120+ Hours', col1X + 110, y);
            
            doc.fontSize(6).font('Helvetica-Bold').text('Validity:', col2X, y);
            doc.fontSize(6).font('Helvetica').text('2 Years', col2X + 70, y);
            
            y += 20;
            
            // Authorized Activities
            doc.fontSize(6).font('Helvetica-Bold').text('Authorized Activities', 30, y);
            y += 12;
            
            const activities = [
                '• Coffee Cupping & Sensory Evaluation',
                '• Quality Grading & Classification',
                '• Flavor Profile Assessment',
                '• Export Quality Certification'
            ];
            
            activities.forEach(activity => {
                doc.fontSize(6).font('Helvetica').text(activity, 40, y);
                y += 10;
            });
            
            y += 5;
            
            // Certification Statement
            doc.fontSize(6).font('Helvetica-Bold').text('Certification Statement', 30, y);
            y += 10;
            
            const statement = 'This certificate confirms that the holder has completed professional coffee tasting training and is qualified to perform cupping and sensory evaluation of coffee in accordance with ECTA standards.';
            
            doc.fontSize(6).font('Helvetica').text(statement, 30, y, { 
                width: 540, 
                align: 'justify',
                lineGap: 2
            });
            
            y += 30;
            
            // Signature area
            doc.moveTo(30, y).lineTo(570, y).stroke();
            y += 5;
            
            doc.fontSize(6).font('Helvetica-Bold').text('Authorized by ECTA', 30, y);
            doc.fontSize(6).font('Helvetica').text('Date: ' + new Date().toLocaleDateString(), 200, y);
            
            // QR Code
            const qrCodeData = await generateQRCode(`https://ecta.gov.et/verify/${certificate.certificateNumber}`);
            const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
            doc.image(qrImage, 490, 720, { width: 60, height: 60 });
            
            doc.fontSize(6).font('Helvetica').text('Scan to verify', 490, 785, { width: 60, align: 'center' });
            
            doc.end();
            
            stream.on('finish', () => {
                resolve({ filepath, filename });
            });
            
            stream.on('error', reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateCompetenceCertificate,
    generateExportLicense,
    generateLaboratoryCertificate,
    generateTasterCertificate
};

