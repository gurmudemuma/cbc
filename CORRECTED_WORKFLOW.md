# ✅ Corrected Ethiopian Coffee Export Workflow

This document outlines the corrected Ethiopian coffee export workflow that follows the actual regulatory process in Ethiopia.

## 🏗️ Corrected Workflow Structure

### Stage 1: Exporter Portal Submission
**Actor:** Exporter (External)  
**Action:** Submit export request with preliminary information  
**Status:** `DRAFT` → `ECX_PENDING`

### Stage 2: ECX Lot Verification
**Actor:** ECX (Ethiopian Commodity Exchange)  
**Action:** Verify coffee lot and warehouse receipt  
**Status:** `ECX_PENDING` → `ECX_VERIFIED` or `ECX_REJECTED`

### Stage 3: Commercial Bank Financial Document Validation
**Actor:** Commercial Bank  
**Action:** Validate financial documents (commercial invoice, sales contract)  
**Status:** `ECX_VERIFIED` → `BANK_DOCUMENT_PENDING` → `BANK_DOCUMENT_VERIFIED` or `BANK_DOCUMENT_REJECTED`

### Stage 4: ECTA Regulatory Approval
**Actor:** ECTA (Ethiopian Coffee and Tea Authority)  
**Actions:**  
1. **License Validation:** Validate export license  
   `BANK_DOCUMENT_VERIFIED` → `ECTA_LICENSE_PENDING` → `ECTA_LICENSE_APPROVED` or `ECTA_LICENSE_REJECTED`
   
2. **Quality Certification:** Issue quality certificate  
   `ECTA_LICENSE_APPROVED` → `ECTA_QUALITY_PENDING` → `ECTA_QUALITY_APPROVED` or `ECTA_QUALITY_REJECTED`
   
3. **Contract Approval:** Approve export contract  
   `ECTA_QUALITY_APPROVED` → `ECTA_CONTRACT_PENDING` → `ECTA_CONTRACT_APPROVED` or `ECTA_CONTRACT_REJECTED`

### Stage 5: National Bank FX Approval
**Actor:** NBE (National Bank of Ethiopia)  
**Action:** Approve foreign exchange application  
**Status:** `ECTA_CONTRACT_APPROVED` → `FX_APPLICATION_PENDING` → `FX_APPROVED` or `FX_REJECTED`

### Stage 6: Export Customs Clearance
**Actor:** Ethiopian Customs Authorities  
**Action:** Clear export for customs  
**Status:** `FX_APPROVED` → `EXPORT_CUSTOMS_PENDING` → `EXPORT_CUSTOMS_CLEARED` or `EXPORT_CUSTOMS_REJECTED`

### Stage 7: Shipping Line Operations
**Actor:** Shipping Line  
**Actions:**  
1. **Schedule Shipment:** Schedule vessel/flight  
   `EXPORT_CUSTOMS_CLEARED` → `SHIPMENT_SCHEDULED`
   
2. **Confirm Shipment:** Confirm goods shipped  
   `SHIPMENT_SCHEDULED` → `SHIPPED`

### Stage 8: Import Customs Clearance
**Actor:** Destination Customs Authorities  
**Action:** Clear import for customs  
**Status:** `SHIPPED` → `IMPORT_CUSTOMS_PENDING` → `IMPORT_CUSTOMS_CLEARED` or `IMPORT_CUSTOMS_REJECTED`

### Stage 9: Delivery Confirmation
**Actor:** Consignee/Shipping Line  
**Action:** Confirm delivery to destination  
**Status:** `IMPORT_CUSTOMS_CLEARED` → `DELIVERED`

### Stage 10: Payment Processing
**Actor:** Commercial Bank  
**Action:** Confirm payment receipt  
**Status:** `DELIVERED` → `PAYMENT_RECEIVED`

### Stage 11: FX Repatriation
**Actor:** National Bank  
**Action:** Repatriate foreign exchange  
**Status:** `PAYMENT_RECEIVED` → `FX_REPATRIATED`

### Stage 12: Export Completion
**Actor:** Commercial Bank or National Bank  
**Action:** Mark export as completed  
**Status:** `FX_REPATRIATED` → `COMPLETED`

## 🔧 Chaincode Functions

### Core Functions
- `CreateExportRequest` (ECXMSP or CommercialBankMSP) - Create export request
- `VerifyECXLot` (ECXMSP) - Verify ECX lot
- `ApproveBanking` (CommercialBankMSP) - Approves financial docs
- `RejectBanking` (CommercialBankMSP) - Rejects with reason
- `ApproveLicense` (ECTAMSP) - Approve export license
- `RejectLicense` (ECTAMSP) - Reject export license
- `ApproveQuality` (ECTAMSP) - Approve quality certificate
- `RejectQuality` (ECTAMSP) - Reject quality certificate
- `ApproveContract` (ECTAMSP) - Approve export contract
- `RejectContract` (ECTAMSP) - Reject export contract
- `ApproveFX` (NBEMSP) - Approve FX application
- `RejectFX` (NBEMSP) - Reject FX application
- `ClearExportCustoms` (CustomAuthoritiesMSP) - Clear export customs
- `RejectExportCustoms` (CustomAuthoritiesMSP) - Reject export customs
- `ClearImportCustoms` (CustomAuthoritiesMSP) - Clear import customs
- `RejectImportCustoms` (CustomAuthoritiesMSP) - Reject import customs
- `ScheduleShipment` (ShippingLineMSP) - Schedule shipment
- `ConfirmShipment` (ShippingLineMSP) - Confirm shipment
- `ConfirmDelivery` (ShippingLineMSP or CommercialBankMSP) - Confirm delivery
- `ConfirmPayment` (CommercialBankMSP or NBEMSP) - Confirm payment receipt
- `RepatriateFX` (NBEMSP) - Repatriate foreign exchange
- `CompleteExport` (CommercialBankMSP or NBEMSP) - Mark export as completed
- `CancelExport` (CommercialBankMSP or NBEMSP) - Cancel export
- `GetExportRequest` - Retrieve export details
- `GetAllExports` - Get all exports
- `GetExportsByStatus` - Filter exports by status
- `GetExportHistory` - View complete export history

### Submission Functions (MSP Permissions)
- `SubmitToECX` (CommercialBankMSP) - Submit to ECX for verification
- `SubmitToECTA` (CommercialBankMSP) - Submit to ECTA for license approval
- `SubmitToBank` (ECTAMSP) - Submit to Commercial Bank for document verification
- `SubmitForQuality` (CommercialBankMSP) - Submit for quality review
- `SubmitFXApplication` (CommercialBankMSP) - Submit FX application to NBE
- `SubmitToExportCustoms` (CommercialBankMSP or ECTAMSP) - Submit to export customs

## 📊 Status Flow

```
DRAFT
  ↓ SubmitToECX (CommercialBankMSP)
ECX_PENDING
  ↓ VerifyECXLot (ECXMSP)
ECX_VERIFIED
  ↓ SubmitToBank (ECTAMSP)
BANK_DOCUMENT_PENDING
  ↓ ApproveBanking/RejectBanking (CommercialBankMSP)
BANK_DOCUMENT_VERIFIED/BANK_DOCUMENT_REJECTED
  ↓ SubmitToECTA (CommercialBankMSP)
ECTA_LICENSE_PENDING
  ↓ ApproveLicense/RejectLicense (ECTAMSP)
ECTA_LICENSE_APPROVED/ECTA_LICENSE_REJECTED
  ↓ 
ECTA_QUALITY_PENDING
  ↓ ApproveQuality/RejectQuality (ECTAMSP)
ECTA_QUALITY_APPROVED/ECTA_QUALITY_REJECTED
  ↓
ECTA_CONTRACT_PENDING
  ↓ ApproveContract/RejectContract (ECTAMSP)
ECTA_CONTRACT_APPROVED/ECTA_CONTRACT_REJECTED
  ↓ SubmitFXApplication (CommercialBankMSP)
FX_APPLICATION_PENDING
  ↓ ApproveFX/RejectFX (NBEMSP)
FX_APPROVED/FX_REJECTED
  ↓
EXPORT_CUSTOMS_PENDING
  ↓ ClearExportCustoms/RejectExportCustoms (CustomAuthoritiesMSP)
EXPORT_CUSTOMS_CLEARED/EXPORT_CUSTOMS_REJECTED
  ↓
SHIPMENT_SCHEDULED
  ↓ ConfirmShipment (ShippingLineMSP)
SHIPPED
  ↓
IMPORT_CUSTOMS_PENDING
  ↓ ClearImportCustoms/RejectImportCustoms (CustomAuthoritiesMSP)
IMPORT_CUSTOMS_CLEARED/IMPORT_CUSTOMS_REJECTED
  ↓
DELIVERED
  ↓ ConfirmPayment (CommercialBankMSP or NBEMSP)
PAYMENT_RECEIVED
  ↓
FX_REPATRIATED (NBEMSP)
  ↓
COMPLETED (CommercialBankMSP or NBEMSP)
```

## 📋 Implementation Notes

### 1. Organization MSP IDs
- **ECX**: `ECXMSP`
- **Commercial Bank**: `CommercialBankMSP`
- **ECTA**: `ECTAMSP`
- **National Bank**: `NBEMSP`
- **Custom Authorities**: `CustomAuthoritiesMSP`
- **Shipping Line**: `ShippingLineMSP`

### 2. Data Model Changes
```go
type ExportRequest struct {
    ExportID           string       `json:"exportId"`
    CommercialBankID   string       `json:"commercialBankId"`  // Changed from commercialbankID
    ExporterName       string       `json:"exporterName"`
    // ... other fields
}
```

### 3. Function Signature Changes
```go
func (c *CoffeeExportContractV2) CreateExportRequest(
    ctx contractapi.TransactionContextInterface,
    exportID string,
    commercialBankID string,  // Changed from commercialbankID
    exporterName string,
    // ... other parameters
) error
```

## 🛠️ Implementation Checklist

### 1. Update Chaincode
- [x] Rename `commercialbankID` to `CommercialBankID` in data model
- [x] Update `CreateExportRequest` function signature
- [x] Update all function comments to reference Commercial Bank
- [x] Update MSP validation checks

### 2. Update API Services
- [x] Update shared export service
- [x] Update Commercial Bank API
- [x] Update ECX API
- [x] Update ECTA API
- [x] Update National Bank API
- [x] Update Custom Authorities API
- [x] Update Shipping Line API

### 3. Update Frontend
- [x] Update role-based routing
- [x] Update organization identification
- [x] Update UI references

### 4. Update Commercial Bank API
- [x] Rename commercialbankId to commercialBankId in all endpoints
- [x] Update documentation
- [x] Update validation schemas

## ✅ Verification

The corrected workflow has been verified to:
1. Follow the actual Ethiopian coffee export regulatory process
2. Maintain proper role-based access control
3. Ensure data consistency across all organizations
4. Provide complete audit trail
5. Support error recovery and resubmission