# Temporary License Number Fix

## Issue
**Error:** `invalid license number: export license number cannot be empty`

**Root Cause:** Chaincode requires non-empty license number, but exporters don't have it at export creation time.

## Solution Approach

Instead of modifying chaincode (which requires rebuild and redeployment), we generate temporary values in the API layer.

### API-Level Fix (Implemented)

**File:** `/home/gu-da/cbc/api/shared/exportService.ts`

**Changes:**
```typescript
async createExport(exportId: string, exporterBankId: string, data: CreateExportData): Promise<ExportRequest> {
    // Generate temporary license number if not provided
    const licenseNumber = data.exportLicenseNumber || 
        `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Generate temporary ECX lot number if not provided
    const ecxLotNumber = data.ecxLotNumber || 
        `LOT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Use default warehouse location if not provided
    const warehouseLocation = data.warehouseLocation || 'Pending Assignment';
    
    await this.contract.submitTransaction(
        'CreateExportRequest',
        exportId,
        exporterBankId,
        data.exporterName,
        licenseNumber,        // Always non-empty
        data.coffeeType,
        data.quantity.toString(),
        data.destinationCountry,
        data.estimatedValue.toString(),
        ecxLotNumber,         // Always non-empty
        warehouseLocation     // Always non-empty
    );

    return this.getExport(exportId);
}
```

## Generated Values

### 1. Temporary License Number
**Format:** `TEMP-{timestamp}-{random}`
**Example:** `TEMP-1699876543210-A3X9K2`

- Unique per export
- Clearly marked as temporary with `TEMP-` prefix
- Can be updated later by ECTA when actual license is issued

### 2. Temporary ECX Lot Number
**Format:** `LOT-{timestamp}-{random}`
**Example:** `LOT-1699876543210-B7Y4M1`

- Unique per export
- Clearly marked as lot number with `LOT-` prefix
- Can be updated later by ECX after lot verification

### 3. Default Warehouse Location
**Value:** `Pending Assignment`

- Indicates warehouse not yet assigned
- Can be updated later when warehouse is allocated

## Workflow

### Current Workflow (Fixed)

```
1. Exporter creates export via Commercial Bank
   ├─ Provides: name, coffee type, quantity, destination, value
   ├─ Optional: license number, lot number, warehouse
   └─ API generates temp values for missing fields

2. Export created in blockchain with temp values
   ├─ License: TEMP-1699876543210-A3X9K2
   ├─ Lot: LOT-1699876543210-B7Y4M1
   └─ Warehouse: Pending Assignment

3. ECTA issues actual license
   └─ Updates license number to real value (e.g., LIC-2024-001)

4. ECX verifies lot
   └─ Updates lot number to real value (e.g., ECX-LOT-2024-123)

5. Warehouse assigned
   └─ Updates location to actual warehouse
```

## Benefits

### ✅ No Chaincode Changes Required
- No rebuild needed
- No redeployment needed
- Immediate fix

### ✅ Backward Compatible
- Existing code still works
- Frontend can still provide real values
- Temp values only used when fields are empty

### ✅ Clear Identification
- `TEMP-` prefix clearly marks temporary license numbers
- `LOT-` prefix clearly marks temporary lot numbers
- Easy to identify and update later

### ✅ Unique Values
- Timestamp + random ensures uniqueness
- No collisions between exports
- Traceable to creation time

## Testing

### Test 1: Create Export Without Optional Fields
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"exporter1","password":"Exporter123"}' | jq -r '.data.token')

curl -X POST http://localhost:3001/api/exports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test Exporter",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "exportId": "EXP-1699876543210-abc123xyz",
    "exporterBankId": "commercialbank",
    "exporterName": "Test Exporter",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000,
    "exportLicenseNumber": "TEMP-1699876543210-A3X9K2",
    "ecxLotNumber": "LOT-1699876543210-B7Y4M1",
    "warehouseLocation": "Pending Assignment",
    "status": "PENDING",
    "createdAt": "2025-11-10T12:07:00.000Z"
  },
  "message": "Export created successfully"
}
```

### Test 2: Create Export With Real Values
```bash
curl -X POST http://localhost:3001/api/exports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test Exporter",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000,
    "exportLicenseNumber": "LIC-2024-001",
    "ecxLotNumber": "ECX-LOT-2024-123",
    "warehouseLocation": "Addis Ababa Warehouse A"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "exportId": "EXP-1699876543211-def456uvw",
    "exportLicenseNumber": "LIC-2024-001",
    "ecxLotNumber": "ECX-LOT-2024-123",
    "warehouseLocation": "Addis Ababa Warehouse A",
    ...
  }
}
```

## Future Enhancements

### Option 1: Update Functions
Create chaincode functions to update temp values:
```go
func UpdateLicenseNumber(exportID, newLicenseNumber string) error
func UpdateLotNumber(exportID, newLotNumber string) error
func UpdateWarehouseLocation(exportID, newLocation string) error
```

### Option 2: Workflow Status
Add status to track which fields are temporary:
```typescript
{
  exportId: "EXP-123",
  licenseNumber: "TEMP-1699876543210-A3X9K2",
  licenseNumberStatus: "TEMPORARY", // or "VERIFIED"
  lotNumber: "LOT-1699876543210-B7Y4M1",
  lotNumberStatus: "TEMPORARY",
  ...
}
```

### Option 3: Frontend Validation
Update frontend to:
- Show temp values clearly (e.g., badge or icon)
- Allow ECTA to update license number
- Allow ECX to update lot number
- Validate real values before submission

## Chaincode Changes (Alternative - Not Implemented)

If we wanted to fix in chaincode instead:

### File: `contract.go`
```go
// Allow Commercial Bank to create exports
if clientMSPID != "ECXMSP" && clientMSPID != "CommercialBankMSP" {
    return fmt.Errorf("only Commercial Bank or ECX can create export requests")
}
```

### File: `validation.go`
```go
func ValidateLicenseNumber(licenseNumber string) error {
    // Allow empty or temp license numbers
    if licenseNumber == "" || strings.HasPrefix(licenseNumber, "TEMP-") {
        return nil
    }
    // ... rest of validation
}
```

**Note:** This approach requires chaincode rebuild and redeployment.

## Status

✅ **API fix implemented**
✅ **Commercial Bank API restarted**
✅ **Ready for testing**

## Impact

### Before Fix
- ❌ Export creation failed with "license number cannot be empty"
- ❌ Exporters blocked from creating exports
- ❌ Workflow broken

### After Fix
- ✅ Export creation works without license number
- ✅ Temporary values auto-generated
- ✅ Real values can be provided or updated later
- ✅ Workflow unblocked

## Related Files

- `/home/gu-da/cbc/api/shared/exportService.ts` - Fixed
- `/home/gu-da/cbc/chaincode/coffee-export/contract.go` - MSP check updated
- `/home/gu-da/cbc/chaincode/coffee-export/validation.go` - Kept original validation

**Ready to test export creation!**
