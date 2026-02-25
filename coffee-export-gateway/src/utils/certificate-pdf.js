/**
 * Certificate PDF Generation Utilities
 * Generates professional PDF certificates with QR codes
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
            width: 200,
            margin: 1
        });
    } catch (error) {
        console.error('QR code generation error:', error);
        throw error;
    }
}

/**
 * Add header to certificate PDF
 */
function addCertificateHeader(doc, title, subtitle) {
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text(title, 50, 50, { align: 'center' });
    
    if (subtitle) {
        doc.fontSize(14)
           .font('Helvetica')
           .text(subtitle, 50, 85, { align: 'center' });
    }
    
    // Add horizontal line
    doc.moveTo(50, 110)
       .lineTo(550, 110)
       .stroke();
    
    return 130; // Return Y position for next content
}

/**
 * Add footer with QR code and verification info
 */
async function addCertificateFooter(doc, certificateNumber, verificationUrl) {
    const footerY = 700;
    
    // Add QR code
    const qrCodeData = await generateQRCode(verificationUrl || certificateNumber);
    const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
    
    doc.image(qrImage, 450, footerY, { width: 100, height: 100 });
    
    // Add verification text
    doc.fontSize(10)
       .font('Helvetica')
       .text('Scan QR code to verify', 450, footerY + 105, { width: 100, align: 'center' });
    
    // Add certificate number
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text(`Certificate No: ${certificateNumber}`, 50, footerY + 20);
    
    // Add verification URL
    doc.fontSize(8)
       .font('Helvetica')
       .text(`Verify at: ${verificationUrl || 'https://ecta.gov.et/verify'}`, 50, footerY + 35);
    
    // Add generation timestamp
    doc.fontSize(8)
       .text(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' })}`, 50, footerY + 50);
}

/**
 * Add field to certificate
 */
function addField(doc, label, value, y, options = {}) {
    const x = options.x || 50;
    const labelWidth = options.labelWidth || 150;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(label + ':', x, y, { width: labelWidth, continued: true })
       .font('Helvetica')
       .text(' ' + (value || 'N/A'));
    
    return y + (options.spacing || 20);
}

/**
 * Generate CQIC Export Authorization PDF
 */
async function generateCQICPDF(certificate, shipment) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `CQIC-${certificate.certificateNumber}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header
            let y = addCertificateHeader(
                doc,
                'COFFEE QUALITY INSPECTION CENTER',
                'Export Authorization Certificate'
            );
            
            // Certificate info
            y = addField(doc, 'Authorization Number', certificate.certificateNumber, y);
            y = addField(doc, 'Issue Date', new Date(certificate.issuedAt).toLocaleDateString(), y);
            y = addField(doc, 'Expiry Date', new Date(certificate.expiryDate).toLocaleDateString(), y);
            y += 10;
            
            // Exporter info
            doc.fontSize(12).font('Helvetica-Bold').text('Exporter Information', 50, y);
            y += 25;
            y = addField(doc, 'Company Name', certificate.exporterName, y);
            y = addField(doc, 'Exporter ID', certificate.exporterId, y);
            y += 10;
            
            // Shipment info
            doc.fontSize(12).font('Helvetica-Bold').text('Shipment Information', 50, y);
            y += 25;
            y = addField(doc, 'Shipment ID', certificate.shipmentId, y);
            if (shipment) {
                y = addField(doc, 'Coffee Type', shipment.coffeeType, y);
                y = addField(doc, 'Grade', shipment.grade, y);
                y = addField(doc, 'Quantity', `${shipment.quantity} kg`, y);
            }
            y += 10;
            
            // Quality metrics
            doc.fontSize(12).font('Helvetica-Bold').text('Quality Metrics', 50, y);
            y += 25;
            const certData = certificate.certificateData;
            y = addField(doc, 'Quality Grade', certData.qualityGrade, y);
            y = addField(doc, 'Cupping Score', certData.cuppingScore, y);
            y = addField(doc, 'Defect Count', certData.defectCount, y);
            y = addField(doc, 'Moisture Content', `${certData.moistureContent}%`, y);
            y = addField(doc, 'Screen Size', certData.screenSize, y);
            y += 10;
            
            // Laboratory info
            doc.fontSize(12).font('Helvetica-Bold').text('Laboratory Information', 50, y);
            y += 25;
            y = addField(doc, 'Laboratory', certData.laboratoryName, y);
            y = addField(doc, 'Accreditation', certData.laboratoryAccreditation, y);
            y = addField(doc, 'Test Date', new Date(certData.testDate).toLocaleDateString(), y);
            
            // Authorization statement
            y += 20;
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .text('AUTHORIZATION', 50, y, { align: 'center' });
            y += 25;
            doc.fontSize(10)
               .font('Helvetica')
               .text(
                   'This certificate authorizes the export of the above-mentioned coffee shipment. ' +
                   'The coffee has been tested and meets the quality standards required for export.',
                   50, y, { width: 500, align: 'justify' }
               );
            
            // Footer with QR code
            await addCertificateFooter(
                doc,
                certificate.certificateNumber,
                `https://ecta.gov.et/verify/${certificate.certificateNumber}`
            );
            
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
 * Generate Phytosanitary Certificate PDF
 */
async function generatePhytosanitaryPDF(certificate, shipment) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `PHYTO-${certificate.certificateNumber}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header
            let y = addCertificateHeader(
                doc,
                'MINISTRY OF AGRICULTURE',
                'Phytosanitary Certificate (IPPC)'
            );
            
            // Certificate info
            y = addField(doc, 'IPPC Number', certificate.certificateNumber, y);
            y = addField(doc, 'Issue Date', new Date(certificate.issuedAt).toLocaleDateString(), y);
            y = addField(doc, 'Expiry Date', new Date(certificate.expiryDate).toLocaleDateString(), y);
            y += 10;
            
            // Exporter/Consignor
            doc.fontSize(12).font('Helvetica-Bold').text('Consignor', 50, y);
            y += 25;
            y = addField(doc, 'Name', certificate.exporterName, y);
            y = addField(doc, 'ID', certificate.exporterId, y);
            y += 10;
            
            // Product description
            doc.fontSize(12).font('Helvetica-Bold').text('Product Description', 50, y);
            y += 25;
            const certData = certificate.certificateData;
            y = addField(doc, 'Botanical Name', certData.botanicalName || 'Coffea arabica', y);
            y = addField(doc, 'Common Name', 'Coffee', y);
            if (shipment) {
                y = addField(doc, 'Quantity', `${shipment.quantity} kg`, y);
                y = addField(doc, 'Destination', shipment.destinationCountry, y);
            }
            y += 10;
            
            // Inspection details
            doc.fontSize(12).font('Helvetica-Bold').text('Inspection Details', 50, y);
            y += 25;
            y = addField(doc, 'Inspection Date', new Date(certData.inspectionDate).toLocaleDateString(), y);
            y = addField(doc, 'Inspector', certData.inspectorName, y);
            y = addField(doc, 'Pest Status', certData.pestStatus, y);
            y += 10;
            
            // Treatment (if any)
            if (certData.treatmentDetails && certData.treatmentDetails !== 'none') {
                doc.fontSize(12).font('Helvetica-Bold').text('Treatment Applied', 50, y);
                y += 25;
                y = addField(doc, 'Treatment', certData.treatmentDetails, y);
                if (certData.treatmentDate) {
                    y = addField(doc, 'Treatment Date', new Date(certData.treatmentDate).toLocaleDateString(), y);
                }
                y += 10;
            }
            
            // Declaration
            y += 20;
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .text('PHYTOSANITARY DECLARATION', 50, y, { align: 'center' });
            y += 25;
            doc.fontSize(10)
               .font('Helvetica')
               .text(
                   'This is to certify that the plants, plant products or other regulated articles described ' +
                   'herein have been inspected and/or tested according to appropriate official procedures and are ' +
                   'considered to be free from quarantine pests and practically free from other injurious pests.',
                   50, y, { width: 500, align: 'justify' }
               );
            
            // Footer with QR code
            await addCertificateFooter(
                doc,
                certificate.certificateNumber,
                `https://ecta.gov.et/verify/${certificate.certificateNumber}`
            );
            
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
 * Generate Certificate of Origin PDF
 */
async function generateOriginPDF(certificate, shipment) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `ORIGIN-${certificate.certificateNumber}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header
            let y = addCertificateHeader(
                doc,
                'ETHIOPIAN COFFEE & TEA AUTHORITY',
                'Certificate of Origin'
            );
            
            // Certificate info
            y = addField(doc, 'Certificate Number', certificate.certificateNumber, y);
            y = addField(doc, 'Issue Date', new Date(certificate.issuedAt).toLocaleDateString(), y);
            y += 10;
            
            // Exporter info
            doc.fontSize(12).font('Helvetica-Bold').text('Exporter', 50, y);
            y += 25;
            y = addField(doc, 'Company Name', certificate.exporterName, y);
            y = addField(doc, 'Exporter ID', certificate.exporterId, y);
            y += 10;
            
            // Buyer info
            const certData = certificate.certificateData;
            doc.fontSize(12).font('Helvetica-Bold').text('Consignee', 50, y);
            y += 25;
            y = addField(doc, 'Buyer Name', certData.buyerName, y);
            y = addField(doc, 'Destination Country', certData.destinationCountry, y);
            y += 10;
            
            // Product info
            doc.fontSize(12).font('Helvetica-Bold').text('Product Information', 50, y);
            y += 25;
            y = addField(doc, 'Product', 'Coffee', y);
            if (shipment) {
                y = addField(doc, 'Type', shipment.coffeeType, y);
                y = addField(doc, 'Grade', shipment.grade, y);
                y = addField(doc, 'Quantity', `${shipment.quantity} kg`, y);
            }
            y += 10;
            
            // Origin details
            doc.fontSize(12).font('Helvetica-Bold').text('Origin Information', 50, y);
            y += 25;
            y = addField(doc, 'Country of Origin', 'Ethiopia', y);
            y = addField(doc, 'Geographical Designation', certData.geographicalDesignation, y);
            if (certData.ecxAuctionReference) {
                y = addField(doc, 'ECX Auction Reference', certData.ecxAuctionReference, y);
            }
            y = addField(doc, 'Verification Method', certData.originVerificationMethod, y);
            
            // Declaration
            y += 20;
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .text('DECLARATION OF ORIGIN', 50, y, { align: 'center' });
            y += 25;
            doc.fontSize(10)
               .font('Helvetica')
               .text(
                   'The Ethiopian Coffee & Tea Authority hereby certifies that the coffee described above ' +
                   'originates from Ethiopia and has been produced, processed, and prepared for export in ' +
                   'accordance with Ethiopian regulations and international standards.',
                   50, y, { width: 500, align: 'justify' }
               );
            
            // Footer with QR code
            await addCertificateFooter(
                doc,
                certificate.certificateNumber,
                `https://ecta.gov.et/verify/${certificate.certificateNumber}`
            );
            
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
 * Generate EUDR Compliance Certificate PDF
 */
async function generateEUDRPDF(certificate, shipment, gpsPlots) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `EUDR-${certificate.certificateNumber}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header
            let y = addCertificateHeader(
                doc,
                'EU DEFORESTATION REGULATION',
                'Compliance Certificate'
            );
            
            // Certificate info
            y = addField(doc, 'Certificate Number', certificate.certificateNumber, y);
            y = addField(doc, 'Issue Date', new Date(certificate.issuedAt).toLocaleDateString(), y);
            y += 10;
            
            // Exporter info
            doc.fontSize(12).font('Helvetica-Bold').text('Exporter Information', 50, y);
            y += 25;
            y = addField(doc, 'Company Name', certificate.exporterName, y);
            y = addField(doc, 'Exporter ID', certificate.exporterId, y);
            y += 10;
            
            // Shipment info
            doc.fontSize(12).font('Helvetica-Bold').text('Shipment Information', 50, y);
            y += 25;
            y = addField(doc, 'Shipment ID', certificate.shipmentId, y);
            if (shipment) {
                y = addField(doc, 'Quantity', `${shipment.quantity} kg`, y);
                y = addField(doc, 'Destination', shipment.destinationCountry, y);
            }
            y += 10;
            
            // GPS tracking summary
            const certData = certificate.certificateData;
            doc.fontSize(12).font('Helvetica-Bold').text('Traceability Information', 50, y);
            y += 25;
            y = addField(doc, 'GPS Plots Recorded', certData.gpsPlotIds?.length || 0, y);
            y = addField(doc, 'Deforestation Status', certData.deforestationStatus, y);
            y = addField(doc, 'Risk Assessment', certData.riskAssessment, y);
            y = addField(doc, 'Traceability Score', `${certData.traceabilityScore}%`, y);
            y += 10;
            
            // GPS coordinates (if available)
            if (gpsPlots && gpsPlots.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold').text('GPS Coordinates', 50, y);
                y += 25;
                gpsPlots.slice(0, 3).forEach((plot, index) => {
                    y = addField(doc, `Plot ${index + 1}`, 
                        `${plot.coordinates.latitude}, ${plot.coordinates.longitude}`, y);
                });
                if (gpsPlots.length > 3) {
                    doc.fontSize(9).font('Helvetica').text(
                        `... and ${gpsPlots.length - 3} more plots`, 50, y
                    );
                    y += 15;
                }
                y += 10;
            }
            
            // Compliance declaration
            y += 20;
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .text('EUDR COMPLIANCE DECLARATION', 50, y, { align: 'center' });
            y += 25;
            doc.fontSize(10)
               .font('Helvetica')
               .text(
                   'This certificate confirms that the coffee in this shipment has been produced on land that ' +
                   'has not been subject to deforestation after December 31, 2020, in compliance with EU ' +
                   'Regulation 2023/1115 on deforestation-free products. GPS coordinates have been recorded ' +
                   'and verified for full supply chain traceability.',
                   50, y, { width: 500, align: 'justify' }
               );
            
            // Footer with QR code
            await addCertificateFooter(
                doc,
                certificate.certificateNumber,
                `https://ecta.gov.et/verify/${certificate.certificateNumber}`
            );
            
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
 * Generate ICO Certificate PDF
 */
async function generateICOPDF(certificate, shipment) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `ICO-${certificate.certificateNumber}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header
            let y = addCertificateHeader(
                doc,
                'INTERNATIONAL COFFEE ORGANIZATION',
                'Certificate of Origin'
            );
            
            // Certificate info
            y = addField(doc, 'ICO Certificate Number', certificate.certificateNumber, y);
            y = addField(doc, 'Issue Date', new Date(certificate.issuedAt).toLocaleDateString(), y);
            y += 10;
            
            // Member country
            const certData = certificate.certificateData;
            doc.fontSize(12).font('Helvetica-Bold').text('Member Country', 50, y);
            y += 25;
            y = addField(doc, 'Country Code', certData.icoMemberCode, y);
            y = addField(doc, 'Country Name', 'Ethiopia', y);
            y += 10;
            
            // Exporter info
            doc.fontSize(12).font('Helvetica-Bold').text('Exporter', 50, y);
            y += 25;
            y = addField(doc, 'Company Name', certificate.exporterName, y);
            y = addField(doc, 'Exporter ID', certificate.exporterId, y);
            y += 10;
            
            // Shipment details
            doc.fontSize(12).font('Helvetica-Bold').text('Shipment Details', 50, y);
            y += 25;
            y = addField(doc, 'Shipment ID', certificate.shipmentId, y);
            if (shipment) {
                y = addField(doc, 'Coffee Type', shipment.coffeeType, y);
                y = addField(doc, 'Quantity', `${shipment.quantity} kg`, y);
                y = addField(doc, 'Destination', shipment.destinationCountry, y);
            }
            y += 10;
            
            // ICO quota info
            doc.fontSize(12).font('Helvetica-Bold').text('Quota Information', 50, y);
            y += 25;
            y = addField(doc, 'Export Type', certData.exportType, y);
            y = addField(doc, 'Quota Allocation', `${certData.quotaAllocation} kg`, y);
            y = addField(doc, 'Quota Used', `${certData.quotaUsed} kg`, y);
            
            // ICO declaration
            y += 20;
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .text('ICO CERTIFICATION', 50, y, { align: 'center' });
            y += 25;
            doc.fontSize(10)
               .font('Helvetica')
               .text(
                   'This certificate is issued in accordance with the International Coffee Agreement and ' +
                   'certifies that the coffee described above is of Ethiopian origin and complies with ICO ' +
                   'regulations for international coffee trade.',
                   50, y, { width: 500, align: 'justify' }
               );
            
            // Footer with QR code
            await addCertificateFooter(
                doc,
                certificate.certificateNumber,
                `https://ecta.gov.et/verify/${certificate.certificateNumber}`
            );
            
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
 * Main function to generate certificate PDF based on type
 */
async function generateCertificatePDF(certificate, shipment, additionalData = {}) {
    switch (certificate.certificateType) {
        case 'CQIC':
            return await generateCQICPDF(certificate, shipment);
        case 'PHYTO':
            return await generatePhytosanitaryPDF(certificate, shipment);
        case 'ORIGIN':
            return await generateOriginPDF(certificate, shipment);
        case 'EUDR':
            return await generateEUDRPDF(certificate, shipment, additionalData.gpsPlots);
        case 'ICO':
            return await generateICOPDF(certificate, shipment);
        default:
            throw new Error(`Unknown certificate type: ${certificate.certificateType}`);
    }
}

/**
 * Generate Certificate Bundle PDF (all certificates in one document)
 */
async function generateBundlePDF(bundle, certificates, shipment, gpsPlots) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = `BUNDLE-${bundle.bundleId}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Cover Page
            doc.fontSize(28)
               .font('Helvetica-Bold')
               .text('CERTIFICATE BUNDLE', 50, 200, { align: 'center' });
            
            doc.fontSize(16)
               .font('Helvetica')
               .text('Ethiopian Coffee Export System', 50, 250, { align: 'center' });
            
            doc.fontSize(14)
               .text(`Bundle ID: ${bundle.bundleId}`, 50, 300, { align: 'center' });
            
            // Shipment summary
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Shipment Information', 50, 350);
            
            let y = 380;
            if (shipment) {
                y = addField(doc, 'Shipment ID', shipment.shipmentId, y);
                y = addField(doc, 'Exporter', shipment.exporterName, y);
                y = addField(doc, 'Coffee Type', shipment.coffeeType, y);
                y = addField(doc, 'Quantity', `${shipment.quantity} kg`, y);
                y = addField(doc, 'Destination', shipment.destinationCountry, y);
            }
            
            // Bundle status
            y += 20;
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Bundle Status', 50, y);
            y += 25;
            y = addField(doc, 'Status', bundle.bundleStatus.toUpperCase(), y);
            y = addField(doc, 'Certificates Included', certificates.length, y);
            y = addField(doc, 'Generated', new Date(bundle.createdAt).toLocaleString(), y);
            
            // QR code for bundle
            const qrCodeData = await generateQRCode(`https://ecta.gov.et/verify/bundle/${bundle.bundleId}`);
            const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
            doc.image(qrImage, 250, 550, { width: 100, height: 100 });
            doc.fontSize(10)
               .font('Helvetica')
               .text('Scan to verify bundle', 230, 660, { width: 140, align: 'center' });
            
            // Table of Contents - New Page
            doc.addPage();
            doc.fontSize(20)
               .font('Helvetica-Bold')
               .text('TABLE OF CONTENTS', 50, 50, { align: 'center' });
            
            y = 100;
            doc.fontSize(12).font('Helvetica-Bold').text('Certificates in this Bundle:', 50, y);
            y += 30;
            
            certificates.forEach((cert, index) => {
                const certTypeNames = {
                    'CQIC': 'CQIC Export Authorization',
                    'PHYTO': 'Phytosanitary Certificate',
                    'ORIGIN': 'Certificate of Origin',
                    'EUDR': 'EUDR Compliance Certificate',
                    'ICO': 'ICO Certificate'
                };
                
                doc.fontSize(11)
                   .font('Helvetica-Bold')
                   .text(`${index + 1}. ${certTypeNames[cert.certificateType]}`, 70, y);
                y += 20;
                doc.fontSize(9)
                   .font('Helvetica')
                   .text(`Certificate No: ${cert.certificateNumber}`, 90, y);
                y += 15;
                doc.text(`Status: ${cert.status}`, 90, y);
                y += 15;
                doc.text(`Issued: ${cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : 'Pending'}`, 90, y);
                y += 15;
                if (cert.expiryDate) {
                    doc.text(`Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`, 90, y);
                    y += 15;
                }
                y += 10;
            });
            
            // Add each certificate on separate pages
            for (let i = 0; i < certificates.length; i++) {
                const cert = certificates[i];
                
                // Add page break
                doc.addPage();
                
                // Add certificate content based on type
                let certY = 50;
                
                // Certificate header
                const certTypeNames = {
                    'CQIC': 'CQIC EXPORT AUTHORIZATION',
                    'PHYTO': 'PHYTOSANITARY CERTIFICATE',
                    'ORIGIN': 'CERTIFICATE OF ORIGIN',
                    'EUDR': 'EUDR COMPLIANCE CERTIFICATE',
                    'ICO': 'ICO CERTIFICATE'
                };
                
                doc.fontSize(18)
                   .font('Helvetica-Bold')
                   .text(certTypeNames[cert.certificateType], 50, certY, { align: 'center' });
                certY += 40;
                
                // Certificate number and dates
                doc.fontSize(10).font('Helvetica-Bold').text('Certificate Number:', 50, certY, { continued: true });
                doc.font('Helvetica').text(' ' + cert.certificateNumber);
                certY += 20;
                
                doc.font('Helvetica-Bold').text('Issue Date:', 50, certY, { continued: true });
                doc.font('Helvetica').text(' ' + (cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : 'Pending'));
                certY += 20;
                
                if (cert.expiryDate) {
                    doc.font('Helvetica-Bold').text('Expiry Date:', 50, certY, { continued: true });
                    doc.font('Helvetica').text(' ' + new Date(cert.expiryDate).toLocaleDateString());
                    certY += 20;
                }
                
                certY += 10;
                
                // Certificate-specific data
                const certData = cert.certificateData;
                
                switch (cert.certificateType) {
                    case 'CQIC':
                        doc.fontSize(12).font('Helvetica-Bold').text('Quality Metrics', 50, certY);
                        certY += 25;
                        certY = addField(doc, 'Quality Grade', certData.qualityGrade, certY);
                        certY = addField(doc, 'Cupping Score', certData.cuppingScore, certY);
                        certY = addField(doc, 'Defect Count', certData.defectCount, certY);
                        certY = addField(doc, 'Moisture Content', `${certData.moistureContent}%`, certY);
                        certY = addField(doc, 'Screen Size', certData.screenSize, certY);
                        break;
                        
                    case 'PHYTO':
                        doc.fontSize(12).font('Helvetica-Bold').text('Inspection Details', 50, certY);
                        certY += 25;
                        certY = addField(doc, 'IPPC Number', certData.ippcNumber || cert.certificateNumber, certY);
                        certY = addField(doc, 'Botanical Name', certData.botanicalName || 'Coffea arabica', certY);
                        certY = addField(doc, 'Pest Status', certData.pestStatus, certY);
                        certY = addField(doc, 'Inspector', certData.inspectorName, certY);
                        break;
                        
                    case 'ORIGIN':
                        doc.fontSize(12).font('Helvetica-Bold').text('Origin Information', 50, certY);
                        certY += 25;
                        certY = addField(doc, 'Country of Origin', 'Ethiopia', certY);
                        certY = addField(doc, 'Geographical Designation', certData.geographicalDesignation, certY);
                        certY = addField(doc, 'Destination', certData.destinationCountry, certY);
                        break;
                        
                    case 'EUDR':
                        doc.fontSize(12).font('Helvetica-Bold').text('EUDR Compliance', 50, certY);
                        certY += 25;
                        certY = addField(doc, 'GPS Plots', certData.gpsPlotIds?.length || 0, certY);
                        certY = addField(doc, 'Deforestation Status', certData.deforestationStatus, certY);
                        certY = addField(doc, 'Risk Assessment', certData.riskAssessment, certY);
                        certY = addField(doc, 'Traceability Score', `${certData.traceabilityScore}%`, certY);
                        break;
                        
                    case 'ICO':
                        doc.fontSize(12).font('Helvetica-Bold').text('ICO Information', 50, certY);
                        certY += 25;
                        certY = addField(doc, 'Member Code', certData.icoMemberCode, certY);
                        certY = addField(doc, 'Export Type', certData.exportType, certY);
                        certY = addField(doc, 'Quota Allocation', `${certData.quotaAllocation} kg`, certY);
                        break;
                }
                
                // Add QR code for this certificate
                certY += 30;
                const certQR = await generateQRCode(`https://ecta.gov.et/verify/${cert.certificateNumber}`);
                const certQRImage = Buffer.from(certQR.split(',')[1], 'base64');
                doc.image(certQRImage, 450, certY, { width: 80, height: 80 });
                doc.fontSize(8)
                   .font('Helvetica')
                   .text('Verify Certificate', 450, certY + 85, { width: 80, align: 'center' });
            }
            
            // Final page - Verification Instructions
            doc.addPage();
            doc.fontSize(20)
               .font('Helvetica-Bold')
               .text('VERIFICATION INSTRUCTIONS', 50, 50, { align: 'center' });
            
            y = 100;
            doc.fontSize(12)
               .font('Helvetica')
               .text(
                   'This certificate bundle contains all required certificates for the coffee export shipment. ' +
                   'Each certificate can be verified independently using the QR code or certificate number.',
                   50, y, { width: 500, align: 'justify' }
               );
            
            y += 60;
            doc.fontSize(14).font('Helvetica-Bold').text('How to Verify:', 50, y);
            y += 30;
            
            doc.fontSize(11).font('Helvetica')
               .text('1. Scan the QR code on any certificate using your smartphone', 70, y);
            y += 25;
            doc.text('2. Visit https://ecta.gov.et/verify and enter the certificate number', 70, y);
            y += 25;
            doc.text('3. The system will display the certificate status and details', 70, y);
            y += 25;
            doc.text('4. Verify that the information matches this document', 70, y);
            
            y += 40;
            doc.fontSize(14).font('Helvetica-Bold').text('Bundle Information:', 50, y);
            y += 30;
            doc.fontSize(10).font('Helvetica')
               .text(`Bundle ID: ${bundle.bundleId}`, 70, y);
            y += 20;
            doc.text(`Total Certificates: ${certificates.length}`, 70, y);
            y += 20;
            doc.text(`Bundle Status: ${bundle.bundleStatus.toUpperCase()}`, 70, y);
            y += 20;
            doc.text(`Generated: ${new Date(bundle.createdAt).toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' })}`, 70, y);
            
            // Add bundle QR code
            y += 40;
            const bundleQR = await generateQRCode(`https://ecta.gov.et/verify/bundle/${bundle.bundleId}`);
            const bundleQRImage = Buffer.from(bundleQR.split(',')[1], 'base64');
            doc.image(bundleQRImage, 225, y, { width: 150, height: 150 });
            doc.fontSize(10)
               .font('Helvetica')
               .text('Scan to verify entire bundle', 200, y + 160, { width: 200, align: 'center' });
            
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

// Export all PDF generation functions
module.exports = {
    generateCertificatePDF,
    generateCQICPDF,
    generatePhytosanitaryPDF,
    generateOriginPDF,
    generateEUDRPDF,
    generateICOPDF,
    generateBundlePDF,
    generateQRCode
};

