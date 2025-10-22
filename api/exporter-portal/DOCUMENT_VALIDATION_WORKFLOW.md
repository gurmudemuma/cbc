# Document Validation Workflow

This document outlines the workflow between Exporter Portal and Exporter Bank consortium for document validation and export processing.

## Overview

The document validation workflow follows a **sequential processing model** where each consortium member performs specific validation steps in order. This ensures proper business process flow and prevents conflicts.

## Sequential Processing Flow

```
Exporter Portal → National Bank → Exporter Bank → NCAT → Shipping Line → Custom Authorities → APPROVED
     ↓              ↓              ↓         ↓           ↓              ↓
  Submit         License      Banking    Quality    Logistics     Final
  Request        Check        Review   Certification Arrangement  Clearance
```

### Processing Order (Best Practice)
1. **National Bank** (FIRST) - Export license validation & FX approval
2. **Exporter Bank** (SECOND) - Banking compliance & financial review  
3. **NCAT** (THIRD) - Quality certification & standards compliance
4. **Shipping Line** (FOURTH) - Logistics arrangement & shipping documentation
5. **Custom Authorities** (FIFTH) - Final export clearance & compliance

### 1. Export Request Creation (Exporter Portal)

**Endpoint**: `POST /api/exports`
- Exporter creates draft export request with company/coffee/trade details
- Request stored in Exporter Portal database with status: `DRAFT`

### 2. Document Upload (Exporter Portal)

**Endpoint**: `POST /api/exports/{id}/documents`
- Exporter uploads required documents:
  - Sales Contract
  - Commercial Invoice
  - Packing List
  - Certificate of Origin
  - Export License
- Documents stored in IPFS for immutable access
- Document metadata stored in portal database

### 3. Request Validation (Exporter Portal)

**Endpoint**: `POST /api/exports/{id}/validate`
- Portal validates:
  - Complete exporter details
  - Valid coffee specifications
  - Complete trade contract information
  - All required documents uploaded
- Returns validation errors if any

### 4. Submit to Consortium (Exporter Portal → National Bank)

**Endpoint**: `POST /api/exports/{id}/submit`

When exporter submits validated request, **National Bank is FIRST** to process (they manage export licenses):

1. **Portal Side**:
   - Changes status to `SUBMITTED`
   - Sets consortium status to `LICENSE_VALIDATION_PENDING`
   - Makes API call to **National Bank** first (NOT Exporter Bank)

2. **API Call to National Bank** (STEP 1):
   ```http
   POST http://localhost:3002/consortium/export-requests
   Content-Type: application/json
   Authorization: Bearer {consortium-auth-token}
   
   {
     "portalRequestId": "uuid",
     "exporterDetails": {...},
     "coffeeDetails": {...},
     "tradeDetails": {...},
     "documents": [
       {
         "type": "export_license",
         "ipfsHash": "QmXxx...",
         "name": "export-license.pdf",
         "required": true
       }
     ],
     "submittedAt": "2024-01-01T00:00:00Z",
     "submittedBy": "exporter-portal-user-id",
     "processingStep": 1,
     "currentProcessor": "NationalBank"
   }
   ```

### 5. Sequential Consortium Processing

Each consortium member processes the request **in order** and passes it to the next member:

#### STEP 1: National Bank Processing (`consortiumStatus: LICENSE_VALIDATION_PENDING`)
- **Duration**: 1-2 business days
- **Primary Role**: Export license authority & FX compliance
- **Actions**:
  - Validates export license authenticity
  - Checks FX compliance and regulations
  - Reviews exporter's business registration
  - Verifies trade contract legality
  - Updates blockchain with license validation
- **On Success**: Forward to Exporter Bank (Step 2)
- **On Failure**: Return to portal with specific license issues

#### STEP 2: Exporter Bank Processing (`consortiumStatus: BANKING_REVIEW_PENDING`) 
- **Duration**: 2-3 business days
- **Primary Role**: Banking compliance & financial validation
- **Actions**:
  - Reviews sales contract terms and authenticity
  - Validates commercial invoice calculations
  - Checks payment terms and financial viability
  - Conducts credit checks if needed
  - Validates banking documents completeness
  - Updates blockchain with banking approval
- **On Success**: Forward to NCAT (Step 3)
- **On Failure**: Return to portal with banking/financial issues

#### STEP 3: NCAT Processing (`consortiumStatus: QUALITY_CERTIFICATION_PENDING`)
- **Duration**: 3-5 business days
- **Primary Role**: Quality standards & certification
- **Actions**:
  - Reviews coffee quality specifications
  - Validates quality certificates
  - Checks compliance with destination country standards
  - Issues quality certification if not present
  - Validates phytosanitary certificates
  - Updates blockchain with quality approval
- **On Success**: Forward to Shipping Line (Step 4)
- **On Failure**: Return to portal with quality certification issues

#### STEP 4: Shipping Line Processing (`consortiumStatus: LOGISTICS_ARRANGEMENT_PENDING`)
- **Duration**: 2-4 business days
- **Primary Role**: Logistics & shipping documentation
- **Actions**:
  - Reviews shipping terms and logistics feasibility
  - Validates port of loading/discharge
  - Arranges shipping schedule and booking
  - Prepares transport documentation
  - Validates packaging and container requirements
  - Updates blockchain with logistics confirmation
- **On Success**: Forward to Custom Authorities (Step 5)
- **On Failure**: Return to portal with logistics issues

#### STEP 5: Custom Authorities Processing (`consortiumStatus: CUSTOMS_CLEARANCE_PENDING`)
- **Duration**: 1-2 business days
- **Primary Role**: Final export clearance & compliance
- **Actions**:
  - Final document review and compliance check
  - Issues export clearance certificate
  - Validates all previous approvals
  - Conducts final regulatory compliance check
  - Updates blockchain with final approval
- **On Success**: Mark as `COMPLETED` - export approved!
- **On Failure**: Return to portal with customs/compliance issues

### 6. Status Updates Flow

The consortium provides status updates back to the portal:

**Webhook/Polling Endpoint** (Exporter Bank → Exporter Portal):
```http
POST http://localhost:3006/api/consortium/status-update
Content-Type: application/json
Authorization: Bearer {shared-secret}

{
  "portalRequestId": "uuid",
  "consortiumStatus": "fx_approval_pending",
  "currentStep": "Foreign Exchange Approval",
  "processingOrganization": "NationalBank",
  "blockchainTxId": "tx_abc123",
  "statusHistory": [...],
  "estimatedCompletion": "2024-01-08T00:00:00Z",
  "notes": "Documents validated, proceeding to FX approval"
}
```

### 7. Final Outcomes

**Approved Export**:
- Status: `APPROVED`
- Consortium Status: `COMPLETED`
- Exporter receives approval notification
- Export can proceed with shipping

**Rejected Export**:
- Status: `REJECTED`
- Consortium provides rejection reasons
- Exporter can address issues and resubmit

## API Endpoints Summary

### Exporter Portal APIs
- `GET /api/exports` - List user's export requests
- `POST /api/exports` - Create new export request
- `GET /api/exports/{id}` - Get export request details
- `PUT /api/exports/{id}` - Update draft export request
- `DELETE /api/exports/{id}` - Delete draft export request
- `POST /api/exports/{id}/documents` - Upload documents
- `POST /api/exports/{id}/validate` - Validate before submission
- `POST /api/exports/{id}/submit` - Submit to consortium
- `GET /api/exports/{id}/status` - Get processing status

### Exporter Bank Consortium APIs (New)
- `POST /consortium/export-requests` - Receive export request from portal
- `GET /consortium/export-requests/{id}` - Get export request details
- `PUT /consortium/export-requests/{id}/status` - Update processing status
- `POST /consortium/export-requests/{id}/validate-documents` - Document validation
- `POST /consortium/export-requests/{id}/approve` - Approve export
- `POST /consortium/export-requests/{id}/reject` - Reject export

### Status Update Webhook (Portal)
- `POST /api/consortium/status-update` - Receive status updates from consortium

## Implementation Notes

### Authentication
- **Portal to Consortium**: Uses service-to-service JWT tokens
- **Consortium to Portal**: Uses shared webhook secrets
- **User Authentication**: Portal users authenticate via National Bank

### Document Storage
- Documents stored in IPFS for immutable access
- IPFS hashes shared between portal and consortium
- Document metadata stored in respective databases

### Error Handling
- Network failures: Retry with exponential backoff
- Document validation errors: Return to exporter with specific feedback
- Consortium unavailable: Queue requests for later processing

### Monitoring
- Track request processing times
- Monitor document validation success rates
- Alert on failed consortium communications

## Future Enhancements

1. **Real-time Updates**: WebSocket connections for live status updates
2. **Advanced Validation**: OCR and ML-based document content validation
3. **Smart Contracts**: Automated validation rules on blockchain
4. **Multi-language Support**: Document validation in multiple languages
5. **Mobile API**: REST APIs optimized for mobile applications