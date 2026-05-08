/**
 * Certificate Branding Helper Functions
 * Reusable components for professional Ethiopian government certificates
 */

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

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

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
        [30, 30], [PAGE_WIDTH - 30, 30],
        [30, PAGE_HEIGHT - 30], [PAGE_WIDTH - 30, PAGE_HEIGHT - 30]
    ];
    
    corners.forEach(([x, y]) => {
        doc.lineWidth(2)
           .strokeColor(COLORS.gold)
           .moveTo(x - cornerSize/2, y).lineTo(x + cornerSize/2, y).stroke()
           .moveTo(x, y - cornerSize/2).lineTo(x, y + cornerSize/2).stroke();
    });
}

/**
 * Draw Ethiopian flag stripe
 */
function drawEthiopianStripe(doc, y, width) {
    const stripeHeight = 8;
    const stripeWidth = width / 3;
    const startX = (PAGE_WIDTH - width) / 2;
    
    doc.rect(startX, y, stripeWidth, stripeHeight).fillColor(COLORS.ethiopianGreen).fill();
    doc.rect(startX + stripeWidth, y, stripeWidth, stripeHeight).fillColor(COLORS.ethiopianYellow).fill();
    doc.rect(startX + (stripeWidth * 2), y, stripeWidth, stripeHeight).fillColor(COLORS.ethiopianRed).fill();
    
    return y + stripeHeight + 5;
}

/**
 * Draw official seal
 */
function drawOfficialSeal(doc, x, y, size) {
    doc.circle(x, y, size).lineWidth(2).strokeColor(COLORS.gold).stroke();
    doc.circle(x, y, size - 5).lineWidth(1).strokeColor(COLORS.ethiopianGreen).stroke();
    doc.fontSize(size - 10).fillColor(COLORS.gold)
       .text('★', x - (size - 10)/2, y - (size - 10)/2, { width: size - 10, align: 'center' });
    doc.fontSize(6).fillColor(COLORS.darkGreen)
       .text('ECTA', x - 15, y + size + 5, { width: 30, align: 'center' });
}

/**
 * Add watermark
 */
function addWatermark(doc) {
    doc.save();
    doc.opacity(0.05).fontSize(80).fillColor(COLORS.ethiopianGreen)
       .text('ECTA', 0, PAGE_HEIGHT / 2 - 40, { width: PAGE_WIDTH, align: 'center' });
    doc.restore();
}

/**
 * Draw official header
 */
function drawOfficialHeader(doc, y, margins, contentWidth, certificateTitle, subtitle) {
    drawOfficialSeal(doc, margins.left + 30, y + 25, 25);
    
    doc.fontSize(20).font('Helvetica-Bold').fillColor(COLORS.darkGreen)
       .text('FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA', margins.left, y, { width: contentWidth, align: 'center' });
    y += 25;
    
    doc.fontSize(16).fillColor(COLORS.ethiopianGreen)
       .text('Ethiopian Coffee & Tea Authority', margins.left, y, { width: contentWidth, align: 'center' });
    y += 20;
    
    doc.fontSize(10).fillColor(COLORS.textGray)
       .text('Ministry of Agriculture', margins.left, y, { width: contentWidth, align: 'center' });
    y += 25;
    
    doc.moveTo(margins.left + 50, y).lineTo(PAGE_WIDTH - margins.right - 50, y)
       .lineWidth(2).strokeColor(COLORS.gold).stroke();
    y += 15;
    
    doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.ethiopianRed)
       .text(certificateTitle, margins.left, y, { width: contentWidth, align: 'center' });
    y += 20;
    
    if (subtitle) {
        doc.fontSize(11).font('Helvetica').fillColor(COLORS.textDark)
           .text(subtitle, margins.left, y, { width: contentWidth, align: 'center' });
        y += 15;
    }
    
    doc.moveTo(margins.left + 50, y).lineTo(PAGE_WIDTH - margins.right - 50, y)
       .lineWidth(2).strokeColor(COLORS.gold).stroke();
    y += 20;
    
    return y;
}

module.exports = {
    COLORS,
    PAGE_WIDTH,
    PAGE_HEIGHT,
    drawDecorativeBorder,
    drawEthiopianStripe,
    drawOfficialSeal,
    addWatermark,
    drawOfficialHeader
};
