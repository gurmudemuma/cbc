# Frontend-Backend Communication Fixes

## Quick Reference Guide for Fixing API Mismatches

This document provides the exact code changes needed to fix all frontend-backend communication issues.

---

## 🔧 CRITICAL FIXES (Must Do)

### 1. Fix Bank Document Verification Endpoint

**File**: `/frontend/src/pages/BankDocumentVerification.jsx`

**Current (Line ~28)**:
```javascript
await apiClient.post(`/bank/exports/${selectedExport.exportId}/approve`, data);
```

**Fix to**:
```javascript
await apiClient.post(`/bank/exports/${selectedExport.exportId}/approve-documents`, data);
```

---

### 2. Fix Customs Clearance Endpoint

**File**: `/frontend/src/pages/CustomsClearance.jsx`

**Current (Line ~77)**:
```javascript
await apiClient.post(`/customs/${selectedExport.exportId}/approve`, data);
```

**Fix to**:
```javascript
await apiClient.post(`/customs/clear`, {
  exportId: selectedExport.exportId,
  clearanceId: data.declarationNumber,
  clearedBy: data.clearedBy
});
```

**Also fix rejection (Line ~93)**:
```javascript
// Current:
await apiClient.post(`/customs/${selectedExport.exportId}/reject`, { category, reason });

// Fix to:
await apiClient.post(`/customs/reject`, {
  exportId: selectedExport.exportId,
  reason: reason,
  rejectedBy: category  // or get from user
});
```

---

### 3. Fix Shipping Schedule Endpoint

**File**: `/frontend/src/pages/ShipmentTracking.jsx`

**Current (Line ~83)**:
```javascript
await apiClient.post(`/shipping/${selectedExport.exportId}/schedule`, data);
```

**Fix to**:
```javascript
await apiClient.post(`/shipments/schedule`, {
  exportId: selectedExport.exportId,
  transportMode: data.transportMode,
  transportIdentifier: data.transportIdentifier,
  departureDate: data.departureDate,
  arrivalDate: data.estimatedArrivalDate,  // Note: field name change
  notes: data.notes
});
```

**Note**: Shipping rejection endpoint doesn't exist yet - needs backend implementation first.

---

## ⚠️ FIELD NAME FIXES (Should Do)

### 4. Fix ECX Form Field Names

**File**: `/frontend/src/components/forms/ECXApprovalForm.jsx`

**Current `handleApprove` function sends**:
```javascript
onApprove({
  ecxLotNumber: formData.ecxLotNumber.trim(),
  warehouseReceiptNumber: formData.warehouseReceiptNumber.trim(),
  warehouseLocation: formData.warehouseLocation.trim(),
  verificationNotes: formData.verificationNotes.trim(),
});
```

**Fix to**:
```javascript
onApprove({
  lotNumber: formData.ecxLotNumber.trim(),  // Changed key
  warehouseReceiptNumber: formData.warehouseReceiptNumber.trim(),
  warehouseLocation: formData.warehouseLocation.trim(),
  notes: formData.verificationNotes.trim(),  // Changed key
});
```

**Also update the API call in ECXVerification.jsx**:
```javascript
// Change from /approve to /verify for lot details
await apiClient.post(`/ecx/exports/${selectedExport.exportId}/verify`, data);
```

---

### 5. Fix ECTA License Form Field Names

**File**: `/frontend/src/components/forms/ECTALicenseForm.jsx`

**Current `handleApprove` function sends**:
```javascript
onApprove({
  validatedLicenseNumber: formData.validatedLicenseNumber.trim(),
  licenseExpiryDate: formData.licenseExpiryDate,
  exporterTIN: formData.exporterTIN.trim(),
  validationNotes: formData.validationNotes.trim(),
});
```

**Fix to**:
```javascript
onApprove({
  licenseNumber: formData.validatedLicenseNumber.trim(),  // Changed key
  notes: formData.validationNotes.trim(),  // Changed key
  // Backend doesn't use: licenseExpiryDate, exporterTIN
});
```

---

### 6. Fix ECTA Contract Form Field Names

**File**: `/frontend/src/components/forms/ECTAContractForm.jsx`

**Current `handleApprove` function sends**:
```javascript
onApprove({
  contractNumber: formData.contractNumber.trim(),
  originCertNumber: formData.originCertNumber.trim(),
  buyerName: formData.buyerName.trim(),
  buyerCountry: formData.buyerCountry.trim(),
  paymentTerms: formData.paymentTerms.trim(),
  notes: formData.notes.trim(),
});
```

**Fix to**:
```javascript
onApprove({
  contractNumber: formData.contractNumber.trim(),
  originCertificateNumber: formData.originCertNumber.trim(),  // Changed key
  notes: formData.notes.trim(),
  // Backend doesn't use: buyerName, buyerCountry, paymentTerms
});
```

---

### 7. Fix NBE FX Form Field Names

**File**: `/frontend/src/components/forms/NBEFXApprovalForm.jsx`

**Current `handleApprove` function sends**:
```javascript
onApprove({
  approvedFXAmount: parseFloat(formData.approvedFXAmount),
  fxRate: parseFloat(formData.fxRate),
  fxAllocationNumber: formData.fxAllocationNumber.trim(),
  approvalNotes: formData.approvalNotes.trim(),
  etbEquivalent: (parseFloat(formData.approvedFXAmount) * parseFloat(formData.fxRate)).toFixed(2),
});
```

**Fix to**:
```javascript
onApprove({
  fxApprovalId: formData.fxAllocationNumber.trim(),  // Changed key
  notes: formData.approvalNotes.trim(),  // Changed key
  // Backend doesn't use: approvedFXAmount, fxRate, etbEquivalent
});
```

---

## 📋 COMPLETE FIX CHECKLIST

### Files to Update:

- [ ] `/frontend/src/pages/BankDocumentVerification.jsx` - Fix endpoint
- [ ] `/frontend/src/pages/CustomsClearance.jsx` - Fix endpoint and data structure
- [ ] `/frontend/src/pages/ShipmentTracking.jsx` - Fix endpoint and data structure
- [ ] `/frontend/src/components/forms/ECXApprovalForm.jsx` - Fix field names
- [ ] `/frontend/src/pages/ECXVerification.jsx` - Change to /verify endpoint
- [ ] `/frontend/src/components/forms/ECTALicenseForm.jsx` - Fix field names
- [ ] `/frontend/src/components/forms/ECTAContractForm.jsx` - Fix field names
- [ ] `/frontend/src/components/forms/NBEFXApprovalForm.jsx` - Fix field names

### Backend Endpoints to Create:

- [ ] `/api/shipping-line/src/controllers/shipment.controller.ts` - Add `rejectShipment` method
- [ ] `/api/shipping-line/src/routes/shipment.routes.ts` - Add rejection route

---

## 🧪 TESTING AFTER FIXES

### Test Each Organization:

1. **ECX**:
   ```bash
   # Test lot verification
   curl -X POST http://localhost:3001/ecx/exports/EXP001/verify \
     -H "Content-Type: application/json" \
     -d '{"lotNumber":"LOT001","warehouseReceiptNumber":"WR001","warehouseLocation":"Addis"}'
   ```

2. **ECTA License**:
   ```bash
   curl -X POST http://localhost:3002/ecta/license/EXP001/approve \
     -H "Content-Type: application/json" \
     -d '{"licenseNumber":"LIC001","notes":"Approved"}'
   ```

3. **Bank**:
   ```bash
   curl -X POST http://localhost:3003/bank/exports/EXP001/approve-documents \
     -H "Content-Type: application/json" \
     -d '{"approvedBy":"banker1"}'
   ```

4. **Customs**:
   ```bash
   curl -X POST http://localhost:3005/customs/clear \
     -H "Content-Type: application/json" \
     -d '{"exportId":"EXP001","clearanceId":"CUST001","clearedBy":"officer1"}'
   ```

5. **Shipping**:
   ```bash
   curl -X POST http://localhost:3006/shipments/schedule \
     -H "Content-Type: application/json" \
     -d '{"exportId":"EXP001","transportMode":"SEA","transportIdentifier":"SHIP001","departureDate":"2024-01-01","arrivalDate":"2024-02-01"}'
   ```

---

## 🎯 PRIORITY ORDER

1. **First** (30 min): Fix critical endpoint mismatches (Bank, Customs, Shipping)
2. **Second** (30 min): Fix field name mismatches (ECX, ECTA, NBE)
3. **Third** (30 min): Test all endpoints
4. **Fourth** (1 hour): Create missing backend endpoints (Shipping rejection)

**Total Time**: ~2.5 hours

---

## ✅ VERIFICATION

After all fixes, verify:
- [ ] No 404 errors in browser console
- [ ] No 400 "missing field" errors in backend logs
- [ ] All forms submit successfully
- [ ] Data appears correctly in blockchain
- [ ] Workflow progresses through all stages
