# Sales Contract Registration & Network Approval Workflow

## Overview
After exporter and buyer agree on sales contract terms, ECTA registers the contract and generates a reference number. All other organizations use this reference to track and approve the export.

---

## Complete Workflow

### Phase 1: Contract Negotiation (Exporter ↔ Buyer)

```
Exporter creates draft → Buyer reviews
         ↓
    Accept/Reject/Counter
         ↓
    (Negotiation continues)
         ↓
Both parties ACCEPT → Status: ACCEPTED
```

**Participants**: Exporter, Buyer  
**System**: PostgreSQL + Blockchain (draft tracking)  
**Output**: Accepted contract (not yet registered)

---

### Phase 2: ECTA Registration (Critical Step)

#### Step 1: Exporter Requests Registration
**Action**: Click "Finalize to Blockchain" on accepted contract

**What Happens**:
1. Contract submitted to ECTA for registration
2. Status changes to `PENDING_ECTA_REGISTRATION`
3. ECTA receives notification

#### Step 2: ECTA Reviews Contract
**ECTA Dashboard**: `/ecta/contract-registrations`

**ECTA Reviews**:
- ✅ Exporter is fully qualified (license valid)
- ✅ Buyer is verified (if international)
- ✅ Contract terms comply with regulations
- ✅ Coffee type and quantity are valid
- ✅ Payment terms are acceptable
- ✅ All required fields are complete

**ECTA Actions**:
- ✅ **Approve & Register** → Generate reference number
- ❌ **Reject** → Return to exporter with reason

#### Step 3: ECTA Generates Reference Number
**Format**: `ECTA-SC-{YEAR}-{SEQUENCE}`  
**Example**: `ECTA-SC-2026-00001`

**Registration Process**:
```javascript
// Generate unique reference number
const year = new Date().getFullYear();
const sequence = await getNextSequence('sales_contract', year);
const referenceNumber = `ECTA-SC-${year}-${sequence.toString().padStart(5, '0')}`;

// Register on blockchain
await fabricService.invokeChaincode('RegisterSalesContract', {
  referenceNumber,
  contractId: draftId,
  exporterId,
  buyerId,
  coffeeType,
  quantity,
  totalValue,
  paymentTerms,
  incoterms,
  registeredBy: 'ECTA',
  registeredAt: timestamp
});

// Update contract status
contract.status = 'REGISTERED';
contract.ectaReferenceNumber = referenceNumber;
contract.registeredAt = timestamp;
contract.registeredBy = ectaOfficerId;
```

**Blockchain Record**:
```json
{
  "docType": "registered_sales_contract",
  "referenceNumber": "ECTA-SC-2026-00001",
  "contractId": "uuid-of-draft",
  "exporterId": "exporter-uuid",
  "exporterName": "ABC Coffee Export",
  "exporterLicense": "LIC-2025-12345",
  "buyerId": "buyer-uuid",
  "buyerName": "Global Coffee Importers Ltd",
  "buyerCountry": "Germany",
  "coffeeDetails": {
    "type": "Arabica Grade 1",
    "origin": "Yirgacheffe",
    "quantity": 300,
    "unitPrice": 4.50,
    "totalValue": 1350.00,
    "currency": "USD"
  },
  "terms": {
    "paymentMethod": "LC",
    "paymentTerms": "Net 30",
    "incoterms": "FOB",
    "portOfLoading": "Port of Djibouti",
    "portOfDischarge": "Port of Hamburg",
    "deliveryDate": "2026-06-15"
  },
  "legalFramework": {
    "governingLaw": "CISG",
    "arbitrationRules": "ICC",
    "arbitrationLocation": "Geneva"
  },
  "registration": {
    "registeredBy": "ECTA",
    "registeredAt": "2026-03-27T10:30:00Z",
    "ectaOfficer": "ecta-officer-id"
  },
  "approvalStatus": {
    "ecta": { status: "APPROVED", approvedAt: "2026-03-27T10:30:00Z" },
    "bank": { status: "PENDING" },
    "nbe": { status: "PENDING" },
    "customs": { status: "PENDING" },
    "shipping": { status: "PENDING" }
  },
  "status": "REGISTERED",
  "createdAt": "2026-03-27T10:30:00Z"
}
```

---

### Phase 3: Network Submission (Exporter)

#### Step 1: Exporter Receives Reference Number
**Notification**: "Your sales contract has been registered by ECTA"  
**Reference Number**: `ECTA-SC-2026-00001`  
**Status**: `REGISTERED`

**Contract Dashboard Shows**:
```
✅ Contract Registered by ECTA
Reference Number: ECTA-SC-2026-00001

Next Step: Submit to Network for Approvals
[Submit to Network (ESW)]
```

#### Step 2: Exporter Submits to Network
**Action**: Click "Submit to Network (ESW)"  
**Navigate to**: `/esw/submission?contractRef=ECTA-SC-2026-00001`

**Network Submission Form Pre-filled**:
- ✅ Reference Number: ECTA-SC-2026-00001
- ✅ Exporter details (from profile)
- ✅ Buyer details (from contract)
- ✅ Coffee details (from contract)
- ✅ Quantity and value (from contract)
- ✅ Payment terms (from contract)
- ✅ Delivery terms (from contract)

**Required Documents**:
1. ✅ Sales Contract Certificate (auto-attached)
2. ✅ Export License (auto-attached)
3. ✅ Competence Certificate (auto-attached)
4. Commercial Invoice (upload)
5. Packing List (upload)
6. Quality Certificate (from ECX)
7. Origin Certificate (upload)
8. Phytosanitary Certificate (upload)
9. Bill of Lading (from shipping)
10. Insurance Certificate (optional)

**Submit Action**:
```javascript
// Create Network Submission
const eswSubmission = {
  referenceNumber: 'ECTA-SC-2026-00001',
  exporterId,
  contractId,
  documents: uploadedDocuments,
  submittedAt: timestamp
};

// Submit to blockchain
await fabricService.invokeChaincode('SubmitToNetwork', eswSubmission);

// Notify all organizations
await notifyOrganizations([
  'COMMERCIAL_BANK',
  'NBE',
  'CUSTOMS',
  'SHIPPING'
]);
```

---

### Phase 4: Organization Approvals (Sequential/Parallel)

All organizations access the export using the **ECTA Reference Number**.

#### Organization 1: Commercial Bank
**Dashboard**: `/bank/pending-approvals`  
**Search**: Enter `ECTA-SC-2026-00001`

**Bank Reviews**:
- ✅ Sales contract details
- ✅ Letter of Credit (LC) status
- ✅ Payment terms compliance
- ✅ Buyer creditworthiness
- ✅ Amount matches contract

**Bank Actions**:
- ✅ **Approve** → LC confirmed, payment guaranteed
- ❌ **Reject** → LC issues, payment concerns
- ⏸️ **Request Info** → Need additional documents

**Blockchain Update**:
```javascript
await fabricService.invokeChaincode('UpdateApprovalStatus', {
  referenceNumber: 'ECTA-SC-2026-00001',
  organization: 'COMMERCIAL_BANK',
  status: 'APPROVED',
  approvedBy: bankOfficerId,
  approvedAt: timestamp,
  lcNumber: 'LC-2026-12345',
  lcAmount: 1350.00,
  lcCurrency: 'USD',
  notes: 'LC confirmed and validated'
});
```

---

#### Organization 2: National Bank of Ethiopia (NBE)
**Dashboard**: `/nbe/fx-approvals`  
**Search**: Enter `ECTA-SC-2026-00001`

**NBE Reviews**:
- ✅ Foreign exchange (FX) requirements
- ✅ Export value and currency
- ✅ Repatriation requirements
- ✅ Compliance with FX regulations
- ✅ Bank LC confirmation

**NBE Actions**:
- ✅ **Approve** → FX allocation approved
- ❌ **Reject** → FX issues
- ⏸️ **Hold** → Pending investigation

**Blockchain Update**:
```javascript
await fabricService.invokeChaincode('UpdateApprovalStatus', {
  referenceNumber: 'ECTA-SC-2026-00001',
  organization: 'NBE',
  status: 'APPROVED',
  approvedBy: nbeOfficerId,
  approvedAt: timestamp,
  fxAllocation: 1350.00,
  fxRate: 55.50,
  repatriationDeadline: '2026-09-15',
  notes: 'FX approved, repatriation required within 90 days'
});
```

---

#### Organization 3: Customs Authority
**Dashboard**: `/customs/clearance-requests`  
**Search**: Enter `ECTA-SC-2026-00001`

**Customs Reviews**:
- ✅ Export declaration (SAD)
- ✅ Coffee quantity and type
- ✅ Quality certificates
- ✅ Origin certificates
- ✅ Duty and tax clearance
- ✅ Phytosanitary compliance

**Customs Actions**:
- ✅ **Approve** → Clearance granted, SAD issued
- ❌ **Reject** → Documentation issues
- 🔍 **Inspect** → Physical inspection required

**Blockchain Update**:
```javascript
await fabricService.invokeChaincode('UpdateApprovalStatus', {
  referenceNumber: 'ECTA-SC-2026-00001',
  organization: 'CUSTOMS',
  status: 'APPROVED',
  approvedBy: customsOfficerId,
  approvedAt: timestamp,
  sadNumber: 'SAD-2026-98765',
  dutyPaid: 15000.00,
  taxClearance: 'TC-2026-54321',
  inspectionStatus: 'PASSED',
  notes: 'Customs clearance granted, goods released'
});
```

---

#### Organization 4: Shipping Line
**Dashboard**: `/shipping/booking-requests`  
**Search**: Enter `ECTA-SC-2026-00001`

**Shipping Reviews**:
- ✅ Booking request
- ✅ Container requirements
- ✅ Port of loading/discharge
- ✅ Delivery schedule
- ✅ Customs clearance status

**Shipping Actions**:
- ✅ **Approve** → Booking confirmed, B/L issued
- ❌ **Reject** → Capacity issues
- 📅 **Reschedule** → Different sailing date

**Blockchain Update**:
```javascript
await fabricService.invokeChaincode('UpdateApprovalStatus', {
  referenceNumber: 'ECTA-SC-2026-00001',
  organization: 'SHIPPING',
  status: 'APPROVED',
  approvedBy: shippingOfficerId,
  approvedAt: timestamp,
  bookingNumber: 'BK-2026-45678',
  billOfLadingNumber: 'BL-2026-11223',
  vesselName: 'MV Coffee Express',
  containerNumber: 'CONT-2026-99887',
  departureDate: '2026-06-10',
  arrivalDate: '2026-06-25',
  notes: 'Booking confirmed, container allocated'
});
```

---

### Phase 5: Export Completion

#### All Approvals Complete
**Blockchain Status**:
```json
{
  "referenceNumber": "ECTA-SC-2026-00001",
  "approvalStatus": {
    "ecta": { "status": "APPROVED", "approvedAt": "2026-03-27T10:30:00Z" },
    "bank": { "status": "APPROVED", "approvedAt": "2026-04-01T14:20:00Z" },
    "nbe": { "status": "APPROVED", "approvedAt": "2026-04-02T09:15:00Z" },
    "customs": { "status": "APPROVED", "approvedAt": "2026-06-05T11:45:00Z" },
    "shipping": { "status": "APPROVED", "approvedAt": "2026-06-08T16:30:00Z" }
  },
  "status": "EXPORT_APPROVED",
  "completedAt": "2026-06-08T16:30:00Z"
}
```

**Exporter Dashboard Shows**:
```
✅ Export Approved - All Organizations
Reference Number: ECTA-SC-2026-00001

Approvals:
✅ ECTA - Contract Registered
✅ Commercial Bank - LC Confirmed (LC-2026-12345)
✅ NBE - FX Approved (Repatriate by 2026-09-15)
✅ Customs - Clearance Granted (SAD-2026-98765)
✅ Shipping - Booking Confirmed (BL-2026-11223)

Vessel: MV Coffee Express
Departure: 2026-06-10
Arrival: 2026-06-25

[Download Export Package] [Track Shipment]
```

---

## Reference Number Usage

### For Exporter
- Track approval status across all organizations
- Download certificates and documents
- Monitor shipment progress
- Provide to buyer for tracking

### For Organizations
- **Search**: Enter reference number to find export
- **View**: See complete contract and approval history
- **Approve**: Add approval with organization-specific data
- **Track**: Monitor other organizations' approvals

### For Buyer
- Track export progress
- Verify approvals
- Prepare for shipment receipt
- Coordinate with shipping line

---

## Database Schema Updates

### Add to `contract_drafts` table:
```sql
ALTER TABLE contract_drafts ADD COLUMN IF NOT EXISTS ecta_reference_number VARCHAR(50) UNIQUE;
ALTER TABLE contract_drafts ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP;
ALTER TABLE contract_drafts ADD COLUMN IF NOT EXISTS registered_by UUID;
ALTER TABLE contract_drafts ADD COLUMN IF NOT EXISTS network_submission_id UUID;

CREATE INDEX idx_contract_drafts_reference ON contract_drafts(ecta_reference_number);
```

### Create `network_submissions` table:
```sql
CREATE TABLE IF NOT EXISTS network_submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(50) NOT NULL UNIQUE,
    contract_id UUID NOT NULL REFERENCES contract_drafts(draft_id),
    exporter_id UUID NOT NULL REFERENCES exporter_profiles(exporter_id),
    
    -- Submission details
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_by UUID NOT NULL,
    
    -- Documents
    documents JSONB,
    
    -- Approval tracking
    ecta_status VARCHAR(50) DEFAULT 'APPROVED',
    ecta_approved_at TIMESTAMP,
    ecta_approved_by UUID,
    
    bank_status VARCHAR(50) DEFAULT 'PENDING',
    bank_approved_at TIMESTAMP,
    bank_approved_by UUID,
    bank_lc_number VARCHAR(100),
    
    nbe_status VARCHAR(50) DEFAULT 'PENDING',
    nbe_approved_at TIMESTAMP,
    nbe_approved_by UUID,
    nbe_fx_allocation DECIMAL(15,2),
    
    customs_status VARCHAR(50) DEFAULT 'PENDING',
    customs_approved_at TIMESTAMP,
    customs_approved_by UUID,
    customs_sad_number VARCHAR(100),
    
    shipping_status VARCHAR(50) DEFAULT 'PENDING',
    shipping_approved_at TIMESTAMP,
    shipping_approved_by UUID,
    shipping_bl_number VARCHAR(100),
    
    -- Overall status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_network_submissions_reference ON network_submissions(reference_number);
CREATE INDEX idx_network_submissions_exporter ON network_submissions(exporter_id);
CREATE INDEX idx_network_submissions_status ON network_submissions(status);
```

---

## API Endpoints

### ECTA Registration
```javascript
// POST /api/ecta/contracts/:draftId/register
router.post('/contracts/:draftId/register', authenticateToken, requireRole('ecta'), async (req, res) => {
  const { draftId } = req.params;
  const { notes } = req.body;
  
  // Generate reference number
  const referenceNumber = await generateReferenceNumber('sales_contract');
  
  // Register on blockchain
  await fabricService.invokeChaincode('RegisterSalesContract', {
    referenceNumber,
    contractId: draftId,
    // ... contract details
  });
  
  // Update database
  await postgresService.query(
    `UPDATE contract_drafts 
     SET status = 'REGISTERED', 
         ecta_reference_number = $1,
         registered_at = CURRENT_TIMESTAMP,
         registered_by = $2
     WHERE draft_id = $3`,
    [referenceNumber, req.user.id, draftId]
  );
  
  res.json({ success: true, referenceNumber });
});
```

### Network Submission
```javascript
// POST /api/esw/submit
router.post('/submit', authenticateToken, requireRole('exporter'), async (req, res) => {
  const { referenceNumber, documents } = req.body;
  
  // Create Network Submission
  const result = await postgresService.query(
    `INSERT INTO network_submissions (reference_number, contract_id, exporter_id, documents, submitted_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING submission_id`,
    [referenceNumber, contractId, exporterId, JSON.stringify(documents), req.user.id]
  );
  
  // Submit to blockchain
  await fabricService.invokeChaincode('SubmitToNetwork', {
    referenceNumber,
    submissionId: result.rows[0].submission_id,
    // ... details
  });
  
  res.json({ success: true, submissionId: result.rows[0].submission_id });
});
```

### Organization Approval
```javascript
// POST /api/:org/approvals/:referenceNumber
router.post('/approvals/:referenceNumber', authenticateToken, async (req, res) => {
  const { referenceNumber } = req.params;
  const { status, notes, ...orgData } = req.body;
  const org = req.user.organization; // BANK, NBE, CUSTOMS, SHIPPING
  
  // Update blockchain
  await fabricService.invokeChaincode('UpdateApprovalStatus', {
    referenceNumber,
    organization: org,
    status,
    approvedBy: req.user.id,
    ...orgData
  });
  
  // Update database
  await postgresService.query(
    `UPDATE network_submissions 
     SET ${org.toLowerCase()}_status = $1,
         ${org.toLowerCase()}_approved_at = CURRENT_TIMESTAMP,
         ${org.toLowerCase()}_approved_by = $2
     WHERE reference_number = $3`,
    [status, req.user.id, referenceNumber]
  );
  
  res.json({ success: true });
});
```

---

## Complete Workflow Summary

```
1. Exporter ↔ Buyer: Negotiate contract → ACCEPTED
2. Exporter: Request finalization → PENDING_ECTA_REGISTRATION
3. ECTA: Review & Register → Generate ECTA-SC-2026-00001
4. Exporter: Receive reference number → REGISTERED
5. Exporter: Submit to Network (ESW) → SUBMITTED
6. Bank: Review & Approve → LC confirmed
7. NBE: Review & Approve → FX allocated
8. Customs: Review & Approve → SAD issued
9. Shipping: Review & Approve → B/L issued
10. System: All approved → EXPORT_APPROVED
11. Exporter: Download package → Ship coffee ☕
```

---

**Status**: ✅ DESIGN COMPLETE  
**Implementation**: Ready for development  
**Organizations**: ECTA, Bank, NBE, Customs, Shipping  
**Blockchain**: Hyperledger Fabric 2.5  
**Reference Format**: ECTA-SC-{YEAR}-{SEQUENCE}
