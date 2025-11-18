# Organization Access Control Audit

## Current State Analysis

### ✅ Good: MSP-Based Access Control Exists
The chaincode properly checks MSP IDs before allowing operations. Each function validates the caller's organization.

### ❌ Problem: Incorrect MSP Names in Chaincode

The chaincode uses **OLD** MSP names that don't match the actual network configuration:

## MSP Name Mismatches

### 1. Commercial Bank (formerly commercialbank)
**Network Config:** `CommercialBankMSP`
**Chaincode Uses:** `ExporterBankMSP` ❌

**Affected Functions:**
- `ApproveBanking()` - Line 495
- `RejectBanking()` - Line 537
- `SubmitForQuality()` - Line 572
- `SubmitForFX()` - Line 736
- `SubmitToExportCustoms()` - Line 853

### 2. ECTA (formerly NCAT)
**Network Config:** `ECTAMSP`
**Chaincode Uses:** `NCATMSP` ❌

**Affected Functions:**
- `IssueQualityCertificate()` - Line 609
- `RejectQuality()` - Line 654
- `IssueOriginCertificate()` - Line 694 (allows both)
- `ValidateExportLicense()` - Line 382 (allows both)
- `ApproveExportContract()` - Line 421 (allows both)

### 3. Custom Authorities
**Network Config:** `CustomAuthoritiesMSP`
**Chaincode Uses:** `ExportCustomsMSP` OR `CustomAuthoritiesMSP` ⚠️

**Status:** Partially correct (allows both)

## Organization Responsibilities Matrix

### ✅ Correctly Enforced:

| Organization | Responsibility | MSP Check | Status |
|-------------|----------------|-----------|---------|
| **ECX** | Create export requests | `ECXMSP` | ✅ Correct |
| **ECX** | Verify coffee lots | `ECXMSP` | ✅ Correct |
| **National Bank** | Approve/Reject FX | `NationalBankMSP` | ✅ Correct |
| **National Bank** | Submit for banking review | `NationalBankMSP` | ✅ Correct |
| **Shipping Line** | Schedule shipments | `ShippingLineMSP` | ✅ Correct |
| **Shipping Line** | Confirm shipment | `ShippingLineMSP` | ✅ Correct |

### ❌ Needs Fixing:

| Organization | Responsibility | Current MSP | Should Be | Fix Required |
|-------------|----------------|-------------|-----------|--------------|
| **Commercial Bank** | Approve banking documents | `ExporterBankMSP` | `CommercialBankMSP` | ✅ YES |
| **Commercial Bank** | Reject banking | `ExporterBankMSP` | `CommercialBankMSP` | ✅ YES |
| **Commercial Bank** | Submit for quality | `ExporterBankMSP` | `CommercialBankMSP` | ✅ YES |
| **Commercial Bank** | Submit for FX | `ExporterBankMSP` | `CommercialBankMSP` | ✅ YES |
| **Commercial Bank** | Submit to customs | `ExporterBankMSP` | `CommercialBankMSP` | ✅ YES |
| **ECTA** | Issue quality certificate | `NCATMSP` | `ECTAMSP` | ✅ YES |
| **ECTA** | Reject quality | `NCATMSP` | `ECTAMSP` | ✅ YES |

## Required Fixes

### File: `/home/gu-da/cbc/chaincode/coffee-export/contract.go`

#### Fix 1: ApproveBanking (Line 495)
```go
// BEFORE:
if clientMSPID != "ExporterBankMSP" {
    return fmt.Errorf("only commercialbank can approve banking/financial documents")
}

// AFTER:
if clientMSPID != "CommercialBankMSP" {
    return fmt.Errorf("only Commercial Bank can approve banking/financial documents")
}
```

#### Fix 2: RejectBanking (Line 537)
```go
// BEFORE:
if clientMSPID != "ExporterBankMSP" {
    return fmt.Errorf("only commercialbank can reject banking review")
}

// AFTER:
if clientMSPID != "CommercialBankMSP" {
    return fmt.Errorf("only Commercial Bank can reject banking review")
}
```

#### Fix 3: SubmitForQuality (Line 572)
```go
// BEFORE:
if clientMSPID != "ExporterBankMSP" {
    return fmt.Errorf("only commercialbank can submit for quality")
}

// AFTER:
if clientMSPID != "CommercialBankMSP" {
    return fmt.Errorf("only Commercial Bank can submit for quality")
}
```

#### Fix 4: SubmitForFX (Line 736)
```go
// BEFORE:
if clientMSPID != "ExporterBankMSP" {
    return fmt.Errorf("only commercialbank can submit for FX")
}

// AFTER:
if clientMSPID != "CommercialBankMSP" {
    return fmt.Errorf("only Commercial Bank can submit for FX")
}
```

#### Fix 5: SubmitToExportCustoms (Line 853)
```go
// BEFORE:
if clientMSPID != "ExporterBankMSP" {
    return fmt.Errorf("only commercialbank can submit to export customs")
}

// AFTER:
if clientMSPID != "CommercialBankMSP" {
    return fmt.Errorf("only Commercial Bank can submit to export customs")
}
```

#### Fix 6: IssueQualityCertificate (Line 609)
```go
// BEFORE:
if clientMSPID != "NCATMSP" {
    return fmt.Errorf("only NCAT can issue quality certificates")
}

// AFTER:
if clientMSPID != "ECTAMSP" {
    return fmt.Errorf("only ECTA can issue quality certificates")
}
```

#### Fix 7: RejectQuality (Line 654)
```go
// BEFORE:
if clientMSPID != "NCATMSP" {
    return fmt.Errorf("only NCAT can reject quality")
}

// AFTER:
if clientMSPID != "ECTAMSP" {
    return fmt.Errorf("only ECTA can reject quality")
}
```

#### Fix 8: IssueOriginCertificate (Line 694)
```go
// BEFORE:
if clientMSPID != "NCATMSP" && clientMSPID != "ChamberOfCommerceMSP" {
    return fmt.Errorf("only NCAT or Chamber of Commerce can issue origin certificates")
}

// AFTER:
if clientMSPID != "ECTAMSP" && clientMSPID != "ChamberOfCommerceMSP" {
    return fmt.Errorf("only ECTA or Chamber of Commerce can issue origin certificates")
}
```

#### Fix 9: ValidateExportLicense (Line 382)
```go
// BEFORE:
if clientMSPID != "ECTAMSP" && clientMSPID != "NCATMSP" {
    return fmt.Errorf("only ECTA can validate export license, got MSP ID: %s", clientMSPID)
}

// AFTER:
if clientMSPID != "ECTAMSP" {
    return fmt.Errorf("only ECTA can validate export license, got MSP ID: %s", clientMSPID)
}
```

#### Fix 10: ApproveExportContract (Line 421)
```go
// BEFORE:
if clientMSPID != "ECTAMSP" && clientMSPID != "NCATMSP" {
    return fmt.Errorf("only ECTA can approve contracts, got MSP ID: %s", clientMSPID)
}

// AFTER:
if clientMSPID != "ECTAMSP" {
    return fmt.Errorf("only ECTA can approve contracts, got MSP ID: %s", clientMSPID)
}
```

## Impact Analysis

### Current Situation:
- ❌ Commercial Bank APIs **CANNOT** perform their functions (MSP mismatch)
- ❌ ECTA APIs **CANNOT** issue certificates (MSP mismatch)
- ✅ National Bank APIs work correctly
- ✅ Shipping Line APIs work correctly
- ✅ ECX APIs work correctly

### After Fix:
- ✅ All organizations can perform their designated functions
- ✅ Access control properly enforced
- ✅ No organization can perform actions outside their scope

## Testing After Fix

### 1. Commercial Bank Functions
```bash
# Should succeed (as Commercial Bank)
curl -X POST http://localhost:3001/api/exports/{id}/approve-banking

# Should fail (as National Bank)
curl -X POST http://localhost:3002/api/exports/{id}/approve-banking
# Expected: "only Commercial Bank can approve banking/financial documents"
```

### 2. ECTA Functions
```bash
# Should succeed (as ECTA)
curl -X POST http://localhost:3003/api/exports/{id}/certify-quality

# Should fail (as Commercial Bank)
curl -X POST http://localhost:3001/api/exports/{id}/certify-quality
# Expected: "only ECTA can issue quality certificates"
```

### 3. National Bank Functions
```bash
# Should succeed (as National Bank)
curl -X POST http://localhost:3002/api/exports/{id}/approve-fx

# Should fail (as Commercial Bank)
curl -X POST http://localhost:3001/api/exports/{id}/approve-fx
# Expected: "only National Bank can approve FX"
```

## Deployment Steps

1. **Update chaincode** with correct MSP names
2. **Rebuild chaincode** (`go build`)
3. **Redeploy chaincode** to network
4. **Test each organization's** functions
5. **Verify access control** works correctly

## Summary

**Total Fixes Required:** 10 MSP name updates in chaincode
**Files to Modify:** 1 (`contract.go`)
**Impact:** HIGH - Currently blocking Commercial Bank and ECTA operations
**Priority:** CRITICAL - Must fix before production use

**Status:** ❌ NEEDS IMMEDIATE ATTENTION
