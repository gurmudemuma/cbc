# Task Assignment Matrix - Coffee Export Workflow

**Date:** November 7, 2025  
**Status:** ✅ **CLEARLY DEFINED**

---

## 🎯 Task Assignment Principle

**Each task is assigned to EXACTLY ONE organization.**  
**No task should be performed by multiple organizations.**

---

## 📋 Complete Task Assignment

### 🔵 STEP 1: Export Creation

| Task | Assigned To | Can Others Do It? |
|------|-------------|-------------------|
| Create export request | **Exporter Portal** | ❌ No (only own exports) |
| Upload initial documents | **Exporter Portal** | ❌ No |
| Enter coffee details | **Exporter Portal** | ❌ No |
| Enter destination info | **Exporter Portal** | ❌ No |
| Submit export request | **Exporter Portal** | ❌ No |

**Status Change:** `DRAFT` → `PENDING`

---

### 🟢 STEP 2: ECX Verification

| Task | Assigned To | Can Others Do It? |
|------|-------------|-------------------|
| Verify ECX lot number | **ECX** | ❌ No |
| Verify warehouse receipt | **ECX** | ❌ No |
| Check warehouse location | **ECX** | ❌ No |
| Confirm coffee quality from warehouse | **ECX** | ❌ No |
| Create blockchain record for lot | **ECX** | ❌ No |
| Approve lot verification | **ECX** | ❌ No |
| Reject lot (if invalid) | **ECX** | ❌ No |

**Status Change:** `PENDING` → `ECX_VERIFIED` or `ECX_REJECTED`

**⚠️ Important:** ECX does NOT issue quality certificates - that's ECTA's job!

---

### 🟡 STEP 3: ECTA Regulation (3 Sub-steps)

#### 3A. License Approval

| Task | Assigned To | Can Others Do It? |
|------|-------------|-------------------|
| Review export license application | **ECTA** | ❌ No |
| Verify exporter credentials | **ECTA** | ❌ No |
| Check export license validity | **ECTA** | ❌ No |
| Issue export license | **ECTA** | ❌ No |
| Approve license | **ECTA** | ❌ No |
| Reject license (if invalid) | **ECTA** | ❌ No |

**Status Change:** `ECX_VERIFIED` → `ECTA_LICENSE_APPROVED` or `LICENSE_REJECTED`

#### 3B. Quality Certification

| Task | Assigned To | Can Others Do It? |
|------|-------------|-------------------|
| Conduct quality inspection | **ECTA** | ❌ No |
| Test coffee samples | **ECTA** | ❌ No |
| Grade coffee quality | **ECTA** | ❌ No |
| Issue quality certificate | **ECTA** | ❌ No |
| Approve quality | **ECTA** | ❌ No |
| Reject quality (if fails) | **ECTA** | ❌ No |

**Status Change:** `ECTA_LICENSE_APPROVED` → `ECTA_QUALITY_APPROVED` or `QUALITY_REJECTED`

#### 3C. Contract Approval

| Task | Assigned To | Can Others Do It? |
|------|-------------|-------------------|
| Review export contract | **ECTA** | ❌ No |
| Verify contract terms | **ECTA** | ❌ No |
| Check buyer information | **ECTA** | ❌ No |
| Verify origin certificate | **ECTA** | ❌ No |
| Approve contract | **ECTA** | ❌ No |
| Reject contract (if invalid) | **ECTA** | ❌ No |

**Status Change:** `ECTA_QUALITY_APPROVED` → `ECTA_CONTRACT_APPROVED` or `CONTRACT_REJECTED`

**⚠️ Important:** ECTA handles ALL regulatory approvals (license, quality, contract)

---

### 🔵 STEP 4: Commercial Bank Operations

| Task | Assigned To | Can Others Do It? |
|------|-------------|-------------------|
| Review export documents | **Commercial Bank** | ❌ No |
| Verify banking information | **Commercial Bank** | ❌ No |
| Verify commercialbank account | **Commercial Bank** | ❌ No |
| Check payment terms | **Commercial Bank** | ❌ No |
| Verify letter of credit (if applicable) | **Commercial Bank** | ❌ No |
| Prepare FX request | **Commercial Bank** | ❌ No |
| Submit FX request to NBE | **Commercial Bank** | ❌ No |

**Status Change:** `ECTA_CONTRACT_APPROVED` → `BANK_DOCUMENT_VERIFIED` → `FX_PENDING`

**⚠️ Important:** Commercial Bank does NOT approve FX - only submits to NBE!

---

### 🟣 STEP 5: NBE Foreign Exchange Approval

| Task | Assigned To | Can Others Do It? |
|------|-------------|-------------------|
| Review FX request from bank | **NBE** | ❌ No |
| Check foreign exchange availability | **NBE** | ❌ No |
| Verify export value | **NBE** | ❌ No |
| Apply FX rate | **NBE** | ❌ No |
| Calculate FX allocation | **NBE** | ❌ No |
| Approve FX allocation | **NBE** | ❌ No |
| Reject FX (if non-compliant) | **NBE** | ❌ No |
| Set/update FX rates | **NBE** | ❌ No |

**Status Change:** `FX_PENDING` → `FX_APPROVED` or `FX_REJECTED`

**⚠️ Important:** ONLY NBE can approve foreign exchange!

---

### 🟠 STEP 6: Customs Clearance

| Task | Assigned To | Can Others Do It? |
|------|-------------|-------------------|
| Review clearance request | **Customs** | ❌ No |
| Verify all documents | **Customs** | ❌ No |
| Check ECTA certificates | **Customs** | ❌ No |
| Verify FX approval | **Customs** | ❌ No |
| Inspect physical goods (if needed) | **Customs** | ❌ No |
| Calculate customs duties | **Customs** | ❌ No |
| Issue export clearance | **Customs** | ❌ No |
| Approve customs clearance | **Customs** | ❌ No |
| Reject clearance (if non-compliant) | **Customs** | ❌ No |

**Status Change:** `FX_APPROVED` → `EXPORT_CUSTOMS_CLEARED` or `EXPORT_CUSTOMS_REJECTED`

**⚠️ Important:** Customs verifies but does NOT issue quality certificates!

---

### 🚢 STEP 7: Shipping & Logistics

| Task | Assigned To | Can Others Do It? |
|------|-------------|-------------------|
| View customs-cleared exports | **Shipping Line** | ❌ No |
| Schedule shipment | **Shipping Line** | ❌ No |
| Assign vessel | **Shipping Line** | ❌ No |
| Book cargo space | **Shipping Line** | ❌ No |
| Generate bill of lading | **Shipping Line** | ❌ No |
| Load cargo | **Shipping Line** | ❌ No |
| Ship coffee | **Shipping Line** | ❌ No |
| Track shipment | **Shipping Line** | ❌ No |
| Confirm delivery | **Shipping Line** | ❌ No |
| Update shipment status | **Shipping Line** | ❌ No |

**Status Change:** `EXPORT_CUSTOMS_CLEARED` → `SHIPMENT_SCHEDULED` → `SHIPPED` → `DELIVERED`

---

## 🚫 Common Mistakes - What NOT to Do

### ❌ ECX Should NOT:
- Issue quality certificates (that's ECTA)
- Approve FX (that's NBE)
- Clear customs (that's Customs)
- Issue licenses (that's ECTA)

### ❌ ECTA Should NOT:
- Verify warehouse receipts (that's ECX)
- Approve FX (that's NBE)
- Clear customs (that's Customs)
- Schedule shipments (that's Shipping Line)

### ❌ Commercial Bank Should NOT:
- Approve FX (that's NBE - bank only submits)
- Issue quality certificates (that's ECTA)
- Clear customs (that's Customs)
- Verify lots (that's ECX)

### ❌ NBE Should NOT:
- Issue licenses (that's ECTA)
- Verify documents (that's Commercial Bank)
- Clear customs (that's Customs)
- Issue quality certificates (that's ECTA)

### ❌ Customs Should NOT:
- Issue quality certificates (that's ECTA)
- Approve FX (that's NBE)
- Schedule shipments (that's Shipping Line)
- Verify lots (that's ECX)

### ❌ Shipping Line Should NOT:
- Clear customs (that's Customs)
- Approve FX (that's NBE)
- Issue certificates (that's ECTA)
- Verify documents (that's Commercial Bank)

### ❌ Exporter Portal Should NOT:
- Approve anything
- View other exporters' data
- Modify status
- Issue certificates

---

## 📊 Task Count by Organization

| Organization | Number of Tasks | Complexity |
|--------------|----------------|------------|
| **Exporter Portal** | 5 | Low |
| **ECX** | 7 | Medium |
| **ECTA** | 18 (6+6+6) | High |
| **Commercial Bank** | 7 | Medium |
| **NBE** | 8 | Medium |
| **Customs** | 9 | Medium |
| **Shipping Line** | 10 | Medium |

**Total Tasks:** 64 distinct tasks

---

## 🔐 Access Control Summary

| Organization | Create | View Own | View All | Approve | Reject |
|--------------|--------|----------|----------|---------|--------|
| **Exporter Portal** | ✅ Own | ✅ | ❌ | ❌ | ❌ |
| **ECX** | ❌ | ✅ | ✅ | ✅ Lots | ✅ Lots |
| **ECTA** | ❌ | ✅ | ✅ | ✅ License/Quality/Contract | ✅ License/Quality/Contract |
| **Commercial Bank** | ✅ All | ✅ | ✅ | ❌ | ❌ |
| **NBE** | ❌ | ✅ | ✅ | ✅ FX | ✅ FX |
| **Customs** | ❌ | ✅ | ✅ | ✅ Clearance | ✅ Clearance |
| **Shipping Line** | ❌ | ✅ | ✅ | ✅ Shipment | ✅ Shipment |

---

## 🎯 Quick Reference: Who Does What?

### Document Creation
- **Export Request:** Exporter Portal
- **Lot Verification:** ECX
- **Export License:** ECTA
- **Quality Certificate:** ECTA
- **Contract Approval:** ECTA
- **FX Request:** Commercial Bank
- **FX Approval:** NBE
- **Customs Clearance:** Customs
- **Bill of Lading:** Shipping Line

### Approvals
- **Lot Verification:** ECX
- **License:** ECTA
- **Quality:** ECTA
- **Contract:** ECTA
- **FX:** NBE (ONLY NBE!)
- **Customs:** Customs
- **Shipment:** Shipping Line

### Rejections
- **Lot:** ECX
- **License:** ECTA
- **Quality:** ECTA
- **Contract:** ECTA
- **FX:** NBE
- **Customs:** Customs
- **Shipment:** Shipping Line

---

## ✅ Validation Rules

### Rule 1: Single Responsibility
**Each task belongs to exactly ONE organization.**

### Rule 2: Sequential Processing
**Organization N can only work on exports that completed step N-1.**

### Rule 3: No Skipping
**Cannot skip steps in the workflow.**

### Rule 4: No Backdating
**Cannot change status backwards.**

### Rule 5: Role-Based Access
**Each organization can only perform their assigned tasks.**

---

## 📝 Implementation Checklist

- [ ] Backend: Implement role-based access control
- [ ] Backend: Validate task ownership before execution
- [ ] Backend: Enforce sequential workflow
- [ ] Frontend: Show only relevant tasks per organization
- [ ] Frontend: Disable actions not assigned to user's organization
- [ ] Testing: Verify each organization can only do their tasks
- [ ] Testing: Verify workflow sequence is enforced
- [ ] Documentation: Update API docs with task assignments

---

## 🎯 Summary

**Total Organizations:** 7  
**Total Tasks:** 64  
**Workflow Steps:** 7  
**Approval Points:** 7 (ECX, ECTA×3, NBE, Customs, Shipping)

**Key Principle:** Each organization has a specific, non-overlapping role in the coffee export workflow.

---

**Status:** ✅ **TASKS CLEARLY ASSIGNED**  
**Each organization knows exactly what they should and should NOT do**  
**Ready for:** Implementation and enforcement
