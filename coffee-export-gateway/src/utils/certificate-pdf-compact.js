/**
 * Professional Branded Certificate PDF Generator
 * Ethiopian Coffee & Tea Authority Official Certificates
 * With government branding, colors, and professional design
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

// Professional margins for A4 (595.28 x 841.89 points)
const MARGINS = {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;

// Ethiopian Government Colors
const COLORS = {
    ethiopianGreen: '#078930',
    ethiopianYellow: '#FCDD09',
    ethiopianRed: '#DA121A',
    gold: '#D4AF37',
    darkGreen: '#006838',
    lightGreen: '#E8F5E9',
    textDark: '#1A1A1A',
    textGray: '#4A4A4A',
    borderGold: '#B8860B'
};

/**
 * Generate QR code as data URL
 */
async function generateQRCode(data) {
    try {
        return await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 120,
            margin: 1
        });
    } catch (error) {
        console.error('QR code generation error:', error);
        throw error;
    }
}

/**
 * Draw decorative border with Ethiopian colors
 */
function drawDecorativeBorder(doc) {
    // Outer border - Ethiopian Green
    doc.lineWidth(3)
       .strokeColor(COLORS.ethiopianGreen)
       .rect(20, 20, PAGE_WIDTH - 40, PAGE_HEIGHT - 40)
       .stroke();
    
    // Inner border - Gold
    doc.lineWidth(1)
       .strokeColor(COLORS.borderGold)
       .rect(25, 25, PAGE_WIDTH - 50, PAGE_HEIGHT - 50)
       .stroke();
    
    // Corner decorations
    const cornerSize = 30;
    const corners = [
        [30, 30], // top-left
        [PAGE_WIDTH - 30, 30], // top-right
        [30, PAGE_HEIGHT - 30], // bottom-left
        [PAGE_WIDTH - 30, PAGE_HEIGHT - 30] // bottom-right
    ];
    
    corners.forEach(([x, y]) => {
        doc.lineWidth(2)
           .strokeColor(COLORS.gold)
           .moveTo(x - cornerSize/2, y)
           .lineTo(x + cornerSize/2, y)
           .stroke()
           .moveTo(x, y - cornerSize/2)
           .lineTo(x, y + cornerSize/2)
           .stroke();
    });
}

/**
 * Draw Ethiopian flag stripe at top
 */
function drawEthiopianStripe(doc, y) {
    const stripeHeight = 8;
    const stripeWidth = CONTENT_WIDTH / 3;
    
    // Green stripe
    doc.rect(MARGINS.left, y, stripeWidth, stripeHeight)
       .fillColor(COLORS.ethiopianGreen)
       .fill();
    
    // Yellow stripe
    doc.rect(MARGINS.left + stripeWidth, y, stripeWidth, stripeHeight)
       .fillColor(COLORS.ethiopianYellow)
       .fill();
    
    // Red stripe
    doc.rect(MARGINS.left + (stripeWidth * 2), y, stripeWidth, stripeHeight)
       .fillColor(COLORS.ethiopianRed)
       .fill();
    
    return y + stripeHeight + 5;
}

/**
 * Draw official seal/emblem placeholder
 */
function drawOfficialSeal(doc, x, y, size) {
    // Outer circle - Gold
    doc.circle(x, y, size)
       .lineWidth(2)
       .strokeColor(COLORS.gold)
       .stroke();
    
    // Inner circle - Green
    doc.circle(x, y, size - 5)
       .lineWidth(1)
       .strokeColor(COLORS.ethiopianGreen)
       .stroke();
    
    // Center star (simplified)
    doc.fontSize(size - 10)
       .fillColor(COLORS.gold)
       .text('★', x - (size - 10)/2, y - (size - 10)/2, {
           width: size - 10,
           align: 'center'
       });
    
    // Text around seal
    doc.fontSize(6)
       .fillColor(COLORS.darkGreen)
       .text('ECTA', x - 15, y + size + 5, { width: 30, align: 'center' });
}

/**
 * Add watermark
 */
function addWatermark(doc) {
    doc.save();
    doc.opacity(0.05)
       .fontSize(80)
       .fillColor(COLORS.ethiopianGreen)
       .text('ECTA', 0, PAGE_HEIGHT / 2 - 40, {
           width: PAGE_WIDTH,
           align: 'center'
       });
    doc.restore();
}

/**
 * Generate Competence Certificate (Professional Branded Design)
 */
async function generateCompetenceCertificate(certificate, exporterData) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `COMP-${certificate.certificateId}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ 
                margin: 0,
                size: 'A4',
                bufferPages: true
            });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Add watermark
            addWatermark(doc);
            
            // Draw decorative border
            drawDecorativeBorder(doc);
            
            let y = MARGINS.top;
            
            // Ethiopian flag stripe
            y = drawEthiopianStripe(doc, y);
            y += 10;
            
            // Official seal (left side)
            drawOfficialSeal(doc, MARGINS.left + 30, y + 25, 25);
            
            // Header with government branding
            doc.fontSize(20)
               .font('Helvetica-Bold')
               .fillColor(COLORS.darkGreen)
               .text('FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA', MARGINS.left, y, { 
                   width: CONTENT_WIDTH, 
                   align: 'center' 
               });
            
            y += 28;
            
            doc.fontSize(16)
               .fillColor(COLORS.ethiopianGreen)
               .text('Ethiopian Coffee & Tea Authority', MARGINS.left, y, { 
                   width: CONTENT_WIDTH, 
                   align: 'center' 
               });
            
            y += 24;
            
            doc.fontSize(10)
               .fillColor(COLORS.textGray)
               .text('Ministry of Agriculture', MARGINS.left, y, { 
                   width: CONTENT_WIDTH, 
                   align: 'center' 
               });
            
            y += 30;
            
            // Certificate title with decorative line
            doc.moveTo(MARGINS.left + 50, y).lineTo(PAGE_WIDTH - MARGINS.right - 50, y)
               .lineWidth(2)
               .strokeColor(COLORS.gold)
               .stroke();
            
            y += 18;
            
            doc.fontSize(18)
               .font('Helvetica-Bold')
               .fillColor(COLORS.ethiopianRed)
               .text('CERTIFICATE OF COMPETENCE', MARGINS.left, y, { 
                   width: CONTENT_WIDTH, 
                   align: 'center' 
               });
            
            y += 24;
            
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor(COLORS.textDark)
               .text('Coffee Export Professional Qualification', MARGINS.left, y, { 
                   width: CONTENT_WIDTH, 
                   align: 'center' 
               });
            
            y += 18;
            
            doc.moveTo(MARGINS.left + 50, y).lineTo(PAGE_WIDTH - MARGINS.right - 50, y)
               .lineWidth(2)
               .strokeColor(COLORS.gold)
               .stroke();
            
            y += 24;
            
            // Certificate details in box
            const boxY = y;
            doc.rect(MARGINS.left + 30, boxY, CONTENT_WIDTH - 60, 38)
               .fillColor(COLORS.lightGreen)
               .fill();
            
            y += 10;
            
            const col1X = MARGINS.left + 40;
            const col2X = MARGINS.left + (CONTENT_WIDTH / 2) + 10;
            
            doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.textDark)
               .text('Certificate No:', col1X, y, { continued: true })
               .font('Helvetica').text(' ' + (certificate.certificateNumber || certificate.certificateId));
            
            doc.fontSize(9).font('Helvetica-Bold')
               .text('Issue Date:', col2X, y, { continued: true })
               .font('Helvetica').text(' ' + new Date(certificate.issuedAt).toLocaleDateString());
            
            y += 14;
            
            doc.fontSize(9).font('Helvetica-Bold')
               .text('Valid Until:', col1X, y, { continued: true })
               .font('Helvetica').text(' ' + new Date(certificate.expiryDate).toLocaleDateString());
            
            doc.fontSize(9).font('Helvetica-Bold')
               .text('Status:', col2X, y, { continued: true })
               .font('Helvetica').fillColor(COLORS.ethiopianGreen).text(' APPROVED');
            
            y += 30;
            
            // This certifies statement
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor(COLORS.textDark)
               .text('This is to certify that', MARGINS.left, y, { 
                   width: CONTENT_WIDTH, 
                   align: 'center' 
               });
            
            y += 24;
            
            doc.fontSize(15)
               .font('Helvetica-Bold')
               .fillColor(COLORS.ethiopianGreen)
               .text((exporterData.business_name || 'N/A').toUpperCase(), MARGINS.left, y, { 
                   width: CONTENT_WIDTH, 
                   align: 'center' 
               });
            
            y += 22;
            
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor(COLORS.textGray)
               .text(`TIN: ${exporterData.tin || 'N/A'} | Exporter Code: ${exporterData.exporterCode || exporterData.exporter_id || 'N/A'}`, 
                   MARGINS.left, y, { width: CONTENT_WIDTH, align: 'center' });
            
            y += 30;
            
            // Main certification text with better spacing
            const certText = 'has successfully completed the Coffee Export Competence Training Program and demonstrated proficiency in all required competencies as mandated by the Ethiopian Coffee & Tea Authority. The holder is hereby authorized to perform coffee quality assessment, grading, and export certification activities in accordance with Ethiopian coffee export regulations and international standards.';
            
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor(COLORS.textDark)
               .text(certText, MARGINS.left + 40, y, { 
                   width: CONTENT_WIDTH - 80, 
                   align: 'justify',
                   lineGap: 5
               });
            
            y += 85;
            
            // Competencies section with better spacing
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .fillColor(COLORS.darkGreen)
               .text('Core Competencies:', MARGINS.left + 40, y);
            
            y += 18;
            
            const competencies = [
                'Coffee Quality Standards & Grading',
                'Export Regulations & Compliance',
                'International Trade Documentation',
                'Quality Control & Assurance',
                'Traceability & EUDR Compliance',
                'Export Procedures & Customs'
            ];
            
            const colWidth = (CONTENT_WIDTH - 80) / 2;
            const mid = Math.ceil(competencies.length / 2);
            let cy = y;
            
            for (let i = 0; i < mid; i++) {
                doc.fontSize(10).font('Helvetica').fillColor(COLORS.textDark)
                   .text(`• ${competencies[i]}`, MARGINS.left + 50, cy, { width: colWidth });
                if (i + mid < competencies.length) {
                    doc.text(`• ${competencies[i + mid]}`, MARGINS.left + 50 + colWidth + 20, cy, { width: colWidth });
                }
                cy += 14;
            }
            
            y = cy + 25;
            
            // Signature section
            const sigY = PAGE_HEIGHT - MARGINS.bottom - 80;
            
            doc.moveTo(MARGINS.left + 60, sigY).lineTo(MARGINS.left + 200, sigY)
               .lineWidth(1)
               .strokeColor(COLORS.textGray)
               .stroke();
            
            doc.moveTo(PAGE_WIDTH - MARGINS.right - 200, sigY).lineTo(PAGE_WIDTH - MARGINS.right - 60, sigY)
               .stroke();
            
            doc.fontSize(9)
               .font('Helvetica-Bold')
               .fillColor(COLORS.textDark)
               .text('Director, Training Center', MARGINS.left + 60, sigY + 5, { width: 140, align: 'center' });
            
            doc.text('Director General, ECTA', PAGE_WIDTH - MARGINS.right - 200, sigY + 5, { width: 140, align: 'center' });
            
            doc.fontSize(8)
               .font('Helvetica')
               .fillColor(COLORS.textGray)
               .text(new Date().toLocaleDateString(), MARGINS.left + 60, sigY + 18, { width: 140, align: 'center' })
               .text(new Date().toLocaleDateString(), PAGE_WIDTH - MARGINS.right - 200, sigY + 18, { width: 140, align: 'center' });
            
            // Official seal placeholder (bottom center)
            drawOfficialSeal(doc, PAGE_WIDTH / 2, sigY + 15, 20);
            
            // QR Code (bottom right corner)
            const qrY = PAGE_HEIGHT - MARGINS.bottom - 55;
            const qrCodeData = await generateQRCode(`https://ecta.gov.et/verify/${certificate.certificateId}`);
            const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
            doc.image(qrImage, PAGE_WIDTH - MARGINS.right - 50, qrY, { width: 45, height: 45 });
            
            doc.fontSize(6).fillColor(COLORS.textGray)
               .text('Scan to verify', PAGE_WIDTH - MARGINS.right - 50, qrY + 48, { width: 45, align: 'center' });
            
            // Footer text
            doc.fontSize(7)
               .fillColor(COLORS.textGray)
               .text('Addis Ababa, Ethiopia | www.ecta.gov.et | info@ecta.gov.et', 
                   MARGINS.left, PAGE_HEIGHT - MARGINS.bottom - 20, 
                   { width: CONTENT_WIDTH, align: 'center' });
            
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
 * Generate Export License (Single Page - Professional Layout)
 */
async function generateExportLicense(certificate, exporterData) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `LIC-${certificate.licenseId}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ 
                margin: 0,
                size: 'A4',
                bufferPages: true
            });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            let y = MARGINS.top;
            
            // Header
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .text('EXPORT LICENSE', MARGINS.left, y, { width: CONTENT_WIDTH, align: 'center' });
            
            y += 20;
            
            doc.fontSize(8)
               .font('Helvetica')
               .text('Ethiopian Coffee & Tea Authority', MARGINS.left, y, { width: CONTENT_WIDTH, align: 'center' });
            
            y += 15;
            
            // Horizontal line
            doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).stroke();
            
            y += 12;
            
            // Two-column layout
            const col1X = MARGINS.left;
            const col2X = MARGINS.left + (CONTENT_WIDTH / 2) + 10;
            const colWidth = (CONTENT_WIDTH / 2) - 10;
            
            // License Details
            doc.fontSize(8).font('Helvetica-Bold').text('License No:', col1X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + (certificate.licenseNumber || certificate.licenseId));
            
            doc.fontSize(8).font('Helvetica-Bold').text('Issue Date:', col2X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + new Date(certificate.issuedAt).toLocaleDateString());
            
            y += 12;
            
            doc.fontSize(8).font('Helvetica-Bold').text('Exporter:', col1X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + (exporterData.business_name || 'N/A'));
            
            doc.fontSize(8).font('Helvetica-Bold').text('Expiry Date:', col2X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + new Date(certificate.expiryDate).toLocaleDateString());
            
            y += 12;
            
            doc.fontSize(8).font('Helvetica-Bold').text('TIN:', col1X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + (exporterData.tin || 'N/A'));
            
            doc.fontSize(8).font('Helvetica-Bold').text('Status:', col2X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ACTIVE');
            
            y += 18;
            
            // License Details Section
            doc.fontSize(9).font('Helvetica-Bold').text('LICENSE DETAILS', MARGINS.left, y);
            y += 12;
            
            const licenseDetails = [
                ['License Type:', 'General Export'],
                ['Category:', 'Commercial'],
                ['Annual Quota:', 'Unlimited'],
                ['Validity Period:', '1 Year']
            ];
            
            licenseDetails.forEach(([label, value]) => {
                doc.fontSize(8).font('Helvetica-Bold').text(label, col1X, y, { width: 90, continued: true });
                doc.fontSize(8).font('Helvetica').text(' ' + value);
                y += 11;
            });
            
            y += 8;
            
            // Authorized Products
            doc.fontSize(9).font('Helvetica-Bold').text('AUTHORIZED PRODUCTS', MARGINS.left, y);
            y += 12;
            
            const products = [
                'Arabica Coffee (Washed & Natural)',
                'Robusta Coffee',
                'Coffee Derivatives (Instant, Roasted)',
                'Coffee By-products'
            ];
            
            products.forEach(product => {
                doc.fontSize(8).font('Helvetica').text('• ' + product, MARGINS.left + 10, y);
                y += 11;
            });
            
            y += 8;
            
            // License Terms
            doc.fontSize(9).font('Helvetica-Bold').text('LICENSE TERMS & CONDITIONS', MARGINS.left, y);
            y += 12;
            
            const terms = 'This license authorizes the holder to export coffee and coffee products in accordance with Ethiopian export regulations. The holder must maintain quality standards, comply with all documentation requirements, and renew the license annually. This license may be suspended or revoked for non-compliance with ECTA regulations.';
            
            doc.fontSize(8).font('Helvetica').text(terms, MARGINS.left, y, { 
                width: CONTENT_WIDTH, 
                align: 'justify',
                lineGap: 2
            });
            
            y += 45;
            
            // Signature line
            doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).stroke();
            y += 6;
            
            doc.fontSize(8).font('Helvetica-Bold').text('Authorized by ECTA', MARGINS.left, y);
            doc.fontSize(8).font('Helvetica').text('Date: ' + new Date().toLocaleDateString(), col2X, y);
            
            // QR Code (bottom right)
            const qrY = PAGE_HEIGHT - MARGINS.bottom - 60;
            const qrCodeData = await generateQRCode(`https://ecta.gov.et/verify/${certificate.licenseId}`);
            const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
            doc.image(qrImage, PAGE_WIDTH - MARGINS.right - 55, qrY, { width: 55, height: 55 });
            
            doc.fontSize(7).font('Helvetica').text('Scan to verify', PAGE_WIDTH - MARGINS.right - 55, qrY + 58, { width: 55, align: 'center' });
            
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
 * Generate Laboratory Certificate (Single Page - Professional Layout)
 */
async function generateLaboratoryCertificate(certificate, exporterData) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `LAB-${certificate.certificateNumber}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({
                margin: 0,
                size: 'A4',
                bufferPages: true
            });
            const stream = fs.createWriteStream(filepath);

            doc.pipe(stream);

            let y = MARGINS.top;

            // Header
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .text('LABORATORY CERTIFICATE', MARGINS.left, y, { width: CONTENT_WIDTH, align: 'center' });

            y += 20;

            doc.fontSize(8)
               .font('Helvetica')
               .text('Ethiopian Coffee & Tea Authority', MARGINS.left, y, { width: CONTENT_WIDTH, align: 'center' });

            y += 15;

            // Horizontal line
            doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).stroke();

            y += 12;

            // Two-column layout
            const col1X = MARGINS.left;
            const col2X = MARGINS.left + (CONTENT_WIDTH / 2) + 10;
            const colWidth = (CONTENT_WIDTH / 2) - 10;

            // Certificate Details
            doc.fontSize(8).font('Helvetica-Bold').text('Certificate No:', col1X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + certificate.certificateNumber);

            doc.fontSize(8).font('Helvetica-Bold').text('Issue Date:', col2X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + new Date(certificate.issuedAt).toLocaleDateString());

            y += 12;

            doc.fontSize(8).font('Helvetica-Bold').text('Valid Until:', col1X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + new Date(certificate.expiryDate).toLocaleDateString());

            doc.fontSize(8).font('Helvetica-Bold').text('Status:', col2X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' APPROVED');

            y += 18;

            // EXPORTER INFORMATION (Left Column)
            doc.fontSize(9).font('Helvetica-Bold').text('EXPORTER INFORMATION', col1X, y);
            y += 12;

            const exporterInfo = [
                ['Company:', exporterData.business_name || 'N/A'],
                ['Exporter Code:', exporterData.exporterCode || exporterData.exporter_id || 'N/A'],
                ['TIN:', exporterData.tin || 'N/A'],
                ['Contact:', exporterData.contact_person || 'N/A']
            ];

            let ey = y;
            exporterInfo.forEach(([label, value]) => {
                doc.fontSize(8).font('Helvetica-Bold').text(label, col1X, ey, { width: 70, continued: true });
                doc.fontSize(8).font('Helvetica').text(' ' + value, { width: colWidth - 70 });
                ey += 11;
            });

            // LABORATORY ACCREDITATION (Right Column)
            doc.fontSize(9).font('Helvetica-Bold').text('LABORATORY ACCREDITATION', col2X, y);
            y += 12;

            const labInfo = [
                ['Lab Name:', 'ECTA Certified Lab'],
                ['Accreditation:', 'ISO 17025 Certified'],
                ['Scope:', 'Coffee Quality Testing'],
                ['Body:', 'ECTA']
            ];

            let ly = y;
            labInfo.forEach(([label, value]) => {
                doc.fontSize(8).font('Helvetica-Bold').text(label, col2X, ly, { width: 80, continued: true });
                doc.fontSize(8).font('Helvetica').text(' ' + value, { width: colWidth - 80 });
                ly += 11;
            });

            y = Math.max(ey, ly) + 8;

            // TESTING CAPABILITIES (Full Width)
            doc.fontSize(9).font('Helvetica-Bold').text('TESTING CAPABILITIES', MARGINS.left, y);
            y += 12;

            const capabilities = [
                'Physical & Sensory Analysis',
                'Moisture & Defect Analysis',
                'Chemical Composition Testing',
                'Microbial & Pesticide Analysis',
                'Cupping & Flavor Profiling',
                'Screen Size & Density Testing'
            ];

            // Two columns for capabilities
            const mid = Math.ceil(capabilities.length / 2);
            let cy = y;

            for (let i = 0; i < mid; i++) {
                doc.fontSize(8).font('Helvetica').text(`${i + 1}. ${capabilities[i]}`, col1X, cy, { width: colWidth });
                if (i + mid < capabilities.length) {
                    doc.fontSize(8).font('Helvetica').text(`${i + mid + 1}. ${capabilities[i + mid]}`, col2X, cy, { width: colWidth });
                }
                cy += 11;
            }

            y = cy + 8;

            // Certification Statement
            doc.fontSize(9).font('Helvetica-Bold').text('CERTIFICATION STATEMENT', MARGINS.left, y);
            y += 12;

            const statement = 'This certificate confirms that the laboratory is accredited to perform coffee quality testing and analysis. All tests are conducted according to international standards (ISO 17025) and ECTA guidelines. The laboratory maintains strict quality control procedures and participates in regular proficiency testing programs.';

            doc.fontSize(8).font('Helvetica').text(statement, MARGINS.left, y, {
                width: CONTENT_WIDTH,
                align: 'justify',
                lineGap: 2
            });

            y += 40;

            // Signature line
            doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).stroke();
            y += 6;

            doc.fontSize(8).font('Helvetica-Bold').text('Authorized by ECTA', MARGINS.left, y);
            doc.fontSize(8).font('Helvetica').text('Date: ' + new Date().toLocaleDateString(), col2X, y);

            // QR Code (bottom right)
            const qrY = PAGE_HEIGHT - MARGINS.bottom - 60;
            const qrCodeData = await generateQRCode(`https://ecta.gov.et/verify/${certificate.certificateNumber}`);
            const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
            doc.image(qrImage, PAGE_WIDTH - MARGINS.right - 55, qrY, { width: 55, height: 55 });

            doc.fontSize(7).font('Helvetica').text('Scan to verify', PAGE_WIDTH - MARGINS.right - 55, qrY + 58, { width: 55, align: 'center' });

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
 * Generate Taster Certificate (Single Page - Professional Layout)
 */
async function generateTasterCertificate(certificate, exporterData) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `TASTER-${certificate.certificateNumber}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ 
                margin: 0,
                size: 'A4',
                bufferPages: true
            });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            let y = MARGINS.top;
            
            // Header
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .text('TASTER CERTIFICATE', MARGINS.left, y, { width: CONTENT_WIDTH, align: 'center' });
            
            y += 20;
            
            doc.fontSize(8)
               .font('Helvetica')
               .text('Ethiopian Coffee & Tea Authority', MARGINS.left, y, { width: CONTENT_WIDTH, align: 'center' });
            
            y += 15;
            
            // Horizontal line
            doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).stroke();
            
            y += 12;
            
            // Two-column layout
            const col1X = MARGINS.left;
            const col2X = MARGINS.left + (CONTENT_WIDTH / 2) + 10;
            const colWidth = (CONTENT_WIDTH / 2) - 10;
            
            // Certificate Details
            doc.fontSize(8).font('Helvetica-Bold').text('Certificate No:', col1X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + certificate.certificateNumber);
            
            doc.fontSize(8).font('Helvetica-Bold').text('Issue Date:', col2X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + new Date(certificate.issuedAt).toLocaleDateString());
            
            y += 12;
            
            doc.fontSize(8).font('Helvetica-Bold').text('Exporter:', col1X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + (exporterData.business_name || 'N/A'));
            
            doc.fontSize(8).font('Helvetica-Bold').text('Expiry Date:', col2X, y, { continued: true });
            doc.fontSize(8).font('Helvetica').text(' ' + new Date(certificate.expiryDate).toLocaleDateString());
            
            y += 18;
            
            // Taster Qualification
            doc.fontSize(9).font('Helvetica-Bold').text('TASTER QUALIFICATION', MARGINS.left, y);
            y += 12;
            
            const qualInfo = [
                ['Qualification Level:', 'Professional Cupper'],
                ['Certification Type:', 'ECTA Certified'],
                ['Training Hours:', '120+ Hours'],
                ['Validity:', '2 Years']
            ];
            
            qualInfo.forEach(([label, value]) => {
                doc.fontSize(8).font('Helvetica-Bold').text(label, col1X, y, { width: 100, continued: true });
                doc.fontSize(8).font('Helvetica').text(' ' + value);
                y += 11;
            });
            
            y += 8;
            
            // Authorized Activities
            doc.fontSize(9).font('Helvetica-Bold').text('AUTHORIZED ACTIVITIES', MARGINS.left, y);
            y += 12;
            
            const activities = [
                'Coffee Cupping & Sensory Evaluation',
                'Quality Grading & Classification',
                'Flavor Profile Assessment',
                'Export Quality Certification'
            ];
            
            activities.forEach(activity => {
                doc.fontSize(8).font('Helvetica').text('• ' + activity, MARGINS.left + 10, y);
                y += 11;
            });
            
            y += 8;
            
            // Certification Statement
            doc.fontSize(9).font('Helvetica-Bold').text('CERTIFICATION STATEMENT', MARGINS.left, y);
            y += 12;
            
            const statement = 'This certificate confirms that the holder has completed professional coffee tasting training and is qualified to perform cupping and sensory evaluation of coffee in accordance with ECTA standards. The holder is authorized to conduct quality assessments for export certification purposes.';
            
            doc.fontSize(8).font('Helvetica').text(statement, MARGINS.left, y, { 
                width: CONTENT_WIDTH, 
                align: 'justify',
                lineGap: 2
            });
            
            y += 45;
            
            // Signature line
            doc.moveTo(MARGINS.left, y).lineTo(PAGE_WIDTH - MARGINS.right, y).stroke();
            y += 6;
            
            doc.fontSize(8).font('Helvetica-Bold').text('Authorized by ECTA', MARGINS.left, y);
            doc.fontSize(8).font('Helvetica').text('Date: ' + new Date().toLocaleDateString(), col2X, y);
            
            // QR Code (bottom right)
            const qrY = PAGE_HEIGHT - MARGINS.bottom - 60;
            const qrCodeData = await generateQRCode(`https://ecta.gov.et/verify/${certificate.certificateNumber}`);
            const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
            doc.image(qrImage, PAGE_WIDTH - MARGINS.right - 55, qrY, { width: 55, height: 55 });
            
            doc.fontSize(7).font('Helvetica').text('Scan to verify', PAGE_WIDTH - MARGINS.right - 55, qrY + 58, { width: 55, align: 'center' });
            
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

