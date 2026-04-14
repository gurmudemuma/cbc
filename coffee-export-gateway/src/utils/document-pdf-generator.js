/**
 * Document PDF Generator with Digital Signatures
 * Generates signed PDF documents for all network member issued documents
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Ensure documents directory exists
const DOCS_DIR = path.join(__dirname, '../../storage/documents');

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
 * Generate digital signature for document
 */
function generateDigitalSignature(documentData, issuerCode) {
  const signaturePayload = {
    documentNumber: documentData.documentNumber,
    documentType: documentData.documentType,
    issuerCode: issuerCode,
    exporterId: documentData.exporterId,
    issuedAt: documentData.issuedAt,
    timestamp: Date.now()
  };
  
  const signatureString = JSON.stringify(signaturePayload);
  return crypto.createHash('sha256').update(signatureString).digest('hex');
}

/**
 * Add official header with network member branding
 */
function addOfficialHeader(doc, memberCode, documentTitle) {
  const memberInfo = {
    'ECTA': {
      name: 'Ethiopian Coffee & Tea Authority',
      subtitle: 'Ministry of Agriculture',
      seal: 'ECTA Official Seal'
    },
    'MOH': {
      name: 'Ministry of Health',
      subtitle: 'Federal Democratic Republic of Ethiopia',
      seal: 'MOH Official Seal'
    },
    'MOA': {
      name: 'Ministry of Agriculture',
      subtitle: 'Plant Health Regulatory Directorate',
      seal: 'MOA Official Seal'
    },
    'BANK': {
      name: 'Commercial Bank of Ethiopia',
      subtitle: 'International Banking Division',
      seal: 'CBE Official Seal'
    },
    'NBE': {
      name: 'National Bank of Ethiopia',
      subtitle: 'Foreign Exchange Department',
      seal: 'NBE Official Seal'
    },
    'SHIPPING': {
      name: 'Ethiopian Shipping Lines',
      subtitle: 'Cargo Services Division',
      seal: 'ESL Official Seal'
    },
    'CUSTOMS': {
      name: 'Ethiopian Revenues & Customs Authority',
      subtitle: 'Export Clearance Division',
      seal: 'ERCA Official Seal'
    },
    'ECX': {
      name: 'Ethiopian Commodity Exchange',
      subtitle: 'Coffee Trading Platform',
      seal: 'ECX Official Seal'
    }
  };

  const info = memberInfo[memberCode] || { name: memberCode, subtitle: '', seal: 'Official Seal' };

  // Header background
  doc.rect(0, 0, 612, 100).fill('#f8f9fa');
  
  // Organization name
  doc.fillColor('#000')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text(info.name, 50, 25, { align: 'center' });
  
  // Subtitle
  if (info.subtitle) {
    doc.fontSize(11)
       .font('Helvetica')
       .text(info.subtitle, 50, 50, { align: 'center' });
  }
  
  // Document title
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text(documentTitle, 50, 75, { align: 'center' });
  
  // Seal placeholder (left side)
  doc.circle(70, 50, 25).stroke();
  doc.fontSize(7).text(info.seal, 45, 80, { width: 50, align: 'center' });
  
  return 110; // Return Y position for content
}

/**
 * Add digital signature section
 */
async function addDigitalSignature(doc, documentData, issuerCode, signature) {
  const y = 680;
  
  // Signature box
  doc.rect(40, y - 10, 520, 80).stroke();
  
  // Title
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('DIGITAL SIGNATURE & VERIFICATION', 50, y);
  
  // Signature details
  doc.fontSize(8)
     .font('Helvetica')
     .text(`Issuer: ${issuerCode}`, 50, y + 20)
     .text(`Document Hash: ${signature.substring(0, 32)}...`, 50, y + 32)
     .text(`Signed: ${new Date(documentData.issuedAt).toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' })}`, 50, y + 44)
     .text(`Issued by: ${documentData.issuedBy}`, 50, y + 56);
  
  // QR code for verification
  const verificationUrl = `https://ecta.gov.et/verify/${documentData.documentNumber}`;
  const qrCodeData = await generateQRCode(verificationUrl);
  const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
  
  doc.image(qrImage, 480, y - 5, { width: 70, height: 70 });
  doc.fontSize(7)
     .text('Scan to verify', 480, y + 68, { width: 70, align: 'center' });
}

/**
 * Add field helper
 */
function addField(doc, label, value, y, options = {}) {
  const x = options.x || 50;
  const labelWidth = options.labelWidth || 150;
  
  doc.fontSize(9)
     .font('Helvetica-Bold')
     .text(label + ':', x, y, { width: labelWidth, continued: true })
     .font('Helvetica')
     .text(' ' + (value || 'N/A'));
  
  return y + (options.spacing || 14);
}

/**
 * Generate Export License PDF
 */
async function generateExportLicensePDF(documentData, exporterData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  return new Promise(async (resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    doc.on('error', reject);
    
    try {
      let y = addOfficialHeader(doc, 'ECTA', 'EXPORT LICENSE');
      
      // License details
      y += 10;
      y = addField(doc, 'License Number', documentData.documentNumber, y);
      y = addField(doc, 'Issue Date', new Date(documentData.issuedAt).toLocaleDateString(), y);
      y = addField(doc, 'Expiry Date', documentData.expiryDate ? new Date(documentData.expiryDate).toLocaleDateString() : 'N/A', y);
      y += 15;
      
      // Exporter information
      doc.fontSize(12).font('Helvetica-Bold').text('EXPORTER INFORMATION', 50, y);
      y += 20;
      y = addField(doc, 'Business Name', exporterData.business_name, y);
      y = addField(doc, 'TIN', exporterData.tin, y);
      y = addField(doc, 'Registration Number', exporterData.registration_number, y);
      y = addField(doc, 'Address', exporterData.address, y);
      y += 15;
      
      // License scope
      const metadata = documentData.document_metadata || {};
      doc.fontSize(12).font('Helvetica-Bold').text('LICENSE SCOPE', 50, y);
      y += 20;
      y = addField(doc, 'Product Category', metadata.productCategory || 'Coffee', y);
      y = addField(doc, 'Annual Quota', metadata.annualQuota || 'Unlimited', y);
      y = addField(doc, 'Authorized Markets', metadata.authorizedMarkets || 'All International Markets', y);
      y += 15;
      
      // Terms and conditions
      doc.fontSize(11).font('Helvetica-Bold').text('TERMS AND CONDITIONS', 50, y);
      y += 20;
      doc.fontSize(9).font('Helvetica').text(
        '1. This license authorizes the holder to export coffee from Ethiopia.\n' +
        '2. All exports must comply with Ethiopian coffee quality standards.\n' +
        '3. The license holder must maintain accurate export records.\n' +
        '4. This license is non-transferable and must be renewed annually.\n' +
        '5. Violation of terms may result in license suspension or revocation.',
        50, y, { width: 500 }
      );
      
      // Digital signature
      const signature = generateDigitalSignature(documentData, 'ECTA');
      await addDigitalSignature(doc, documentData, 'ECTA', signature);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Phytosanitary Certificate PDF
 */
async function generatePhytosanitaryCertificatePDF(documentData, exporterData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  return new Promise(async (resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    doc.on('error', reject);
    
    try {
      let y = addOfficialHeader(doc, 'MOA', 'PHYTOSANITARY CERTIFICATE (IPPC)');
      
      // Certificate details
      y += 10;
      y = addField(doc, 'Certificate Number', documentData.documentNumber, y);
      y = addField(doc, 'Issue Date', new Date(documentData.issuedAt).toLocaleDateString(), y);
      y = addField(doc, 'Expiry Date', documentData.expiryDate ? new Date(documentData.expiryDate).toLocaleDateString() : 'N/A', y);
      y += 15;
      
      // Consignor (Exporter)
      doc.fontSize(12).font('Helvetica-Bold').text('CONSIGNOR', 50, y);
      y += 20;
      y = addField(doc, 'Name', exporterData.business_name, y);
      y = addField(doc, 'Address', exporterData.address, y);
      y += 15;
      
      // Product description
      const metadata = documentData.document_metadata || {};
      doc.fontSize(12).font('Helvetica-Bold').text('PRODUCT DESCRIPTION', 50, y);
      y += 20;
      y = addField(doc, 'Botanical Name', 'Coffea arabica / Coffea canephora', y);
      y = addField(doc, 'Common Name', 'Coffee (Green Beans)', y);
      y = addField(doc, 'Quantity', metadata.quantity || 'As per invoice', y);
      y = addField(doc, 'Destination Country', metadata.destinationCountry || 'N/A', y);
      y += 15;
      
      // Inspection details
      doc.fontSize(12).font('Helvetica-Bold').text('INSPECTION DETAILS', 50, y);
      y += 20;
      y = addField(doc, 'Inspection Date', metadata.inspectionDate || new Date().toLocaleDateString(), y);
      y = addField(doc, 'Inspector Name', metadata.inspectorName || documentData.issuedBy, y);
      y = addField(doc, 'Pest Status', metadata.pestStatus || 'Free from quarantine pests', y);
      y = addField(doc, 'Treatment Applied', metadata.treatment || 'None required', y);
      y += 15;
      
      // Declaration
      doc.fontSize(10).font('Helvetica-Bold').text('PHYTOSANITARY DECLARATION', 50, y);
      y += 15;
      doc.fontSize(9).font('Helvetica').text(
        'This is to certify that the plants, plant products or other regulated articles described ' +
        'herein have been inspected and/or tested according to appropriate official procedures and are ' +
        'considered to be free from quarantine pests and practically free from other injurious pests.',
        50, y, { width: 500, align: 'justify' }
      );
      
      // Digital signature
      const signature = generateDigitalSignature(documentData, 'MOA');
      await addDigitalSignature(doc, documentData, 'MOA', signature);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Health Certificate PDF
 */
async function generateHealthCertificatePDF(documentData, exporterData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  return new Promise(async (resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    doc.on('error', reject);
    
    try {
      let y = addOfficialHeader(doc, 'MOH', 'HEALTH CERTIFICATE');
      
      // Certificate details
      y += 10;
      y = addField(doc, 'Certificate Number', documentData.documentNumber, y);
      y = addField(doc, 'Issue Date', new Date(documentData.issuedAt).toLocaleDateString(), y);
      y = addField(doc, 'Expiry Date', documentData.expiryDate ? new Date(documentData.expiryDate).toLocaleDateString() : 'N/A', y);
      y += 15;
      
      // Exporter information
      doc.fontSize(12).font('Helvetica-Bold').text('EXPORTER INFORMATION', 50, y);
      y += 20;
      y = addField(doc, 'Business Name', exporterData.business_name, y);
      y = addField(doc, 'Address', exporterData.address, y);
      y += 15;
      
      // Product information
      const metadata = documentData.document_metadata || {};
      doc.fontSize(12).font('Helvetica-Bold').text('PRODUCT INFORMATION', 50, y);
      y += 20;
      y = addField(doc, 'Product', 'Coffee (Green Beans)', y);
      y = addField(doc, 'Quantity', metadata.quantity || 'As per invoice', y);
      y = addField(doc, 'Destination', metadata.destinationCountry || 'N/A', y);
      y += 15;
      
      // Health inspection
      doc.fontSize(12).font('Helvetica-Bold').text('HEALTH INSPECTION RESULTS', 50, y);
      y += 20;
      y = addField(doc, 'Inspection Date', metadata.inspectionDate || new Date().toLocaleDateString(), y);
      y = addField(doc, 'Inspector', metadata.inspectorName || documentData.issuedBy, y);
      y = addField(doc, 'Microbiological Status', metadata.microbiologicalStatus || 'Satisfactory', y);
      y = addField(doc, 'Aflatoxin Level', metadata.aflatoxinLevel || 'Within acceptable limits', y);
      y = addField(doc, 'Heavy Metals', metadata.heavyMetals || 'Within acceptable limits', y);
      y += 15;
      
      // Health declaration
      doc.fontSize(10).font('Helvetica-Bold').text('HEALTH DECLARATION', 50, y);
      y += 15;
      doc.fontSize(9).font('Helvetica').text(
        'This is to certify that the coffee described above has been inspected and tested by the ' +
        'Ministry of Health and is fit for human consumption. The product meets all health and safety ' +
        'standards required for export and complies with international food safety regulations.',
        50, y, { width: 500, align: 'justify' }
      );
      
      // Digital signature
      const signature = generateDigitalSignature(documentData, 'MOH');
      await addDigitalSignature(doc, documentData, 'MOH', signature);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Quality Certificate PDF
 */
async function generateQualityCertificatePDF(documentData, exporterData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  return new Promise(async (resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    doc.on('error', reject);
    
    try {
      let y = addOfficialHeader(doc, 'ECTA', 'COFFEE QUALITY CERTIFICATE');
      
      // Certificate details
      y += 10;
      y = addField(doc, 'Certificate Number', documentData.documentNumber, y);
      y = addField(doc, 'Issue Date', new Date(documentData.issuedAt).toLocaleDateString(), y);
      y += 15;
      
      // Exporter information
      doc.fontSize(12).font('Helvetica-Bold').text('EXPORTER INFORMATION', 50, y);
      y += 20;
      y = addField(doc, 'Business Name', exporterData.business_name, y);
      y += 15;
      
      // Quality assessment
      const metadata = documentData.document_metadata || {};
      doc.fontSize(12).font('Helvetica-Bold').text('QUALITY ASSESSMENT', 50, y);
      y += 20;
      y = addField(doc, 'Coffee Type', metadata.coffeeType || 'Arabica', y);
      y = addField(doc, 'Grade', metadata.grade || 'Grade 1', y);
      y = addField(doc, 'Cupping Score', metadata.cuppingScore || 'N/A', y);
      y = addField(doc, 'Screen Size', metadata.screenSize || 'N/A', y);
      y = addField(doc, 'Moisture Content', metadata.moistureContent || 'N/A', y);
      y = addField(doc, 'Defect Count', metadata.defectCount || '0', y);
      y += 15;
      
      // Laboratory information
      doc.fontSize(12).font('Helvetica-Bold').text('LABORATORY INFORMATION', 50, y);
      y += 20;
      y = addField(doc, 'Laboratory', metadata.laboratoryName || 'ECTA Quality Control Lab', y);
      y = addField(doc, 'Test Date', metadata.testDate || new Date().toLocaleDateString(), y);
      y = addField(doc, 'Taster', metadata.tasterName || documentData.issuedBy, y);
      y += 15;
      
      // Quality declaration
      doc.fontSize(10).font('Helvetica-Bold').text('QUALITY DECLARATION', 50, y);
      y += 15;
      doc.fontSize(9).font('Helvetica').text(
        'This certificate confirms that the coffee described above has been tested and graded according ' +
        'to Ethiopian coffee quality standards. The coffee meets all quality requirements for export.',
        50, y, { width: 500, align: 'justify' }
      );
      
      // Digital signature
      const signature = generateDigitalSignature(documentData, 'ECTA');
      await addDigitalSignature(doc, documentData, 'ECTA', signature);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Certificate of Origin PDF
 */
async function generateCertificateOfOriginPDF(documentData, exporterData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  return new Promise(async (resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    doc.on('error', reject);
    
    try {
      let y = addOfficialHeader(doc, 'ECTA', 'CERTIFICATE OF ORIGIN');
      
      // Certificate details
      y += 10;
      y = addField(doc, 'Certificate Number', documentData.documentNumber, y);
      y = addField(doc, 'Issue Date', new Date(documentData.issuedAt).toLocaleDateString(), y);
      y += 15;
      
      // Exporter information
      doc.fontSize(12).font('Helvetica-Bold').text('EXPORTER', 50, y);
      y += 20;
      y = addField(doc, 'Name', exporterData.business_name, y);
      y = addField(doc, 'Address', exporterData.address, y);
      y += 15;
      
      // Consignee information
      const metadata = documentData.document_metadata || {};
      doc.fontSize(12).font('Helvetica-Bold').text('CONSIGNEE', 50, y);
      y += 20;
      y = addField(doc, 'Name', metadata.consigneeName || 'As per invoice', y);
      y = addField(doc, 'Country', metadata.destinationCountry || 'N/A', y);
      y += 15;
      
      // Product information
      doc.fontSize(12).font('Helvetica-Bold').text('PRODUCT INFORMATION', 50, y);
      y += 20;
      y = addField(doc, 'Product', 'Coffee', y);
      y = addField(doc, 'Type', metadata.coffeeType || 'Arabica', y);
      y = addField(doc, 'Quantity', metadata.quantity || 'As per invoice', y);
      y = addField(doc, 'Origin', 'Ethiopia', y);
      y = addField(doc, 'Geographical Designation', metadata.geographicalDesignation || 'Ethiopian Highlands', y);
      y += 15;
      
      // Origin declaration
      doc.fontSize(10).font('Helvetica-Bold').text('DECLARATION OF ORIGIN', 50, y);
      y += 15;
      doc.fontSize(9).font('Helvetica').text(
        'The Ethiopian Coffee & Tea Authority hereby certifies that the coffee described above ' +
        'originates from Ethiopia and has been produced, processed, and prepared for export in ' +
        'accordance with Ethiopian regulations and international standards.',
        50, y, { width: 500, align: 'justify' }
      );
      
      // Digital signature
      const signature = generateDigitalSignature(documentData, 'ECTA');
      await addDigitalSignature(doc, documentData, 'ECTA', signature);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Continue in next part...

/**
 * Generate Bank Guarantee PDF
 */
async function generateBankGuaranteePDF(documentData, exporterData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  return new Promise(async (resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    doc.on('error', reject);
    
    try {
      let y = addOfficialHeader(doc, 'BANK', 'BANK GUARANTEE');
      
      // Guarantee details
      y += 10;
      y = addField(doc, 'Guarantee Number', documentData.documentNumber, y);
      y = addField(doc, 'Issue Date', new Date(documentData.issuedAt).toLocaleDateString(), y);
      y = addField(doc, 'Expiry Date', documentData.expiryDate ? new Date(documentData.expiryDate).toLocaleDateString() : 'N/A', y);
      y += 15;
      
      // Beneficiary (Exporter)
      doc.fontSize(12).font('Helvetica-Bold').text('BENEFICIARY', 50, y);
      y += 20;
      y = addField(doc, 'Name', exporterData.business_name, y);
      y = addField(doc, 'TIN', exporterData.tin, y);
      y += 15;
      
      // Guarantee details
      const metadata = documentData.document_metadata || {};
      doc.fontSize(12).font('Helvetica-Bold').text('GUARANTEE DETAILS', 50, y);
      y += 20;
      y = addField(doc, 'Guarantee Amount', metadata.guaranteeAmount || 'N/A', y);
      y = addField(doc, 'Currency', metadata.currency || 'USD', y);
      y = addField(doc, 'Purpose', metadata.purpose || 'Export Transaction', y);
      y = addField(doc, 'Transaction Reference', metadata.transactionReference || 'N/A', y);
      y += 15;
      
      // Guarantee statement
      doc.fontSize(10).font('Helvetica-Bold').text('GUARANTEE STATEMENT', 50, y);
      y += 15;
      doc.fontSize(9).font('Helvetica').text(
        'The Commercial Bank of Ethiopia hereby irrevocably and unconditionally guarantees payment ' +
        'to the beneficiary named above for the amount specified, in accordance with the terms and ' +
        'conditions of this guarantee. This guarantee is valid until the expiry date stated above.',
        50, y, { width: 500, align: 'justify' }
      );
      
      // Digital signature
      const signature = generateDigitalSignature(documentData, 'BANK');
      await addDigitalSignature(doc, documentData, 'BANK', signature);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Shipping Booking Confirmation PDF
 */
async function generateShippingBookingPDF(documentData, exporterData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  return new Promise(async (resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    doc.on('error', reject);
    
    try {
      let y = addOfficialHeader(doc, 'SHIPPING', 'SHIPPING BOOKING CONFIRMATION');
      
      // Booking details
      y += 10;
      y = addField(doc, 'Booking Number', documentData.documentNumber, y);
      y = addField(doc, 'Booking Date', new Date(documentData.issuedAt).toLocaleDateString(), y);
      y += 15;
      
      // Shipper information
      doc.fontSize(12).font('Helvetica-Bold').text('SHIPPER', 50, y);
      y += 20;
      y = addField(doc, 'Name', exporterData.business_name, y);
      y = addField(doc, 'Address', exporterData.address, y);
      y += 15;
      
      // Shipment details
      const metadata = documentData.document_metadata || {};
      doc.fontSize(12).font('Helvetica-Bold').text('SHIPMENT DETAILS', 50, y);
      y += 20;
      y = addField(doc, 'Vessel Name', metadata.vesselName || 'TBD', y);
      y = addField(doc, 'Voyage Number', metadata.voyageNumber || 'TBD', y);
      y = addField(doc, 'Port of Loading', metadata.portOfLoading || 'Djibouti', y);
      y = addField(doc, 'Port of Discharge', metadata.portOfDischarge || 'N/A', y);
      y = addField(doc, 'ETD (Estimated Time of Departure)', metadata.etd || 'TBD', y);
      y = addField(doc, 'ETA (Estimated Time of Arrival)', metadata.eta || 'TBD', y);
      y += 15;
      
      // Cargo details
      doc.fontSize(12).font('Helvetica-Bold').text('CARGO DETAILS', 50, y);
      y += 20;
      y = addField(doc, 'Commodity', 'Coffee', y);
      y = addField(doc, 'Quantity', metadata.quantity || 'As per booking', y);
      y = addField(doc, 'Container Type', metadata.containerType || '20ft Standard', y);
      y = addField(doc, 'Number of Containers', metadata.numberOfContainers || '1', y);
      y += 15;
      
      // Booking confirmation
      doc.fontSize(10).font('Helvetica-Bold').text('BOOKING CONFIRMATION', 50, y);
      y += 15;
      doc.fontSize(9).font('Helvetica').text(
        'Ethiopian Shipping Lines confirms the booking of cargo space as described above. ' +
        'This booking is subject to the terms and conditions of the carrier and availability of space.',
        50, y, { width: 500, align: 'justify' }
      );
      
      // Digital signature
      const signature = generateDigitalSignature(documentData, 'SHIPPING');
      await addDigitalSignature(doc, documentData, 'SHIPPING', signature);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Customs Clearance Certificate PDF
 */
async function generateCustomsClearancePDF(documentData, exporterData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  return new Promise(async (resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    doc.on('error', reject);
    
    try {
      let y = addOfficialHeader(doc, 'CUSTOMS', 'CUSTOMS CLEARANCE CERTIFICATE');
      
      // Clearance details
      y += 10;
      y = addField(doc, 'Clearance Number', documentData.documentNumber, y);
      y = addField(doc, 'Clearance Date', new Date(documentData.issuedAt).toLocaleDateString(), y);
      y += 15;
      
      // Exporter information
      doc.fontSize(12).font('Helvetica-Bold').text('EXPORTER', 50, y);
      y += 20;
      y = addField(doc, 'Name', exporterData.business_name, y);
      y = addField(doc, 'TIN', exporterData.tin, y);
      y += 15;
      
      // Customs declaration
      const metadata = documentData.document_metadata || {};
      doc.fontSize(12).font('Helvetica-Bold').text('CUSTOMS DECLARATION', 50, y);
      y += 20;
      y = addField(doc, 'Declaration Number', metadata.declarationNumber || 'N/A', y);
      y = addField(doc, 'HS Code', metadata.hsCode || '0901.11', y);
      y = addField(doc, 'Product Description', 'Coffee (Green Beans)', y);
      y = addField(doc, 'Quantity', metadata.quantity || 'As per declaration', y);
      y = addField(doc, 'FOB Value', metadata.fobValue || 'N/A', y);
      y = addField(doc, 'Destination Country', metadata.destinationCountry || 'N/A', y);
      y += 15;
      
      // Duties and taxes
      doc.fontSize(12).font('Helvetica-Bold').text('DUTIES AND TAXES', 50, y);
      y += 20;
      y = addField(doc, 'Export Duty', metadata.exportDuty || 'Exempt', y);
      y = addField(doc, 'VAT', metadata.vat || 'Zero-rated', y);
      y = addField(doc, 'Other Charges', metadata.otherCharges || 'None', y);
      y += 15;
      
      // Clearance statement
      doc.fontSize(10).font('Helvetica-Bold').text('CLEARANCE STATEMENT', 50, y);
      y += 15;
      doc.fontSize(9).font('Helvetica').text(
        'The Ethiopian Revenues and Customs Authority hereby certifies that the goods described above ' +
        'have been cleared for export. All applicable duties and taxes have been assessed and paid. ' +
        'The exporter is authorized to proceed with the export of these goods.',
        50, y, { width: 500, align: 'justify' }
      );
      
      // Digital signature
      const signature = generateDigitalSignature(documentData, 'CUSTOMS');
      await addDigitalSignature(doc, documentData, 'CUSTOMS', signature);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Main function to generate document PDF based on type
 */
async function generateDocumentPDF(documentData, exporterData) {
  const documentType = documentData.document_type || documentData.documentType;
  
  switch (documentType) {
    case 'EXPORT_LICENSE':
      return await generateExportLicensePDF(documentData, exporterData);
    
    case 'PHYTOSANITARY_CERTIFICATE':
      return await generatePhytosanitaryCertificatePDF(documentData, exporterData);
    
    case 'HEALTH_CERTIFICATE':
      return await generateHealthCertificatePDF(documentData, exporterData);
    
    case 'QUALITY_CERTIFICATE':
      return await generateQualityCertificatePDF(documentData, exporterData);
    
    case 'CERTIFICATE_OF_ORIGIN':
      return await generateCertificateOfOriginPDF(documentData, exporterData);
    
    case 'BANK_GUARANTEE':
      return await generateBankGuaranteePDF(documentData, exporterData);
    
    case 'SHIPPING_BOOKING':
      return await generateShippingBookingPDF(documentData, exporterData);
    
    case 'CUSTOMS_CLEARANCE':
      return await generateCustomsClearancePDF(documentData, exporterData);
    
    case 'WEIGHT_CERTIFICATE':
      return await generateWeightCertificatePDF(documentData, exporterData);
    
    case 'PACKING_LIST':
      return await generatePackingListPDF(documentData, exporterData);
    
    case 'COMMERCIAL_INVOICE':
      return await generateCommercialInvoicePDF(documentData, exporterData);
    
    default:
      throw new Error(`Unsupported document type: ${documentType}`);
  }
}

module.exports = {
  generateDocumentPDF,
  generateDigitalSignature,
  generateQRCode
};


/**
 * Generate Weight Certificate PDF
 */
async function generateWeightCertificatePDF(documentData, exporterData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));

  return new Promise(async (resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      // Add header
      addOfficialHeader(doc, 'ECX', 'WEIGHT CERTIFICATE');

      let y = 120;

      // Certificate number and date
      doc.fontSize(10).fillColor('#000000');
      doc.text(`Certificate No: ${documentData.documentNumber}`, 50, y);
      doc.text(`Issue Date: ${new Date(documentData.issuedAt).toLocaleDateString()}`, 400, y, { align: 'right' });
      y += 30;

      // Title
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#2c3e50');
      doc.text('WEIGHT CERTIFICATE', 50, y, { align: 'center' });
      y += 40;

      // Exporter details
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('EXPORTER DETAILS', 50, y);
      y += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Company Name: ${exporterData.business_name}`, 50, y);
      y += 15;
      doc.text(`TIN: ${exporterData.tin}`, 50, y);
      y += 15;
      doc.text(`Address: ${exporterData.address || 'N/A'}`, 50, y);
      y += 30;

      // Weight details
      const metadata = documentData.document_metadata || {};
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('WEIGHT DETAILS', 50, y);
      y += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Number of Bags: ${metadata.numberOfBags || 'N/A'}`, 50, y);
      y += 15;
      doc.text(`Gross Weight: ${metadata.grossWeight || 'N/A'} kg`, 50, y);
      y += 15;
      doc.text(`Tare Weight: ${metadata.tareWeight || 'N/A'} kg`, 50, y);
      y += 15;
      doc.text(`Net Weight: ${metadata.netWeight || 'N/A'} kg`, 50, y);
      y += 15;
      doc.text(`Weighing Date: ${metadata.weighingDate || new Date().toLocaleDateString()}`, 50, y);
      y += 15;
      doc.text(`Weighing Location: ${metadata.weighingLocation || 'ECX Warehouse'}`, 50, y);
      y += 30;

      // Coffee details
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('COFFEE DETAILS', 50, y);
      y += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Coffee Type: ${metadata.coffeeType || 'Arabica'}`, 50, y);
      y += 15;
      doc.text(`Grade: ${metadata.grade || 'Grade 1'}`, 50, y);
      y += 15;
      doc.text(`Origin: ${metadata.origin || 'Ethiopia'}`, 50, y);
      y += 30;

      // Inspector details
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('INSPECTOR CERTIFICATION', 50, y);
      y += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Inspector Name: ${metadata.inspectorName || 'ECX Inspector'}`, 50, y);
      y += 15;
      doc.text(`Inspector ID: ${metadata.inspectorId || 'ECX-INS-001'}`, 50, y);
      y += 15;
      doc.text(`Inspection Date: ${new Date(documentData.issuedAt).toLocaleDateString()}`, 50, y);
      y += 40;

      // Digital signature
      const signature = generateDigitalSignature(documentData, 'ECX');
      doc.fontSize(8).fillColor('#666666');
      doc.text(`Digital Signature: ${signature.substring(0, 40)}...`, 50, y);
      y += 15;

      // QR Code
      const qrData = await generateQRCode(`https://ecx.gov.et/verify/weight/${documentData.documentNumber}`);
      const qrImage = Buffer.from(qrData.split(',')[1], 'base64');
      doc.image(qrImage, 470, y - 80, { width: 80, height: 80 });

      // Footer
      doc.fontSize(8).fillColor('#999999');
      doc.text('This is a computer-generated document. Verify authenticity by scanning the QR code.', 50, 750, {
        align: 'center',
        width: 500
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Packing List PDF
 */
async function generatePackingListPDF(documentData, exporterData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));

  return new Promise(async (resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      // Header
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#2c3e50');
      doc.text('PACKING LIST', 50, 50, { align: 'center' });

      let y = 100;

      // Document info
      doc.fontSize(10).fillColor('#000000').font('Helvetica');
      doc.text(`Packing List No: ${documentData.documentNumber}`, 50, y);
      doc.text(`Date: ${new Date(documentData.issuedAt).toLocaleDateString()}`, 400, y, { align: 'right' });
      y += 30;

      // Exporter details
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('EXPORTER', 50, y);
      y += 15;

      doc.fontSize(10).font('Helvetica');
      doc.text(exporterData.business_name, 50, y);
      y += 12;
      doc.text(`TIN: ${exporterData.tin}`, 50, y);
      y += 12;
      doc.text(exporterData.address || 'N/A', 50, y);
      y += 30;

      // Buyer details
      const metadata = documentData.document_metadata || {};
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('CONSIGNEE', 50, y);
      y += 15;

      doc.fontSize(10).font('Helvetica');
      doc.text(metadata.buyerName || 'N/A', 50, y);
      y += 12;
      doc.text(metadata.buyerAddress || 'N/A', 50, y);
      y += 12;
      doc.text(metadata.buyerCountry || 'N/A', 50, y);
      y += 30;

      // Shipment details
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('SHIPMENT DETAILS', 50, y);
      y += 15;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Port of Loading: ${metadata.portOfLoading || 'Port of Djibouti'}`, 50, y);
      y += 12;
      doc.text(`Port of Discharge: ${metadata.portOfDischarge || 'N/A'}`, 50, y);
      y += 12;
      doc.text(`Vessel: ${metadata.vesselName || 'N/A'}`, 50, y);
      y += 12;
      doc.text(`Container No: ${metadata.containerNumber || 'N/A'}`, 50, y);
      y += 30;

      // Packing details table
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('PACKING DETAILS', 50, y);
      y += 20;

      // Table header
      doc.fontSize(9).font('Helvetica-Bold');
      doc.rect(50, y, 500, 20).fillAndStroke('#e8f4f8', '#2c3e50');
      doc.fillColor('#000000');
      doc.text('Description', 55, y + 5);
      doc.text('Quantity', 250, y + 5);
      doc.text('Weight (kg)', 350, y + 5);
      doc.text('Marks & Numbers', 450, y + 5);
      y += 25;

      // Table rows
      const items = metadata.items || [
        {
          description: 'Coffee Beans - Arabica Grade 1',
          quantity: '300 bags',
          weight: '18,000',
          marks: 'ETH-001-300'
        }
      ];

      doc.fontSize(9).font('Helvetica');
      items.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(50, y, 500, 20).fill('#f8f9fa');
        }
        doc.fillColor('#000000');
        doc.text(item.description, 55, y + 5, { width: 180 });
        doc.text(item.quantity, 250, y + 5);
        doc.text(item.weight, 350, y + 5);
        doc.text(item.marks, 450, y + 5);
        y += 25;
      });

      // Total
      y += 10;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Total Packages: ${metadata.totalPackages || items.length}`, 50, y);
      doc.text(`Total Weight: ${metadata.totalWeight || '18,000'} kg`, 350, y);
      y += 40;

      // Signature
      doc.fontSize(10).font('Helvetica');
      doc.text('_______________________', 50, y);
      doc.text('_______________________', 350, y);
      y += 15;
      doc.text('Authorized Signature', 50, y);
      doc.text('Date', 350, y);

      // QR Code
      const qrData = await generateQRCode(`https://ecta.gov.et/verify/packing/${documentData.documentNumber}`);
      const qrImage = Buffer.from(qrData.split(',')[1], 'base64');
      doc.image(qrImage, 470, 650, { width: 80, height: 80 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Commercial Invoice PDF
 */
async function generateCommercialInvoicePDF(documentData, exporterData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));

  return new Promise(async (resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      // Header
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#2c3e50');
      doc.text('COMMERCIAL INVOICE', 50, 50, { align: 'center' });

      let y = 100;

      // Invoice info
      doc.fontSize(10).fillColor('#000000').font('Helvetica');
      doc.text(`Invoice No: ${documentData.documentNumber}`, 50, y);
      doc.text(`Date: ${new Date(documentData.issuedAt).toLocaleDateString()}`, 400, y, { align: 'right' });
      y += 30;

      // Seller details
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('SELLER', 50, y);
      y += 15;

      doc.fontSize(10).font('Helvetica');
      doc.text(exporterData.business_name, 50, y);
      y += 12;
      doc.text(`TIN: ${exporterData.tin}`, 50, y);
      y += 12;
      doc.text(exporterData.address || 'N/A', 50, y);
      y += 12;
      doc.text(`Tel: ${exporterData.phone || 'N/A'}`, 50, y);
      y += 12;
      doc.text(`Email: ${exporterData.email || 'N/A'}`, 50, y);
      y += 30;

      // Buyer details
      const metadata = documentData.document_metadata || {};
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('BUYER', 50, y);
      y += 15;

      doc.fontSize(10).font('Helvetica');
      doc.text(metadata.buyerName || 'N/A', 50, y);
      y += 12;
      doc.text(metadata.buyerAddress || 'N/A', 50, y);
      y += 12;
      doc.text(metadata.buyerCountry || 'N/A', 50, y);
      y += 30;

      // Payment & delivery terms
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TERMS', 50, y);
      y += 15;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Payment Terms: ${metadata.paymentTerms || 'Net 30 days'}`, 50, y);
      y += 12;
      doc.text(`Payment Method: ${metadata.paymentMethod || 'Letter of Credit'}`, 50, y);
      y += 12;
      doc.text(`Incoterms: ${metadata.incoterms || 'FOB'}`, 50, y);
      y += 12;
      doc.text(`Currency: ${metadata.currency || 'USD'}`, 50, y);
      y += 30;

      // Items table
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('ITEMS', 50, y);
      y += 20;

      // Table header
      doc.fontSize(9).font('Helvetica-Bold');
      doc.rect(50, y, 500, 20).fillAndStroke('#e8f4f8', '#2c3e50');
      doc.fillColor('#000000');
      doc.text('Description', 55, y + 5);
      doc.text('Quantity', 280, y + 5);
      doc.text('Unit Price', 360, y + 5);
      doc.text('Amount', 460, y + 5);
      y += 25;

      // Table rows
      const items = metadata.items || [
        {
          description: 'Coffee Beans - Arabica Grade 1',
          quantity: '300 bags (60kg each)',
          unitPrice: '250.00',
          amount: '75,000.00'
        }
      ];

      doc.fontSize(9).font('Helvetica');
      let subtotal = 0;
      items.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(50, y, 500, 20).fill('#f8f9fa');
        }
        doc.fillColor('#000000');
        doc.text(item.description, 55, y + 5, { width: 210 });
        doc.text(item.quantity, 280, y + 5);
        doc.text(`$${item.unitPrice}`, 360, y + 5);
        doc.text(`$${item.amount}`, 460, y + 5);
        subtotal += parseFloat(item.amount.replace(/,/g, ''));
        y += 25;
      });

      // Totals
      y += 10;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Subtotal:', 360, y);
      doc.text(`$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 460, y);
      y += 15;

      const taxRate = metadata.taxRate || 0;
      if (taxRate > 0) {
        const tax = subtotal * (taxRate / 100);
        doc.text(`Tax (${taxRate}%):`, 360, y);
        doc.text(`$${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 460, y);
        y += 15;
        subtotal += tax;
      }

      doc.fontSize(12);
      doc.text('TOTAL:', 360, y);
      doc.text(`$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 460, y);
      y += 40;

      // Bank details
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('BANK DETAILS', 50, y);
      y += 15;

      doc.fontSize(9).font('Helvetica');
      doc.text(`Bank Name: ${metadata.bankName || 'Commercial Bank of Ethiopia'}`, 50, y);
      y += 12;
      doc.text(`Account Number: ${metadata.accountNumber || 'N/A'}`, 50, y);
      y += 12;
      doc.text(`SWIFT Code: ${metadata.swiftCode || 'N/A'}`, 50, y);
      y += 30;

      // Signature
      doc.fontSize(10).font('Helvetica');
      doc.text('_______________________', 50, y);
      y += 15;
      doc.text('Authorized Signature', 50, y);
      doc.text(exporterData.business_name, 50, y + 12);

      // QR Code
      const qrData = await generateQRCode(`https://ecta.gov.et/verify/invoice/${documentData.documentNumber}`);
      const qrImage = Buffer.from(qrData.split(',')[1], 'base64');
      doc.image(qrImage, 470, 650, { width: 80, height: 80 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Export the new functions
module.exports.generateWeightCertificatePDF = generateWeightCertificatePDF;
module.exports.generatePackingListPDF = generatePackingListPDF;
module.exports.generateCommercialInvoicePDF = generateCommercialInvoicePDF;
