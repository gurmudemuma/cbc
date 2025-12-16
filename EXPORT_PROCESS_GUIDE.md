# Complete Ethiopian Coffee Export Process Guide

**Step-by-Step Guide from Registration to Final Export**

---

## 📋 Overview

Total Steps: **15**  
Estimated Timeline: **45-60 days** (with eSW: 13-15 days)  
Organizations Involved: **7** (ECTA, ECX, NBE, Commercial Bank, Customs, Shipping Line, Chamber of Commerce)

---

## PHASE 1: EXPORTER SETUP (One-Time) - 30-45 Days

### Step 1: Business Registration & TIN
**Who**: Exporter  
**Where**: Ministry of Trade and Regional Integration (MOTRI)  
**Duration**: 5-7 days

**Actions**:
1. Register business (Sole Proprietorship, LLC, Joint Stock, etc.)
2. Obtain Taxpayer Identification Number (TIN)
3. Open business bank account
4. Get business license

**Database**: `exporter_profiles`
```sql
INSERT INTO exporter_profiles (
    business_name, tin, registration_number, 
    business_type, office_address, contact_person, 
    email, phone, status
) VALUES (...);
```

**Documents Required**:
- Business registration certificate
- TIN certificate
- Bank account statement
- Office lease agreement
- ID of business owner

---

### Step 2: Capital Verification (Non-Farmers Only)
**Who**: Exporter  
**Where**: Bank  
**Duration**: 2-3 days

**Minimum Capital Requirements** (Directive 1106/2025):
- Private Limited Company: 500,000 ETB
- Joint Stock Company: 1,000,000 ETB
- Trade Association: As per articles

**Actions**:
1. Deposit minimum capital in business account
2. Obtain capital verification letter from bank
3. Submit to ECTA

**Database**: `exporter_profiles.capital_verified = TRUE`

**Documents Required**:
- Bank statement showing capital
- Capital verification letter

---

### Step 3: Coffee Laboratory Setup (Non-Farmers Only)
**Who**: Exporter  
**Where**: Exporter's facility  
**Duration**: 10-15 days

**Requirements**:
- Roasting facility
- Cupping room
- Sample storage area
- Quality testing equipment

**Actions**:
1. Setup laboratory facilities
2. Purchase required equipment
3. Request ECTA inspection
4. Obtain laboratory certification

**Database**: `coffee_laboratories`
```sql
INSERT INTO coffee_laboratories (
    exporter_id, laboratory_name, address,
    has_roasting_facility, has_cupping_room,
    has_sample_storage, equipment, status
) VALUES (...);
```

**Documents Required**:
- Facility photos
- Equipment list
- Facility layout plan

---

### Step 4: Coffee Taster Registration (Non-Farmers Only)
**Who**: Exporter  
**Where**: ECTA  
**Duration**: 3-5 days

**Requirements**:
- Qualified coffee taster (Diploma/Degree/Certificate)
- ECTA proficiency certificate
- Exclusive employment contract

**Actions**:
1. Hire qualified coffee taster
2. Submit taster credentials to ECTA
3. Obtain proficiency certificate
4. Register employment contract

**Database**: `coffee_tasters`
```sql
INSERT INTO coffee_tasters (
    exporter_id, full_name, qualification_level,
    proficiency_certificate_number, 
    certificate_issue_date, certificate_expiry_date,
    employment_start_date, status
) VALUES (...);
```

**Documents Required**:
- Taster's educational certificates
- ECTA proficiency certificate
- Employment contract
- National ID

---

### Step 5: Competence Certificate Application
**Who**: Exporter  
**Where**: ECTA  
**Duration**: 7-10 days

**Requirements**:
- Certified laboratory (or exemption for farmers)
- Registered coffee taster (or exemption for farmers)
- Facility inspection passed
- Quality management system

**Actions**:
1. Submit competence certificate application to ECTA
2. Schedule facility inspection
3. Pass inspection
4. Receive competence certificate

**Database**: `competence_certificates`
```sql
INSERT INTO competence_certificates (
    exporter_id, certificate_number, issued_date,
    expiry_date, laboratory_id, taster_id,
    facility_inspection_date, inspection_passed,
    has_quality_management_system, status
) VALUES (...);
```

**Frontend**: ECTA Admin Portal → Issue Competence Certificate

**Documents Required**:
- Laboratory certification
- Taster registration
- Facility inspection report
- QMS documentation

---

### Step 6: Export License Application
**Who**: Exporter  
**Where**: ECTA  
**Duration**: 5-7 days

**Requirements**:
- Valid competence certificate
- EIC (Ethiopian Investment Commission) registration
- Annual quota allocation

**Actions**:
1. Submit export license application to ECTA
2. Provide competence certificate
3. Provide EIC registration number
4. Receive export license (valid 1 year)

**Database**: `export_licenses`
```sql
INSERT INTO export_licenses (
    exporter_id, license_number, issued_date,
    expiry_date, competence_certificate_id,
    eic_registration_number, authorized_coffee_types,
    authorized_origins, annual_quota, status
) VALUES (...);
```

**Frontend**: `ECTALicenseForm` → ECTA approves

**Documents Required**:
- Competence certificate
- EIC registration certificate
- Business license
- TIN certificate

---

## PHASE 2: COFFEE PROCUREMENT - 1-3 Days

### Step 7: Purchase Coffee from ECX
**Who**: Exporter  
**Where**: Ethiopian Commodity Exchange (ECX)  
**Duration**: 1 day

**Actions**:
1. Attend ECX coffee auction
2. Bid on coffee lots
3. Win auction and pay
4. Receive warehouse receipt
5. Coffee stored in ECX warehouse

**Database**: `coffee_lots`
```sql
INSERT INTO coffee_lots (
    ecx_lot_number, warehouse_receipt_number,
    warehouse_location, coffee_type, origin_region,
    processing_method, quantity, purchased_by,
    purchase_date, purchase_price, status
) VALUES (...);
```

**Frontend**: ECX Portal → Purchase Coffee Lot

**Documents Required**:
- Export license
- Payment confirmation
- Warehouse receipt

**Note**: Cooperatives and private estates can bypass ECX

---

### Step 8: Quality Inspection by ECTA
**Who**: ECTA Inspector  
**Where**: ECTA Inspection Center  
**Duration**: 1-2 days

**Actions**:
1. Submit coffee sample to ECTA
2. Physical analysis (moisture, defects, bean size)
3. Cupping evaluation (score, flavor profile)
4. Receive quality certificate and grade
5. Coffee approved for export

**Database**: `quality_inspections`
```sql
INSERT INTO quality_inspections (
    lot_id, exporter_id, inspection_date,
    inspection_center, inspector,
    moisture_content, defect_count, cupping_score,
    aroma_score, acidity_score, body_score,
    final_grade, quality_certificate_number,
    passed, status
) VALUES (...);
```

**Frontend**: `ECTAQualityForm` → ECTA Inspector submits results

**Documents Required**:
- Coffee sample
- Warehouse receipt
- Export license

---

## PHASE 3: CONTRACT & BUYER ARRANGEMENT - 3-5 Days

### Step 9: Sales Contract Registration
**Who**: Exporter  
**Where**: ECTA  
**Duration**: 1-2 days

**Actions**:
1. Negotiate with international buyer
2. Sign sales contract
3. **Register contract with ECTA within 15 days** (eSW requirement)
4. Buyer opens Letter of Credit (L/C)
5. ECTA approves contract

**Database**: `sales_contracts`
```sql
INSERT INTO sales_contracts (
    exporter_id, contract_number, buyer_name,
    buyer_country, coffee_type, quantity,
    contract_value, price_per_kg, payment_terms,
    incoterms, delivery_date, port_of_loading,
    port_of_discharge, registration_date,
    notification_date, lc_number, lc_opening_date,
    settlement_deadline, status
) VALUES (...);
```

**Frontend**: `ECTAContractForm` → ECTA approves

**eSW Requirements**:
- ✅ Notification within 15 days
- ✅ L/C number tracking
- ✅ 90-day settlement deadline

**Documents Required**:
- Signed sales contract
- Buyer's business registration
- Proforma invoice
- L/C copy

---

### Step 10: Certificate of Origin
**Who**: ECTA / Chamber of Commerce  
**Where**: ECTA Office  
**Duration**: 1 day

**Actions**:
1. Apply for Certificate of Origin
2. Provide contract and quality certificate
3. ECTA verifies origin region
4. Receive Certificate of Origin

**Database**: `certificates_of_origin`
```sql
INSERT INTO certificates_of_origin (
    certificate_number, export_permit_id, exporter_id,
    exporter_name, buyer_name, buyer_country,
    coffee_type, origin_region, quantity, grade,
    processing_method, issued_date, issued_by
) VALUES (...);
```

**Frontend**: Auto-generated when contract approved

**Documents Required**:
- Sales contract
- Quality certificate
- Export license

---

## PHASE 4: FINANCIAL CLEARANCE - 3-5 Days

### Step 11: Commercial Bank Document Verification
**Who**: Commercial Bank  
**Where**: Exporter's bank  
**Duration**: 1-2 days

**Actions**:
1. Submit export documents to bank
2. Bank verifies L/C compliance
3. Bank checks document authenticity
4. Bank approves for FX application

**Database**: `document_verifications`
```sql
INSERT INTO document_verifications (
    export_permit_id, exporter_id, document_type,
    document_number, document_hash,
    verification_status, lc_compliant,
    verified_by, verified_at
) VALUES (...);
```

**Frontend**: `BankDocumentVerificationForm` → Bank verifies

**Documents Required**:
- Sales contract
- Quality certificate
- Certificate of origin
- Export license
- L/C copy
- Commercial invoice
- Packing list

---

### Step 12: Foreign Exchange (FX) Approval
**Who**: National Bank of Ethiopia (NBE)  
**Where**: NBE / Authorized Commercial Bank  
**Duration**: 2-3 days

**Actions**:
1. Apply for FX approval through commercial bank
2. Submit export contract and documents
3. NBE reviews and approves FX allocation
4. Receive bank permit for payment
5. **90-day settlement deadline set** (eSW requirement)

**Database**: `fx_approvals`
```sql
INSERT INTO fx_approvals (
    export_permit_id, exporter_id, export_value,
    currency, exchange_rate, local_value,
    payment_method, lc_number, bank_permit_number,
    settlement_deadline, settlement_days,
    approval_status, approved_by, approved_at
) VALUES (...);
```

**Frontend**: `NBEFXApprovalForm` → NBE approves

**eSW Requirements**:
- ✅ Payment method (L/C, CAD, Advance)
- ✅ 90-day settlement deadline
- ✅ Bank permit number

**Documents Required**:
- Export contract
- Export license
- TIN certificate
- Proforma invoice
- L/C copy
- Bank verification

---

## PHASE 5: EXPORT PERMIT - 1-2 Days

### Step 13: Export Permit Issuance
**Who**: ECTA  
**Where**: ECTA Office  
**Duration**: 1 day

**Actions**:
1. Submit all required documents to ECTA
2. ECTA verifies all prerequisites
3. ECTA issues export permit
4. Permit valid for specific shipment

**Database**: `export_permits`
```sql
INSERT INTO export_permits (
    permit_number, exporter_id, export_license_id,
    competence_certificate_id, quality_inspection_id,
    sales_contract_id, lot_id, issued_date,
    valid_until, coffee_type, quantity, grade,
    destination_country, esw_submission_id,
    status, issued_by
) VALUES (...);
```

**Frontend**: ECTA Admin Portal → Issue Export Permit

**Prerequisites** (All Required):
- ✅ Valid export license
- ✅ Valid competence certificate
- ✅ Quality inspection passed
- ✅ Sales contract approved
- ✅ Certificate of origin issued
- ✅ FX approval obtained
- ✅ Bank documents verified

**Documents Required**:
- Export license
- Competence certificate
- Quality certificate
- Sales contract
- Certificate of origin
- FX approval
- Bank permit

---

## PHASE 6: CUSTOMS CLEARANCE - 2-3 Days

### Step 14: Customs Declaration & Clearance
**Who**: Ethiopian Customs Commission  
**Where**: Customs Office / Port  
**Duration**: 2-3 days (eSW target: same day)

**Actions**:
1. Submit customs declaration (goods declaration)
2. Provide all export documents
3. Pay customs duties (0% for coffee)
4. Pay VAT (0% for exports)
5. Pay warehouse fees and service charges
6. Physical inspection by customs
7. Pre-shipment inspection (mandatory)
8. Receive release note
9. Receive final customs declaration

**Database**: `customs_clearances`
```sql
INSERT INTO customs_clearances (
    clearance_id, export_permit_id, exporter_id,
    declaration_number, declaration_date,
    tariff_classification, inspection_date,
    customs_duty, vat, excise_tax,
    warehouse_fees, service_charges, total_fees,
    release_note_number, status, cleared_by, cleared_at
) VALUES (...);
```

**Frontend**: `CustomsClearanceForm` → Customs Officer processes

**eSW Requirements**:
- ✅ Tariff classification (HS Code)
- ✅ Warehouse fees tracking
- ✅ Service charges tracking
- ✅ Release note number
- ✅ Final declaration number

**Fees**:
- Customs Duty: 0% (coffee exports)
- VAT: 0% (exports)
- Excise Tax: 0% (coffee)
- Warehouse Fees: Variable
- Service Charges: Variable

**Documents Required**:
- Export permit
- Quality certificate
- Certificate of origin
- Sales contract
- Commercial invoice
- Packing list
- FX approval
- Insurance certificate

---

## PHASE 7: SHIPPING & FINAL STEPS - 5-7 Days

### Step 15: Shipment Arrangement
**Who**: Shipping Line / Freight Forwarder  
**Where**: Port of Djibouti (typically)  
**Duration**: 1-2 days booking + 3-5 days to port

**Actions**:
1. Book vessel/container with shipping line
2. Arrange marine cargo insurance
3. Pre-shipment inspection by customs/ECTA
4. Transport coffee to port
5. Load container
6. Obtain Bill of Lading
7. Ship coffee

**Database**: `shipments`
```sql
INSERT INTO shipments (
    shipment_id, export_permit_id, exporter_id,
    booking_number, vessel_name, container_number,
    departure_port, arrival_port, departure_date,
    estimated_arrival_date, pre_shipment_inspection_status,
    pre_shipment_inspector, inspection_date,
    insurance_policy_number, status
) VALUES (...);
```

**Frontend**: `ShipmentScheduleForm` → Shipping Line processes

**eSW Requirements**:
- ✅ Pre-shipment inspection status
- ✅ Inspector name
- ✅ Inspection date
- ✅ Insurance policy number
- ✅ Container number

**Documents Required**:
- Customs release note
- Export permit
- Commercial invoice
- Packing list
- Certificate of origin
- Quality certificate
- Insurance certificate

---

## PHASE 8: POST-SHIPMENT - Within 90 Days

### Step 16: Payment Settlement & Final Declaration
**Who**: Exporter + Commercial Bank + NBE  
**Where**: Bank  
**Duration**: Within 90 days

**Actions**:
1. Shipping line issues Bill of Lading
2. Exporter submits documents to bank
3. Bank negotiates documents with buyer's bank
4. Buyer pays (as per L/C terms)
5. Exporter receives payment
6. **Submit final customs declaration to NBE** (mandatory)
7. Retain all records for 5 years (audit requirement)

**Database**: 
```sql
-- Update export permit
UPDATE export_permits SET
    final_declaration_number = 'FD-...',
    final_declaration_date = NOW(),
    clearance_days = (cleared_date - submission_date),
    status = 'completed'
WHERE permit_id = ...;

-- Update FX approval
UPDATE fx_approvals SET
    approval_status = 'settled'
WHERE export_permit_id = ...;
```

**eSW Requirements**:
- ✅ Final declaration to NBE
- ✅ 5-year record retention
- ✅ Settlement within 90 days

**Documents for Bank**:
- Bill of Lading (original)
- Commercial invoice
- Packing list
- Certificate of origin
- Quality certificate
- Insurance certificate
- Final customs declaration

---

## 📊 Complete Process Summary

### Timeline Breakdown

| Phase | Steps | Duration (Traditional) | Duration (eSW) |
|-------|-------|----------------------|----------------|
| **Setup** (One-time) | 1-6 | 30-45 days | 30-45 days |
| **Procurement** | 7-8 | 1-3 days | 1-3 days |
| **Contract** | 9-10 | 3-5 days | 1-2 days |
| **Financial** | 11-12 | 3-5 days | 1-2 days |
| **Permit** | 13 | 1-2 days | Same day |
| **Customs** | 14 | 2-3 days | Same day |
| **Shipping** | 15 | 5-7 days | 5-7 days |
| **Settlement** | 16 | Within 90 days | Within 90 days |
| **TOTAL** | **16 steps** | **45-60 days** | **13-15 days** |

### Organizations Involved

1. **ECTA** (Ethiopian Coffee & Tea Authority)
   - Competence certificates
   - Export licenses
   - Quality inspections
   - Contract registration
   - Certificate of origin
   - Export permits

2. **ECX** (Ethiopian Commodity Exchange)
   - Coffee auctions
   - Warehouse storage
   - Lot tracking

3. **NBE** (National Bank of Ethiopia)
   - FX approvals
   - Bank permits
   - Settlement monitoring

4. **Commercial Banks**
   - Document verification
   - L/C processing
   - Payment settlement

5. **Customs Commission**
   - Customs declaration
   - Physical inspection
   - Clearance & release

6. **Shipping Lines**
   - Vessel booking
   - Container allocation
   - Bill of Lading

7. **MOTRI** (Ministry of Trade)
   - Business registration
   - Contract notifications

---

## 🎯 Critical Compliance Points

### Must-Have Documents at Each Stage

**For Export Permit**:
- ✅ Export license (valid)
- ✅ Competence certificate (valid)
- ✅ Quality certificate
- ✅ Sales contract (registered)
- ✅ Certificate of origin
- ✅ FX approval

**For Customs Clearance**:
- ✅ Export permit
- ✅ All above documents
- ✅ Commercial invoice
- ✅ Packing list
- ✅ Insurance certificate

**For Shipment**:
- ✅ Customs release note
- ✅ All above documents
- ✅ Pre-shipment inspection passed

**For Payment**:
- ✅ Bill of Lading
- ✅ All export documents
- ✅ Final customs declaration

---

## 🚨 Common Pitfalls to Avoid

1. **15-Day Contract Notification**: Register contract with ECTA within 15 days
2. **90-Day Settlement**: Ensure payment received within 90 days
3. **License Expiry**: Renew export license annually
4. **Certificate Expiry**: Renew competence certificate before expiry
5. **L/C Compliance**: Ensure all documents match L/C terms exactly
6. **Pre-Shipment Inspection**: Mandatory - don't skip
7. **Final Declaration**: Must submit to NBE for future exports
8. **Record Retention**: Keep all documents for 5 years

---

## 📱 System Usage Guide

### For Exporters:
1. Register on platform with TIN
2. Apply for competence certificate
3. Apply for export license
4. Purchase coffee from ECX
5. Register sales contract
6. Track export progress through dashboard

### For ECTA Officers:
1. Review competence certificate applications
2. Conduct quality inspections
3. Approve sales contracts
4. Issue export permits
5. Issue certificates of origin

### For Bank Officers:
1. Verify export documents
2. Check L/C compliance
3. Process FX applications

### For NBE Officers:
1. Review FX applications
2. Approve FX allocations
3. Monitor settlement deadlines

### For Customs Officers:
1. Process customs declarations
2. Conduct physical inspections
3. Issue release notes
4. Issue final declarations

### For Shipping Lines:
1. Process booking requests
2. Allocate containers
3. Schedule pre-shipment inspections
4. Issue Bills of Lading

---

## 🔗 Database Workflow

```
exporter_profiles (TIN, business)
    ↓
coffee_laboratories + coffee_tasters
    ↓
competence_certificates
    ↓
export_licenses
    ↓
coffee_lots (ECX purchase)
    ↓
quality_inspections (ECTA)
    ↓
sales_contracts (15-day notification)
    ↓
certificates_of_origin
    ↓
document_verifications (Bank)
    ↓
fx_approvals (NBE, 90-day settlement)
    ↓
export_permits (ECTA)
    ↓
customs_clearances (Customs)
    ↓
shipments (Shipping Line)
    ↓
Final Declaration & Payment
```

---

## ✅ Success Criteria

Export is complete when:
- ✅ Coffee shipped
- ✅ Payment received (within 90 days)
- ✅ Final declaration submitted to NBE
- ✅ All records archived (5-year retention)
- ✅ No compliance violations

---

**This guide covers the complete Ethiopian coffee export process from business registration to final payment settlement, fully aligned with Ethiopian eSW standards.**
