const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a commercial invoice PDF for a shipment
 * @param {Object} shipment - The shipment object from chaincode
 * @param {string} outputPath - Full path where PDF should be saved
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateInvoicePDF(shipment, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Ensure output directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24)
         .text('COMMERCIAL INVOICE', { align: 'center' })
         .moveDown();

      // Invoice Details
      doc.fontSize(12);
      doc.text(`Invoice Number: ${shipment.commercialInvoice.invoiceNumber}`, { bold: true });
      doc.text(`Invoice Date: ${new Date(shipment.commercialInvoice.invoiceDate).toLocaleDateString()}`);
      doc.text(`Currency: ${shipment.pricing.currency}`);
      doc.moveDown();

      // Exporter Details
      doc.fontSize(14).text('EXPORTER:', { underline: true });
      doc.fontSize(12);
      doc.text(shipment.exporterName);
      doc.text(`Export License: ${shipment.exportLicenseNumber}`);
      doc.moveDown();

      // Buyer Details
      doc.fontSize(14).text('BUYER:', { underline: true });
      doc.fontSize(12);
      doc.text(shipment.salesContract.buyerCompanyName);
      doc.text(`Country: ${shipment.salesContract.buyerCountry}`);
      if (shipment.salesContract.buyerContact) {
        doc.text(`Contact: ${shipment.salesContract.buyerContact.name}`);
        doc.text(`Email: ${shipment.salesContract.buyerContact.email}`);
      }
      doc.moveDown();

      // Coffee Details
      doc.fontSize(14).text('COFFEE DETAILS:', { underline: true });
      doc.fontSize(12);
      doc.text(`Type: ${shipment.coffeeDetails.type}`);
      doc.text(`Grade: ${shipment.coffeeDetails.grade}`);
      doc.text(`Quantity: ${shipment.coffeeDetails.quantity} kg`);
      doc.text(`Number of Bags: ${shipment.coffeeDetails.numberOfBags}`);
      if (shipment.coffeeDetails.geographicalDesignation) {
        doc.text(`Origin: ${shipment.coffeeDetails.geographicalDesignation}`);
      }
      if (shipment.coffeeDetails.processingMethod) {
        doc.text(`Processing: ${shipment.coffeeDetails.processingMethod}`);
      }
      doc.moveDown();

      // Pricing Table
      doc.fontSize(14).text('PRICING:', { underline: true });
      doc.fontSize(12);
      
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 250;
      const col3 = 400;
      
      // Table headers
      doc.text('Description', col1, tableTop);
      doc.text('Unit Price', col2, tableTop);
      doc.text('Total', col3, tableTop);
      
      doc.moveTo(col1, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();
      
      // Table row
      const rowTop = tableTop + 20;
      doc.text(`${shipment.coffeeDetails.type} - ${shipment.coffeeDetails.grade}`, col1, rowTop);
      doc.text(`${shipment.pricing.unitPrice} ${shipment.pricing.currency}/kg`, col2, rowTop);
      doc.text(`${shipment.pricing.totalValue} ${shipment.pricing.currency}`, col3, rowTop);
      
      doc.moveTo(col1, rowTop + 15)
         .lineTo(550, rowTop + 15)
         .stroke();
      
      doc.moveDown(3);

      // Total
      doc.fontSize(14);
      doc.text(`TOTAL VALUE: ${shipment.pricing.totalValue} ${shipment.pricing.currency}`, { align: 'right' });
      doc.moveDown();

      // Payment and Delivery Terms
      doc.fontSize(12);
      doc.text(`Payment Terms: ${shipment.salesContract.paymentTerms}`);
      doc.text(`Delivery Terms: ${shipment.salesContract.deliveryTerms}`);
      
      if (shipment.salesContract.ecxAuctionReference) {
        doc.text(`ECX Auction Reference: ${shipment.salesContract.ecxAuctionReference}`);
      }
      
      doc.moveDown();

      // Footer
      doc.fontSize(10)
         .text('This is a computer-generated invoice and does not require a signature.', 
               { align: 'center', italics: true });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateInvoicePDF
};
