# Coffee Export System - Actual Workflow Analysis

## Executive Summary

This document provides a comprehensive analysis of the actual workflow implementation in the Coffee Bean Chain (CBC) system, identifying the roles, responsibilities, and approval chain for coffee export requests.

---

## System Organizations & Roles

### 1. **Exporter Portal** (Exporter - External Client)
- **Primary Role**: Initiates export requests
- **Architecture**: External client using Fabric SDK (NOT an MSP member)
- **Connects Through**: Commercial Bank's peer as gateway
- **Identity**: `exporterClient` (enrolled via Commercial Bank)
- **Actual MSP on Blockchain**: `CommercialBankMSP` (transactions submitted on behalf of exporter)
- **Responsibilities**:
  - Create export requests with required documentation (via SDK through Commercial Bank)
  - Upload forms and files (license, contracts, invoices)
  - Track export status throughout the lifecycle
  - View own export history and audit trail
  - Respond to rejections by updating export details
- **Note**: Exporter Portal is an external application, not a blockchain peer. It uses the Fabric SDK to connect to the Commercial Bank's peer, which then submits transactions to the blockchain using `CommercialBankMSP`.

### 2. **ECX** (Ethiopian Commodity Exchange)
- **Primary Role**: Lot verification and warehouse validation
- **MSP ID**: `ECXMSP`
- **Responsibilities**:
  - Verify ECX lot numbers
  - Validate warehouse receipt numbers
  - Confirm warehouse location and coffee quality from warehouse
  - **APPROVE/REJECT**: Lot verification
  - Status transition: `PENDING` → `ECX_VERIFIED` or `ECX_REJECTED`

### 3. **ECTA** (Ethiopian Coffee & Tea Authority)
- **Primary Role**: Primary regulatory authority with THREE approval stages
- **MSP ID**: `ECTAMSP`
- **Responsibilities**:
  
  **Stage 1: License Approval**
  - Review export license applications
  - Verify exporter credentials and TIN
  - Issue export licenses
  - **APPROVE/REJECT**: Export license
  - Status: `ECX_VERIFIED` → `ECTA_LICENSE_APPROVED` or `ECTA_LICENSE_REJECTED`
  
  **Stage 2: Quality Certification**
  - Conduct quality inspections
  - Issue quality certificates and grades
  - Verify coffee quality standards
  - **APPROVE/REJECT**: Quality certification
  - Status: `ECTA_LICENSE_APPROVED` → `ECTA_QUALITY_APPROVED` or `ECTA_QUALITY_REJECTED`
  
  **Stage 3: Contract Approval**
  - Review export contracts
  - Verify buyer information and payment terms
  - Issue Certificate of Origin
  - **APPROVE/REJECT**: Export contract
  - Status: `ECTA_QUALITY_APPROVED` → `ECTA_CONTRACT_APPROVED` or `ECTA_CONTRACT_REJECTED`

### 4. **Commercial Bank** (Exporter's Bank)
- **Primary Role**: Document verification and FX intermediary
- **MSP ID**: `CommercialBankMSP`
- **Responsibilities**:
  - Verify all export documents (ECTA certificates, contracts, invoices)
  - Check document completeness and validity
  - Submit FX application to NBE on behalf of exporter
  - Confirm payment receipt
  - **APPROVE/REJECT**: Document verification
  - Status: `ECTA_CONTRACT_APPROVED` → `BANK_DOCUMENT_VERIFIED` or `BANK_DOCUMENT_REJECTED`
  - Then: `BANK_DOCUMENT_VERIFIED` → `FX_APPLICATION_PENDING` (submit to NBE)

### 5. **NBE** (National Bank of Ethiopia)
- **Primary Role**: Foreign Exchange (FX) approval authority
- **MSP ID**: `NBEMSP`
- **Responsibilities**:
  - Review FX applications from Commercial Banks
  - Approve or reject foreign exchange allocation
  - Confirm FX repatriation after payment
  - **APPROVE/REJECT**: FX allocation
  - Status: `FX_APPLICATION_PENDING` → `FX_APPROVED` or `FX_REJECTED`

### 6. **Customs Authorities**
- **Primary Role**: Export customs clearance
- **MSP ID**: `CustomAuthoritiesMSP`
- **Responsibilities**:
  - Review customs declarations
  - Inspect export documentation
  - Issue customs clearance
  - **APPROVE/REJECT**: Customs clearance
  - Status: `FX_APPROVED` → `CUSTOMS_CLEARED` or `CUSTOMS_REJECTED`

### 7. **Shipping Line**
- **Primary Role**: Transportation and logistics
- **MSP ID**: `ShippingLineMSP`
- **Responsibilities**:
  - Schedule shipments
  - Mark shipment as shipped
  - Track shipment status
  - Confirm arrival at destination
  - Submit to import customs
  - Confirm delivery
  - Status transitions: `CUSTOMS_CLEARED` → `SHIPMENT_SCHEDULED` → `SHIPPED` → `ARRIVED` → `DELIVERED`

---

## Complete Workflow Chain

### **Phase 1: Initiation (Exporter)**
```
ACTION: Exporter creates export request
- Fills export form (coffee type, quantity, destination, value)
- Uploads export license
- Uploads ECX lot number
- Uploads warehouse location
STATUS: DRAFT → PENDING (submitted to ECX)
```

### **Phase 2: ECX Verification**
```
ACTION: ECX verifies lot and warehouse
- Verifies ECX lot number
- Validates warehouse receipt number
- Confirms warehouse location
DECISION: APPROVE or REJECT
STATUS: PENDING → ECX_VERIFIED or ECX_REJECTED
```

### **Phase 3: ECTA Approvals (3 Stages)**

#### **Stage 3A: License Approval**
```
ACTION: ECTA reviews export license
- Verifies exporter license number
- Checks license expiry date
- Validates exporter TIN
DECISION: APPROVE or REJECT
STATUS: ECX_VERIFIED → ECTA_LICENSE_APPROVED or ECTA_LICENSE_REJECTED
```

#### **Stage 3B: Quality Certification**
```
ACTION: ECTA conducts quality inspection
- Inspects coffee quality
- Issues quality grade
- Uploads quality certificate documents
DECISION: APPROVE or REJECT
STATUS: ECTA_LICENSE_APPROVED → ECTA_QUALITY_APPROVED or ECTA_QUALITY_REJECTED
```

#### **Stage 3C: Contract Approval**
```
ACTION: ECTA reviews export contract
- Reviews contract number
- Verifies buyer name and country
- Checks payment terms
- Issues Certificate of Origin
DECISION: APPROVE or REJECT
STATUS: ECTA_QUALITY_APPROVED → ECTA_CONTRACT_APPROVED or ECTA_CONTRACT_REJECTED
```

### **Phase 4: Commercial Bank Document Verification**
```
ACTION: Commercial Bank verifies all documents
- Checks ECTA license validation
- Verifies quality certificate
- Confirms Certificate of Origin
- Validates contract approval
- Reviews commercial invoice
- Checks sales contract
DECISION: APPROVE or REJECT
STATUS: ECTA_CONTRACT_APPROVED → BANK_DOCUMENT_VERIFIED or BANK_DOCUMENT_REJECTED

Then automatically:
ACTION: Commercial Bank submits FX application to NBE
STATUS: BANK_DOCUMENT_VERIFIED → FX_APPLICATION_PENDING
```

### **Phase 5: NBE FX Approval**
```
ACTION: NBE reviews FX application
- Reviews all supporting documents
- Checks foreign exchange availability
- Validates export value
DECISION: APPROVE or REJECT
STATUS: FX_APPLICATION_PENDING → FX_APPROVED or FX_REJECTED
```

### **Phase 6: Customs Clearance**
```
ACTION: Customs reviews export declaration
- Reviews customs declaration number
- Inspects all documentation
- Verifies export compliance
DECISION: APPROVE or REJECT
STATUS: FX_APPROVED → CUSTOMS_CLEARED or CUSTOMS_REJECTED
```

### **Phase 7: Shipping & Delivery**
```
ACTION: Shipping Line handles logistics
- Schedules shipment (CUSTOMS_CLEARED → SHIPMENT_SCHEDULED)
- Marks as shipped (SHIPMENT_SCHEDULED → SHIPPED)
- Confirms arrival (SHIPPED → ARRIVED)
- Submits to import customs (ARRIVED → IMPORT_CUSTOMS_PENDING)
- Clears import customs (IMPORT_CUSTOMS_PENDING → IMPORT_CUSTOMS_CLEARED)
- Confirms delivery (IMPORT_CUSTOMS_CLEARED → DELIVERED)
```

### **Phase 8: Payment & Completion**
```
ACTION: Payment processing
- Commercial Bank confirms payment receipt (DELIVERED → PAYMENT_RECEIVED)
- NBE confirms FX repatriation (PAYMENT_RECEIVED → FX_REPATRIATED)
- System marks as completed (FX_REPATRIATED → COMPLETED)
```

---

## Current Implementation Status

### ✅ **Properly Implemented**

1. **Exporter Portal**
   - ✅ Create export requests
   - ✅ View own exports only (ownership validation)
   - ✅ Track export history
   - ✅ Cannot approve exports (read-only for approvals)

2. **ECX**
   - ✅ Verify lot numbers
   - ✅ Approve/reject lot verification
   - ✅ View all exports
   - ✅ Proper status transitions

3. **ECTA**
   - ✅ Three-stage approval process (License, Quality, Contract)
   - ✅ Each stage has approve/reject actions
   - ✅ Proper status transitions
   - ✅ Certificate of Origin issuance

4. **Commercial Bank**
   - ✅ Document verification
   - ✅ FX application submission to NBE
   - ✅ Document completeness checking
   - ✅ Payment confirmation

5. **NBE**
   - ✅ FX approval/rejection
   - ✅ FX repatriation confirmation
   - ✅ Proper validation and audit logging

6. **Customs**
   - ✅ Customs clearance/rejection
   - ✅ Declaration number tracking
   - ✅ Document verification

7. **Dashboard & Reporting**
   - ✅ Real-time workflow progress visualization
   - ✅ Stage-by-stage tracking
   - ✅ Actor/approver tracking per stage
   - ✅ Completion rate metrics
   - ✅ Organization-specific views

---

## Identified Gaps & Issues

### ❌ **Critical Issues**

1. **Exporter Cannot Submit to Next Stage**
   - **Issue**: After ECX verification, exporter should submit to ECTA, but there's no explicit "submit to ECTA" action
   - **Current**: Status automatically transitions
   - **Required**: Exporter should explicitly submit to each next stage

2. **Missing Exporter Tracking Actions**
   - **Issue**: Exporter creates request but cannot track submission actions
   - **Required**: 
     - Submit to ECX (DRAFT → ECX_PENDING)
     - Submit to ECTA after ECX approval
     - Submit to Commercial Bank after ECTA approval

3. **Automatic Status Transitions**
   - **Issue**: Some status transitions happen automatically without exporter action
   - **Current**: Commercial Bank auto-submits to NBE
   - **Better**: Exporter should be notified and track each transition

4. **Incomplete Rejection Handling**
   - **Issue**: When rejected, exporter can update but workflow for resubmission is unclear
   - **Required**: Clear resubmission workflow after fixing rejection issues

5. **Missing Document Upload Tracking**
   - **Issue**: No explicit tracking of which documents exporter uploaded
   - **Required**: Document checklist with upload status per stage

### ⚠️ **Medium Priority Issues**

1. **Dashboard Shows Wrong Workflow**
   - **Issue**: Dashboard shows old workflow (FX → Banking → Quality)
   - **Actual**: Should be (ECX → ECTA → Banking → NBE → Customs)
   - **Fix Required**: Update dashboard workflow visualization

2. **Inconsistent Status Names**
   - **Issue**: Some aliases exist (QUALITY_PENDING vs ECTA_QUALITY_PENDING)
   - **Fix**: Standardize all status names

3. **Missing Exporter Notifications**
   - **Issue**: No notification system when status changes
   - **Required**: Notify exporter at each approval/rejection

4. **Limited Rejection Reason Tracking**
   - **Issue**: Rejection reasons stored but not prominently displayed to exporter
   - **Required**: Clear rejection reason display with action items

---

## Recommended Improvements

### **1. Add Exporter Submission Actions**

Create explicit submission endpoints for exporter:

```typescript
// Exporter Portal API
POST /api/exports/:exportId/submit-to-ecx
POST /api/exports/:exportId/submit-to-ecta  
POST /api/exports/:exportId/submit-to-bank
POST /api/exports/:exportId/resubmit-after-rejection
```

### **2. Implement Document Checklist**

Track document upload status:

```typescript
interface DocumentChecklist {
  exportLicense: { uploaded: boolean, cid?: string }
  qualityCertificate: { uploaded: boolean, cid?: string }
  originCertificate: { uploaded: boolean, cid?: string }
  commercialInvoice: { uploaded: boolean, cid?: string }
  salesContract: { uploaded: boolean, cid?: string }
  customsDeclaration: { uploaded: boolean, cid?: string }
}
```

### **3. Fix Dashboard Workflow Visualization**

Update workflow stages to match actual process:

```javascript
const correctWorkflow = [
  { stage: 'Created', org: 'Exporter', status: 'DRAFT' },
  { stage: 'ECX Verification', org: 'ECX', status: 'ECX_VERIFIED' },
  { stage: 'ECTA License', org: 'ECTA', status: 'ECTA_LICENSE_APPROVED' },
  { stage: 'ECTA Quality', org: 'ECTA', status: 'ECTA_QUALITY_APPROVED' },
  { stage: 'ECTA Contract', org: 'ECTA', status: 'ECTA_CONTRACT_APPROVED' },
  { stage: 'Bank Documents', org: 'Commercial Bank', status: 'BANK_DOCUMENT_VERIFIED' },
  { stage: 'NBE FX Approval', org: 'NBE', status: 'FX_APPROVED' },
  { stage: 'Customs Clearance', org: 'Customs', status: 'CUSTOMS_CLEARED' },
  { stage: 'Shipped', org: 'Shipping Line', status: 'SHIPPED' },
  { stage: 'Completed', org: 'System', status: 'COMPLETED' }
];
```

### **4. Add Notification System**

Implement event-driven notifications:

```typescript
// When status changes, notify exporter
eventEmitter.on('statusChange', (exportId, oldStatus, newStatus, actor) => {
  notifyExporter(exportId, {
    message: `Export ${exportId} status changed from ${oldStatus} to ${newStatus}`,
    actor: actor,
    timestamp: new Date(),
    actionRequired: getRequiredAction(newStatus)
  });
});
```

### **5. Enhanced Rejection Workflow**

```typescript
// When rejected, provide clear path forward
interface RejectionDetails {
  reason: string
  rejectedBy: string
  rejectedAt: string
  requiredActions: string[]
  resubmitEndpoint: string
}
```

---

## Summary

### **Current State**
- ✅ All organizations have proper approval/rejection actions
- ✅ Blockchain workflow is correctly implemented
- ✅ Role-based access control is enforced
- ✅ Audit trail is maintained

### **Required Changes**
1. Add exporter submission actions for each stage
2. Fix dashboard workflow visualization
3. Implement document upload tracking
4. Add notification system
5. Improve rejection handling workflow
6. Standardize status names

### **Impact**
- **Exporter Experience**: Will be able to actively track and submit at each stage
- **Transparency**: Clear visibility of who approved/rejected at each stage
- **Accountability**: Full audit trail of all actions
- **Reporting**: Accurate dashboard showing real workflow progress
