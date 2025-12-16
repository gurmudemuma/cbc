# Implementation Checklist - Corrected Coffee Export Workflow

## Status: ✅ Chaincode V2 Created (contract_v2.go)

The corrected chaincode has been created with ALL gaps fixed. This checklist guides you through deploying the changes.

---

## ✅ COMPLETED

### 1. Chaincode V2 Created
**File**: `chaincode/coffee-export/contract_v2.go` (1,212 lines)

**All Gaps Fixed**:
- ✅ **Corrected workflow sequence**: Quality BEFORE FX
- ✅ **Added export license validation**
- ✅ **Split customs**: Export customs (origin) and Import customs (destination)
- ✅ **Added Certificate of Origin** functionality
- ✅ **Added arrival notification**
- ✅ **Added delivery confirmation**
- ✅ **Added payment tracking**
- ✅ **Added FX repatriation**
- ✅ **Added all missing fields**: ECX lot number, warehouse, all customs fields, payment fields
- ✅ **Added all missing states**: 18 status states (vs. 11 before)

**New Workflow**:
```
DRAFT → QUALITY_PENDING → QUALITY_CERTIFIED → FX_PENDING → FX_APPROVED  
→ EXPORT_CUSTOMS_PENDING → EXPORT_CUSTOMS_CLEARED → SHIPMENT_SCHEDULED  
→ SHIPPED → ARRIVED → IMPORT_CUSTOMS_PENDING → IMPORT_CUSTOMS_CLEARED  
→ DELIVERED → PAYMENT_RECEIVED → FX_REPATRIATED → COMPLETED
```

---

## 🔄 TODO: Deployment Steps

### Phase 1: Replace Chaincode (Priority: CRITICAL)

#### Step 1.1: Backup Current Chaincode
```bash
cd /home/gu-da/cbc/chaincode/coffee-export
cp contract.go contract_v1_backup.go
```

#### Step 1.2: Replace with V2
```bash
mv contract_v2.go contract.go
```

#### Step 1.3: Test Build
```bash
cd /home/gu-da/cbc/chaincode/coffee-export
go mod tidy
go build ./...
```

#### Step 1.4: Deploy to Network
```bash
cd /home/gu-da/cbc/network
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang -ccv 2.0 -ccs 2
```

**Note**: Increment `-ccv` (version) and `-ccs` (sequence) for upgrade

---

### Phase 2: Update API Endpoints (Priority: HIGH)

All APIs need updating for new states and functions. Here's what needs to change:

#### 2.1 Update commercialbank API (`api/commercialbank/`)

**New Endpoints Needed**:
- `POST /exports/:id/submit-quality` - Submit for quality certification
- `POST /exports/:id/submit-fx` - Submit for FX approval  
- `POST /exports/:id/submit-export-customs` - Submit to export customs
- Support export license in create export endpoint

**Modified Endpoints**:
- `POST /exports` - Add exportLicenseNumber, ecxLotNumber, warehouseLocation fields

#### 2.2 Update National Bank API (`api/national-bank/`)

**New Endpoints Needed**:
- `POST /exports/:id/confirm-payment` - Confirm payment received
- `POST /exports/:id/confirm-repatriation` - Confirm FX repatriation

**Modified Endpoints**:
- `POST /exports/:id/fx/approve` - Now requires QUALITY_CERTIFIED (not PENDING)
- `GET /exports/pending-fx` - Filter by FX_PENDING (not PENDING)

#### 2.3 Update ECTA API (`api/ncat/`)

**New Endpoints Needed**:
- `POST /exports/:id/origin-certificate` - Issue certificate of origin

**Modified Endpoints**:
- `POST /exports/:id/quality/approve` - Now requires QUALITY_PENDING
- `GET /exports/pending-quality` - Filter by QUALITY_PENDING

#### 2.4 Update Shipping Line API (`api/shipping-line/`)

**New Endpoints Needed**:
- `POST /exports/:id/notify-arrival` - Notify arrival at destination
- `POST /exports/:id/submit-import-customs` - Submit to import customs

**Modified Endpoints**:
- `POST /exports/:id/schedule` - Now requires EXPORT_CUSTOMS_CLEARED (not QUALITY_CERTIFIED)

#### 2.5 Split Custom Authorities API

**Option A**: Update existing `api/custom-authorities/` to handle both
- Add `type` parameter: "export" or "import"

**Option B**: Create two separate APIs
- `api/export-customs/` - Ethiopian customs (before shipment)
- `api/import-customs/` - Destination customs (after arrival)

**Recommended**: Option A for simpler deployment

**New Endpoints**:
- `POST /exports/:id/export-customs/clear` - Clear export customs
- `POST /exports/:id/export-customs/reject` - Reject export customs
- `POST /exports/:id/import-customs/clear` - Clear import customs
- `POST /exports/:id/import-customs/reject` - Reject import customs
- `POST /exports/:id/confirm-delivery` - Confirm delivery (or add to shipping)

---

### Phase 3: Update Frontend (Priority: HIGH)

#### 3.1 Update Status Constants
**File**: Create `frontend/src/constants/exportStatus.js`

```javascript
export const ExportStatus = {
  DRAFT: 'DRAFT',
  QUALITY_PENDING: 'QUALITY_PENDING',
  QUALITY_CERTIFIED: 'QUALITY_CERTIFIED',
  QUALITY_REJECTED: 'QUALITY_REJECTED',
  FX_PENDING: 'FX_PENDING',
  FX_APPROVED: 'FX_APPROVED',
  FX_REJECTED: 'FX_REJECTED',
  EXPORT_CUSTOMS_PENDING: 'EXPORT_CUSTOMS_PENDING',
  EXPORT_CUSTOMS_CLEARED: 'EXPORT_CUSTOMS_CLEARED',
  EXPORT_CUSTOMS_REJECTED: 'EXPORT_CUSTOMS_REJECTED',
  SHIPMENT_SCHEDULED: 'SHIPMENT_SCHEDULED',
  SHIPPED: 'SHIPPED',
  ARRIVED: 'ARRIVED',
  IMPORT_CUSTOMS_PENDING: 'IMPORT_CUSTOMS_PENDING',
  IMPORT_CUSTOMS_CLEARED: 'IMPORT_CUSTOMS_CLEARED',
  IMPORT_CUSTOMS_REJECTED: 'IMPORT_CUSTOMS_REJECTED',
  DELIVERED: 'DELIVERED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  FX_REPATRIATED: 'FX_REPATRIATED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const StatusLabels = {
  [ExportStatus.DRAFT]: 'Draft',
  [ExportStatus.QUALITY_PENDING]: 'Quality Pending',
  [ExportStatus.QUALITY_CERTIFIED]: 'Quality Certified',
  // ... add all labels
};

export const StatusColors = {
  [ExportStatus.DRAFT]: 'default',
  [ExportStatus.QUALITY_PENDING]: 'warning',
  [ExportStatus.QUALITY_CERTIFIED]: 'success',
  // ... add all colors
};
```

#### 3.2 Update Export Management Page
**Files to Update**:
- `frontend/src/pages/ExportManagement.jsx`
- `frontend/src/pages/ExportDetails.jsx`

**Changes**:
- Add export license field to create form
- Add ECX lot number field (optional)
- Add warehouse location field (optional)
- Add "Submit for Quality" button
- Add "Submit for FX" button (after quality certified)
- Add "Submit to Export Customs" button (after FX approved)
- Update status badges to show all new states
- Add workflow timeline/stepper component

#### 3.3 Update Dashboard Quick Actions
**File**: `frontend/src/pages/Dashboard.jsx`

Already updated in previous work, but verify workflow sequence:
- Exporter: Submit for Quality → Submit for FX → Submit to Customs
- Bank: Approve FX (only after quality) → Confirm Payment → Confirm Repatriation
- ECTA: Certify Quality → Issue Origin Certificate
- Shipping: Schedule (only after export customs) → Confirm Shipment → Notify Arrival
- Customs: Clear Export Customs (new) + Clear Import Customs (new)

#### 3.4 Update Layout Navigation
**File**: `frontend/src/components/Layout.jsx`

Already updated, but consider adding:
- Separate "Export Customs" and "Import Customs" menu items
- Or single "Customs" item with tabs inside the page

#### 3.5 Create New Pages (if needed)
- Certificate of Origin management page
- Payment tracking page
- FX repatriation dashboard

---

### Phase 4: Database Migration (Priority: MEDIUM)

#### 4.1 Create Migration Script
**File**: `scripts/migrate-export-statuses.js`

```javascript
// Pseudocode for status migration
const statusMigration = {
  'PENDING': 'QUALITY_PENDING', // Old PENDING becomes QUALITY_PENDING
  'CUSTOMS_CLEARED': 'EXPORT_CUSTOMS_CLEARED', // Assume origin customs
  // Map other statuses as appropriate
};

// Script to update off-chain data (if any)
// Blockchain data migrates naturally with chaincode upgrade
```

#### 4.2 Handle Legacy Data
- Old exports may have old status values
- Frontend should handle gracefully (show as-is or map to new)
- Consider data cutover date

---

### Phase 5: Testing (Priority: CRITICAL)

#### 5.1 Unit Tests
```bash
# Test chaincode functions
cd /home/gu-da/cbc/chaincode/coffee-export
go test ./...
```

#### 5.2 Integration Tests
- Test complete workflow end-to-end
- Test each status transition
- Test rejection scenarios
- Test cancellation at each stage

#### 5.3 API Tests
```bash
cd /home/gu-da/cbc/api
npm run test:all
```

#### 5.4 E2E Tests
- Manual testing through UI
- Automated E2E tests (Cypress/Playwright)
- Test with different org roles

---

### Phase 6: Documentation (Priority: MEDIUM)

#### 6.1 Update WORKFLOW_MAPPING.md
- Reflect new workflow order
- Update status descriptions
- Update org responsibilities

#### 6.2 Update README.md
- Document new API endpoints
- Update deployment instructions
- Add migration guide

#### 6.3 Create API Documentation
- OpenAPI/Swagger specs for new endpoints
- Postman collections
- Example requests/responses

---

## Quick Start Commands

### For Full Deployment:

```bash
# 1. Stop current network
cd /home/gu-da/cbc
npm run network:down

# 2. Replace chaincode
cd chaincode/coffee-export
cp contract.go contract_v1_backup.go
mv contract_v2.go contract.go
go mod tidy && go build ./...

# 3. Bring up network with new chaincode
cd ../../network
./network.sh up
./network.sh createChannel -c coffeechannel
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang -ccv 2.0 -ccs 2
./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl golang -ccv 1.0 -ccs 1

# 4. Test chaincode
# Create test export with new fields
# Test new workflow transitions

# 5. Update and restart APIs
cd ../api
# Update code for each service
npm run build:all
npm run dev:all

# 6. Update and test frontend
cd ../frontend
# Update code
npm run dev
```

---

## Risk Mitigation

### Backward Compatibility
- V2 chaincode has different function signatures (added parameters)
- Old API calls will fail until APIs updated
- **Recommendation**: Deploy all layers together (chaincode + APIs + frontend)

### Data Migration
- Blockchain state naturally migrates with chaincode upgrade
- Off-chain databases need manual migration
- Export existing data before upgrade

### Rollback Plan
If issues arise:
```bash
# Restore old chaincode
cd /home/gu-da/cbc/chaincode/coffee-export
cp contract_v1_backup.go contract.go

# Redeploy old version
cd ../../network
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang -ccv 1.1 -ccs 1
```

---

## Success Criteria

- [ ] Chaincode builds without errors
- [ ] All unit tests pass
- [ ] Network deploys successfully
- [ ] APIs updated and tested
- [ ] Frontend reflects new workflow
- [ ] Complete export workflow test passes
- [ ] No data loss from migration
- [ ] Documentation updated
- [ ] Team trained on new workflow

---

## Estimated Timeline

- **Phase 1** (Chaincode): 1-2 hours
- **Phase 2** (APIs): 8-12 hours (all 5 services)
- **Phase 3** (Frontend): 6-8 hours
- **Phase 4** (Migration): 2-3 hours
- **Phase 5** (Testing): 8-12 hours
- **Phase 6** (Documentation): 4-6 hours

**Total**: 29-43 hours (~4-6 working days)

---

## Support

For questions or issues during implementation:
1. Review WORKFLOW_GAP_ANALYSIS.md for context
2. Check DOCUMENT_TYPES.md for document requirements
3. Refer to chaincode comments in contract_v2.go
4. Test incrementally - don't deploy everything at once

**Next Step**: Deploy Phase 1 (Chaincode) to test new workflow
