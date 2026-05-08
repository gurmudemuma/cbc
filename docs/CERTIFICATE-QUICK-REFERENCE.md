# Certificate Generation - Quick Reference

## For ECTA Admins

### Approve Qualification & Generate Certificate

```bash
# Approve competence (auto-generates PDF)
POST /api/ecta/qualifications/:username/competenceCertificate/approve
{
  "comments": "Training completed successfully",
  "trainingProgram": "Coffee Export Competence Training",
  "assessmentScore": "92%"
}

# Approve laboratory (auto-generates PDF)
POST /api/ecta/qualifications/:username/laboratory/approve
{
  "comments": "Facility meets all requirements",
  "laboratoryName": "Company Lab",
  "inspector": "Inspector Name"
}

# Approve taster (auto-generates PDF)
POST /api/ecta/qualifications/:username/taster/approve
{
  "comments": "Q Grader certified",
  "tasterName": "Taster Name",
  "certificationLevel": "Q Grader"
}

# Issue export license (auto-generates PDF)
POST /api/ecta/license/issue
{
  "exporterId": "username",
  "licenseNumber": "LIC-2026-001",
  "expiryDate": "2027-03-04"
}
```

### Response Includes Certificate Info

```json
{
  "success": true,
  "certificate": {
    "certificateNumber": "COMP-1772623857406",
    "filename": "Competence-Certificate-username.pdf",
    "downloadUrl": "/api/ecta/certificates/competenceCertificate/username/download"
  }
}
```

---

## For Exporters

### Download Your Certificates

```bash
# Download competence certificate
GET /api/ecta/certificates/competenceCertificate/:username/download

# Download laboratory certificate
GET /api/ecta/certificates/laboratory/:username/download

# Download taster certificate
GET /api/ecta/certificates/taster/:username/download

# Download export license
GET /api/ecta/certificates/license/:username/download
```

### Frontend Button Example

```javascript
<Button onClick={() => downloadCertificate('competenceCertificate', username)}>
  Download Competence Certificate
</Button>
```

---

## Certificate Types

| Type | Validity | File Size | Certificate Number Format |
|------|----------|-----------|---------------------------|
| Competence | 3 years | ~11 KB | COMP-{timestamp} |
| Laboratory | 2 years | ~9 KB | LAB-{timestamp} |
| Taster | 3 years | ~8 KB | TASTER-{timestamp} |
| Export License | 1 year | ~11 KB | LIC-YYYY-NNN |

---

## QR Code Verification

All certificates include QR codes that link to:

```
https://ecta.gov.et/verify/{type}/{certificateNumber}
```

Scan with smartphone to verify authenticity.

---

## Testing

```bash
# Run certificate generation tests
cd coffee-export-gateway
node test-certificate-generation.js
```

Expected output: 4 PDF files in `/certificates` directory

---

## Troubleshooting

### Certificate not generating?
- Check user exists in blockchain
- Verify ECTA admin role
- Check `/certificates` directory permissions

### Download failing?
- Verify authentication token
- Check user authorization
- Ensure certificate file exists

### QR code not working?
- Verify verification endpoint is deployed
- Check QR code URL format
- Test with QR scanner app

---

## Files Modified

- `coffee-export-gateway/src/utils/certificate-pdf.js` - PDF generation
- `coffee-export-gateway/src/routes/ecta.routes.js` - API endpoints
- `coffee-export-gateway/test-certificate-generation.js` - Test suite

---

## Support

For issues or questions:
1. Check logs: `docker logs coffee-gateway`
2. Test generation: `node test-certificate-generation.js`
3. Verify blockchain: Check user status on blockchain
4. Contact: ECTA IT Support
