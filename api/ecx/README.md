# ECX API - Ethiopian Commodity Exchange

**Port:** 3006  
**Organization:** ECX (Ethiopian Commodity Exchange)  
**MSP ID:** ECXMSP

## Overview

The ECX API is the **first step** in the corrected Ethiopian coffee export workflow. It verifies coffee lots from the Ethiopian Commodity Exchange and creates the initial blockchain record.

## Role in Export Process

ECX is responsible for:
1. ✅ Verifying ECX lot numbers
2. ✅ Validating warehouse receipts
3. ✅ Confirming coffee ownership
4. ✅ Creating initial blockchain record
5. ✅ Setting status to `ECX_VERIFIED`

## Workflow Position

```
Portal → ECX (YOU ARE HERE) → ECTA → Bank → NBE → Customs → Shipping
```

## API Endpoints

### Verification Endpoints

#### POST `/api/ecx/verify-lot`
Verify ECX lot number and warehouse receipt.

**Request:**
```json
{
  "lotNumber": "LOT-2024-001",
  "warehouseReceiptNumber": "WR-2024-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lot verified successfully",
  "data": {
    "lotNumber": "LOT-2024-001",
    "coffeeType": "Arabica Grade 2",
    "quantity": 5000,
    "grade": "Grade 2",
    "warehouseLocation": "Addis Ababa Warehouse",
    "ownerName": "Sample Exporter Ltd",
    "status": "AVAILABLE"
  }
}
```

#### POST `/api/ecx/verify-receipt`
Verify warehouse receipt.

**Request:**
```json
{
  "receiptNumber": "WR-2024-001"
}
```

#### POST `/api/ecx/verify-and-create`
Verify lot and create blockchain record in one step.

**Request:**
```json
{
  "exportId": "EXP-2024-001",
  "lotNumber": "LOT-2024-001",
  "warehouseReceiptNumber": "WR-2024-001",
  "exporterName": "ABC Coffee Exporters",
  "exporterTIN": "TIN123456789",
  "requestedQuantity": 5000
}
```

### Export Management Endpoints

#### POST `/api/ecx/create-export`
Create export request on blockchain (after verification).

**Request:**
```json
{
  "exportId": "EXP-2024-001",
  "commercialbankId": "BANK-001",
  "exporterName": "ABC Coffee Exporters",
  "exporterTIN": "TIN123456789",
  "exportLicenseNumber": "EXP-LIC-2024-001",
  "coffeeType": "Arabica Grade 2",
  "quantity": 5000,
  "destinationCountry": "United States",
  "estimatedValue": 75000,
  "ecxLotNumber": "LOT-2024-001",
  "warehouseLocation": "Addis Ababa Warehouse",
  "warehouseReceiptNumber": "WR-2024-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Export request created successfully",
  "data": {
    "exportId": "EXP-2024-001",
    "lotNumber": "LOT-2024-001",
    "exporterName": "ABC Coffee Exporters",
    "quantity": 5000,
    "status": "ECX_VERIFIED",
    "blockchainTxId": "abc123..."
  }
}
```

#### GET `/api/ecx/exports/:exportId`
Get export request by ID.

#### GET `/api/ecx/exports/status/:status`
Get all exports by status.

#### POST `/api/ecx/reject`
Reject ECX verification.

**Request:**
```json
{
  "exportId": "EXP-2024-001",
  "reason": "Invalid warehouse receipt"
}
```

## Installation

```bash
cd /home/gu-da/cbc/api/ecx
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3006
ORGANIZATION_ID=ecx
MSP_ID=ECXMSP
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME=coffee-export
PEER_ENDPOINT=peer0.ecx.coffee-export.com:12051
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Testing

```bash
npm test
```

## API Documentation

Swagger UI available at: `http://localhost:3006/api-docs`

## Health Check

```bash
curl http://localhost:3006/health
```

## Blockchain Functions Called

This API calls the following chaincode functions:

1. **CreateExportRequest** - Creates initial blockchain record (ECXMSP only)
2. **VerifyECXLot** - Verifies ECX lot on blockchain
3. **GetExportRequest** - Retrieves export data
4. **GetExportsByStatus** - Queries exports by status
5. **RejectECXVerification** - Rejects verification

## Status Flow

```
DRAFT (Portal) → ECX_PENDING → ECX_VERIFIED → ECTA_LICENSE_PENDING
```

## Integration with Other Services

### Exporter Portal → ECX
Portal submits export request to ECX API for verification.

### ECX → ECTA
After ECX verification, export moves to ECTA for license validation and quality certification.

## Security

- JWT authentication (to be implemented)
- MSP-based blockchain access control
- Input validation on all endpoints
- Rate limiting
- Helmet security headers

## Logging

Logs are written to:
- Console (development)
- File: `./logs/ecx-api.log`

## Error Handling

All errors are logged and returned in standardized format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Next Steps

After ECX verification, the export proceeds to **ECTA** for:
1. Export license validation
2. Quality certification
3. Certificate of origin issuance
4. Contract approval

## Support

For issues or questions:
- Technical: [Technical Lead]
- ECX Integration: [ECX Contact]
- Blockchain: [Blockchain Team]

---

**Status:** ✅ Phase 1 Complete - ECX API Created  
**Next:** Phase 2 - Rename ECTA to ECTA and reposition
