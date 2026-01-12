# Exporter Qualification Workflow - Complete Guide

## 🎯 Overview

This document explains the **complete exporter pre-registration and qualification workflow** that an exporter must complete before being allowed to create export requests. The system uses `exporter_id` as the primary authentication and authorization mechanism.

---

## 🔑 Key Concept: exporter_id

**The `exporter_id` is the single source of truth for:**
- Exporter identity and authentication
- Qualification validation
- Export request authorization
- Document ownership verification
- Status tracking across all systems

**Flow:** `user_id` → `exporter_profile` → `exporter_id` → All qualifications

---

## 📋 Complete Qualification Checklist

Before an exporter can create an export request, they MUST have:

### ✅ 1. Exporter Profile (ACTIVE)
- Business registration
- TIN verification
- Minimum capital verification
- ECTA approval

### ✅ 2. Minimum Capital (Verified)
- Private: ETB 15,000,000
- Trade Association: ETB 20,000,000
- Joint Stock: ETB 20,000,000
- LLC: ETB 20,000,000
- Farmer: Exempt

### ✅ 3. ECTA-Certified Laboratory (ACTIVE)
- Equipment verification
- Facility inspection
- ECTA certification
- **Exemption:** Farmer-exporters

### ✅ 4. Qualified Coffee Taster (ACTIVE)
- Valid proficiency certificate
- Exclusive employee status
- ECTA verification
- **Exemption:** Farmer-exporters

### ✅ 5. Competence Certificate (ACTIVE)
- Laboratory + Taster verified
- Facility inspection passed
- ECTA issued
- Valid (not expired)

### ✅ 6. Export License (ACTIVE)
- Competence certificate verified
- EIC registration confirmed
- ECTA issued
- Valid (not expired)

---

## 🚀 Step-by-Step Workflow


### Step 1: User Registration & Profile Creation

**Actor:** Exporter (via Exporter Portal)

**Endpoint:** `POST /api/exporter/preregistration/profile`

**Required Data:**
```json
{
  "businessName": "ABC Coffee Exporters",
  "businessType": "PRIVATE" | "TRADE_ASSOCIATION" | "JOINT_STOCK" | "LLC" | "FARMER",
  "tin": "1234567890",
  "minimumCapital": 15000000,
  "city": "Addis Ababa",
  "region": "Addis Ababa",
  "contactPerson": "John Doe",
  "phoneNumber": "+251911234567",
  "email": "contact@abccoffee.com"
}
```

**System Actions:**
1. Creates `exporter_profile` record
2. Generates unique `exporter_id` (UUID)
3. Links `user_id` to `exporter_id`
4. Sets status to `PENDING_APPROVAL`
5. Notifies ECTA for review

**Result:**
- ✅ `exporter_id` created
- ⏳ Status: `PENDING_APPROVAL`
- 🔒 Cannot create exports yet

---

### Step 2: ECTA Profile Approval

**Actor:** ECTA Officer (via ECTA Management Portal)

**Endpoint:** `POST /api/ecta/preregistration/exporters/:exporterId/approve`

**ECTA Verifies:**
- Business registration documents
- TIN validity
- Capital verification (bank statement)
- Business address
- Contact information

**System Actions:**
1. Updates profile status to `ACTIVE`
2. Records `approved_by` and `approved_at`
3. Notifies exporter via email/SMS
4. Enables next steps

**Result:**
- ✅ Profile Status: `ACTIVE`
- ✅ Checkpoint 1/6 Complete
- 🔒 Still cannot create exports

---

### Step 3: Laboratory Certification (Non-Farmers Only)

**Actor:** Exporter (via Exporter Portal)

**Endpoint:** `POST /api/exporter/preregistration/laboratory`

**Required Data:**
```json
{
  "exporterId": "uuid-from-step-1",
  "laboratoryName": "ABC Coffee Lab",
  "address": "Bole, Addis Ababa",
  "hasRoastingFacility": true,
  "hasCuppingRoom": true,
  "hasSampleStorage": true,
  "equipment": [
    "Roasting Machine",
    "Cupping Table",
    "Moisture Meter",
    "Sample Roaster"
  ]
}
```

**ECTA Certification Process:**
1. Exporter submits laboratory details
2. ECTA schedules facility inspection
3. ECTA officer verifies equipment and facilities
4. ECTA issues certification (if passed)

**Endpoint:** `POST /api/ecta/preregistration/laboratories/:laboratoryId/certify`

**System Actions:**
1. Creates `coffee_laboratories` record
2. Links to `exporter_id`
3. Sets status to `ACTIVE` after certification
4. Records certification number and expiry date

**Result:**
- ✅ Laboratory Status: `ACTIVE`
- ✅ Checkpoint 2/6 Complete
- 🔒 Still cannot create exports

**Note:** Farmer-exporters are **exempt** from this requirement.

---

### Step 4: Taster Verification (Non-Farmers Only)

**Actor:** Exporter (via Exporter Portal)

**Endpoint:** `POST /api/exporter/preregistration/taster`

**Required Data:**
```json
{
  "exporterId": "uuid-from-step-1",
  "fullName": "Jane Smith",
  "proficiencyCertificateNumber": "TASTER-2025-001",
  "certificateIssueDate": "2025-01-01",
  "certificateExpiryDate": "2027-01-01",
  "qualificationLevel": "Q Grader Level 2",
  "isExclusiveEmployee": true
}
```

**ECTA Verification Process:**
1. Exporter submits taster credentials
2. ECTA verifies proficiency certificate
3. ECTA confirms exclusive employment
4. ECTA approves taster

**Endpoint:** `POST /api/ecta/preregistration/tasters/:tasterId/verify`

**System Actions:**
1. Creates `coffee_tasters` record
2. Links to `exporter_id`
3. Sets status to `ACTIVE` after verification
4. Records certificate details

**Result:**
- ✅ Taster Status: `ACTIVE`
- ✅ Checkpoint 3/6 Complete
- 🔒 Still cannot create exports

**Note:** Farmer-exporters are **exempt** from this requirement.

---

### Step 5: Competence Certificate Application

**Actor:** Exporter (via Exporter Portal)

**Endpoint:** `POST /api/exporter/preregistration/competence/apply`

**Prerequisites:**
- ✅ Profile: `ACTIVE`
- ✅ Laboratory: `ACTIVE` (or farmer exemption)
- ✅ Taster: `ACTIVE` (or farmer exemption)

**System Validation:**
```typescript
// Automatic validation by system
const validation = await ectaPreRegistrationService.validateExporter(exporterId);

if (!validation.hasCertifiedLaboratory) {
  throw new Error('Laboratory must be certified first');
}

if (!validation.hasQualifiedTaster) {
  throw new Error('Taster must be verified first');
}
```

**ECTA Issuance Process:**
1. Exporter applies for competence certificate
2. ECTA verifies laboratory and taster
3. ECTA conducts facility inspection
4. ECTA issues competence certificate

**Endpoint:** `POST /api/ecta/preregistration/competence/:exporterId/issue`

**System Actions:**
1. Creates `competence_certificates` record
2. Links to `exporter_id`, `laboratory_id`, `taster_id`
3. Sets status to `ACTIVE`
4. Records certificate number and expiry date (1 year validity)

**Result:**
- ✅ Competence Certificate: `ACTIVE`
- ✅ Checkpoint 4/6 Complete
- 🔒 Still cannot create exports

---

### Step 6: Export License Application

**Actor:** Exporter (via Exporter Portal)

**Endpoint:** `POST /api/exporter/preregistration/license/apply`

**Required Data:**
```json
{
  "exporterId": "uuid-from-step-1",
  "eicRegistrationNumber": "EIC-2025-001",
  "requestedCoffeeTypes": ["ARABICA", "ROBUSTA"],
  "requestedOrigins": ["Sidamo", "Yirgacheffe", "Harar"],
  "annualQuota": 1000000
}
```

**Prerequisites:**
- ✅ Profile: `ACTIVE`
- ✅ Minimum Capital: Verified
- ✅ Competence Certificate: `ACTIVE`
- ✅ EIC Registration: Valid

**System Validation:**
```typescript
const validation = await ectaPreRegistrationService.validateExporter(exporterId);

if (!validation.hasCompetenceCertificate) {
  throw new Error('Competence certificate required');
}

if (!validation.hasMinimumCapital) {
  throw new Error('Minimum capital not verified');
}
```

**ECTA Issuance Process:**
1. Exporter applies for export license
2. ECTA verifies competence certificate
3. ECTA confirms EIC registration
4. ECTA issues export license

**Endpoint:** `POST /api/ecta/preregistration/licenses/:exporterId/issue`

**System Actions:**
1. Creates `export_licenses` record
2. Links to `exporter_id` and `competence_certificate_id`
3. Sets status to `ACTIVE`
4. Records license number and expiry date (1 year validity)
5. Records authorized coffee types and origins

**Result:**
- ✅ Export License: `ACTIVE`
- ✅ Checkpoint 5/6 Complete
- 🔒 Still cannot create exports (need final validation)

---

### Step 7: Final Qualification Validation

**Actor:** System (Automatic)

**Endpoint:** `GET /api/exporter/preregistration/qualification-status`

**System Validation:**
```typescript
const validation = await ectaPreRegistrationService.validateExporter(exporterId);

// Checks all 6 requirements:
validation.isValid = 
  validation.hasValidProfile &&           // ✅ Step 2
  validation.hasMinimumCapital &&         // ✅ Step 2
  validation.hasCertifiedLaboratory &&    // ✅ Step 3 (or exempt)
  validation.hasQualifiedTaster &&        // ✅ Step 4 (or exempt)
  validation.hasCompetenceCertificate &&  // ✅ Step 5
  validation.hasExportLicense;            // ✅ Step 6
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "exporterId": "uuid-from-step-1",
    "hasValidProfile": true,
    "hasMinimumCapital": true,
    "hasCertifiedLaboratory": true,
    "hasQualifiedTaster": true,
    "hasCompetenceCertificate": true,
    "hasExportLicense": true,
    "issues": [],
    "requiredActions": [],
    "canCreateExportRequest": true
  }
}
```

**Result:**
- ✅ All 6 Checkpoints Complete
- ✅ **QUALIFIED TO EXPORT**
- 🎉 Can now create export requests!

---


## 🎯 Step 8: Create Export Request (AUTHORIZED)

**Actor:** Qualified Exporter (via Exporter Portal)

**Endpoint:** `POST /api/exporter/exports`

**Critical Validation Flow:**

```typescript
// 1. Get user_id from JWT token
const userId = req.user.id;

// 2. Get exporter_id from user_id
const profile = await repository.getExporterProfileByUserId(userId);
if (!profile) {
  throw new Error('Exporter profile not found');
}
const exporterId = profile.exporterId;

// 3. Validate exporter qualification
const qualificationCheck = await ectaPreRegistrationService.canCreateExportRequest(exporterId);

if (!qualificationCheck.allowed) {
  return res.status(403).json({
    success: false,
    message: 'Cannot create export request. Pre-qualification requirements not met.',
    reason: qualificationCheck.reason,
    requiredActions: qualificationCheck.requiredActions
  });
}

// 4. Create export with exporter_id
const result = await pool.query(
  `INSERT INTO exports (export_id, exporter_id, ...) VALUES ($1, $2, ...)`,
  [exportId, exporterId, ...]
);
```

**Required Data:**
```json
{
  "exportId": "EXP-2026-001",
  "coffeeType": "ARABICA",
  "quantity": 1000,
  "destinationCountry": "United States",
  "estimatedValue": 50000,
  "exportLicenseNumber": "LIC-2025-001",
  "competenceCertificateNumber": "COMP-2025-001",
  "ecxLotNumber": "LOT-2025-001",
  "warehouseReceiptNumber": "WR-2025-001",
  "qualityCertificateNumber": "QC-2025-001",
  "salesContractNumber": "SC-2025-001",
  "exportPermitNumber": "EP-2025-001",
  "originCertificateNumber": "OC-2025-001"
}
```

**System Actions:**
1. Validates `exporter_id` qualification (all 6 checkpoints)
2. Validates required pre-existing documents
3. Creates `exports` record with `exporter_id`
4. Sets initial status to `DRAFT`
5. Creates audit trail in `export_status_history`
6. Returns export details

**Result:**
- ✅ Export Created
- ✅ Status: `DRAFT`
- ✅ Linked to `exporter_id`
- 🎉 Ready for ECTA approvals

---

## 🔐 Security & Authorization

### How exporter_id Protects the System

**1. Authentication Chain:**
```
JWT Token → user_id → exporter_profile → exporter_id
```

**2. Authorization Checks:**
```typescript
// Every export operation validates ownership
const export = await getExport(exportId);
if (export.exporter_id !== currentExporterId) {
  throw new Error('Unauthorized: Export does not belong to this exporter');
}
```

**3. Qualification Validation:**
```typescript
// Before ANY export creation
const canExport = await ectaPreRegistrationService.canCreateExportRequest(exporterId);
if (!canExport.allowed) {
  throw new Error('Not qualified to create exports');
}
```

**4. Document Ownership:**
```typescript
// All documents linked to exporter_id
const documents = await getDocuments(exporterId);
const licenses = await getLicenses(exporterId);
const certificates = await getCertificates(exporterId);
```

---

## 📊 Database Schema

### Core Tables

**1. exporter_profiles**
```sql
CREATE TABLE exporter_profiles (
  exporter_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  business_name VARCHAR(255),
  business_type VARCHAR(50),
  tin VARCHAR(50) UNIQUE,
  minimum_capital DECIMAL(15,2),
  capital_verified BOOLEAN,
  status VARCHAR(50), -- PENDING_APPROVAL, ACTIVE, REJECTED, SUSPENDED
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**2. coffee_laboratories**
```sql
CREATE TABLE coffee_laboratories (
  laboratory_id UUID PRIMARY KEY,
  exporter_id UUID REFERENCES exporter_profiles(exporter_id),
  laboratory_name VARCHAR(255),
  certification_number VARCHAR(100),
  status VARCHAR(50), -- PENDING, ACTIVE, EXPIRED, REJECTED
  expiry_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**3. coffee_tasters**
```sql
CREATE TABLE coffee_tasters (
  taster_id UUID PRIMARY KEY,
  exporter_id UUID REFERENCES exporter_profiles(exporter_id),
  full_name VARCHAR(255),
  proficiency_certificate_number VARCHAR(100),
  certificate_expiry_date DATE,
  is_exclusive_employee BOOLEAN,
  status VARCHAR(50), -- PENDING, ACTIVE, EXPIRED, REJECTED
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**4. competence_certificates**
```sql
CREATE TABLE competence_certificates (
  certificate_id UUID PRIMARY KEY,
  exporter_id UUID REFERENCES exporter_profiles(exporter_id),
  laboratory_id UUID REFERENCES coffee_laboratories(laboratory_id),
  taster_id UUID REFERENCES coffee_tasters(taster_id),
  certificate_number VARCHAR(100) UNIQUE,
  issued_date DATE,
  expiry_date DATE,
  status VARCHAR(50), -- PENDING, ACTIVE, EXPIRED, REJECTED
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**5. export_licenses**
```sql
CREATE TABLE export_licenses (
  license_id UUID PRIMARY KEY,
  exporter_id UUID REFERENCES exporter_profiles(exporter_id),
  competence_certificate_id UUID REFERENCES competence_certificates(certificate_id),
  license_number VARCHAR(100) UNIQUE,
  eic_registration_number VARCHAR(100),
  issued_date DATE,
  expiry_date DATE,
  authorized_coffee_types TEXT[],
  authorized_origins TEXT[],
  annual_quota DECIMAL(15,2),
  status VARCHAR(50), -- PENDING, ACTIVE, EXPIRED, SUSPENDED, REJECTED
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**6. exports**
```sql
CREATE TABLE exports (
  export_id VARCHAR(50) PRIMARY KEY,
  exporter_id UUID REFERENCES exporter_profiles(exporter_id), -- KEY LINK
  exporter_name VARCHAR(255),
  exporter_tin VARCHAR(50),
  export_license_number VARCHAR(100),
  coffee_type VARCHAR(50),
  quantity DECIMAL(10,2),
  destination_country VARCHAR(100),
  estimated_value DECIMAL(15,2),
  status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔄 Status Flow Diagram

```
USER REGISTRATION
      ↓
[user_id created]
      ↓
EXPORTER PROFILE REGISTRATION
      ↓
[exporter_id created] → Status: PENDING_APPROVAL
      ↓
ECTA PROFILE APPROVAL
      ↓
Status: ACTIVE (1/6 ✅)
      ↓
LABORATORY CERTIFICATION (or farmer exemption)
      ↓
Laboratory: ACTIVE (2/6 ✅)
      ↓
TASTER VERIFICATION (or farmer exemption)
      ↓
Taster: ACTIVE (3/6 ✅)
      ↓
COMPETENCE CERTIFICATE APPLICATION
      ↓
Competence: ACTIVE (4/6 ✅)
      ↓
EXPORT LICENSE APPLICATION
      ↓
License: ACTIVE (5/6 ✅)
      ↓
FINAL VALIDATION
      ↓
All Checks: PASSED (6/6 ✅)
      ↓
✅ QUALIFIED TO CREATE EXPORTS
      ↓
CREATE EXPORT REQUEST
      ↓
Export: DRAFT → SUBMITTED → ECTA_LICENSE_PENDING → ...
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Exporter profile not found"
**Cause:** User hasn't registered as exporter
**Solution:** Complete Step 1 (Profile Registration)

### Issue 2: "Cannot create export request. Pre-qualification requirements not met"
**Cause:** Missing one or more qualifications
**Solution:** Check qualification status endpoint to see what's missing

### Issue 3: "Laboratory must be certified first"
**Cause:** Trying to apply for competence certificate without laboratory
**Solution:** Complete Step 3 (Laboratory Certification) or register as farmer

### Issue 4: "Competence certificate required"
**Cause:** Trying to apply for export license without competence certificate
**Solution:** Complete Step 5 (Competence Certificate)

### Issue 5: "Export license expired"
**Cause:** License validity period (1 year) has passed
**Solution:** Renew export license with ECTA

### Issue 6: "Unauthorized: Export does not belong to this exporter"
**Cause:** Trying to access another exporter's export
**Solution:** Only access your own exports (linked to your exporter_id)

---

## 📝 API Endpoints Summary

### Exporter Portal (Exporter Actions)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/exporter/preregistration/profile` | POST | Register exporter profile |
| `/api/exporter/preregistration/laboratory` | POST | Submit laboratory for certification |
| `/api/exporter/preregistration/taster` | POST | Submit taster for verification |
| `/api/exporter/preregistration/competence/apply` | POST | Apply for competence certificate |
| `/api/exporter/preregistration/license/apply` | POST | Apply for export license |
| `/api/exporter/preregistration/qualification-status` | GET | Check qualification status |
| `/api/exporter/exports` | POST | Create export request |
| `/api/exporter/exports` | GET | Get my exports |

### ECTA Management Portal (ECTA Actions)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ecta/preregistration/exporters/pending` | GET | Get pending profiles |
| `/api/ecta/preregistration/exporters/:id/approve` | POST | Approve exporter profile |
| `/api/ecta/preregistration/exporters/:id/reject` | POST | Reject exporter profile |
| `/api/ecta/preregistration/laboratories/pending` | GET | Get pending laboratories |
| `/api/ecta/preregistration/laboratories/:id/certify` | POST | Certify laboratory |
| `/api/ecta/preregistration/tasters/pending` | GET | Get pending tasters |
| `/api/ecta/preregistration/tasters/:id/verify` | POST | Verify taster |
| `/api/ecta/preregistration/competence/pending` | GET | Get pending competence apps |
| `/api/ecta/preregistration/competence/:id/issue` | POST | Issue competence certificate |
| `/api/ecta/preregistration/licenses/pending` | GET | Get pending license apps |
| `/api/ecta/preregistration/licenses/:id/issue` | POST | Issue export license |
| `/api/ecta/preregistration/exporters/:id/validate` | GET | Validate exporter qualification |

---

## 🎓 Best Practices

### For Exporters

1. **Complete registration in order** - Don't skip steps
2. **Keep documents ready** - Have all certificates and registrations prepared
3. **Monitor expiry dates** - Renew licenses and certificates before expiry
4. **Check qualification status** - Before attempting to create exports
5. **Maintain accurate information** - Update profile if business details change

### For ECTA Officers

1. **Verify documents thoroughly** - Check authenticity of all submissions
2. **Conduct proper inspections** - Physical verification of facilities
3. **Provide clear rejection reasons** - Help exporters understand what's needed
4. **Track expiry dates** - Send renewal reminders to exporters
5. **Use dashboard for overview** - Monitor all exporters' qualification status

### For Developers

1. **Always validate exporter_id** - Before any export operation
2. **Use service layer** - Don't bypass `ectaPreRegistrationService.validateExporter()`
3. **Handle exemptions** - Farmer-exporters have different requirements
4. **Log all actions** - Maintain audit trail for compliance
5. **Return helpful errors** - Include `requiredActions` in error responses

---

## 📈 Success Metrics

### System Tracks:

- **Total Registered Exporters:** Count of all exporter profiles
- **Qualified Exporters:** Count with all 6 checkpoints complete
- **Pending Approvals:** Count at each stage
- **Average Qualification Time:** Days from registration to fully qualified
- **Rejection Rate:** Percentage of applications rejected at each stage
- **Renewal Rate:** Percentage of exporters renewing on time

### Dashboard Queries:

```sql
-- Total qualified exporters
SELECT COUNT(*) FROM exporter_profiles ep
WHERE ep.status = 'ACTIVE'
  AND EXISTS (SELECT 1 FROM export_licenses el WHERE el.exporter_id = ep.exporter_id AND el.status = 'ACTIVE');

-- Exporters by qualification stage
SELECT 
  COUNT(CASE WHEN ep.status = 'ACTIVE' THEN 1 END) as profile_approved,
  COUNT(CASE WHEN cl.status = 'ACTIVE' THEN 1 END) as lab_certified,
  COUNT(CASE WHEN ct.status = 'ACTIVE' THEN 1 END) as taster_verified,
  COUNT(CASE WHEN cc.status = 'ACTIVE' THEN 1 END) as competence_issued,
  COUNT(CASE WHEN el.status = 'ACTIVE' THEN 1 END) as license_issued
FROM exporter_profiles ep
LEFT JOIN coffee_laboratories cl ON cl.exporter_id = ep.exporter_id
LEFT JOIN coffee_tasters ct ON ct.exporter_id = ep.exporter_id
LEFT JOIN competence_certificates cc ON cc.exporter_id = ep.exporter_id
LEFT JOIN export_licenses el ON el.exporter_id = ep.exporter_id;
```

---

## 🎯 Conclusion

The exporter qualification workflow ensures that **only properly qualified exporters** can create export requests. The `exporter_id` serves as the central authentication and authorization mechanism, linking:

- User identity (`user_id`)
- Business profile (`exporter_profile`)
- Laboratory certification (`coffee_laboratories`)
- Taster verification (`coffee_tasters`)
- Competence certificate (`competence_certificates`)
- Export license (`export_licenses`)
- Export requests (`exports`)

**All 6 checkpoints must be complete before an exporter can create export requests.**

This system ensures compliance with Ethiopian coffee export regulations and ECTA Directive 1106/2025.

---

**Document Version:** 1.0.0  
**Last Updated:** January 1, 2026  
**Status:** ✅ Complete and Production Ready

