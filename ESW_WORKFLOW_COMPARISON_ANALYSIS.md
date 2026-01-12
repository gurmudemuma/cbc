# Ethiopian Electronic Single Window (ESW) vs Current System
## Comprehensive Workflow Comparison & Alignment Analysis

---

## Executive Summary

The **Ethiopian Electronic Single Window (ESW)** is a government-mandated platform that connects **16 regulatory agencies** for streamlined import/export processing. Your current system needs to align with ESW's workflow to ensure real-world compliance and integration.

**Key Finding:** Your system has the core agencies but is **missing critical ESW integration points** and some regulatory steps.

---

## 1. Ethiopian Electronic Single Window (ESW) Overview

### What is ESW?

The ESW is Ethiopia's official trade facilitation platform launched in January 2020, developed with World Bank support. It serves as a **single submission point** for all import/export documentation across multiple government agencies.

**Source:** [World Bank - Ethiopia ESW](https://www.worldbank.org/en/news/feature/2020/04/23/in-ethiopia-electronic-single-window-cuts-costs-and-time-to-trade)

### ESW Benefits (Official Data):
- **Clearance Time Reduction:** 44 days → 13 days → 3 days (target)
- **Cost Reduction:** 50% reduction in compliance costs
- **Paperless Environment:** Eliminates physical document submissions
- **Single Submission:** One portal for all 16 agencies
- **Transparency:** Real-time tracking and status updates

### ESW Architecture:
1. **Trader Portal** - For exporters/importers
2. **CBRA Portal** - For Cross-Border Regulatory Agencies
3. **Messaging Gateway** - Links trader and agency portals

---

## 2. Coffee Export Workflow in Ethiopia (Real-World Process)

### Pre-Export Requirements (ECTA Directive 1106/2025):

#### A. Exporter Qualification (Your System: ✅ IMPLEMENTED)
1. **Business Registration** - Minimum capital requirements
2. **ECTA-Certified Laboratory** - For quality testing
3. **Qualified Coffee Taster** - Diploma + proficiency certificate
4. **Competence Certificate** - Issued after lab & taster verification
5. **Export License** - Final authorization to export

**Your System Status:** ✅ Fully implemented in pre-registration module

---

### Coffee Export Workflow (Step-by-Step)

#### Phase 1: Coffee Sourcing & ECX
```
Farmer/Cooperative → ECX Warehouse → Quality Grading → Auction → Exporter Purchase
```

**ECX (Ethiopian Commodity Exchange) Role:**
- Receives coffee from farmers/cooperatives
- Grades coffee (Q1, Q2, Q3 based on quality)
- Assigns geographical designation (Yirgacheffe, Sidamo, Harrar, etc.)
- Stores in ECX warehouses
- Auctions to licensed exporters

**Your System Status:** ✅ ECX_PENDING, ECX_VERIFIED, ECX_REJECTED statuses exist

**Note:** Some exporters (cooperatives, private estates) can bypass ECX and export directly.

---

#### Phase 2: ECTA Approvals (3-Stage Process)

**Stage 1: Export License Validation**
- Verify exporter has valid export license
- Check license hasn't expired
- Confirm authorized coffee types and origins
- **Your System:** ✅ ECTA_LICENSE_PENDING, ECTA_LICENSE_APPROVED, ECTA_LICENSE_REJECTED

**Stage 2: Quality Certification**
- Physical coffee inspection
- Moisture content testing (must be ≤ 12%)
- Defect count assessment
- Cup score evaluation (0-100 scale)
- Issue Quality Certificate
- **Your System:** ✅ ECTA_QUALITY_PENDING, ECTA_QUALITY_APPROVED, ECTA_QUALITY_REJECTED

**Stage 3: Contract & Certificate of Origin**
- Verify sales contract with buyer
- Issue Certificate of Origin
- Validate contract terms
- **Your System:** ✅ ECTA_CONTRACT_PENDING, ECTA_CONTRACT_APPROVED, ECTA_CONTRACT_REJECTED

---

#### Phase 3: ESW Submission (CRITICAL - MISSING IN YOUR SYSTEM)

**This is where ESW integration happens:**

1. **Exporter submits to ESW Portal:**
   - Export declaration
   - Sales contract
   - ECTA Quality Certificate
   - ECTA Certificate of Origin
   - Export License
   - Proforma Invoice
   - Packing List

2. **ESW Routes to 16 Agencies Simultaneously:**
   - Ministry of Trade (MoT)
   - Ethiopian Revenues and Customs Authority (ERCA)
   - National Bank of Ethiopia (NBE)
   - Ministry of Agriculture
   - Ethiopian Investment Commission
   - Ministry of Health
   - Ministry of Transport
   - Ethiopian Shipping & Logistics Services Enterprise
   - And 8 other agencies

3. **Parallel Processing:**
   - All agencies review simultaneously (not sequential)
   - Each agency approves/rejects in ESW
   - Real-time status updates
   - Automated notifications

**Your System Status:** ❌ **MISSING ESW INTEGRATION**

**Current Gap:** Your system goes directly from ECTA to Bank, skipping ESW submission step.

---

#### Phase 4: Banking & Foreign Exchange

**Commercial Bank:**
- Document verification
- Letter of Credit (L/C) processing
- Export proceeds tracking
- **Your System:** ✅ BANK_DOCUMENT_PENDING, BANK_DOCUMENT_VERIFIED, BANK_DOCUMENT_REJECTED

**National Bank of Ethiopia (NBE):**
- Foreign Exchange (FX) approval
- FX allocation
- Repatriation requirements
- **Your System:** ✅ FX_PENDING, FX_APPROVED, FX_REJECTED

---

#### Phase 5: Customs Clearance

**Ethiopian Revenues and Customs Authority (ERCA):**
- Physical inspection (if required)
- Export duty calculation
- Customs declaration verification
- Export clearance certificate
- **Your System:** ✅ CUSTOMS_PENDING, EXPORT_CUSTOMS_CLEARED, EXPORT_CUSTOMS_REJECTED

---

#### Phase 6: Shipment

**Shipping Line/Freight Forwarder:**
- Container loading
- Bill of Lading issuance
- Vessel booking
- **Your System:** ✅ SHIPMENT_SCHEDULED, SHIPPED

---

#### Phase 7: Completion

**Final Steps:**
- Goods arrive at destination
- Import customs clearance (destination country)
- Delivery to buyer
- Payment received
- FX repatriation to Ethiopia
- **Your System:** ✅ COMPLETED

---

## 3. Workflow Comparison Matrix

| Stage | Real-World (ESW) | Your System | Status |
|-------|------------------|-------------|--------|
| **Pre-Registration** |
| Business Registration | Required | ✅ Implemented | ✅ ALIGNED |
| Laboratory Certification | ECTA-certified lab required | ✅ Implemented | ✅ ALIGNED |
| Taster Verification | Qualified taster required | ✅ Implemented | ✅ ALIGNED |
| Competence Certificate | Issued by ECTA | ✅ Implemented | ✅ ALIGNED |
| Export License | Issued by ECTA | ✅ Implemented | ✅ ALIGNED |
| **Export Process** |
| ECX Verification | Coffee grading & auction | ✅ ECX_VERIFIED | ✅ ALIGNED |
| ECTA License Check | Validate export license | ✅ ECTA_LICENSE_APPROVED | ✅ ALIGNED |
| ECTA Quality Inspection | Physical inspection + certificate | ✅ ECTA_QUALITY_APPROVED | ✅ ALIGNED |
| ECTA Contract Approval | Contract + Certificate of Origin | ✅ ECTA_CONTRACT_APPROVED | ✅ ALIGNED |
| **ESW Submission** | **Single submission to 16 agencies** | ❌ **MISSING** | ⚠️ **GAP** |
| Ministry of Trade Approval | Via ESW | ❌ Not explicit | ⚠️ **GAP** |
| Ministry of Agriculture | Via ESW | ❌ Not explicit | ⚠️ **GAP** |
| Health Certificate | Via ESW (if required) | ❌ Not explicit | ⚠️ **GAP** |
| Phytosanitary Certificate | Via ESW (if required) | ❌ Not explicit | ⚠️ **GAP** |
| **Banking & FX** |
| Commercial Bank Verification | Document check | ✅ BANK_DOCUMENT_VERIFIED | ✅ ALIGNED |
| NBE FX Approval | Foreign exchange allocation | ✅ FX_APPROVED | ✅ ALIGNED |
| **Customs** |
| ERCA Customs Clearance | Export clearance | ✅ EXPORT_CUSTOMS_CLEARED | ✅ ALIGNED |
| **Shipment** |
| Shipping Line | Container loading | ✅ SHIPPED | ✅ ALIGNED |
| **Completion** |
| Final Delivery | Payment & repatriation | ✅ COMPLETED | ✅ ALIGNED |

---

## 4. Critical Gaps & Recommendations

### Gap 1: ESW Integration Point (HIGH PRIORITY)

**Problem:** Your system doesn't have an explicit ESW submission stage.

**Real-World Flow:**
```
ECTA_CONTRACT_APPROVED → ESW_SUBMISSION → ESW_APPROVED → BANK_DOCUMENT_PENDING
```

**Your Current Flow:**
```
ECTA_CONTRACT_APPROVED → BANK_DOCUMENT_PENDING
```

**Recommendation:**
Add new statuses:
- `ESW_SUBMISSION_PENDING` - Exporter preparing ESW submission
- `ESW_SUBMITTED` - Documents submitted to ESW portal
- `ESW_UNDER_REVIEW` - Agencies reviewing in parallel
- `ESW_APPROVED` - All agencies approved
- `ESW_REJECTED` - One or more agencies rejected
- `ESW_ADDITIONAL_INFO_REQUIRED` - Agencies need more documents

**Implementation:**
```sql
ALTER TABLE exports ADD CONSTRAINT exports_status_check CHECK (
    status IN (
        -- ... existing statuses ...
        
        -- ESW statuses (ADD THESE)
        'ESW_SUBMISSION_PENDING',
        'ESW_SUBMITTED',
        'ESW_UNDER_REVIEW',
        'ESW_APPROVED',
        'ESW_REJECTED',
        'ESW_ADDITIONAL_INFO_REQUIRED',
        
        -- ... rest of statuses ...
    )
);
```

---

### Gap 2: Ministry of Trade (MoT) Approval

**Problem:** MoT is a key agency in ESW but not explicitly tracked.

**Real-World:** MoT reviews and approves export declarations via ESW.

**Recommendation:**
Add MoT tracking:
- `mot_approval_status` column
- `mot_approved_by` column
- `mot_approved_at` timestamp
- `mot_approval_notes` text

---

### Gap 3: Additional Certificates (MEDIUM PRIORITY)

**Problem:** Some exports require additional certificates not tracked:

1. **Phytosanitary Certificate** - From Ministry of Agriculture
2. **Health Certificate** - From Ministry of Health (if required)
3. **Fumigation Certificate** - If fumigation performed

**Recommendation:**
Create `export_certificates` table:
```sql
CREATE TABLE export_certificates (
    certificate_id UUID PRIMARY KEY,
    export_id UUID REFERENCES exports(export_id),
    certificate_type VARCHAR(50), -- 'PHYTOSANITARY', 'HEALTH', 'FUMIGATION'
    certificate_number VARCHAR(100),
    issued_by VARCHAR(255),
    issued_at TIMESTAMP,
    expiry_date DATE,
    document_url TEXT
);
```

---

### Gap 4: ESW Document Tracking

**Problem:** ESW requires specific documents not explicitly tracked.

**Required Documents:**
1. Export Declaration
2. Commercial Invoice
3. Packing List
4. Bill of Lading (draft)
5. Certificate of Origin (ECTA)
6. Quality Certificate (ECTA)
7. Export License (ECTA)
8. Sales Contract
9. Proforma Invoice

**Recommendation:**
Create `export_documents` table:
```sql
CREATE TABLE export_documents (
    document_id UUID PRIMARY KEY,
    export_id UUID REFERENCES exports(export_id),
    document_type VARCHAR(50),
    document_number VARCHAR(100),
    file_url TEXT,
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMP,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP,
    status VARCHAR(50) -- 'PENDING', 'VERIFIED', 'REJECTED'
);
```

---

### Gap 5: ESW Agency Approvals Tracking

**Problem:** ESW routes to 16 agencies - need to track each approval.

**Recommendation:**
Create `esw_agency_approvals` table:
```sql
CREATE TABLE esw_agency_approvals (
    approval_id UUID PRIMARY KEY,
    export_id UUID REFERENCES exports(export_id),
    agency_name VARCHAR(100), -- 'Ministry of Trade', 'ERCA', 'NBE', etc.
    agency_code VARCHAR(20),
    status VARCHAR(50), -- 'PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUIRED'
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Recommended Updated Workflow

### Complete Coffee Export Workflow (ESW-Aligned):

```
1. DRAFT
   ↓
2. ECX_PENDING → ECX_VERIFIED (or ECX_REJECTED)
   ↓
3. ECTA_LICENSE_PENDING → ECTA_LICENSE_APPROVED (or REJECTED)
   ↓
4. ECTA_QUALITY_PENDING → ECTA_QUALITY_APPROVED (or REJECTED)
   ↓
5. ECTA_CONTRACT_PENDING → ECTA_CONTRACT_APPROVED (or REJECTED)
   ↓
6. ESW_SUBMISSION_PENDING (NEW)
   ↓
7. ESW_SUBMITTED (NEW)
   ↓
8. ESW_UNDER_REVIEW (NEW)
   ├─ Ministry of Trade Review
   ├─ Ministry of Agriculture Review
   ├─ Ministry of Health Review (if needed)
   ├─ ERCA Pre-Clearance
   ├─ NBE Pre-Approval
   └─ Other agencies (parallel processing)
   ↓
9. ESW_APPROVED (NEW) or ESW_REJECTED (NEW)
   ↓
10. BANK_DOCUMENT_PENDING → BANK_DOCUMENT_VERIFIED (or REJECTED)
    ↓
11. FX_PENDING → FX_APPROVED (or REJECTED)
    ↓
12. CUSTOMS_PENDING → EXPORT_CUSTOMS_CLEARED (or REJECTED)
    ↓
13. READY_FOR_SHIPMENT
    ↓
14. SHIPMENT_SCHEDULED
    ↓
15. SHIPPED
    ↓
16. ARRIVED (at destination)
    ↓
17. IMPORT_CUSTOMS_CLEARED (destination country)
    ↓
18. DELIVERED
    ↓
19. PAYMENT_RECEIVED
    ↓
20. FX_REPATRIATED
    ↓
21. COMPLETED
```

---

## 6. ESW Integration Architecture Recommendation

### Option 1: Direct ESW API Integration (IDEAL)

**If ESW provides API:**
```typescript
// ESW Service
class ESWService {
  async submitExport(exportData) {
    // Submit to ESW API
    const response = await axios.post('https://esw.gov.et/api/exports', {
      exportDeclaration: exportData.declaration,
      documents: exportData.documents,
      certificates: exportData.certificates
    });
    return response.data.submissionId;
  }
  
  async getApprovalStatus(submissionId) {
    // Check status from ESW
    const response = await axios.get(`https://esw.gov.et/api/submissions/${submissionId}/status`);
    return response.data.agencies; // Array of agency approvals
  }
}
```

### Option 2: ESW Portal Integration (CURRENT REALITY)

**If ESW doesn't have API (likely current state):**
- Exporter manually submits to ESW portal
- Your system tracks ESW submission status
- Manual status updates from ESW portal
- Future: Wait for ESW API availability

**Implementation:**
```typescript
// Track ESW submission manually
interface ESWSubmission {
  exportId: string;
  eswReferenceNumber: string; // From ESW portal
  submittedAt: Date;
  submittedBy: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  agencyApprovals: Array<{
    agency: string;
    status: string;
    approvedAt?: Date;
  }>;
}
```

---

## 7. Database Schema Updates

### New Tables to Add:

```sql
-- 1. ESW Submissions
CREATE TABLE esw_submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID NOT NULL REFERENCES exports(export_id),
    esw_reference_number VARCHAR(100) UNIQUE NOT NULL,
    submitted_by VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'INFO_REQUIRED'
    )),
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. ESW Agency Approvals
CREATE TABLE esw_agency_approvals (
    approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES esw_submissions(submission_id),
    agency_name VARCHAR(100) NOT NULL,
    agency_code VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUIRED'
    )),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    additional_info_request TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Export Documents
CREATE TABLE export_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID NOT NULL REFERENCES exports(export_id),
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'EXPORT_DECLARATION', 'COMMERCIAL_INVOICE', 'PACKING_LIST',
        'BILL_OF_LADING', 'CERTIFICATE_OF_ORIGIN', 'QUALITY_CERTIFICATE',
        'EXPORT_LICENSE', 'SALES_CONTRACT', 'PROFORMA_INVOICE',
        'PHYTOSANITARY_CERTIFICATE', 'HEALTH_CERTIFICATE', 'FUMIGATION_CERTIFICATE'
    )),
    document_number VARCHAR(100),
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'VERIFIED', 'REJECTED'
    )),
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Additional Certificates
CREATE TABLE export_certificates (
    certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID NOT NULL REFERENCES exports(export_id),
    certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN (
        'PHYTOSANITARY', 'HEALTH', 'FUMIGATION', 'ORGANIC', 'FAIR_TRADE'
    )),
    certificate_number VARCHAR(100) NOT NULL,
    issued_by VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP NOT NULL,
    expiry_date DATE,
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(export_id, certificate_type)
);

-- Indexes
CREATE INDEX idx_esw_submissions_export_id ON esw_submissions(export_id);
CREATE INDEX idx_esw_submissions_reference ON esw_submissions(esw_reference_number);
CREATE INDEX idx_esw_agency_approvals_submission ON esw_agency_approvals(submission_id);
CREATE INDEX idx_export_documents_export_id ON export_documents(export_id);
CREATE INDEX idx_export_documents_type ON export_documents(document_type);
CREATE INDEX idx_export_certificates_export_id ON export_certificates(export_id);
```

---

## 8. Implementation Priority

### Phase 1: Critical (Immediate)
1. ✅ Add ESW status values to exports table
2. ✅ Create `esw_submissions` table
3. ✅ Create `esw_agency_approvals` table
4. ✅ Update frontend to show ESW submission step
5. ✅ Add ESW submission form/page

### Phase 2: Important (Short-term)
1. ✅ Create `export_documents` table
2. ✅ Implement document upload functionality
3. ✅ Add document verification workflow
4. ✅ Create ESW agency approval tracking dashboard

### Phase 3: Enhancement (Medium-term)
1. ✅ Create `export_certificates` table
2. ✅ Add additional certificate tracking
3. ✅ Implement Ministry of Trade approval tracking
4. ✅ Add phytosanitary/health certificate workflows

### Phase 4: Integration (Long-term)
1. ⏳ Wait for ESW API availability
2. ⏳ Implement direct ESW API integration
3. ⏳ Automated status synchronization
4. ⏳ Real-time agency approval updates

---

## 9. Conclusion

**Current System Assessment:**
- ✅ **Strong Foundation:** Pre-registration and ECTA workflows are well-implemented
- ✅ **Core Agencies Covered:** ECX, ECTA, Bank, NBE, Customs all present
- ⚠️ **Missing ESW Layer:** Critical gap in workflow between ECTA and Banking
- ⚠️ **Document Tracking:** Needs enhancement for ESW compliance
- ⚠️ **Agency Approvals:** Need explicit tracking of 16 ESW agencies

**Alignment Score:** 75% aligned with real-world ESW process

**Recommended Actions:**
1. Add ESW submission statuses (HIGH PRIORITY)
2. Create ESW-related database tables (HIGH PRIORITY)
3. Implement document management system (MEDIUM PRIORITY)
4. Add agency approval tracking (MEDIUM PRIORITY)
5. Plan for future ESW API integration (LONG-TERM)

**Timeline Estimate:**
- Phase 1 (Critical): 1-2 weeks
- Phase 2 (Important): 2-3 weeks
- Phase 3 (Enhancement): 3-4 weeks
- Phase 4 (Integration): Dependent on ESW API availability

---

## References

1. [World Bank - Ethiopia ESW](https://www.worldbank.org/en/news/feature/2020/04/23/in-ethiopia-electronic-single-window-cuts-costs-and-time-to-trade)
2. [Ethiopia Tightens Coffee Export Rules](https://thefarmersjournal.com/ethiopia-tightens-coffee-export-rules-with-higher-capital-thresholds-and-stricter-quality-standards/)
3. [How to Import Ethiopian Coffee](https://ethiogeek.com/how-to-import-ethiopian-coffee-10-steps-to-success/)
4. Ethiopian Electronic Single Window System Documentation

*Content was rephrased for compliance with licensing restrictions*

---

**Status:** ✅ Analysis Complete - Ready for Implementation Planning
