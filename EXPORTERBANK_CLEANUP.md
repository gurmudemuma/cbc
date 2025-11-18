# commercialbank to CommercialBank - Final Cleanup

## Issue Found
The chaincode still had "ExporterBankMSP" references in several functions, even though we renamed the organization to "CommercialBank".

## Functions Fixed

### 1. ConfirmPayment
**Before:**
```go
if clientMSPID != "ExporterBankMSP" && clientMSPID != "NationalBankMSP" {
    return fmt.Errorf("only commercialbank or National Bank can confirm payment")
}
```

**After:**
```go
if clientMSPID != "CommercialBankMSP" && clientMSPID != "NationalBankMSP" {
    return fmt.Errorf("only Commercial Bank or National Bank can confirm payment")
}
```

### 2. CompleteExport
**Before:**
```go
if clientMSPID != "ExporterBankMSP" && clientMSPID != "NationalBankMSP" {
    return fmt.Errorf("only commercialbank or National Bank can complete exports")
}
```

**After:**
```go
if clientMSPID != "CommercialBankMSP" && clientMSPID != "NationalBankMSP" {
    return fmt.Errorf("only Commercial Bank or National Bank can complete exports")
}
```

### 3. UpdateExport
**Before:**
```go
if clientMSPID != "ExporterBankMSP" {
    return fmt.Errorf("only commercialbank can update exports")
}
```

**After:**
```go
if clientMSPID != "CommercialBankMSP" {
    return fmt.Errorf("only Commercial Bank can update exports")
}
```

### 4. ResubmitRejectedExport
**Before:**
```go
if clientMSPID != "ExporterBankMSP" {
    return fmt.Errorf("only commercialbank can resubmit exports")
}
```

**After:**
```go
if clientMSPID != "CommercialBankMSP" {
    return fmt.Errorf("only Commercial Bank can resubmit exports")
}
```

### 5. CancelExport
**Before:**
```go
if clientMSPID != "ExporterBankMSP" {
    return fmt.Errorf("only commercialbank can cancel exports")
}
```

**After:**
```go
if clientMSPID != "CommercialBankMSP" {
    return fmt.Errorf("only Commercial Bank can cancel exports")
}
```

---

## Impact

### Functions Affected
- ✅ `ConfirmPayment` - Payment confirmation
- ✅ `CompleteExport` - Export completion
- ✅ `UpdateExport` - Export updates
- ✅ `ResubmitRejectedExport` - Resubmit rejected exports
- ✅ `CancelExport` - Export cancellation

### What This Fixes
Without these changes, Commercial Bank users would get errors like:
```
Error: only commercialbank can update exports
```

Even though they're using the Commercial Bank API with the correct MSP ID.

---

## Current Deployment Status

### ⏳ Startup Script Running
The `start-system.sh` is currently deploying chaincode, but it's deploying the **old version** (before these fixes).

### 🔄 Next Deployment Will Include Fixes
The chaincode source is now updated. The next time chaincode is deployed, it will include:
1. ✅ Commercial Bank can create exports
2. ✅ Temporary license numbers
3. ✅ Accept all coffee types
4. ✅ **All MSP references updated to CommercialBankMSP**

---

## What Happens Next

### Current Startup (In Progress)
```bash
./start-system.sh
```
- Deploying v2.1 (without latest MSP fixes)
- Will complete successfully
- But some functions will still reference "commercialbank"

### After Current Startup Completes
You have two options:

#### Option 1: Redeploy Chaincode
```bash
./start-system.sh --update-chaincode
```
- Forces redeployment with latest code
- Includes all MSP fixes
- Takes 2-3 minutes

#### Option 2: Wait for Next Restart
```bash
./start-system.sh --clean
```
- Next clean start will deploy latest version
- Includes all fixes

---

## Remaining References

### Non-Critical Files (Can be cleaned up later)
- `/home/gu-da/cbc/network/*.json` - Temporary config files
- `/home/gu-da/cbc/network/scripts/*.sh` - Old scripts
- `/home/gu-da/cbc/docker-compose*.yml` - Backup files
- `/home/gu-da/cbc/fix-*.sh` - Migration scripts

These don't affect runtime behavior.

---

## Verification

### After Next Deployment

**Test Commercial Bank functions:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"exporter1","password":"Exporter123"}' | jq -r '.data.token')

# Create export (should work)
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

# Update export (should work - no more "commercialbank" error)
curl -X PUT http://localhost:3001/api/exports/EXP-123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coffeeType": "Robusta",
    "quantity": 2000
  }'

# Cancel export (should work - no more "commercialbank" error)
curl -X POST http://localhost:3001/api/exports/EXP-123/cancel \
  -H "Authorization: Bearer $TOKEN"
```

---

## Summary

### ✅ Fixed in Chaincode
- All MSP checks updated from `ExporterBankMSP` to `CommercialBankMSP`
- All error messages updated from "commercialbank" to "Commercial Bank"
- 5 functions affected: ConfirmPayment, CompleteExport, UpdateExport, ResubmitRejectedExport, CancelExport

### ⏳ Deployment Status
- Current startup is deploying old version
- Next deployment will include all fixes

### 🎯 Recommendation
After current startup completes, run:
```bash
./start-system.sh --update-chaincode
```

This will deploy the latest chaincode with all MSP fixes.

---

## Files Modified

1. ✅ `/home/gu-da/cbc/chaincode/coffee-export/contract.go`
   - Line 1251: ConfirmPayment MSP check
   - Line 1327: CompleteExport MSP check
   - Line 1365: UpdateExport MSP check
   - Line 1422: ResubmitRejectedExport MSP check
   - Line 1768: CancelExport MSP check

**All references to "ExporterBankMSP" in critical functions are now "CommercialBankMSP"!** ✅
