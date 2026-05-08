const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate Professional Sales Contract Certificate PDF
 * Ethiopian Coffee Export Sales Agreement
 */
async function generateSalesContractCertificate(contractData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: {
          Title: 'Coffee Export Sales Contract Certificate',
          Author: 'Ethiopian Coffee and Tea Authority (ECTA)',
          Subject: `Sales Contract ${contractData.contractId}`,
          Keywords: 'coffee, export, sales contract, ECTA'
        }
      });

      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      const contentWidth = pageWidth - 2 * margin;

      // ==================== DECORATIVE HEADER BORDER ====================
      doc.rect(margin - 10, margin - 10, contentWidth + 20, 140).fillAndStroke('#f8f9fa', '#2c3e50');

      // ==================== OFFICIAL SEAL/LOGO AREA ====================
      doc.fontSize(32).font('Helvetica-Bold').fillColor('#1a472a')
         .text('ECTA', margin + 10, margin + 10);
      
      doc.fontSize(8).font('Helvetica').fillColor('#2c3e50')
         .text('Ethiopian Coffee & Tea Authority', margin + 10, margin + 45);
      
      doc.fontSize(7).fillColor('#666666')
         .text('Ministry of Agriculture', margin + 10, margin + 58);

      // ==================== CERTIFICATE TITLE ====================
      doc.fontSize(26).font('Helvetica-Bold').fillColor('#1a472a')
         .text('SALES CONTRACT', margin, margin + 85, {
           align: 'center',
           width: contentWidth
         });
      
      doc.fontSize(22).fillColor('#2c3e50')
         .text('CERTIFICATE', margin, doc.y + 2, {
           align: 'center',
           width: contentWidth
         });

      // ==================== CERTIFICATE NUMBER BOX ====================
      const certBoxY = margin + 150;
      doc.roundedRect(margin, certBoxY, contentWidth, 60, 5)
         .fillAndStroke('#e8f5e9', '#4caf50');

      const certNumber = contractData.contractId || 'PENDING';
      const ectaRef = contractData.ectaReferenceNumber || 'N/A';
      const issueDate = new Date(contractData.finalizedAt || new Date()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1b5e20')
         .text('Certificate No:', margin + 15, certBoxY + 12);
      doc.fontSize(12).font('Helvetica').fillColor('#2e7d32')
         .text(certNumber, margin + 15, certBoxY + 28);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1b5e20')
         .text('ECTA Reference:', margin + contentWidth/2, certBoxY + 12);
      doc.fontSize(12).font('Helvetica').fillColor('#2e7d32')
         .text(ectaRef, margin + contentWidth/2, certBoxY + 28);

      doc.fontSize(9).font('Helvetica').fillColor('#424242')
         .text(`Issue Date: ${issueDate}`, margin + 15, certBoxY + 48);
      
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#d32f2f')
         .text('STATUS: FINALIZED & LEGALLY BINDING', margin + contentWidth/2, certBoxY + 48);

      // ==================== PARTIES SECTION ====================
      let currentY = certBoxY + 85;
      
      // Section Header
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a472a')
         .text('CONTRACTING PARTIES', margin, currentY);
      
      doc.moveTo(margin, currentY + 20).lineTo(pageWidth - margin, currentY + 20)
         .strokeColor('#4caf50').lineWidth(2).stroke();

      currentY += 35;

      // Two-column layout for parties
      const colWidth = (contentWidth - 30) / 2;
      const col1X = margin;
      const col2X = margin + colWidth + 30;

      // EXPORTER BOX
      doc.roundedRect(col1X, currentY, colWidth, 110, 3)
         .fillAndStroke('#fff3e0', '#ff9800');

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#e65100')
         .text('EXPORTER (Seller)', col1X + 10, currentY + 10);

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#424242')
         .text('Company:', col1X + 10, currentY + 30);
      doc.fontSize(9).font('Helvetica').fillColor('#212121')
         .text(contractData.exporterName || 'N/A', col1X + 10, currentY + 44, { width: colWidth - 20 });

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#424242')
         .text('TIN:', col1X + 10, currentY + 62);
      doc.fontSize(8).font('Helvetica').fillColor('#212121')
         .text(contractData.exporterTIN || 'N/A', col1X + 50, currentY + 62);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#424242')
         .text('Country:', col1X + 10, currentY + 76);
      doc.fontSize(8).font('Helvetica').fillColor('#212121')
         .text('Ethiopia', col1X + 50, currentY + 76);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#424242')
         .text('ID:', col1X + 10, currentY + 90);
      doc.fontSize(7).font('Helvetica').fillColor('#616161')
         .text(contractData.exporterId || 'N/A', col1X + 50, currentY + 90, { width: colWidth - 60 });

      // BUYER BOX
      doc.roundedRect(col2X, currentY, colWidth, 110, 3)
         .fillAndStroke('#e3f2fd', '#2196f3');

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0d47a1')
         .text('BUYER (Purchaser)', col2X + 10, currentY + 10);

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#424242')
         .text('Company:', col2X + 10, currentY + 30);
      doc.fontSize(9).font('Helvetica').fillColor('#212121')
         .text(contractData.buyerName || 'N/A', col2X + 10, currentY + 44, { width: colWidth - 20 });

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#424242')
         .text('Tax ID:', col2X + 10, currentY + 62);
      doc.fontSize(8).font('Helvetica').fillColor('#212121')
         .text(contractData.buyerTaxId || 'N/A', col2X + 55, currentY + 62);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#424242')
         .text('Country:', col2X + 10, currentY + 76);
      doc.fontSize(8).font('Helvetica').fillColor('#212121')
         .text(contractData.buyerCountry || 'N/A', col2X + 55, currentY + 76);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#424242')
         .text('ID:', col2X + 10, currentY + 90);
      doc.fontSize(7).font('Helvetica').fillColor('#616161')
         .text(contractData.buyerId || 'N/A', col2X + 55, currentY + 90, { width: colWidth - 65 });

      currentY += 130;

      // ==================== CONTRACT TERMS SECTION ====================
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a472a')
         .text('CONTRACT TERMS & CONDITIONS', margin, currentY);
      
      doc.moveTo(margin, currentY + 20).lineTo(pageWidth - margin, currentY + 20)
         .strokeColor('#4caf50').lineWidth(2).stroke();

      currentY += 35;

      // Terms Table
      const drawTermRow = (label, value, y, bgColor = '#ffffff') => {
        doc.rect(margin, y, contentWidth, 20).fillAndStroke(bgColor, '#e0e0e0');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#424242')
           .text(label, margin + 10, y + 6);
        doc.fontSize(9).font('Helvetica').fillColor('#212121')
           .text(value, margin + 180, y + 6, { width: contentWidth - 190 });
      };

      drawTermRow('Coffee Type:', contractData.coffeeType || 'N/A', currentY, '#f5f5f5');
      currentY += 20;
      drawTermRow('Origin Region:', contractData.originRegion || 'N/A', currentY);
      currentY += 20;
      drawTermRow('Quality Grade:', contractData.qualityGrade || 'N/A', currentY, '#f5f5f5');
      currentY += 20;
      drawTermRow('Quantity:', `${contractData.quantity || 0} bags (60kg each)`, currentY);
      currentY += 20;
      drawTermRow('Unit Price:', `${contractData.currency || 'USD'} ${parseFloat(contractData.unitPrice || 0).toFixed(2)}`, currentY, '#f5f5f5');
      currentY += 20;
      drawTermRow('Total Contract Value:', `${contractData.currency || 'USD'} ${parseFloat(contractData.totalValue || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, currentY, '#fff3e0');
      currentY += 20;

      // Add new page if needed
      if (currentY > pageHeight - 200) {
        doc.addPage();
        currentY = margin;
      }

      currentY += 15;

      // ==================== PAYMENT & DELIVERY ====================
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a472a')
         .text('PAYMENT & DELIVERY', margin, currentY);
      
      doc.moveTo(margin, currentY + 18).lineTo(pageWidth - margin, currentY + 18)
         .strokeColor('#4caf50').lineWidth(1).stroke();

      currentY += 28;

      drawTermRow('Payment Terms:', contractData.paymentTerms || 'N/A', currentY, '#f5f5f5');
      currentY += 20;
      drawTermRow('Payment Method:', contractData.paymentMethod || 'N/A', currentY);
      currentY += 20;
      drawTermRow('Incoterms:', contractData.incoterms || 'N/A', currentY, '#f5f5f5');
      currentY += 20;
      drawTermRow('Delivery Date:', new Date(contractData.deliveryDate).toLocaleDateString() || 'N/A', currentY);
      currentY += 20;
      drawTermRow('Port of Loading:', contractData.portOfLoading || 'N/A', currentY, '#f5f5f5');
      currentY += 20;
      drawTermRow('Port of Discharge:', contractData.portOfDischarge || 'N/A', currentY);
      currentY += 20;

      currentY += 15;

      // ==================== LEGAL FRAMEWORK ====================
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a472a')
         .text('LEGAL FRAMEWORK', margin, currentY);
      
      doc.moveTo(margin, currentY + 18).lineTo(pageWidth - margin, currentY + 18)
         .strokeColor('#4caf50').lineWidth(1).stroke();

      currentY += 28;

      drawTermRow('Governing Law:', contractData.governingLaw || 'CISG', currentY, '#f5f5f5');
      currentY += 20;
      drawTermRow('Arbitration Location:', contractData.arbitrationLocation || 'N/A', currentY);
      currentY += 20;
      drawTermRow('Arbitration Rules:', contractData.arbitrationRules || 'N/A', currentY, '#f5f5f5');
      currentY += 20;
      drawTermRow('Contract Language:', contractData.contractLanguage || 'English', currentY);
      currentY += 20;

      // Add new page if needed
      if (currentY > pageHeight - 250) {
        doc.addPage();
        currentY = margin;
      }

      currentY += 15;

      // ==================== CERTIFICATIONS ====================
      if (contractData.certificationsRequired && contractData.certificationsRequired.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a472a')
           .text('REQUIRED CERTIFICATIONS', margin, currentY);
        
        doc.moveTo(margin, currentY + 18).lineTo(pageWidth - margin, currentY + 18)
           .strokeColor('#4caf50').lineWidth(1).stroke();

        currentY += 28;

        doc.roundedRect(margin, currentY, contentWidth, 30 + (contractData.certificationsRequired.length * 15), 3)
           .fillAndStroke('#f1f8e9', '#8bc34a');

        doc.fontSize(9).font('Helvetica').fillColor('#33691e');
        contractData.certificationsRequired.forEach((cert, index) => {
          doc.text(`✓ ${cert}`, margin + 15, currentY + 10 + (index * 15));
        });

        currentY += 40 + (contractData.certificationsRequired.length * 15);
      }

      // ==================== BLOCKCHAIN VERIFICATION ====================
      currentY += 10;
      
      doc.roundedRect(margin, currentY, contentWidth - 110, 80, 3)
         .fillAndStroke('#e8eaf6', '#3f51b5');

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a237e')
         .text('BLOCKCHAIN VERIFICATION', margin + 15, currentY + 12);

      doc.fontSize(8).font('Helvetica').fillColor('#283593')
         .text('This contract is recorded on an immutable blockchain ledger', margin + 15, currentY + 30);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#424242')
         .text('Network:', margin + 15, currentY + 48);
      doc.fontSize(8).font('Helvetica').fillColor('#212121')
         .text('Hyperledger Fabric - Coffee Export Channel', margin + 60, currentY + 48);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#424242')
         .text('Status:', margin + 15, currentY + 62);
      doc.fontSize(8).font('Helvetica').fillColor('#2e7d32')
         .text('Verified & Immutable', margin + 60, currentY + 62);

      // ==================== QR CODE ====================
      try {
        const qrData = {
          type: 'SALES_CONTRACT',
          contractId: contractData.contractId,
          ectaRef: ectaRef,
          exporter: contractData.exporterId,
          buyer: contractData.buyerId,
          value: contractData.totalValue,
          currency: contractData.currency,
          date: issueDate,
          verify: `https://ecta.gov.et/verify/${contractData.contractId}`
        };

        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 200,
          margin: 1,
          color: {
            dark: '#1a472a',
            light: '#ffffff'
          }
        });

        const qrX = pageWidth - margin - 95;
        const qrY = currentY + 5;
        
        doc.roundedRect(qrX - 5, qrY - 5, 100, 100, 3)
           .fillAndStroke('#ffffff', '#4caf50');
        
        doc.image(qrCode, qrX, qrY, { width: 90, height: 90 });
        
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#1a472a')
           .text('Scan to Verify', qrX, qrY + 95, { width: 90, align: 'center' });
      } catch (qrError) {
        console.error('QR code generation error:', qrError);
      }

      currentY += 100;

      // ==================== OFFICIAL DECLARATION ====================
      doc.roundedRect(margin, currentY, contentWidth, 60, 3)
         .fillAndStroke('#fff8e1', '#ffa000');

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#e65100')
         .text('OFFICIAL DECLARATION', margin + 15, currentY + 10);

      doc.fontSize(8).font('Helvetica').fillColor('#424242')
         .text('This certificate confirms that a legally binding sales contract has been finalized and registered with the Ethiopian Coffee & Tea Authority (ECTA). The contract terms are recorded on the Hyperledger Fabric blockchain for immutability, transparency, and verification.', 
           margin + 15, currentY + 26, { width: contentWidth - 30, align: 'justify' });

      // ==================== FOOTER ====================
      const footerY = pageHeight - margin - 40;
      
      doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY)
         .strokeColor('#bdbdbd').lineWidth(1).stroke();

      doc.fontSize(7).font('Helvetica').fillColor('#757575')
         .text('Ethiopian Coffee & Tea Authority (ECTA) | Ministry of Agriculture', margin, footerY + 8, {
           width: contentWidth,
           align: 'center'
         });

      doc.fontSize(7).fillColor('#9e9e9e')
         .text('P.O. Box 2591, Addis Ababa, Ethiopia | Tel: +251-11-646-0340 | www.ecta.gov.et', margin, footerY + 20, {
           width: contentWidth,
           align: 'center'
         });

      doc.fontSize(6).fillColor('#bdbdbd')
         .text(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' })} EAT`, margin, footerY + 32, {
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
