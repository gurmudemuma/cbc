# Ethiopian Electronic Single Window (eSW) Alignment

**Date**: December 12, 2025  
**Purpose**: Align Coffee Export Blockchain Platform with Ethiopian eSW Standards

---

## 🇪🇹 Ethiopian Coffee Export Process (Official)

### Current Ethiopian eSW System

The Ethiopian Electronic Single Window connects **16 major cross-border regulatory agencies** and enables:
- Single submission point for all export documentation
- Reduced clearance time: **44 days → 13 days** (target: 3 days)
- 50% reduction in compliance costs
- Paperless environment
- Elimination of multiple physical inspections

**Source**: World Bank Group, Ethiopian Customs Commission

---

## 📋 Official Coffee Export Workflow in Ethiopia

### Phase 1: Pre-Export Requirements

#### 1. **Exporter Registration & Licensing**
- Register business with Ministry of Trade and Regional Integration (MOTRI)
- Obtain Taxpayer Identification Number (TIN)
- Apply for export license from MOTRI
- Open business bank account
- Register with Ethiopian Customs Commission

#### 2. **Contract Notification**
- Notify Ministry of Trade within **15 days** of contract conclusion
- Submit export contract details
- Obtain contract approval

### Phase 2: Quality & Certification

#### 3. **ECX Processing** (Ethiopian Commodity Exchange)
- Coffee delivered to ECX warehouses
- Grading and quality assessment
- Geographical designation assignment
- Storage to prevent tampering
- Auction to exporters (or direct sale for cooperatives/estates)

#### 4. **ECTA Certification** (Ethiopian Coffee & Tea Authority)
- Quality inspection by ECTA
- Verify coffee meets grade requirements
- Confirm agro-ecological origin
- Issue quality certificate
- Verify production area characteristics

### Phase 3: Financial Clearance

#### 5. **Foreign Exchange Approval**
- Buyer opens irrevocable Letter of Credit (L/C)
- Exporter applies to National Bank of Ethiopia (NBE)
- Submit: export contract, seller's invoice, export license, TIN
- NBE issues bank permit for payment arrangement
- Maximum settlement period: **90 days**

#### 6. **Commercial Bank Processing**
- Document verification
- L/C compliance check
- Payment arrangement (L/C, Cash Against Document, or Advance Payment)
- Insurance certificate processing

### Phase 4: Customs & Shipping

#### 7. **Customs Declaration**
- Submit goods declaration to Ethiopian Customs Commission
- Include: contract, goods description, tariff classification, valuation
- Pay export duties (0% for most coffee, selected hides/skins excluded)
- VAT at 0% for exports
- Excise tax on selected goods

#### 8. **Pre-Shipment Inspection**
- Physical examination by Customs Commission
- Mandatory inspection by regulatory bodies
- Certificate of Origin from Chamber of Commerce
- Movement certificates from Customs Authority

#### 9. **Customs Clearance & Release**
- Obtain export customs clearance
- Pay warehouse fees and service charges
- Receive release note
- Physical cargo inspection and insurance

#### 10. **Final Documentation**
- Receive final export customs declaration from Customs Commission
- Submit final declaration to NBE (required for future exports)
- Retain all records for **5 years** (post-clearance audit requirement)

### Phase 5: Shipment & Payment

#### 11. **Shipping Arrangement**
- Book vessel/container
- Arrange transport to port (typically Djibouti)
- Submit shipping documents

#### 12. **Payment Settlement**
- Bank negotiates documents with importer's bank
- Exporter can receive immediate payment via Letter of Indemnity
- Bank verifies L/C compliance
- Foreign exchange retention as per NBE directives

---

## 🔄 Current System vs Ethiopian eSW Standards

### ✅ What We Have Correctly

| Requirement | Our Implementation | Status |
|-------------|-------------------|--------|
| ECTA Licensing | `license_applications`, `export_licenses` tables | ✅ |
| Quality Inspection | `quality_inspections` table | ✅ |
| ECX Certification | ECX API with quality endpoints | ✅ |
| FX Approval | `fx_approvals` table, National Bank API | ✅ |
| Customs Clearance | `customs_clearances` table | ✅ |
| Shipping | `shipments` table, Shipping Line API | ✅ |
| Document Verification | `document_verifications` table | ✅ |
| Sales Contracts | `sales_contracts` table | ✅ |

### ⚠️ What Needs Alignment

| Ethiopian eSW Requirement | Current Gap | Recommended Action |
|---------------------------|-------------|-------------------|
| **Contract Notification (15 days)** | No contract notification tracking | Add `contract_notification_date` to `sales_contracts` |
| **Certificate of Origin** | Not tracked | Add `certificates` table usage for origin certificates |
| **TIN Integration** | Not enforced | Add `tin` field to `users` table, validate on export |
| **90-Day Settlement Rule** | Not enforced | Add `settlement_deadline` to `fx_approvals` |
| **5-Year Record Retention** | No audit trail | Add `audit_logs` table for compliance |
| **Chamber of Commerce Cert** | Not tracked | Add certificate type in `certificates` table |
| **Warehouse Fees** | Not calculated | Add `warehouse_fees` to `customs_clearances` |
| **Letter of Credit** | Not tracked | Add `payment_method` enum to `fx_approvals` |
| **Pre-Shipment Inspection** | Implicit | Add `pre_shipment_inspection` status to `shipments` |
| **Final Declaration** | Not issued | Add `final_declaration_number` to `exports` |

---

## 🎯 Recommended Database Schema Updates

### 1. Update `users` table
```sql
ALTER TABLE users ADD COLUMN tin VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN business_license_number VARCHAR(100);
ALTER TABLE users ADD COLUMN license_issue_date DATE;
```

### 2. Update `sales_contracts` table
```sql
ALTER TABLE sales_contracts ADD COLUMN notification_date TIMESTAMP;
ALTER TABLE sales_contracts ADD COLUMN notification_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE sales_contracts ADD COLUMN motri_approval_number VARCHAR(100);
```

### 3. Update `fx_approvals` table
```sql
ALTER TABLE fx_approvals ADD COLUMN payment_method VARCHAR(50); -- 'L/C', 'CAD', 'Advance'
ALTER TABLE fx_approvals ADD COLUMN lc_number VARCHAR(100);
ALTER TABLE fx_approvals ADD COLUMN settlement_deadline DATE;
ALTER TABLE fx_approvals ADD COLUMN bank_permit_number VARCHAR(100);
```

### 4. Update `customs_clearances` table
```sql
ALTER TABLE customs_clearances ADD COLUMN warehouse_fees DECIMAL(15,2);
ALTER TABLE customs_clearances ADD COLUMN service_charges DECIMAL(15,2);
ALTER TABLE customs_clearances ADD COLUMN release_note_number VARCHAR(100);
ALTER TABLE customs_clearances ADD COLUMN tariff_classification VARCHAR(50);
```

### 5. Update `shipments` table
```sql
ALTER TABLE shipments ADD COLUMN pre_shipment_inspection_status VARCHAR(50);
ALTER TABLE shipments ADD COLUMN pre_shipment_inspector VARCHAR(255);
ALTER TABLE shipments ADD COLUMN inspection_date TIMESTAMP;
ALTER TABLE shipments ADD COLUMN insurance_policy_number VARCHAR(100);
```

### 6. Update `exports` table
```sql
ALTER TABLE exports ADD COLUMN final_declaration_number VARCHAR(100);
ALTER TABLE exports ADD COLUMN final_declaration_date TIMESTAMP;
ALTER TABLE exports ADD COLUMN esw_submission_id VARCHAR(100); -- eSW tracking number
ALTER TABLE exports ADD COLUMN total_clearance_days INTEGER;
```

### 7. Create `audit_logs` table (5-year retention)
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_by INTEGER REFERENCES users(id),
    action_details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '5 years')
);

CREATE INDEX idx_audit_export ON audit_logs(export_id);
CREATE INDEX idx_audit_retention ON audit_logs(retention_until);
```

### 8. Enhance `certificates` table
```sql
ALTER TABLE certificates ADD COLUMN certificate_type VARCHAR(100); -- 'origin', 'quality', 'phyto', 'movement'
ALTER TABLE certificates ADD COLUMN issuing_authority VARCHAR(255); -- 'Chamber of Commerce', 'ECTA', 'Customs'
ALTER TABLE certificates ADD COLUMN certificate_data JSONB;
```

---

## 🔧 API Endpoint Enhancements

### 1. Contract Notification Endpoint (ECTA API)
```javascript
POST /api/contracts/notify
{
  "export_id": "EXP001",
  "contract_id": "CNT123",
  "notification_date": "2025-12-12",
  "buyer_details": {...}
}
```

### 2. TIN Validation Endpoint (All APIs)
```javascript
POST /api/validate/tin
{
  "tin": "1234567890",
  "organization_id": "ORG001"
}
```

### 3. Certificate of Origin Endpoint (Chamber of Commerce - New API)
```javascript
POST /api/certificates/origin
{
  "export_id": "EXP001",
  "coffee_origin": "Sidamo",
  "production_area": "Yirgacheffe"
}
```

### 4. Final Declaration Endpoint (Customs API)
```javascript
POST /api/clearance/final-declaration
{
  "export_id": "EXP001",
  "clearance_id": "CLR001"
}
// Returns: final_declaration_number
```

### 5. Audit Log Endpoint (All APIs)
```javascript
POST /api/audit/log
{
  "export_id": "EXP001",
  "action_type": "document_verified",
  "action_details": {...}
}
```

---

## 📊 Workflow Alignment

### Updated Export Process Flow

```
1. Exporter Registration (ECTA)
   ↓ [TIN, Business License]
   
2. Contract Creation & Notification (ECTA)
   ↓ [Within 15 days to MOTRI]
   
3. ECX Quality Grading
   ↓ [Grade assignment, warehouse storage]
   
4. ECTA Quality Certification
   ↓ [Quality certificate, origin verification]
   
5. L/C Opening (Buyer)
   ↓ [Irrevocable L/C]
   
6. FX Approval (National Bank)
   ↓ [Bank permit, 90-day settlement]
   
7. Document Verification (Commercial Bank)
   ↓ [L/C compliance, insurance]
   
8. Customs Declaration (Customs Authority)
   ↓ [Goods declaration, tariff classification]
   
9. Pre-Shipment Inspection (Customs + ECTA)
   ↓ [Physical examination, certificates]
   
10. Certificate of Origin (Chamber of Commerce)
    ↓ [Origin certificate, movement forms]
    
11. Customs Clearance & Release
    ↓ [Release note, warehouse fees paid]
    
12. Shipping Arrangement (Shipping Line)
    ↓ [Booking, container, insurance]
    
13. Final Declaration (Customs)
    ↓ [Submit to NBE, 5-year retention]
    
14. Payment Settlement (Banks)
    ↓ [Document negotiation, FX retention]
```

---

## 🚀 Implementation Priority

### Phase 1: Critical Compliance (Immediate)
1. Add TIN validation
2. Implement 15-day contract notification
3. Add final declaration tracking
4. Create audit logs table

### Phase 2: Financial Compliance (Week 1)
1. Add L/C tracking
2. Implement 90-day settlement rule
3. Add payment method tracking
4. Warehouse fees calculation

### Phase 3: Certificate Management (Week 2)
1. Certificate of Origin integration
2. Movement certificates
3. Pre-shipment inspection tracking
4. Chamber of Commerce API (if available)

### Phase 4: eSW Integration (Week 3-4)
1. Add eSW submission ID tracking
2. Calculate clearance time metrics
3. Implement single submission interface
4. Connect to actual eSW system (if API available)

---

## 📝 Compliance Checklist

- [ ] TIN required for all exporters
- [ ] Contract notification within 15 days
- [ ] L/C opened before export processing
- [ ] FX approval with 90-day settlement
- [ ] Pre-shipment inspection completed
- [ ] Certificate of Origin obtained
- [ ] Customs declaration submitted
- [ ] Warehouse fees paid
- [ ] Final declaration issued
- [ ] 5-year record retention
- [ ] All documents submitted to NBE

---

## 🔗 Integration with Ethiopian eSW

When Ethiopian eSW API becomes available:

```javascript
// eSW Submission
POST https://esw.ethiopia.gov.et/api/v1/export/submit
Headers: {
  "Authorization": "Bearer {esw_token}",
  "X-TIN": "{exporter_tin}"
}
Body: {
  "export_declaration": {...},
  "quality_certificates": [...],
  "fx_approval": {...},
  "customs_declaration": {...},
  "certificates_of_origin": [...]
}
```

---

## 📚 References

1. [World Bank: Ethiopia Electronic Single Window](https://www.worldbank.org/en/news/feature/2020/04/23/in-ethiopia-electronic-single-window-cuts-costs-and-time-to-trade)
2. [2merkato: Import and Export Procedures in Ethiopia](https://www.2merkato.com/articles/import-and-export/2482-import-and-export-procedures-in-ethiopia)
3. Ethiopian Customs Commission Regulations
4. National Bank of Ethiopia Foreign Exchange Directives
5. Ministry of Trade and Regional Integration (MOTRI) Guidelines

---

**Next Steps**: Implement Phase 1 critical compliance updates to align with Ethiopian eSW standards.
