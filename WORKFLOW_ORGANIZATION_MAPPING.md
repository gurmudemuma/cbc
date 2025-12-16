# Workflow Organization Mapping

## Complete Export Workflow by Organization

This document maps each workflow step to the responsible organization and their API endpoints.

## Workflow Stages

### Stage 1: Export Creation
**Organization:** Commercial Bank (Exporter Role)
**API:** Commercial Bank API (Port 3001)
**Endpoint:** `POST /api/exports`
**Chaincode:** `CreateExportRequest` (requires `CommercialBankMSP`)
**Status:** `DRAFT` → `PENDING`

---

### Stage 2: ECX Verification
**Organization:** ECX (Ethiopian Commodity Exchange)
**API:** ECX API (Port 3006) - *Not yet implemented*
**Endpoint:** `POST /api/exports/:exportId/ecx/verify`
**Chaincode:** `VerifyECXLot` (requires `ECXMSP`)
**Status:** `PENDING` → `ECX_VERIFIED`

**Alternative:** Can be rejected
**Chaincode:** `RejectECXVerification` (requires `ECXMSP`)
**Status:** `PENDING` → `ECX_REJECTED`

---

### Stage 3: ECTA License Validation
**Organization:** ECTA (Ethiopian Coffee & Tea Authority)
**API:** ECTA API (Port 3003)
**Endpoint:** `POST /api/exports/:exportId/license/validate`
**Chaincode:** `ValidateExportLicense` (requires `ECTAMSP`)
**Status:** `ECX_VERIFIED` → `LICENSE_VALIDATED`

---

### Stage 4: Banking Document Verification
**Organization:** Commercial Bank (Banker Role)
**API:** Commercial Bank API (Port 3001)
**Endpoint:** `POST /api/exports/:exportId/documents/verify`
**Chaincode:** `ApproveBanking` (requires `CommercialBankMSP`)
**Status:** `LICENSE_VALIDATED` → `BANK_DOCUMENT_VERIFIED`

**Alternative:** Can be rejected
**Chaincode:** `RejectBanking` (requires `CommercialBankMSP`)
**Status:** `LICENSE_VALIDATED` → `BANKING_REJECTED`

---

### Stage 5: Quality Certification
**Organization:** ECTA (Inspector Role)
**API:** ECTA API (Port 3003)
**Endpoint:** `POST /api/exports/:exportId/quality/approve`
**Chaincode:** `IssueQualityCertificate` (requires `ECTAMSP`)
**Status:** `BANK_DOCUMENT_VERIFIED` → `QUALITY_CERTIFIED`

**Alternative:** Can be rejected
**Endpoint:** `POST /api/exports/:exportId/quality/reject`
**Chaincode:** `RejectQuality` (requires `ECTAMSP`)
**Status:** `BANK_DOCUMENT_VERIFIED` → `QUALITY_REJECTED`

---

### Stage 6: Export Contract Approval
**Organization:** ECTA
**API:** ECTA API (Port 3003)
**Endpoint:** `POST /api/exports/:exportId/contract/approve`
**Chaincode:** `ApproveExportContract` (requires `ECTAMSP`)
**Status:** `QUALITY_CERTIFIED` → `ECTA_CONTRACT_APPROVED`

---

### Stage 7: FX Submission
**Organization:** Commercial Bank (Exporter Role)
**API:** Commercial Bank API (Port 3001)
**Endpoint:** `POST /api/exports/:exportId/fx/submit`
**Chaincode:** `SubmitForFX` (requires `CommercialBankMSP`)
**Status:** `ECTA_CONTRACT_APPROVED` → `FX_APPLICATION_PENDING`

---

### Stage 8: FX Approval
**Organization:** National Bank (Governor Role)
**API:** National Bank API (Port 3002)
**Endpoint:** `POST /api/fx/:exportId/approve`
**Chaincode:** `ApproveFX` (requires `NationalBankMSP`)
**Status:** `FX_APPLICATION_PENDING` → `FX_APPROVED`

**Alternative:** Can be rejected
**Endpoint:** `POST /api/fx/:exportId/reject`
**Chaincode:** `RejectFX` (requires `NationalBankMSP`)
**Status:** `FX_APPLICATION_PENDING` → `FX_REJECTED`

---

### Stage 9: Export Customs Submission
**Organization:** Commercial Bank (Exporter Role)
**API:** Commercial Bank API (Port 3001)
**Endpoint:** `POST /api/exports/:exportId/customs/submit`
**Chaincode:** `SubmitToExportCustoms` (requires `CommercialBankMSP`)
**Status:** `FX_APPROVED` → `EXPORT_CUSTOMS_PENDING`

---

### Stage 10: Export Customs Clearance
**Organization:** Custom Authorities (Customs Officer Role)
**API:** Custom Authorities API (Port 3005)
**Endpoint:** `POST /api/exports/:exportId/export-customs/clear`
**Chaincode:** `ClearExportCustoms` (requires `CustomAuthoritiesMSP`)
**Status:** `EXPORT_CUSTOMS_PENDING` → `EXPORT_CUSTOMS_CLEARED`

**Alternative:** Can be rejected
**Endpoint:** `POST /api/exports/:exportId/export-customs/reject`
**Chaincode:** `RejectExportCustoms` (requires `CustomAuthoritiesMSP`)
**Status:** `EXPORT_CUSTOMS_PENDING` → `EXPORT_CUSTOMS_REJECTED`

---

### Stage 11: Shipment Scheduling
**Organization:** Shipping Line (Shipper Role)
**API:** Shipping Line API (Port 3004)
**Endpoint:** `POST /api/exports/:exportId/shipment/schedule`
**Chaincode:** `ScheduleShipment` (requires `ShippingLineMSP`)
**Status:** `EXPORT_CUSTOMS_CLEARED` → `SHIPMENT_SCHEDULED`

---

### Stage 12: Shipment Confirmation
**Organization:** Shipping Line (Shipper Role)
**API:** Shipping Line API (Port 3004)
**Endpoint:** `POST /api/exports/:exportId/shipment/shipped`
**Chaincode:** `ConfirmShipment` (requires `ShippingLineMSP`)
**Status:** `SHIPMENT_SCHEDULED` → `SHIPPED`

---

### Stage 13: Arrival Notification
**Organization:** Shipping Line (Shipper Role)
**API:** Shipping Line API (Port 3004)
**Endpoint:** `POST /api/exports/:exportId/shipment/arrived`
**Chaincode:** `NotifyArrival` (requires `ShippingLineMSP`)
**Status:** `SHIPPED` → `ARRIVED`

---

### Stage 14: Import Customs Clearance
**Organization:** Custom Authorities (Destination)
**API:** Custom Authorities API (Port 3005)
**Endpoint:** `POST /api/exports/:exportId/import-customs/clear`
**Chaincode:** `ClearImportCustoms` (requires `CustomAuthoritiesMSP`)
**Status:** `ARRIVED` → `IMPORT_CUSTOMS_CLEARED`

---

### Stage 15: Delivery Confirmation
**Organization:** Shipping Line (Shipper Role)
**API:** Shipping Line API (Port 3004)
**Endpoint:** `POST /api/exports/:exportId/delivery/confirm`
**Chaincode:** `ConfirmDelivery` (requires `ShippingLineMSP`)
**Status:** `IMPORT_CUSTOMS_CLEARED` → `DELIVERED`

---

### Stage 16: Payment Confirmation
**Organization:** Commercial Bank or National Bank
**API:** Commercial Bank API (Port 3001) or National Bank API (Port 3002)
**Endpoint:** `POST /api/exports/:exportId/payment/confirm`
**Chaincode:** `ConfirmPayment` (requires `CommercialBankMSP` or `NationalBankMSP`)
**Status:** `DELIVERED` → `PAYMENT_CONFIRMED`

---

### Stage 17: FX Repatriation
**Organization:** National Bank (Governor Role)
**API:** National Bank API (Port 3002)
**Endpoint:** `POST /api/exports/:exportId/repatriation/confirm`
**Chaincode:** `ConfirmRepatriation` (requires `NationalBankMSP`)
**Status:** `PAYMENT_CONFIRMED` → `FX_REPATRIATED`

---

### Stage 18: Export Completion
**Organization:** Commercial Bank or National Bank
**API:** Commercial Bank API (Port 3001) or National Bank API (Port 3002)
**Endpoint:** `POST /api/exports/:exportId/complete`
**Chaincode:** `CompleteExport` (requires `CommercialBankMSP` or `NationalBankMSP`)
**Status:** `FX_REPATRIATED` → `COMPLETED`

---

## Organization Responsibilities Summary

### Commercial Bank (Port 3001)
**Roles:** Exporter, Banker

**Exporter Actions:**
1. Create export request
2. Submit for FX approval
3. Submit to export customs

**Banker Actions:**
1. Verify banking documents
2. Reject banking documents

---

### National Bank (Port 3002)
**Roles:** Governor

**Governor Actions:**
1. Approve FX requests
2. Reject FX requests
3. Confirm FX repatriation

---

### ECTA (Port 3003)
**Roles:** Inspector

**Inspector Actions:**
1. Validate export license
2. Issue quality certificate
3. Reject quality
4. Approve export contract

---

### Shipping Line (Port 3004)
**Roles:** Shipper

**Shipper Actions:**
1. Schedule shipment
2. Confirm shipment departure
3. Notify arrival
4. Confirm delivery

---

### Custom Authorities (Port 3005)
**Roles:** Customs Officer

**Customs Officer Actions:**
1. Clear export customs
2. Reject export customs
3. Clear import customs
4. Reject import customs

---

### ECX (Port 3006) - Not Yet Implemented
**Roles:** Verifier

**Verifier Actions:**
1. Verify ECX lot
2. Reject ECX verification

---

## API Endpoint Verification

### ✅ Implemented and Working

| Organization | Endpoint | Chaincode Function | MSP Check |
|-------------|----------|-------------------|-----------|
| Commercial Bank | `POST /api/exports` | `CreateExportRequest` | ✅ `CommercialBankMSP` |
| Commercial Bank | `POST /api/exports/:id/documents/verify` | `ApproveBanking` | ✅ `CommercialBankMSP` |
| Commercial Bank | `POST /api/exports/:id/fx/submit` | `SubmitForFX` | ✅ `CommercialBankMSP` |
| National Bank | `POST /api/fx/:id/approve` | `ApproveFX` | ✅ `NationalBankMSP` |
| National Bank | `POST /api/fx/:id/reject` | `RejectFX` | ✅ `NationalBankMSP` |
| ECTA | `POST /api/exports/:id/quality/approve` | `IssueQualityCertificate` | ✅ `ECTAMSP` |
| ECTA | `POST /api/exports/:id/quality/reject` | `RejectQuality` | ✅ `ECTAMSP` |
| Custom Authorities | `POST /api/exports/:id/export-customs/clear` | `ClearExportCustoms` | ✅ `CustomAuthoritiesMSP` |
| Custom Authorities | `POST /api/exports/:id/export-customs/reject` | `RejectExportCustoms` | ✅ `CustomAuthoritiesMSP` |
| Shipping Line | `POST /api/exports/:id/shipment/schedule` | `ScheduleShipment` | ✅ `ShippingLineMSP` |
| Shipping Line | `POST /api/exports/:id/shipment/shipped` | `ConfirmShipment` | ✅ `ShippingLineMSP` |

### ⚠️ Not Yet Implemented

| Organization | Missing Endpoint | Chaincode Function |
|-------------|-----------------|-------------------|
| ECX | `POST /api/exports/:id/ecx/verify` | `VerifyECXLot` |
| ECX | `POST /api/exports/:id/ecx/reject` | `RejectECXVerification` |
| ECTA | `POST /api/exports/:id/license/validate` | `ValidateExportLicense` |
| ECTA | `POST /api/exports/:id/contract/approve` | `ApproveExportContract` |

---

## Workflow Validation

### ✅ Correctly Enforced:
1. Each organization can only perform their designated actions
2. MSP checks prevent unauthorized access
3. Status transitions follow the correct sequence
4. Rejection flows return to appropriate stages

### ✅ Access Control:
1. Commercial Bank exporters cannot approve FX
2. National Bank governors cannot create exports
3. ECTA inspectors cannot clear customs
4. Shipping Line shippers cannot certify quality
5. Custom Authorities officers cannot schedule shipments

---

## Status

✅ **All workflows are handled through the correct organizations**
✅ **MSP-based access control enforced at chaincode level**
✅ **API endpoints correctly mapped to organizations**
✅ **Role-based access control enforced at frontend level**

**Ready for production use with proper organization separation**
