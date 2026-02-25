const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Phase 4: Logistics PDF Generators
 * Generates PDFs for customs declarations, fumigation certificates, shipping instructions, and Bill of Lading
 */

/**
 * Generate Customs Declaration PDF (SAD format)
 */
async function generateCustomsDeclarationPDF(declaration, outputPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(outputPath);
            
            doc.pipe(stream);

            // Header
            doc.fontSize(20).text('CUSTOMS DECLARATION', { align: 'center' });
            doc.fontSize(12).text('Ethiopian Customs Commission', { align: 'center' });
            doc.moveDown();

            // Declaration details
            doc.fontSize(10);
            doc.text(`Declaration ID: ${declaration.declarationId}`);
            doc.text(`Declaration Date: ${new Date(declaration.declarationDate).toLocaleDateString()}`);
            doc.text(`Customs Office: ${declaration.customsOffice}`);
            doc.text(`Type: ${declaration.declarationType.toUpperCase()}`);
            doc.moveDown();

            // Exporter details
            doc.fontSize(12).text('Exporter Information', { underline: true });
            doc.fontSize(10);
            doc.text(`Exporter ID: ${declaration.exporterId}`);
            doc.text(`Company Name: ${declaration.exporterName}`);
            doc.moveDown();

            // Commodity details
            doc.fontSize(12).text('Commodity Information', { underline: true });
            doc.fontSize(10);
            doc.text(`HS Code: ${declaration.hsCode}`);
            doc.text(`Description: ${declaration.tariffDescription}`);
            doc.moveDown();

            // Valuation
            doc.fontSize(12).text('Customs Valuation', { underline: true });
            doc.fontSize(10);
            doc.text(`Customs Value: ${declaration.customsValue} ${declaration.currency}`);
            doc.text(`Duty Rate: ${(declaration.dutyRate * 100).toFixed(2)}%`);
            doc.text(`Duty Amount: ${declaration.dutyAmount.toFixed(2)} ${declaration.currency}`);
            doc.text(`Tax Amount: ${declaration.taxAmount.toFixed(2)} ${declaration.currency}`);
            doc.text(`Total Amount: ${declaration.totalAmount.toFixed(2)} ${declaration.currency}`, { bold: true });
            doc.moveDown();

            // Status
            doc.fontSize(12).text('Status', { underline: true });
            doc.fontSize(10);
            doc.text(`Current Status: ${declaration.status.toUpperCase()}`);
            if (declaration.submittedAt) {
                doc.text(`Submitted: ${new Date(declaration.submittedAt).toLocaleString()}`);
            }
            if (declaration.approvedAt) {
                doc.text(`Approved: ${new Date(declaration.approvedAt).toLocaleString()}`);
                doc.text(`Approved By: ${declaration.reviewedBy}`);
            }

            // Generate QR code
            const qrData = JSON.stringify({
                declarationId: declaration.declarationId,
                shipmentId: declaration.shipmentId,
                status: declaration.status
            });
            const qrCodeDataURL = await QRCode.toDataURL(qrData);
            const qrImage = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
            
            doc.image(qrImage, doc.page.width - 150, doc.page.height - 150, { width: 100 });

            doc.end();
            
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Fumigation Certificate PDF
 */
async function generateFumigationCertificatePDF(fumigation, outputPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(outputPath);
            
            doc.pipe(stream);

            // Header
            doc.fontSize(20).text('FUMIGATION CERTIFICATE', { align: 'center' });
            doc.fontSize(10).text('ISPM 15 Compliant Treatment', { align: 'center' });
            doc.moveDown();

            // Certificate details
            doc.fontSize(10);
            doc.text(`Certificate Number: ${fumigation.certificateNumber}`);
            doc.text(`Fumigation ID: ${fumigation.fumigationId}`);
            doc.text(`Container ID: ${fumigation.containerId}`);
            doc.moveDown();

            // Treatment details
            doc.fontSize(12).text('Treatment Information', { underline: true });
            doc.fontSize(10);
            doc.text(`Fumigation Type: ${fumigation.fumigationType}`);
            if (fumigation.chemical) {
                doc.text(`Chemical Used: ${fumigation.chemical}`);
            }
            if (fumigation.concentration) {
                doc.text(`Concentration: ${fumigation.concentration}`);
            }
            if (fumigation.treatmentDate) {
                doc.text(`Treatment Date: ${new Date(fumigation.treatmentDate).toLocaleDateString()}`);
            }
            if (fumigation.treatmentDuration) {
                doc.text(`Duration: ${fumigation.treatmentDuration} hours`);
            }
            doc.moveDown();

            // Compliance
            doc.fontSize(12).text('Compliance', { underline: true });
            doc.fontSize(10);
            doc.text(`ISPM 15 Compliant: ${fumigation.ispm15Compliant ? 'YES' : 'NO'}`);
            doc.text(`Treatment Standard: ${fumigation.treatmentStandard}`);
            doc.moveDown();

            // Issuer details
            doc.fontSize(12).text('Issued By', { underline: true });
            doc.fontSize(10);
            doc.text(`Company: ${fumigation.issuingCompany || 'N/A'}`);
            doc.text(`License: ${fumigation.companyLicense || 'N/A'}`);
            doc.text(`Issued By: ${fumigation.issuedBy || 'N/A'}`);
            doc.moveDown();

            // Validity
            if (fumigation.validFrom && fumigation.validUntil) {
                doc.fontSize(12).text('Validity Period', { underline: true });
                doc.fontSize(10);
                doc.text(`Valid From: ${new Date(fumigation.validFrom).toLocaleDateString()}`);
                doc.text(`Valid Until: ${new Date(fumigation.validUntil).toLocaleDateString()}`);
            }

            // Generate QR code
            const qrData = JSON.stringify({
                certificateNumber: fumigation.certificateNumber,
                fumigationId: fumigation.fumigationId,
                ispm15: fumigation.ispm15Compliant
            });
            const qrCodeDataURL = await QRCode.toDataURL(qrData);
            const qrImage = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
            
            doc.image(qrImage, doc.page.width - 150, doc.page.height - 150, { width: 100 });

            doc.end();
            
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Shipping Instructions PDF
 */
async function generateShippingInstructionsPDF(instructions, outputPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(outputPath);
            
            doc.pipe(stream);

            // Header
            doc.fontSize(20).text('SHIPPING INSTRUCTIONS', { align: 'center' });
            doc.moveDown();

            // Instruction details
            doc.fontSize(10);
            doc.text(`Instruction ID: ${instructions.instructionId}`);
            doc.text(`Shipment ID: ${instructions.shipmentId}`);
            doc.text(`Booking Number: ${instructions.bookingNumber || 'N/A'}`);
            doc.moveDown();

            // Shipping line
            doc.fontSize(12).text('Shipping Line', { underline: true });
            doc.fontSize(10);
            doc.text(`Carrier: ${instructions.shippingLine}`);
            doc.text(`Booking Date: ${new Date(instructions.bookingDate).toLocaleDateString()}`);
            doc.moveDown();

            // Container requirements
            doc.fontSize(12).text('Container Requirements', { underline: true });
            doc.fontSize(10);
            doc.text(`Container Type: ${instructions.containerType}`);
            doc.text(`Container Count: ${instructions.containerCount}`);
            if (instructions.temperatureControl) {
                doc.text(`Temperature Control: Required (${instructions.temperatureRange})`);
            }
            if (instructions.ventilationRequired) {
                doc.text(`Ventilation: Required`);
            }
            doc.moveDown();

            // Ports
            doc.fontSize(12).text('Port Information', { underline: true });
            doc.fontSize(10);
            doc.text(`Port of Loading: ${instructions.portOfLoading} (${instructions.portOfLoadingCode})`);
            doc.text(`Port of Discharge: ${instructions.portOfDischarge} (${instructions.portOfDischargeCode})`);
            doc.text(`Final Destination: ${instructions.finalDestination}`);
            doc.moveDown();

            // Cargo details
            doc.fontSize(12).text('Cargo Details', { underline: true });
            doc.fontSize(10);
            doc.text(`Description: ${instructions.cargoDescription}`);
            doc.text(`Gross Weight: ${instructions.grossWeight} kg`);
            doc.text(`Net Weight: ${instructions.netWeight} kg`);
            doc.text(`Volume: ${instructions.volume} m³`);
            doc.moveDown();

            // Special instructions
            if (instructions.specialInstructions) {
                doc.fontSize(12).text('Special Instructions', { underline: true });
                doc.fontSize(10);
                doc.text(instructions.specialInstructions);
            }

            doc.end();
            
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Bill of Lading PDF
 */
async function generateBillOfLadingPDF(bl, outputPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(outputPath);
            
            doc.pipe(stream);

            // Header
            doc.fontSize(20).text('BILL OF LADING', { align: 'center' });
            doc.fontSize(10).text(`B/L Number: ${bl.blNumber}`, { align: 'center' });
            doc.fontSize(10).text(`Type: ${bl.blType.toUpperCase()}`, { align: 'center' });
            doc.moveDown();

            // Shipper
            doc.fontSize(12).text('Shipper', { underline: true });
            doc.fontSize(10);
            doc.text(bl.shipper.name);
            doc.text(bl.shipper.address);
            doc.text(`${bl.shipper.country}`);
            doc.text(`Contact: ${bl.shipper.contact}`);
            doc.moveDown();

            // Consignee
            doc.fontSize(12).text('Consignee', { underline: true });
            doc.fontSize(10);
            doc.text(bl.consignee.name);
            doc.text(bl.consignee.address);
            doc.text(`${bl.consignee.country}`);
            doc.text(`Contact: ${bl.consignee.contact}`);
            doc.moveDown();

            // Notify Party
            doc.fontSize(12).text('Notify Party', { underline: true });
            doc.fontSize(10);
            doc.text(bl.notifyParty.name);
            doc.text(bl.notifyParty.address);
            doc.moveDown();

            // Vessel details
            doc.fontSize(12).text('Vessel & Voyage', { underline: true });
            doc.fontSize(10);
            doc.text(`Vessel Name: ${bl.vesselName}`);
            doc.text(`Voyage Number: ${bl.voyageNumber}`);
            doc.moveDown();

            // Ports
            doc.fontSize(12).text('Port Information', { underline: true });
            doc.fontSize(10);
            doc.text(`Port of Loading: ${bl.portOfLoading}`);
            doc.text(`Port of Discharge: ${bl.portOfDischarge}`);
            doc.text(`Place of Receipt: ${bl.placeOfReceipt}`);
            doc.text(`Place of Delivery: ${bl.placeOfDelivery}`);
            doc.moveDown();

            // Containers
            doc.fontSize(12).text('Container Details', { underline: true });
            doc.fontSize(10);
            if (bl.containers && bl.containers.length > 0) {
                bl.containers.forEach((container, index) => {
                    doc.text(`Container ${index + 1}:`);
                    doc.text(`  Number: ${container.containerNumber}`);
                    doc.text(`  Seal: ${container.sealNumber}`);
                    doc.text(`  Packages: ${container.numberOfPackages}`);
                    doc.text(`  Weight: ${container.grossWeight} kg`);
                    doc.moveDown(0.5);
                });
            }
            doc.moveDown();

            // Freight
            doc.fontSize(12).text('Freight Details', { underline: true });
            doc.fontSize(10);
            doc.text(`Freight Terms: ${bl.freightTerms.toUpperCase()}`);
            doc.text(`Freight Amount: ${bl.freightAmount} ${bl.freightCurrency}`);
            doc.moveDown();

            // Dates
            doc.fontSize(12).text('Dates', { underline: true });
            doc.fontSize(10);
            doc.text(`Date of Issue: ${new Date(bl.dateOfIssue).toLocaleDateString()}`);
            if (bl.dateOfShipment) {
                doc.text(`Date of Shipment: ${new Date(bl.dateOfShipment).toLocaleDateString()}`);
            }
            doc.moveDown();

            // Signature
            doc.fontSize(10);
            doc.text(`Issued By: ${bl.issuedBy}`);
            doc.text(`Place and Date: ${new Date(bl.issuedAt).toLocaleString()}`);

            // Generate QR code
            const qrData = JSON.stringify({
                blNumber: bl.blNumber,
                vesselName: bl.vesselName,
                voyageNumber: bl.voyageNumber
            });
            const qrCodeDataURL = await QRCode.toDataURL(qrData);
            const qrImage = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
            
            doc.image(qrImage, doc.page.width - 150, 50, { width: 100 });

            doc.end();
            
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateCustomsDeclarationPDF,
    generateFumigationCertificatePDF,
    generateShippingInstructionsPDF,
    generateBillOfLadingPDF
};
