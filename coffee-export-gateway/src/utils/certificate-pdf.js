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
 * Add header to certificate PDF (optimized for single page)
 */
function addCertificateHeader(doc, title, subtitle) {
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(title, 40, 30, { align: 'center' });
    
    if (subtitle) {
        doc.fontSize(10)
           .font('Helvetica')
           .text(subtitle, 40, 50, { align: 'center' });
    }
    
    // Add horizontal line
    doc.moveTo(40, 65)
       .lineTo(560, 65)
       .stroke();
    
    return 75; // Return Y position for next content
}

/**
 * Add footer with QR code and verification info (optimized for single page)
 */
async function addCertificateFooter(doc, certificateNumber, verificationUrl) {
    const footerY = 680;
    
    // Add QR code (smaller)
    const qrCodeData = await generateQRCode(verificationUrl || certificateNumber);
    const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
    
    doc.image(qrImage, 480, footerY - 50, { width: 70, height: 70 });
    
    // Add verification text
    doc.fontSize(8)
       .font('Helvetica')
       .text('Scan to verify', 480, footerY + 25, { width: 70, align: 'center' });
    
    // Add certificate number and timestamp
    doc.fontSize(7)
       .font('Helvetica-Bold')
       .text(`Cert: ${certificateNumber}`, 40, footerY);
    
    doc.fontSize(7)
       .font('Helvetica')
       .text(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' })}`, 40, footerY + 12);
}

/**
 * Add field to certificate (optimized for single page)
 */
function addField(doc, label, value, y, options = {}) {
    const x = options.x || 40;
    const labelWidth = options.labelWidth || 120;
    
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .text(label + ':', x, y, { width: labelWidth, continued: true })
       .font('Helvetica')
       .text(' ' + (value || 'N/A'));
    
    return y + (options.spacing || 12);
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



// ============================================================================
// PRE-REGISTRATION QUALIFICATION CERTIFICATES
// ============================================================================

/**
 * Generate Competence Certificate PDF for Exporter
 */
async function generateCompetenceCertificatePDF(exporterData, certificateData) {
    return new Promise(async (resolve, reject) => {
        try {
            const certificateNumber = `COMP-${Date.now()}`;
            const filename = `Competence-Certificate-${exporterData.username}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header with official seal
            let y = addCertificateHeader(
                doc,
                'ETHIOPIAN COFFEE & TEA AUTHORITY',
                'Certificate of Competence for Coffee Export'
            );
            
            // Certificate number and issue date
            y = addField(doc, 'Certificate Number', certificateNumber, y);
            y = addField(doc, 'Issue Date', new Date().toLocaleDateString('en-US', { timeZone: 'Africa/Addis_Ababa' }), y);
            y = addField(doc, 'Valid Until', new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(), y);
            y += 15;
            
            // Exporter Information
            doc.fontSize(14).font('Helvetica-Bold').text('EXPORTER INFORMATION', 50, y);
            y += 30;
            y = addField(doc, 'Company Name', exporterData.companyName, y);
            y = addField(doc, 'Exporter ID', exporterData.username, y);
            y = addField(doc, 'TIN', exporterData.tin, y);
            y = addField(doc, 'Business Type', exporterData.businessType, y);
            y += 15;
            
            // Qualification Details
            doc.fontSize(14).font('Helvetica-Bold').text('QUALIFICATION DETAILS', 50, y);
            y += 30;
            y = addField(doc, 'Training Program', certificateData.trainingProgram || 'Coffee Export Competence Training', y);
            y = addField(doc, 'Training Duration', certificateData.trainingDuration || '40 hours', y);
            y = addField(doc, 'Training Provider', certificateData.trainingProvider || 'ECTA Training Center', y);
            y = addField(doc, 'Assessment Score', certificateData.assessmentScore || 'Pass', y);
            y = addField(doc, 'Assessment Date', certificateData.assessmentDate || new Date().toLocaleDateString(), y);
            y += 15;
            
            // Competencies Covered
            doc.fontSize(14).font('Helvetica-Bold').text('COMPETENCIES COVERED', 50, y);
            y += 30;
            const competencies = [
                'Coffee Quality Standards and Grading',
                'Ethiopian Coffee Export Regulations',
                'International Trade Documentation',
                'Supply Chain Management',
                'Quality Control and Assurance',
                'Traceability and Certification Requirements',
                'EUDR Compliance and GPS Tracking',
                'Export Procedures and Customs Clearance'
            ];
            
            doc.fontSize(10).font('Helvetica');
            competencies.forEach((comp, index) => {
                doc.text(`${index + 1}. ${comp}`, 70, y);
                y += 18;
            });
            
            y += 15;
            
            // Official Declaration
            doc.fontSize(12).font('Helvetica-Bold').text('OFFICIAL DECLARATION', 50, y, { align: 'center' });
            y += 30;
            doc.fontSize(10).font('Helvetica').text(
                'The Ethiopian Coffee & Tea Authority hereby certifies that the above-named exporter has ' +
                'successfully completed the required competence training program and has demonstrated adequate ' +
                'knowledge and understanding of coffee export procedures, quality standards, and regulatory ' +
                'requirements. This certificate is valid for three (3) years from the date of issue.',
                50, y, { width: 500, align: 'justify' }
            );
            
            y += 80;
            
            // Signature section
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('_____________________________', 80, y);
            doc.text('_____________________________', 350, y);
            y += 20;
            doc.fontSize(9).font('Helvetica');
            doc.text('Director, ECTA Training Center', 80, y);
            doc.text('Director General, ECTA', 350, y);
            y += 15;
            doc.text(new Date().toLocaleDateString(), 80, y);
            doc.text(new Date().toLocaleDateString(), 350, y);
            
            // Footer with QR code
            await addCertificateFooter(
                doc,
                certificateNumber,
                `https://ecta.gov.et/verify/competence/${certificateNumber}`
            );
            
            doc.end();
            
            stream.on('finish', () => {
                resolve({ filepath, filename, certificateNumber });
            });
            
            stream.on('error', reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Laboratory Approval Certificate PDF
 */
async function generateLaboratoryCertificatePDF(exporterData, laboratoryData) {
    return new Promise(async (resolve, reject) => {
        try {
            const certificateNumber = `LAB-${Date.now()}`;
            const filename = `Laboratory-Certificate-${exporterData.username}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header
            let y = addCertificateHeader(
                doc,
                'ETHIOPIAN COFFEE & TEA AUTHORITY',
                'Laboratory Facility Approval Certificate'
            );
            
            // Certificate info
            y = addField(doc, 'Certificate Number', certificateNumber, y);
            y = addField(doc, 'Issue Date', new Date().toLocaleDateString(), y);
            y = addField(doc, 'Valid Until', new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(), y);
            y += 15;
            
            // Exporter Information
            doc.fontSize(14).font('Helvetica-Bold').text('EXPORTER INFORMATION', 50, y);
            y += 30;
            y = addField(doc, 'Company Name', exporterData.companyName, y);
            y = addField(doc, 'Exporter ID', exporterData.username, y);
            y = addField(doc, 'TIN', exporterData.tin, y);
            y += 15;
            
            // Laboratory Details
            doc.fontSize(14).font('Helvetica-Bold').text('LABORATORY FACILITY DETAILS', 50, y);
            y += 30;
            y = addField(doc, 'Laboratory Name', laboratoryData.laboratoryName || exporterData.companyName + ' Lab', y);
            y = addField(doc, 'Location', laboratoryData.location || exporterData.address, y);
            y = addField(doc, 'Facility Type', laboratoryData.facilityType || 'Coffee Quality Testing Laboratory', y);
            y = addField(doc, 'Accreditation', laboratoryData.accreditation || 'ECTA Approved', y);
            y += 15;
            
            // Equipment and Capabilities
            doc.fontSize(14).font('Helvetica-Bold').text('APPROVED EQUIPMENT & CAPABILITIES', 50, y);
            y += 30;
            const equipment = [
                'Sample Roaster (SCAA Standard)',
                'Cupping Equipment and Tables',
                'Moisture Meter (Calibrated)',
                'Screen Size Grading Equipment',
                'Defect Counting Tables',
                'Sample Storage Facility',
                'Quality Control Documentation System'
            ];
            
            doc.fontSize(10).font('Helvetica');
            equipment.forEach((item, index) => {
                doc.text(`✓ ${item}`, 70, y);
                y += 18;
            });
            
            y += 15;
            
            // Inspection Details
            doc.fontSize(14).font('Helvetica-Bold').text('INSPECTION DETAILS', 50, y);
            y += 30;
            y = addField(doc, 'Inspection Date', laboratoryData.inspectionDate || new Date().toLocaleDateString(), y);
            y = addField(doc, 'Inspector', laboratoryData.inspector || 'ECTA Quality Inspector', y);
            y = addField(doc, 'Inspection Result', 'APPROVED', y);
            y += 15;
            
            // Declaration
            doc.fontSize(12).font('Helvetica-Bold').text('APPROVAL DECLARATION', 50, y, { align: 'center' });
            y += 30;
            doc.fontSize(10).font('Helvetica').text(
                'The Ethiopian Coffee & Tea Authority hereby certifies that the laboratory facility operated by ' +
                'the above-named exporter has been inspected and meets the minimum requirements for coffee quality ' +
                'testing as specified in ECTA regulations. This approval is valid for two (2) years from the date of issue.',
                50, y, { width: 500, align: 'justify' }
            );
            
            // Footer with QR code
            await addCertificateFooter(
                doc,
                certificateNumber,
                `https://ecta.gov.et/verify/laboratory/${certificateNumber}`
            );
            
            doc.end();
            
            stream.on('finish', () => {
                resolve({ filepath, filename, certificateNumber });
            });
            
            stream.on('error', reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Taster Approval Certificate PDF
 */
async function generateTasterCertificatePDF(exporterData, tasterData) {
    return new Promise(async (resolve, reject) => {
        try {
            const certificateNumber = `TASTER-${Date.now()}`;
            const filename = `Taster-Certificate-${exporterData.username}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header
            let y = addCertificateHeader(
                doc,
                'ETHIOPIAN COFFEE & TEA AUTHORITY',
                'Certified Coffee Taster Approval'
            );
            
            // Certificate info
            y = addField(doc, 'Certificate Number', certificateNumber, y);
            y = addField(doc, 'Issue Date', new Date().toLocaleDateString(), y);
            y = addField(doc, 'Valid Until', new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(), y);
            y += 15;
            
            // Exporter Information
            doc.fontSize(14).font('Helvetica-Bold').text('EXPORTER INFORMATION', 50, y);
            y += 30;
            y = addField(doc, 'Company Name', exporterData.companyName, y);
            y = addField(doc, 'Exporter ID', exporterData.username, y);
            y += 15;
            
            // Taster Details
            doc.fontSize(14).font('Helvetica-Bold').text('CERTIFIED TASTER DETAILS', 50, y);
            y += 30;
            y = addField(doc, 'Taster Name', tasterData.tasterName || 'Certified Taster', y);
            y = addField(doc, 'Taster ID', tasterData.tasterId || 'TASTER-' + Date.now(), y);
            y = addField(doc, 'Certification Level', tasterData.certificationLevel || 'Q Grader Certified', y);
            y = addField(doc, 'Years of Experience', tasterData.yearsOfExperience || '5+ years', y);
            y += 15;
            
            // Qualifications
            doc.fontSize(14).font('Helvetica-Bold').text('QUALIFICATIONS', 50, y);
            y += 30;
            const qualifications = [
                'SCAA/SCA Q Grader Certification',
                'Ethiopian Coffee Cupping Protocol',
                'Sensory Analysis Training',
                'Coffee Defect Identification',
                'Grading and Classification Standards',
                'Cupping Form Completion and Scoring'
            ];
            
            doc.fontSize(10).font('Helvetica');
            qualifications.forEach((qual, index) => {
                doc.text(`✓ ${qual}`, 70, y);
                y += 18;
            });
            
            y += 15;
            
            // Assessment Details
            doc.fontSize(14).font('Helvetica-Bold').text('ASSESSMENT DETAILS', 50, y);
            y += 30;
            y = addField(doc, 'Assessment Date', tasterData.assessmentDate || new Date().toLocaleDateString(), y);
            y = addField(doc, 'Assessment Type', 'Practical Cupping Test', y);
            y = addField(doc, 'Assessment Result', 'PASSED', y);
            y = addField(doc, 'Assessed By', 'ECTA Chief Q Grader', y);
            y += 15;
            
            // Declaration
            doc.fontSize(12).font('Helvetica-Bold').text('CERTIFICATION DECLARATION', 50, y, { align: 'center' });
            y += 30;
            doc.fontSize(10).font('Helvetica').text(
                'The Ethiopian Coffee & Tea Authority hereby certifies that the taster employed by the above-named ' +
                'exporter has been assessed and meets the competency requirements for coffee quality evaluation and ' +
                'cupping as per ECTA standards. This certification is valid for three (3) years from the date of issue.',
                50, y, { width: 500, align: 'justify' }
            );
            
            // Footer with QR code
            await addCertificateFooter(
                doc,
                certificateNumber,
                `https://ecta.gov.et/verify/taster/${certificateNumber}`
            );
            
            doc.end();
            
            stream.on('finish', () => {
                resolve({ filepath, filename, certificateNumber });
            });
            
            stream.on('error', reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Export License Certificate PDF
 */
async function generateExportLicensePDF(exporterData, licenseData) {
    return new Promise(async (resolve, reject) => {
        try {
            const certificateNumber = licenseData.licenseNumber || `LIC-${Date.now()}`;
            const filename = `Export-License-${exporterData.username}.pdf`;
            const filepath = path.join(CERT_DIR, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            
            doc.pipe(stream);
            
            // Header with official seal
            let y = addCertificateHeader(
                doc,
                'ETHIOPIAN COFFEE & TEA AUTHORITY',
                'Coffee Export License'
            );
            
            // License info
            y = addField(doc, 'License Number', certificateNumber, y);
            y = addField(doc, 'Issue Date', licenseData.issuedDate || new Date().toLocaleDateString(), y);
            y = addField(doc, 'Expiry Date', licenseData.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(), y);
            y = addField(doc, 'License Type', 'Coffee Export License', y);
            y += 15;
            
            // Licensee Information
            doc.fontSize(14).font('Helvetica-Bold').text('LICENSEE INFORMATION', 50, y);
            y += 30;
            y = addField(doc, 'Company Name', exporterData.companyName, y);
            y = addField(doc, 'Exporter ID', exporterData.username, y);
            y = addField(doc, 'TIN', exporterData.tin, y);
            y = addField(doc, 'Business Type', exporterData.businessType, y);
            y = addField(doc, 'Registered Capital', `${exporterData.capitalETB?.toLocaleString()} ETB`, y);
            y = addField(doc, 'Address', exporterData.address || 'Addis Ababa, Ethiopia', y);
            y += 15;
            
            // License Scope
            doc.fontSize(14).font('Helvetica-Bold').text('LICENSE SCOPE', 50, y);
            y += 30;
            doc.fontSize(10).font('Helvetica');
            doc.text('This license authorizes the holder to:', 70, y);
            y += 20;
            const authorizations = [
                'Export Ethiopian coffee to international markets',
                'Purchase coffee from ECX or directly from cooperatives',
                'Operate coffee processing and quality control facilities',
                'Issue quality certificates for exported coffee',
                'Engage in international coffee trade transactions'
            ];
            
            authorizations.forEach((auth, index) => {
                doc.text(`${index + 1}. ${auth}`, 90, y);
                y += 18;
            });
            
            y += 15;
            
            // Conditions
            doc.fontSize(14).font('Helvetica-Bold').text('LICENSE CONDITIONS', 50, y);
            y += 30;
            doc.fontSize(10).font('Helvetica');
            const conditions = [
                'Comply with all ECTA regulations and directives',
                'Maintain minimum capital requirements',
                'Submit monthly export reports to ECTA',
                'Ensure coffee quality meets export standards',
                'Maintain valid competence and facility certifications',
                'Renew license annually before expiry date'
            ];
            
            conditions.forEach((cond, index) => {
                doc.text(`• ${cond}`, 70, y);
                y += 18;
            });
            
            y += 20;
            
            // Official Declaration
            doc.fontSize(12).font('Helvetica-Bold').text('OFFICIAL LICENSE GRANT', 50, y, { align: 'center' });
            y += 30;
            doc.fontSize(10).font('Helvetica').text(
                'The Ethiopian Coffee & Tea Authority, by the powers vested in it under Proclamation No. 1106/2025, ' +
                'hereby grants this Coffee Export License to the above-named company. This license is valid for one (1) year ' +
                'from the date of issue and must be renewed annually. The license may be suspended or revoked for ' +
                'non-compliance with ECTA regulations.',
                50, y, { width: 500, align: 'justify' }
            );
            
            y += 80;
            
            // Signature section
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('_____________________________', 200, y, { align: 'center' });
            y += 20;
            doc.fontSize(9).font('Helvetica');
            doc.text('Director General', 200, y, { align: 'center' });
            y += 15;
            doc.text('Ethiopian Coffee & Tea Authority', 200, y, { align: 'center' });
            y += 15;
            doc.text(new Date().toLocaleDateString(), 200, y, { align: 'center' });
            
            // Official Seal placeholder
            doc.fontSize(8).font('Helvetica-Oblique');
            doc.text('[OFFICIAL SEAL]', 250, y + 30, { align: 'center' });
            
            // Footer with QR code
            await addCertificateFooter(
                doc,
                certificateNumber,
                `https://ecta.gov.et/verify/license/${certificateNumber}`
            );
            
            doc.end();
            
            stream.on('finish', () => {
                resolve({ filepath, filename, certificateNumber });
            });
            
            stream.on('error', reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

// Export all functions including new qualification certificates
module.exports = {
    generateCertificatePDF,
    generateCQICPDF,
    generatePhytosanitaryPDF,
    generateOriginPDF,
    generateEUDRPDF,
    generateICOPDF,
    generateBundlePDF,
    generateQRCode,
    // Pre-registration qualification certificates
    generateCompetenceCertificatePDF,
    generateLaboratoryCertificatePDF,
    generateTasterCertificatePDF,
    generateExportLicensePDF
};
