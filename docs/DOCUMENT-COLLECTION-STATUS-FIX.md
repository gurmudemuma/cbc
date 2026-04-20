# Document Collection Status Endpoint Fix

## Issue
Frontend was showing "Failed to load document collection status" error when exporters tried to view their document collection progress.

## Root Cause
The `/api/exporter/documents/collection-status` endpoint was using incorrect column names in SQL queries:
- Used `status` instead of `request_status`
- Used `approved_at` instead of `reviewed_at`
- Referenced non-existent `rejected_at` column

## Database Schema (Actual)
From `020_document_issuance.sql`:
```sql
CREATE TABLE document_requests (
  request_id UUID PRIMARY KEY,
  exporter_id UUID NOT NULL,
  network_member_code VARCHAR(50) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  request_status VARCHAR(50) DEFAULT 'PENDING',  -- NOT 'status'
  request_notes TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,  -- NOT 'approved_at'
  reviewed_by VARCHAR(255),
  rejection_reason TEXT,
  -- NO 'rejected_at' column
  ...
);
```

Status values: `PENDING`, `UNDER_REVIEW`, `ISSUED`, `REJECTED`

## Fix Applied

### File: `coffee-export-gateway/src/routes/document-requests.routes.js`

**Before:**
```javascript
const requestQuery = `
  SELECT 
    request_id,
    status,              -- WRONG
    requested_at,
    approved_at,         -- WRONG
    rejected_at,         -- DOESN'T EXIST
    rejection_reason
  FROM document_requests
  WHERE exporter_id = $1 
    AND network_member_code = $2 
    AND document_type = $3
  ORDER BY requested_at DESC
  LIMIT 1
`;

if (request.status === 'APPROVED') {  -- WRONG
  // Check for issued document
}
```

**After:**
```javascript
const requestQuery = `
  SELECT 
    request_id,
    request_status,      -- CORRECT
    requested_at,
    reviewed_at,         -- CORRECT
    rejection_reason
  FROM document_requests
  WHERE exporter_id = $1 
    AND network_member_code = $2 
    AND document_type = $3
  ORDER BY requested_at DESC
  LIMIT 1
`;

if (request.request_status === 'ISSUED') {  -- CORRECT
  // Check for issued document
}
```

## Testing

### Test Script: `scripts/test-collection-status.bat`
```batch
@echo off
REM Login as exporter
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"exporter1\",\"password\":\"password123\"}"

REM Get collection status
curl -X GET http://localhost:3000/api/exporter/documents/collection-status ^
  -H "Authorization: Bearer %TOKEN%"
```

### Test Results
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "type": "LABORATORY_CERTIFICATE",
        "name": "Laboratory Certificate",
        "issuer": "ECTA",
        "required": true,
        "status": "PENDING",
        "requestId": "b557a631-44c3-418b-bd65-1fce76ebfc2d",
        "requestedAt": "2026-04-06T08:19:37.133Z"
      },
      {
        "type": "EXPORT_LICENSE",
        "name": "Export License",
        "issuer": "ECTA",
        "required": true,
        "status": "ISSUED",
        "requestId": "4919cfcb-13ea-4da8-af8d-05590113ef51",
        "documentId": "b1d2f911-902a-4521-9a5e-72692350b032",
        "requestedAt": "2026-04-01T11:06:21.208Z"
      }
    ],
    "issuedDocuments": 1,
    "pendingDocuments": 3,
    "rejectedDocuments": 0,
    "notRequestedDocuments": 0,
    "requiredDocuments": 4,
    "isComplete": false,
    "canSubmitToNetwork": false
  }
}
```

## Deployment Steps

1. **Updated Code:**
   - Fixed SQL queries in `document-requests.routes.js`
   - Changed column references to match actual schema

2. **Rebuilt Gateway Container:**
   ```bash
   docker-compose -f docker-compose-hybrid.yml build gateway
   ```

3. **Restarted Gateway:**
   ```bash
   docker stop coffee-gateway
   docker rm coffee-gateway
   docker-compose -f docker-compose-hybrid.yml up -d gateway
   ```

4. **Verified Fix:**
   ```bash
   cmd /c scripts\test-collection-status.bat
   ```

## Impact

- Exporters can now view their document collection status
- Frontend `DocumentCollectionStatus` component works correctly
- Shows accurate counts of issued, pending, rejected documents
- Indicates whether exporter can submit to network

## Related Files

- `coffee-export-gateway/src/routes/document-requests.routes.js` - Fixed endpoint
- `cbc/services/shared/database/migrations/020_document_issuance.sql` - Schema reference
- `cbc/frontend/src/components/DocumentCollectionStatus.tsx` - Frontend component
- `scripts/test-collection-status.bat` - Test script

## Status
✅ **FIXED** - Endpoint now returns correct document collection status

## Date
April 17, 2026
