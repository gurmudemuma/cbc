# Frontend-Backend Communication Review

## 🔍 Complete Analysis of Frontend Forms vs Backend APIs

This document reviews all frontend forms and their corresponding backend API endpoints to ensure complete compatibility.

---

## ✅ MATCHING STATUS SUMMARY

| Organization | Frontend Form | Backend Endpoint | Data Match | Status |
|--------------|---------------|------------------|------------|--------|
| **ECX** | ECXApprovalForm | `/ecx/:exportId/approve` | ⚠️ Partial | Needs Update |
| **ECTA License** | ECTALicenseForm | `/ecta/license/:exportId/approve` | ⚠️ Partial | Needs Update |
| **ECTA Quality** | ECTAQualityForm | `/ecta/quality/:exportId/approve` | ⚠️ Partial | Needs Update |
| **ECTA Contract** | ECTAContractForm | `/ecta/contract/:exportId/approve` | ⚠️ Partial | Needs Update |
| **Bank** | BankDocumentVerificationForm | `/bank/exports/:exportId/approve` | ❌ Missing | Needs Creation |
| **NBE** | NBEFXApprovalForm | `/nbe/fx/:exportId/approve` | ✅ Match | OK |
| **Customs** | CustomsClearanceForm | `/customs/:exportId/approve` | ⚠️ Partial | Needs Update |
| **Shipping** | ShipmentScheduleForm | `/shipping/:exportId/schedule` | ❌ Missing | Needs Creation |

---

## 📋 DETAILED ANALYSIS BY ORGANIZATION

### 1. **ECX - Lot Verification**

#### Frontend Form (`ECXApprovalForm.jsx`)
**Sends**:
```javascript
{
  ecxLotNumber: string,
  warehouseReceiptNumber: string,
  warehouseLocation: string,
  verificationNotes: string
}
```

#### Backend API (`/api/ecx/src/controllers/lot-verification.controller.ts`)
**Route**: `POST /ecx/:exportId/approve`
**Expects**:
```typescript
{
  approvedBy?: string,
  notes?: string
}
```

**Also has**: `POST /ecx/:exportId/verify`
**Expects**:
```typescript
{
  lotNumber: string,
  warehouseReceiptNumber: string,
  warehouseLocation?: string,
  verifiedBy?: string,
  notes?: string
}
```

#### ⚠️ **MISMATCH IDENTIFIED**

**Problem**: Frontend form sends lot details, but backend `/approve` endpoint doesn't expect them. Backend has separate `/verify` endpoint for lot details.

**Solution Options**:
1. **Option A** (Recommended): Frontend should call TWO endpoints:
   - First: `POST /ecx/:exportId/verify` with lot details
   - Then: `POST /ecx/:exportId/approve` for final approval

2. **Option B**: Update backend `/approve` to accept lot details

**Recommended Fix**: Update frontend to use `/verify` endpoint:
```javascript
// In ECXApprovalForm, change API call:
await apiClient.post(`/ecx/exports/${exportId}/verify`, {
  lotNumber: data.ecxLotNumber,
  warehouseReceiptNumber: data.warehouseReceiptNumber,
  warehouseLocation: data.warehouseLocation,
  notes: data.verificationNotes
});
```

---

### 2. **ECTA License Approval**

#### Frontend Form (`ECTALicenseForm.jsx`)
**Sends**:
```javascript
{
  validatedLicenseNumber: string,
  licenseExpiryDate: string,
  exporterTIN: string,
  validationNotes: string
}
```

#### Backend API (`/api/ecta/src/controllers/license.controller.ts`)
**Route**: `POST /ecta/license/:exportId/approve`
**Expects**:
```typescript
{
  licenseNumber: string,  // REQUIRED
  approvedBy?: string,
  notes?: string
}
```

#### ⚠️ **MISMATCH IDENTIFIED**

**Problem**: 
- Frontend sends `validatedLicenseNumber` but backend expects `licenseNumber`
- Frontend sends `licenseExpiryDate` and `exporterTIN` but backend doesn't use them
- Backend REQUIRES `licenseNumber`

**Recommended Fix**: Update frontend to match backend:
```javascript
// In ECTALicenseForm, change onApprove:
onApprove({
  licenseNumber: formData.validatedLicenseNumber.trim(),  // Changed key name
  // licenseExpiryDate: formData.licenseExpiryDate,  // Backend doesn't use
  // exporterTIN: formData.exporterTIN.trim(),  // Backend doesn't use
  notes: formData.validationNotes.trim(),
});
```

**OR** Update backend to accept additional fields for better tracking.

---

### 3. **ECTA Quality Certification**

#### Frontend Form (`ECTAQualityForm.jsx`)
**Sends**:
```javascript
{
  qualityGrade: string,
  qualityCertNumber: string,
  moistureContent: number,
  defectCount: number,
  cupScore: number,
  inspectionNotes: string,
  documents: File[]
}
```

#### Backend API (`/api/ecta/src/controllers/quality.controller.ts`)
**Route**: `POST /ecta/quality/:exportId/approve` (via issueQualityCertificate)
**Expects**:
```typescript
{
  qualityGrade: string,
  certifiedBy?: string,
  documentCIDs?: string[],
  originCertificateNumber?: string
}
```

#### ⚠️ **MISMATCH IDENTIFIED**

**Problem**:
- Frontend sends detailed quality metrics (moisture, defects, cup score) but backend doesn't accept them
- Frontend sends `qualityCertNumber` but backend doesn't use it
- Backend expects `documentCIDs` (IPFS hashes) but frontend sends File objects

**Recommended Fix**: 
1. **Update backend** to accept quality metrics:
```typescript
{
  qualityGrade: string,
  qualityCertNumber: string,
  moistureContent: number,
  defectCount: number,
  cupScore: number,
  certifiedBy?: string,
  notes?: string,
  documentCIDs?: string[]
}
```

2. **OR** Update frontend to only send what backend accepts

---

### 4. **ECTA Contract Approval**

#### Frontend Form (`ECTAContractForm.jsx`)
**Sends**:
```javascript
{
  contractNumber: string,
  originCertNumber: string,
  buyerName: string,
  buyerCountry: string,
  paymentTerms: string,
  notes: string
}
```

#### Backend API (`/api/ecta/src/controllers/contract.controller.ts`)
**Route**: `POST /ecta/contract/:exportId/approve`
**Expects**:
```typescript
{
  contractNumber: string,  // REQUIRED
  originCertificateNumber: string,  // REQUIRED
  approvedBy?: string,
  notes?: string
}
```

#### ⚠️ **MISMATCH IDENTIFIED**

**Problem**:
- Frontend sends `originCertNumber` but backend expects `originCertificateNumber`
- Frontend sends `buyerName`, `buyerCountry`, `paymentTerms` but backend doesn't use them

**Recommended Fix**: Update frontend to match backend:
```javascript
onApprove({
  contractNumber: formData.contractNumber.trim(),
  originCertificateNumber: formData.originCertNumber.trim(),  // Changed key name
  notes: formData.notes.trim(),
  // Remove: buyerName, buyerCountry, paymentTerms (or update backend to accept)
});
```

---

### 5. **Bank Document Verification**

#### Frontend Form (`BankDocumentVerificationForm.jsx`)
**Sends**:
```javascript
{
  verifiedDocuments: {
    ectaLicense: boolean,
    qualityCert: boolean,
    originCert: boolean,
    contract: boolean,
    invoice: boolean,
    packingList: boolean
  }
}
```

#### Backend API
**Route**: `POST /bank/exports/:exportId/approve`
**Status**: ❌ **ENDPOINT DOES NOT EXIST**

**Current backend** (`/api/commercial-bank/src/controllers/export.controller.ts`) has:
- `POST /bank/exports/:exportId/approve-documents` - Different endpoint name!

**Expects**:
```typescript
{
  approvedBy?: string,
  notes?: string
}
```

#### ❌ **CRITICAL MISMATCH**

**Problem**:
1. Frontend calls `/bank/exports/:exportId/approve` but backend has `/approve-documents`
2. Frontend sends document checklist but backend doesn't use it

**Recommended Fix**:
1. **Update frontend** to call correct endpoint:
```javascript
await apiClient.post(`/bank/exports/${exportId}/approve-documents`, data);
```

2. **Update backend** to accept document verification data

---

### 6. **NBE FX Approval**

#### Frontend Form (`NBEFXApprovalForm.jsx`)
**Sends**:
```javascript
{
  approvedFXAmount: number,
  fxRate: number,
  fxAllocationNumber: string,
  approvalNotes: string,
  etbEquivalent: number
}
```

#### Backend API (`/api/national-bank/src/controllers/fx.controller.ts`)
**Route**: `POST /nbe/fx/:exportId/approve`
**Expects**:
```typescript
{
  fxApprovalId: string,  // REQUIRED
  approvedBy?: string,
  notes?: string
}
```

#### ⚠️ **MISMATCH IDENTIFIED**

**Problem**:
- Frontend sends `fxAllocationNumber` but backend expects `fxApprovalId`
- Frontend sends `approvedFXAmount`, `fxRate`, `etbEquivalent` but backend doesn't use them
- Backend REQUIRES `fxApprovalId`

**Recommended Fix**: Update frontend to match backend:
```javascript
onApprove({
  fxApprovalId: formData.fxAllocationNumber.trim(),  // Changed key name
  notes: formData.approvalNotes.trim(),
  // Backend doesn't use: approvedFXAmount, fxRate, etbEquivalent
});
```

**OR** Update backend to accept FX details for better tracking.

---

### 7. **Customs Clearance**

#### Frontend Form (`CustomsClearanceForm.jsx`)
**Sends**:
```javascript
{
  declarationNumber: string,
  inspectionNotes: string,
  dutyPaid: string,
  taxPaid: string,
  documents: File[]
}
```

#### Backend API (`/api/custom-authorities/src/controllers/customs.controller.ts`)
**Route**: `POST /customs/clear` (NOT `/customs/:exportId/approve`)
**Expects**:
```typescript
{
  exportId: string,  // In body, not URL!
  clearanceId: string,
  clearedBy?: string
}
```

#### ❌ **CRITICAL MISMATCH**

**Problem**:
1. Frontend calls `/customs/:exportId/approve` but backend has `/customs/clear`
2. Frontend sends `exportId` in URL, backend expects it in body
3. Frontend sends `declarationNumber` but backend expects `clearanceId`
4. Frontend sends duty/tax info but backend doesn't use it

**Recommended Fix**:
1. **Update frontend** API call:
```javascript
await apiClient.post(`/customs/clear`, {
  exportId: selectedExport.exportId,  // In body!
  clearanceId: data.declarationNumber,
  // Backend doesn't use: inspectionNotes, dutyPaid, taxPaid, documents
});
```

2. **OR** Update backend to use RESTful pattern with `:exportId` in URL

---

### 8. **Shipping Schedule**

#### Frontend Form (`ShipmentScheduleForm.jsx`)
**Sends**:
```javascript
{
  transportMode: string,
  transportIdentifier: string,
  departureDate: string,
  estimatedArrivalDate: string,
  portOfLoading: string,
  portOfDischarge: string,
  notes: string
}
```

#### Backend API
**Route**: `POST /shipping/:exportId/schedule`
**Status**: ❌ **ENDPOINT DOES NOT EXIST**

**Current backend** (`/api/shipping-line/src/controllers/shipment.controller.ts`) has:
- `POST /shipments/schedule` - Different pattern!

**Expects**:
```typescript
{
  exportId: string,  // In body
  transportIdentifier: string,
  departureDate: string,
  arrivalDate: string,
  transportMode: string
}
```

#### ❌ **CRITICAL MISMATCH**

**Problem**:
1. Frontend calls `/shipping/:exportId/schedule` but backend has `/shipments/schedule`
2. Frontend sends `exportId` in URL, backend expects it in body
3. Field name mismatch: `estimatedArrivalDate` vs `arrivalDate`
4. Frontend sends port info but backend doesn't use it

**Recommended Fix**:
1. **Update frontend** API call:
```javascript
await apiClient.post(`/shipments/schedule`, {
  exportId: selectedExport.exportId,  // In body!
  transportMode: data.transportMode,
  transportIdentifier: data.transportIdentifier,
  departureDate: data.departureDate,
  arrivalDate: data.estimatedArrivalDate,  // Changed key name
  // Backend doesn't use: portOfLoading, portOfDischarge, notes
});
```

---

## 🔧 REJECTION ENDPOINTS

### Frontend Rejection Dialog (`RejectionDialog.jsx`)
**Sends**:
```javascript
{
  category: string,  // e.g., "ECTA_LICENSE"
  reason: string     // Minimum 10 characters
}
```

### Backend Rejection Endpoints

All rejection endpoints follow similar pattern but with variations:

| Organization | Endpoint | Expects |
|--------------|----------|---------|
| ECX | `POST /ecx/:exportId/reject` | `{ reason, rejectedBy? }` |
| ECTA License | `POST /ecta/license/:exportId/reject` | `{ reason, rejectedBy? }` |
| ECTA Quality | `POST /ecta/quality/:exportId/reject` | `{ reason, rejectedBy? }` |
| ECTA Contract | `POST /ecta/contract/:exportId/reject` | `{ reason, rejectedBy? }` |
| NBE | `POST /nbe/fx/:exportId/reject` | `{ reason, rejectedBy? }` |
| Customs | `POST /customs/reject` | `{ exportId, reason, rejectedBy? }` ⚠️ |
| Shipping | `POST /shipping/:exportId/reject` | ❌ **MISSING** |

#### ⚠️ **ISSUES**:
1. Frontend sends `category` but backends don't use it
2. Customs expects `exportId` in body, not URL
3. Shipping rejection endpoint doesn't exist

**Recommended Fix**: Backends should accept and store `category` for better rejection tracking.

---

## 📊 SUMMARY OF ISSUES

### **Critical Issues** (Must Fix)
1. ❌ **Bank**: Endpoint mismatch `/approve` vs `/approve-documents`
2. ❌ **Customs**: Endpoint mismatch `/customs/:id/approve` vs `/customs/clear`
3. ❌ **Customs**: exportId in URL vs body
4. ❌ **Shipping**: Endpoint doesn't exist `/shipping/:id/schedule`
5. ❌ **Shipping**: Rejection endpoint doesn't exist

### **Field Name Mismatches** (Should Fix)
1. ⚠️ ECX: `ecxLotNumber` vs `lotNumber`
2. ⚠️ ECTA License: `validatedLicenseNumber` vs `licenseNumber`
3. ⚠️ ECTA Contract: `originCertNumber` vs `originCertificateNumber`
4. ⚠️ NBE: `fxAllocationNumber` vs `fxApprovalId`
5. ⚠️ Customs: `declarationNumber` vs `clearanceId`
6. ⚠️ Shipping: `estimatedArrivalDate` vs `arrivalDate`

### **Missing Backend Fields** (Optional Enhancement)
1. ECTA Quality: moisture, defects, cup score not stored
2. ECTA Contract: buyer info, payment terms not stored
3. NBE: FX amount, rate, ETB equivalent not stored
4. Customs: duty, tax, inspection notes not stored
5. Shipping: port info not stored
6. All rejections: category not stored

---

## 🎯 RECOMMENDED FIXES

### **Priority 1: Critical Endpoint Fixes**

#### 1. Update Frontend API Calls

**File**: `/frontend/src/pages/BankDocumentVerification.jsx`
```javascript
// Change from:
await apiClient.post(`/bank/exports/${exportId}/approve`, data);
// To:
await apiClient.post(`/bank/exports/${exportId}/approve-documents`, data);
```

**File**: `/frontend/src/pages/CustomsClearance.jsx`
```javascript
// Change from:
await apiClient.post(`/customs/${exportId}/approve`, data);
// To:
await apiClient.post(`/customs/clear`, {
  exportId: exportId,
  clearanceId: data.declarationNumber
});
```

**File**: `/frontend/src/pages/ShipmentTracking.jsx`
```javascript
// Change from:
await apiClient.post(`/shipping/${exportId}/schedule`, data);
// To:
await apiClient.post(`/shipments/schedule`, {
  exportId: exportId,
  transportMode: data.transportMode,
  transportIdentifier: data.transportIdentifier,
  departureDate: data.departureDate,
  arrivalDate: data.estimatedArrivalDate
});
```

#### 2. Create Missing Backend Endpoints

**File**: `/api/shipping-line/src/controllers/shipment.controller.ts`
```typescript
public rejectShipment = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { exportId } = req.params;
  const { reason, rejectedBy } = req.body;
  // Implementation
};
```

**File**: `/api/shipping-line/src/routes/shipment.routes.ts`
```typescript
router.post('/:exportId/reject', controller.rejectShipment);
```

### **Priority 2: Field Name Alignment**

Update all frontend forms to use backend field names:
- `ecxLotNumber` → `lotNumber`
- `validatedLicenseNumber` → `licenseNumber`
- `originCertNumber` → `originCertificateNumber`
- `fxAllocationNumber` → `fxApprovalId`
- `declarationNumber` → `clearanceId`
- `estimatedArrivalDate` → `arrivalDate`

### **Priority 3: Enhanced Data Capture** (Optional)

Update backends to accept and store additional fields for better tracking and reporting.

---

## ✅ VERIFICATION CHECKLIST

After fixes, verify:
- [ ] All frontend forms can successfully submit
- [ ] All approval endpoints work
- [ ] All rejection endpoints work
- [ ] Data is correctly stored in blockchain
- [ ] No console errors in frontend
- [ ] No 404 or 400 errors in backend logs

---

## 📝 NEXT STEPS

1. **Immediate**: Fix critical endpoint mismatches (Bank, Customs, Shipping)
2. **Short-term**: Align field names across frontend/backend
3. **Long-term**: Enhance backends to capture all form data for better analytics

**Estimated Fix Time**: 2-3 hours for all critical issues
