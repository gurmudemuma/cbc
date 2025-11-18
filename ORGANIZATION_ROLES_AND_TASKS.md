# Organization Roles and Tasks - Coffee Export Workflow

**Date:** November 7, 2025  
**Status:** ✅ **VERIFIED**

---

## 🎯 Coffee Export Workflow Sequence

```
1. Exporter Portal → Creates export request
2. ECX → Verifies coffee lot and warehouse receipt
3. ECTA → Issues licenses, quality certificates, and contract approval
4. Commercial Bank → Verifies documents and submits to NBE
5. National Bank → Approves foreign exchange (FX)
6. Customs → Clears export for shipment
7. Shipping Line → Schedules and ships coffee
```

---

## 📋 Organization Roles & Tasks

### 1. **Exporter Portal** (External Entity - SDK)
**Port:** 3007  
**Type:** External  
**Users:** Coffee exporters (external companies)

**Tasks:**
- ✅ Create export requests
- ✅ Upload required documents
- ✅ Track export status
- ✅ View own exports only
- ❌ Cannot approve or modify others' exports

**Navigation:**
- My Exports
  - Draft
  - Submitted
  - In Progress
  - Completed
- Create Export
- Documents

**Workflow Position:** **Step 1** - Initiates the export process

---

### 2. **ECX** (Ethiopian Commodity Exchange)
**Port:** 3006  
**Type:** Consortium Member  
**Users:** ECX officers

**Tasks:**
- ✅ Verify coffee lot numbers
- ✅ Verify warehouse receipt numbers
- ✅ Confirm coffee quality from warehouse
- ✅ Create blockchain record for verified lots
- ✅ Approve/reject lot verification
- ❌ Cannot issue quality certificates (that's ECTA's role)

**Navigation:**
- All Exports
  - Pending Verification
  - Verified
  - Rejected
- Lot Verification
- Warehouse Reports
- Users

**Workflow Position:** **Step 2** - First verification after export creation

---

### 3. **ECTA** (Ethiopian Coffee & Tea Authority)
**Port:** 3003  
**Type:** Consortium Member  
**Users:** ECTA officers, quality inspectors

**Tasks:**
- ✅ Issue export licenses
- ✅ Conduct quality inspections
- ✅ Issue quality certificates
- ✅ Verify origin certificates
- ✅ Approve export contracts
- ✅ Reject exports that don't meet standards

**Navigation:**
- All Exports
  - ECX Verified (ready for ECTA)
  - Pending License
  - Pending Quality Certification
  - Pending Contract Approval
  - Certified
  - Rejected
- Quality Reports
- License Management
- Users

**Workflow Position:** **Step 3** - Primary regulator (license, quality, origin, contract)

---

### 4. **Commercial Bank** (Consortium Member)
**Port:** 3001  
**Type:** Consortium Member  
**Users:** Bank officers, FX managers

**Tasks:**
- ✅ Review export documents
- ✅ Verify banking information
- ✅ Verify exporter credentials
- ✅ Submit to NBE for FX approval
- ✅ Track FX approval status
- ✅ Manage banking operations

**Navigation:**
- Banking Operations
  - Document Review
  - FX Submission
  - FX Approved
  - Completed
- All Exports
- Users

**Workflow Position:** **Step 4** - Document verification and FX submission

---

### 5. **National Bank (NBE)** (National Bank of Ethiopia)
**Port:** 3002  
**Type:** Consortium Member  
**Users:** NBE officers, FX managers

**Tasks:**
- ✅ Review FX requests from commercial banks
- ✅ Approve/reject foreign exchange allocation
- ✅ Set FX rates
- ✅ Monitor foreign exchange compliance
- ✅ Track payment confirmations
- ❌ Does NOT issue licenses or quality certificates

**Navigation:**
- All Exports
  - Pending FX Approval
  - FX Approved
  - Banking Pending
  - Banking Approved
  - Rejected
- FX Rates Management
- Compliance Reports
- Users

**Workflow Position:** **Step 5** - Foreign exchange approval only

---

### 6. **Customs** (Ethiopian Customs Commission)
**Port:** 3005  
**Type:** Consortium Member  
**Users:** Customs officers

**Tasks:**
- ✅ Review export clearance requests
- ✅ Verify all required documents
- ✅ Verify ECTA certificates
- ✅ Verify FX approval
- ✅ Issue export clearance
- ✅ Approve/reject customs clearance

**Navigation:**
- All Exports
  - FX Approved (ready for customs)
  - Pending Clearance
  - Cleared
  - Rejected
- Customs Reports
- Clearance History
- Users

**Workflow Position:** **Step 6** - Export clearance and compliance

---

### 7. **Shipping Line**
**Port:** 3004  
**Type:** Consortium Member  
**Users:** Shipping coordinators, logistics managers

**Tasks:**
- ✅ View customs-cleared exports
- ✅ Schedule shipments
- ✅ Assign vessels
- ✅ Track shipping status
- ✅ Confirm delivery
- ✅ Update shipment status

**Navigation:**
- All Exports
  - Customs Cleared (ready to ship)
  - Pending Shipments
  - Scheduled
  - Shipped
  - Delivered
  - Rejected
- Shipment Schedule
- Vessel Management
- Users

**Workflow Position:** **Step 7** - Final step - shipment and delivery

---

## 🔄 Complete Workflow with Status Transitions

```
1. DRAFT
   ↓ (Exporter submits)
2. PENDING
   ↓ (ECX verifies lot)
3. ECX_VERIFIED
   ↓ (ECTA issues license)
4. ECTA_LICENSE_APPROVED
   ↓ (ECTA quality inspection)
5. ECTA_QUALITY_APPROVED
   ↓ (ECTA contract approval)
6. ECTA_CONTRACT_APPROVED
   ↓ (Commercial Bank verifies documents)
7. BANK_DOCUMENT_VERIFIED
   ↓ (Commercial Bank submits to NBE)
8. FX_PENDING
   ↓ (NBE approves FX)
9. FX_APPROVED
   ↓ (Customs reviews)
10. EXPORT_CUSTOMS_PENDING
    ↓ (Customs clears)
11. EXPORT_CUSTOMS_CLEARED
    ↓ (Shipping Line schedules)
12. SHIPMENT_SCHEDULED
    ↓ (Shipping Line ships)
13. SHIPPED
    ↓ (Delivery confirmed)
14. DELIVERED
    ↓ (Payment received)
15. PAYMENT_RECEIVED
    ↓
16. COMPLETED
```

---

## ❌ Common Mistakes to Avoid

### 1. **ECX vs ECTA Confusion**
- ❌ WRONG: ECX issues quality certificates
- ✅ CORRECT: ECX verifies lots, ECTA issues quality certificates

### 2. **Commercial Bank vs NBE**
- ❌ WRONG: Commercial Bank approves FX
- ✅ CORRECT: Commercial Bank submits to NBE, NBE approves FX

### 3. **Exporter Portal Access**
- ❌ WRONG: Exporter Portal can approve exports
- ✅ CORRECT: Exporter Portal can only create and view own exports

### 4. **ECTA Responsibilities**
- ❌ WRONG: ECTA only does quality
- ✅ CORRECT: ECTA handles license, quality, origin, AND contract approval

---

## 📊 Access Control Matrix

| Action | Exporter | ECX | ECTA | Comm Bank | NBE | Customs | Shipping |
|--------|----------|-----|------|-----------|-----|---------|----------|
| Create Export | ✅ Own | ❌ | ❌ | ✅ All | ❌ | ❌ | ❌ |
| Verify Lot | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Issue License | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Quality Cert | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Contract Approval | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify Docs | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Submit FX | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Approve FX | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Customs Clear | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Schedule Ship | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View All | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🎯 Summary

Each organization has a **specific role** in the coffee export workflow:

1. **Exporter Portal** - Creates requests (external)
2. **ECX** - Verifies coffee lots
3. **ECTA** - Regulates (license, quality, contract)
4. **Commercial Bank** - Banking operations
5. **NBE** - FX approval
6. **Customs** - Export clearance
7. **Shipping Line** - Logistics and delivery

**No organization should do another's job!**

---

**Status:** ✅ **ROLES CLEARLY DEFINED**  
**Ready for:** Implementation verification
