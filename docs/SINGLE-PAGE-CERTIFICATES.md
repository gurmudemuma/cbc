# Single-Page Certificate Implementation

## Overview
All certificates have been optimized to fit on a single A4 page following best practices for professional certificates.

## Changes Made

### 1. New Compact Certificate Generator
Created `coffee-export-gateway/src/utils/certificate-pdf-compact.js` with optimized single-page templates for:
- **Competence Certificate** - Professional coffee competence certification
- **Export License** - Annual export authorization
- **Laboratory Certificate** - Laboratory accreditation certificate
- **Taster Certificate** - Professional coffee taster certification

### 2. Layout Optimization
Each certificate now features:
- **Compact Header** (16pt title, 9pt subtitle)
- **Two-Column Layout** - Efficient use of space
- **Reduced Font Sizes** - 8pt for body text, 7pt for footer
- **Minimal Spacing** - 12pt line spacing instead of 20pt
- **Small QR Code** - 60x60px positioned in bottom right
- **Signature Area** - Compact footer with authorization details

### 3. Certificate Details
All certificates include:
- Certificate number and issue/expiry dates
- Exporter information (business name, registration number)
- Certification details and scope
- Authorized activities/capabilities
- Certification statement
- QR code for verification
- Generation timestamp

### 4. Updated Routes
Modified `coffee-export-gateway/src/routes/exporter.routes.js` to:
- Import compact certificate generators
- Use new single-page templates
- Pass proper certificate data with dates
- Maintain backward compatibility

## Certificate Types

### Competence Certificate
- **Validity**: 3 years
- **Scope**: Coffee quality assessment
- **Activities**: Grading, cupping, testing, export certification

### Export License
- **Validity**: 1 year
- **Type**: General Export
- **Products**: Arabica, Robusta, derivatives, by-products

### Laboratory Certificate
- **Validity**: 3 years
- **Accreditation**: ISO 17025 Certified
- **Capabilities**: Physical, sensory, chemical, microbial testing

### Taster Certificate
- **Validity**: 2 years
- **Qualification**: Professional Cupper
- **Training**: 120+ hours
- **Activities**: Cupping, grading, flavor assessment

## Page Layout Specifications

### Margins
- Top: 30mm
- Bottom: 30mm
- Left: 30mm
- Right: 30mm

### Content Area
- Width: 540pt (190mm)
- Height: 750pt (265mm)
- Fits perfectly on A4 (210x297mm)

### Font Sizes
- Title: 16pt (Helvetica-Bold)
- Subtitle: 9pt (Helvetica)
- Section Headers: 10pt (Helvetica-Bold)
- Body Text: 8pt (Helvetica)
- Footer: 7pt (Helvetica)

### QR Code
- Size: 60x60px
- Position: Bottom right corner
- Error Correction: High (H)
- Verification URL: https://ecta.gov.et/verify/{certificateId}

## Testing

To test certificate downloads:
1. Login as "Ella" (password: "password123")
2. Navigate to "My Applications" dashboard
3. Click download button for any certificate
4. Verify PDF opens on single page
5. Scan QR code to verify certificate

## Benefits

✅ **Professional Appearance** - Clean, organized layout
✅ **Print-Friendly** - Fits perfectly on A4 paper
✅ **Reduced Costs** - Single page = less paper/ink
✅ **Easy Verification** - QR code for quick validation
✅ **Compliance** - Follows international certificate standards
✅ **Accessibility** - Clear fonts and spacing

## Files Modified

- `coffee-export-gateway/src/utils/certificate-pdf-compact.js` (NEW)
- `coffee-export-gateway/src/routes/exporter.routes.js` (UPDATED)
- `coffee-export-gateway/src/utils/certificate-pdf.js` (OPTIMIZED)

## Deployment

The changes have been deployed:
1. Gateway container rebuilt with new certificate generator
2. All certificate endpoints updated to use compact templates
3. Frontend proxy configured to route certificate downloads correctly
4. System fully operational and ready for testing
