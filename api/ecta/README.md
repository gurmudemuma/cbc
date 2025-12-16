# ECTA API - Ethiopian Coffee and Tea Authority

**Port:** 3004 (updated from 3003)  
**Organization:** ECTA (Ethiopian Coffee and Tea Authority)  
**MSP ID:** ECTAMSP (formerly ECTAMSP)  
**Formerly:** ECTA API

## Overview

The ECTA API is the **PRIMARY REGULATOR** and **FIRST regulatory step** in the corrected Ethiopian coffee export workflow. ECTA is responsible for export licensing, quality certification, contract approval, and certificate of origin issuance.

## Role in Export Process (CORRECTED)

ECTA is the **SECOND step** (after ECX) and handles:
1. ✅ **Export License Validation** (FIRST regulatory check)
2. ✅ **Quality Certification** (Grade 1-9)
3. ✅ **Certificate of Origin** issuance
4. ✅ **Export Contract Approval**

## Workflow Position

```
Portal → ECX → ECTA (YOU ARE HERE) → Commercial Bank → NBE → Customs → Shipping
                ^^^^
           PRIMARY REGULATOR
```

## What Changed from ECTA

### Naming
- **Old:** ECTA (National Coffee and Tea Authority)
- **New:** ECTA (Ethiopian Coffee and Tea Authority)
- **Reason:** Align with official Ethiopian government naming

### Port
- **Old:** 3003
- **New:** 3004
- **Reason:** Port 3003 now used by Exporter Portal

### MSP ID
- **Old:** ECTAMSP
- **New:** ECTAMSP
- **Note:** Chaincode accepts both for backward compatibility

### Workflow Position
- **Old:** THIRD step (after NBE FX and Bank)
- **New:** SECOND step (after ECX, before Bank)
- **Reason:** Quality certification must happen BEFORE FX approval

### Expanded Responsibilities
- **Added:** Export license validation
- **Added:** Export contract approval
- **Added:** Certificate of origin issuance
- **Existing:** Quality certification (repositioned to first)

## API Endpoints

### Export License Validation (NEW)

#### POST `/api/quality/validate-license/:exportId`
Validate export license before any other approvals.

**Prerequisites:** Export must be in `ECX_VERIFIED` status

**Request:**
```json
{
  "licenseNumber": "EXP-LIC-2024-001",
  "expiryDate": "2025-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Export license validated successfully",
  "exportId": "EXP-2024-001",
  "status": "ECTA_LICENSE_APPROVED",
  "validatedBy": "ecta-inspector-001",
  "validatedAt": "2024-11-04T12:00:00Z"
}
```

### Quality Certification (EXISTING - REPOSITIONED)

#### POST `/api/quality/certify/:exportId`
Issue quality certificate with grade assignment.

**Prerequisites:** Export license must be validated first

**Request:**
```json
{
  "grade": "Grade 2",
  "cuppingScore": 85,
  "moistureContent": 11.5,
  "defectCount": 8,
  "qualityCertCID": "QmXxXxXx..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quality certificate issued",
  "exportId": "EXP-2024-001",
  "grade": "Grade 2",
  "status": "ECTA_QUALITY_APPROVED",
  "certifiedBy": "ecta-inspector-001"
}
```

### Contract Approval (NEW)

#### POST `/api/quality/approve-contract/:exportId`
Approve export contract after quality certification.

**Prerequisites:** Quality must be certified first

**Request:**
```json
{
  "contractNumber": "CONTRACT-2024-001",
  "buyerName": "US Coffee Importers Inc",
  "contractValue": 75000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Export contract approved",
  "exportId": "EXP-2024-001",
  "status": "ECTA_CONTRACT_APPROVED",
  "approvedBy": "ecta-officer-001"
}
```

### Certificate of Origin (NEW)

#### POST `/api/quality/issue-origin-certificate/:exportId`
Issue Ethiopian Certificate of Origin.

**Prerequisites:** Contract must be approved

**Request:**
```json
{
  "originCertNumber": "ORIGIN-ETH-2024-001",
  "originCertCID": "QmYyYyYy..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate of origin issued",
  "exportId": "EXP-2024-001",
  "certificateNumber": "ORIGIN-ETH-2024-001",
  "issuedBy": "ecta-officer-001"
}
```

### Rejection Endpoints

#### POST `/api/quality/reject-license/:exportId`
Reject export license validation.

#### POST `/api/quality/reject-quality/:exportId`
Reject quality certification.

#### POST `/api/quality/reject-contract/:exportId`
Reject export contract.

## ECTA Workflow Sequence

```
1. ECX_VERIFIED (from ECX)
   ↓
2. ECTA_LICENSE_PENDING → ECTA_LICENSE_APPROVED
   ↓
3. ECTA_QUALITY_PENDING → ECTA_QUALITY_APPROVED
   ↓
4. ECTA_CONTRACT_PENDING → ECTA_CONTRACT_APPROVED
   ↓
5. BANK_DOCUMENT_PENDING (to Commercial Bank)
```

## Quality Grades

ECTA assigns coffee quality grades based on defect count:

| Grade | Defects per 300g | Category |
|-------|------------------|----------|
| Grade 1 | 0-3 | Specialty |
| Grade 2 | 4-12 | Premium |
| Grade 3 | 13-25 | Exchange |
| Grade 4 | 26-45 | Standard |
| Grade 5 | 46-90 | Off-grade |
| Grade 6-9 | 90+ | Lower grades |

## Documents Required

### For License Validation:
- Valid export license (annual renewal)
- Business registration certificate
- Tax clearance certificate

### For Quality Certification:
- Coffee sample (physical)
- ECX warehouse receipt
- Laboratory test results

### For Contract Approval:
- Export sales contract
- Buyer information
- Proforma invoice

### For Certificate of Origin:
- All above documents
- Proof of Ethiopian origin
- ECX lot documentation

## Configuration

### Environment Variables (.env)
```env
PORT=3004
ORGANIZATION_ID=ecta
ORGANIZATION_NAME=ECTA
MSP_ID=ECTAMSP
PEER_ENDPOINT=peer0.ecta.coffee-export.com:9051
```

### Peer Configuration
- **Peer:** peer0.ecta.coffee-export.com
- **Port:** 9051
- **MSP:** ECTAMSP

## Running the API

### Development
```bash
cd /home/gu-da/cbc/api/ecta
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Blockchain Functions Called

This API calls the following chaincode functions:

1. **ValidateExportLicense** - Validates export license (ECTAMSP only)
2. **IssueQualityCertificate** - Issues quality certificate (ECTAMSP only)
3. **ApproveExportContract** - Approves contract (ECTAMSP only)
4. **IssueCertificateOfOrigin** - Issues origin certificate (ECTAMSP only)
5. **RejectECTA** - Rejects at any ECTA stage (ECTAMSP only)

## Status Transitions

ECTA manages these status transitions:

```
ECX_VERIFIED
  ↓
ECTA_LICENSE_PENDING
  ↓
ECTA_LICENSE_APPROVED
  ↓
ECTA_QUALITY_PENDING
  ↓
ECTA_QUALITY_APPROVED
  ↓
ECTA_CONTRACT_PENDING
  ↓
ECTA_CONTRACT_APPROVED
  ↓
BANK_DOCUMENT_PENDING
```

## Integration with Other Services

### ECX → ECTA
After ECX verifies the lot, export moves to ECTA for license validation.

### ECTA → Commercial Bank
After ECTA approves contract, export moves to Commercial Bank for document verification.

## Migration from ECTA

### Directory Renamed
```bash
/home/gu-da/cbc/api/ncat → /home/gu-da/cbc/api/ecta
```

### Configuration Updates
- Port: 3003 → 3004
- MSP ID: ECTAMSP → ECTAMSP
- Organization: ECTA → ECTA
- Peer endpoint: Updated

### Code Updates
- All "ECTA" references → "ECTA"
- Service name updated in health checks
- Organization IDs updated

### Backward Compatibility
- Chaincode accepts both ECTAMSP and ECTAMSP
- Gradual migration supported

## Security

- JWT authentication
- MSP-based blockchain access control (ECTAMSP)
- Input validation on all endpoints
- Rate limiting
- Helmet security headers
- CORS configuration

## Logging

Logs written to:
- Console (development)
- File: `./logs/ecta-api.log`

## Health Check

```bash
curl http://localhost:3004/health
```

Response:
```json
{
  "status": "ok",
  "service": "ECTA API",
  "version": "1.0.0",
  "fabric": "connected",
  "uptime": 3600
}
```

## Next Steps

After ECTA approval, the export proceeds to **Commercial Bank** for:
1. Document verification
2. FX application preparation
3. Submission to NBE

## Support

For issues or questions:
- Technical: [Technical Lead]
- ECTA Integration: [ECTA Contact]
- Blockchain: [Blockchain Team]

---

**Status:** ✅ Phase 2 Complete - ECTA API Renamed and Repositioned  
**Next:** Phase 3 - Update NBE role and remaining APIs
