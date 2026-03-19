const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate Sales Contract Certificate PDF
 * Professional format with all contract details
 */
async function generateSalesContractCertificate(contractData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true
      });

      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 40;
      const contentWidth = pageWidth - 2 * margin;

      // ==================== Header ====================
      doc.fontSize(24).font('Helvetica-Bold').text('SALES CONTRACT CERTIFICATE', {
        align: 'center'
      });

      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text('Official Record of Coffee Export Sales Agreement', {
        align: 'center'
      });

      doc.moveDown(0.5);
      doc.strokeColor('#2c3e50').lineWidth(2).moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();

      // ==================== Certificate Number & Date ====================
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');
      
      const certNumber = `CERT-${contractData.contractId || 'PENDING'}`;
      const issueDate = new Date(contractData.finalizedAt || new Date()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.text(`Certificate Number: ${certNumber}`, margin, doc.y);
      doc.text(`Issue Date: ${issueDate}`, margin, doc.y);
      doc.text(`Status: FINALIZED & BINDING`, margin, doc.y);

      // ==================== Two Column Layout ====================
      doc.moveDown(0.8);
      const colWidth = (contentWidth - 20) / 2;
      const col1X = margin;
      const col2X = margin + colWidth + 20;

      // ==================== EXPORTER INFORMATION ====================
      doc.fontSize(11).font('Helvetica-Bold').text('EXPORTER INFORMATION', col1X, doc.y);
      doc.fontSize(9).font('Helvetica');
      doc.text(`ID: ${contractData.exporterId || 'N/A'}`, col1X, doc.y);
      doc.text(`Name: ${contractData.exporterName || 'N/A'}`, col1X, doc.y);
      doc.text(`TIN: ${contractData.exporterTIN || 'N/A'}`, col1X, doc.y);
      doc.text(`Country: Ethiopia`, col1X, doc.y);

      // ==================== BUYER INFORMATION ====================
      doc.fontSize(11).font('Helvetica-Bold').text('BUYER INFORMATION', col2X, doc.y - 72);
      doc.fontSize(9).font('Helvetica');
      doc.text(`ID: ${contractData.buyerId || 'N/A'}`, col2X, doc.y - 72);
      doc.text(`Company: ${contractData.buyerName || 'N/A'}`, col2X, doc.y - 72);
      doc.text(`Country: ${contractData.buyerCountry || 'N/A'}`, col2X, doc.y - 72);
      doc.text(`Tax ID: ${contractData.buyerTaxId || 'N/A'}`, col2X, doc.y - 72);

      doc.moveDown(1.2);

      // ==================== CONTRACT TERMS ====================
      doc.fontSize(11).font('Helvetica-Bold').text('CONTRACT TERMS', margin, doc.y);
      doc.fontSize(9).font('Helvetica');

      const termsData = [
        ['Coffee Type:', contractData.coffeeType || 'N/A'],
        ['Origin Region:', contractData.originRegion || 'N/A'],
        ['Quantity:', `${contractData.quantity || 0} bags (60kg each)`],
        ['Unit Price:', `${contractData.currency || 'USD'} ${contractData.unitPrice || 0}`],
        ['Total Value:', `${contractData.currency || 'USD'} ${contractData.totalValue || 0}`],
        ['Quality Grade:', contractData.qualityGrade || 'N/A']
      ];

      termsData.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, margin, doc.y);
      });

      doc.moveDown(0.5);

      // ==================== PAYMENT & DELIVERY ====================
      doc.fontSize(11).font('Helvetica-Bold').text('PAYMENT & DELIVERY TERMS', margin, doc.y);
      doc.fontSize(9).font('Helvetica');

      const paymentData = [
        ['Payment Terms:', contractData.paymentTerms || 'N/A'],
        ['Payment Method:', contractData.paymentMethod || 'N/A'],
        ['Incoterms:', contractData.incoterms || 'N/A'],
        ['Delivery Date:', contractData.deliveryDate || 'N/A'],
        ['Port of Loading:', contractData.portOfLoading || 'N/A'],
        ['Port of Discharge:', contractData.portOfDischarge || 'N/A']
      ];

      paymentData.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, margin, doc.y);
      });

      doc.moveDown(0.5);

      // ==================== LEGAL FRAMEWORK ====================
      doc.fontSize(11).font('Helvetica-Bold').text('LEGAL FRAMEWORK', margin, doc.y);
      doc.fontSize(9).font('Helvetica');

      const legalData = [
        ['Governing Law:', contractData.governingLaw || 'CISG'],
        ['Arbitration Location:', contractData.arbitrationLocation || 'N/A'],
        ['Arbitration Rules:', contractData.arbitrationRules || 'N/A'],
        ['Contract Language:', contractData.contractLanguage || 'English']
      ];

      legalData.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, margin, doc.y);
      });

      doc.moveDown(0.5);

      // ==================== SPECIAL CONDITIONS ====================
      if (contractData.specialConditions) {
        doc.fontSize(11).font('Helvetica-Bold').text('SPECIAL CONDITIONS', margin, doc.y);
        doc.fontSize(9).font('Helvetica');
        doc.text(contractData.specialConditions, margin, doc.y, { width: contentWidth });
        doc.moveDown(0.5);
      }

      // ==================== CERTIFICATIONS ====================
      if (contractData.certificationsRequired && contractData.certificationsRequired.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').text('REQUIRED CERTIFICATIONS', margin, doc.y);
        doc.fontSize(9).font('Helvetica');
        contractData.certificationsRequired.forEach(cert => {
          doc.text(`• ${cert}`, margin + 10, doc.y);
        });
        doc.moveDown(0.5);
      }

      // ==================== BLOCKCHAIN VERIFICATION ====================
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').text('BLOCKCHAIN VERIFICATION', margin, doc.y);
      doc.fontSize(8).font('Helvetica');
      doc.text(`Contract ID: ${contractData.contractId || 'PENDING'}`, margin, doc.y);
      doc.text(`Blockchain: Hyperledger Fabric`, margin, doc.y);
      doc.text(`Network: Coffee Export Channel`, margin, doc.y);
      doc.text(`Immutable Record: Yes`, margin, doc.y);

      // ==================== QR Code ====================
      doc.moveDown(0.5);
      const qrData = {
        contractId: contractData.contractId,
        exporterId: contractData.exporterId,
        buyerId: contractData.buyerId,
        totalValue: contractData.totalValue,
        currency: contractData.currency,
        issueDate: issueDate
      };

      try {
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 100,
          margin: 1
        });

        const qrX = pageWidth - margin - 80;
        const qrY = doc.y;
        doc.image(qrCode, qrX, qrY, { width: 80, height: 80 });
        doc.fontSize(7).font('Helvetica').text('Scan for verification', qrX, qrY + 85, { width: 80, align: 'center' });
      } catch (qrError) {
        console.error('QR code generation error:', qrError);
      }

      // ==================== Footer ====================
      doc.moveDown(2);
      doc.strokeColor('#2c3e50').lineWidth(1).moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();

      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica').fillColor('#666666');
      doc.text('This certificate confirms that a binding sales contract has been finalized between the exporter and buyer.', margin, doc.y, {
        width: contentWidth,
        align: 'center'
      });

      doc.text('The contract terms are recorded on the Hyperledger Fabric blockchain for immutability and verification.', margin, doc.y, {
        width: contentWidth,
        align: 'center'
      });

      doc.moveDown(0.3);
      doc.fontSize(7).text(`Generated: ${new Date().toLocaleString()}`, margin, doc.y, {
        width: contentWidth,
        align: 'center'
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateSalesContractCertificate
};
