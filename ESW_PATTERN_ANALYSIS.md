# ESW Pattern Analysis & Application to Exporter Registration

## 🎯 How ESW Works - The Pattern

### ESW Architecture Overview

**ESW (Electronic Single Window)** is a **parallel approval system** where:
1. Exporter submits export to ESW with all required documents
2. ESW automatically creates approval records for **16 government agencies**
3. All 16 agencies review **in parallel** (not sequential)
4. Each agency can: APPROVE, REJECT, or REQUEST_INFO
5. Export proceeds only when **ALL agencies approve**

### Key ESW Components

#### 1. Submission Table (`esw_submissions`)
```sql
CREATE TABLE esw_submissions (
    submission_id UUID PRIMARY KEY,
    export_id UUID REFERENCES exports(export_id),
    esw_reference_number VARCHAR(50) UNIQUE,
    status VARCHAR(50), -- SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
    submitted_at TIMESTAMP,
    submitted_by VARCHAR(255),
    approved_at TIMESTAMP,
    ...
);
```

#### 2. Agency Approvals Table (`esw_agency_approvals`)
```sql
CREATE TABLE esw_agency_approvals (
    approval_id UUID PRIMARY KEY,
    submission_id UUID REFERENCES esw_submissions(submission_id),
    agency_code VARCHAR(50) REFERENCES esw_agencies(agency_code),
    status VARCHAR(50), -- PENDING, UNDER_REVIEW, APPROVED, REJECTED, INFO_REQUIRED
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    ...
);
```

#### 3. Agencies Table (`esw_agencies`)
```sql
CREATE TABLE esw_agencies (
    agency_code VARCHAR(50) PRIMARY KEY,
    agency_name VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    ...
);
```

### ESW Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Exporter Submits to ESW                             │
│ POST /api/esw/submissions                                    │
│ { exportId, documents: [], certificates: [] }               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: ESW Creates Approval Records (Automatic)            │
│ - Creates 1 esw_submission record                           │
│ - Creates 16 esw_agency_approval records (one per agency)   │
│ - All start with status: PENDING                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Agencies Review in Parallel                         │
│ - Ministry of Trade                                          │
│ - Ministry of Agriculture                                    │
│ - Ethiopian Customs Commission                               │
│ - National Bank of Ethiopia                                  │
│ - ... (12 more agencies)                                     │
│                                                              │
│ Each agency: GET /api/esw/agencies/{code}/pending           │
│ Each agency: POST /api/esw/submissions/{id}/agencies/{code}/approve │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: ESW Checks Overall Status (Automatic)               │
│ - If ALL 16 agencies APPROVED → submission.status = APPROVED│
│ - If ANY agency REJECTED → submission.status = REJECTED     │
│ - Otherwise → submission.status = UNDER_REVIEW              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Applying ESW Pattern to Exporter Registration

### Current Exporter Registration Problem

**Current State:**
- Exporter submits profile, laboratory, taster, competence, license **separately**
- Each checkpoint is **independent**
- No unified "application" concept
- ECTA approves each checkpoint **individually**
- Hard to track overall qualification status

**Issues:**
1. Profile registration fails with "Exporter profile not found"
2. Checkpoints are disconnected
3. No single "application" to track
4. Organization mismatch (exporter_portal vs commercial-bank)

### Proposed Solution: ESW-Style Registration

**New Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Exporter Submits Complete Application               │
│ POST /api/exporter/application/submit                        │
│ {                                                            │
│   profile: { businessName, tin, ... },                      │
│   laboratory: { name, location, ... },                      │
│   taster: { name, certificate, ... },                       │
│   competence: { certificate, ... },                         │
│   license: { eicNumber, ... }                               │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: System Creates All Records (Automatic)              │
│ - Creates 1 exporter_application record                     │
│ - Creates 1 exporter_profile record (status: PENDING)       │
│ - Creates 1 coffee_laboratory record (status: PENDING)      │
│ - Creates 1 coffee_taster record (status: PENDING)          │
│ - Creates 1 competence_certificate record (status: PENDING) │
│ - Creates 1 export_license record (status: PENDING)         │
│ - Creates 6 checkpoint_approvals records                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: ECTA Reviews All Checkpoints                        │
│ GET /api/ecta/applications/pending                          │
│ POST /api/ecta/applications/{id}/checkpoints/{type}/approve │
│                                                              │
│ Checkpoints:                                                 │
│ 1. Profile (PENDING → APPROVED)                             │
│ 2. Capital (PENDING → APPROVED)                             │
│ 3. Laboratory (PENDING → APPROVED)                          │
│ 4. Taster (PENDING → APPROVED)                              │
│ 5. Competence (PENDING → APPROVED)                          │
│ 6. License (PENDING → APPROVED)                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: System Updates Overall Status (Automatic)           │
│ - If ALL 6 checkpoints APPROVED → QUALIFIED                 │
│ - If ANY checkpoint REJECTED → REJECTED                     │
│ - Otherwise → UNDER_REVIEW                                   │
│                                                              │
│ Exporter can now create export requests!                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 New Database Schema

### 1. Exporter Applications Table
```sql
CREATE TABLE exporter_applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exporter_id UUID REFERENCES exporter_profiles(exporter_id),
    application_reference VARCHAR(50) UNIQUE,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, UNDER_REVIEW, APPROVED, REJECTED, QUALIFIED
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(255),
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Checkpoint Approvals Table
```sql
CREATE TABLE checkpoint_approvals (
    approval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES exporter_applications(application_id),
    checkpoint_type VARCHAR(50), -- PROFILE, CAPITAL, LABORATORY, TASTER, COMPETENCE, LICENSE
    checkpoint_id UUID, -- References specific record (profile_id, laboratory_id, etc.)
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, UNDER_REVIEW, APPROVED, REJECTED, INFO_REQUIRED
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    additional_info_request TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Implementation Plan

### Phase 1: Database Migration (30 minutes)
1. Create `exporter_applications` table
2. Create `checkpoint_approvals` table
3. Add indexes for performance
4. Seed test data

### Phase 2: Backend API (1 hour)
1. Create `ExporterApplicationService`
2. Create `ExporterApplicationController`
3. Add routes:
   - `POST /api/exporter/application/submit` - Submit complete application
   - `GET /api/exporter/application/status` - Check application status
   - `GET /api/ecta/applications/pending` - Get pending applications
   - `POST /api/ecta/applications/:id/checkpoints/:type/approve` - Approve checkpoint

### Phase 3: Update Test Script (30 minutes)
1. Change from individual checkpoint submissions to single application
2. Add application status checking
3. Simplify workflow

### Phase 4: Frontend Integration (1 hour)
1. Create unified application form
2. Add application status tracker
3. Update ECTA dashboard

---

## 🎯 Benefits of ESW Pattern

### 1. Single Source of Truth
- One `application_id` tracks everything
- Clear overall status
- Easy to query

### 2. Atomic Operations
- All records created together
- No partial states
- Consistent data

### 3. Parallel Processing
- ECTA can review all checkpoints simultaneously
- Faster approval process
- Better user experience

### 4. Clear Status Tracking
- Application-level status
- Checkpoint-level status
- Easy to see what's pending

### 5. Better Error Handling
- No "profile not found" errors
- All records exist from start
- Clear dependencies

---

## 🚀 Quick Win: Simplified Test Script

Instead of implementing the full ESW pattern immediately, we can **fix the test script** to work with the current architecture:

### Option A: Use Commercial Bank Exclusively (Recommended)
```javascript
// Register at Commercial Bank
const response = await axios.post(
  'http://localhost:3001/api/auth/register',
  {
    username: 'test_exporter_001',
    password: 'Test123!',
    organizationId: 'commercial-bank', // Key change!
    role: 'exporter'
  }
);

// All subsequent operations use Commercial Bank API
// No Exporter Portal involvement
```

### Option B: Implement ESW-Style Application
```javascript
// Submit complete application in one call
const response = await axios.post(
  'http://localhost:3004/api/exporter/application/submit',
  {
    profile: { ... },
    laboratory: { ... },
    taster: { ... },
    competence: { ... },
    license: { ... }
  }
);

// System creates all records automatically
// Returns application_id for tracking
```

---

## 📝 Recommendation

**For Immediate Testing:** Use Option A (Commercial Bank exclusively)
- Fastest to implement (5 minutes)
- Works with existing architecture
- 90%+ success rate expected

**For Production:** Implement Option B (ESW-style application)
- Better user experience
- Cleaner architecture
- Matches ESW pattern
- More maintainable

---

## 🎉 Summary

**ESW Pattern Key Principles:**
1. **Single submission** creates all related records
2. **Parallel processing** by multiple reviewers
3. **Automatic status aggregation** based on all approvals
4. **Clear tracking** with reference numbers
5. **Atomic operations** prevent partial states

**Application to Exporter Registration:**
- Submit complete application once
- System creates all 6 checkpoint records
- ECTA reviews all checkpoints in parallel
- System automatically determines qualification status
- Exporter can create exports when qualified

**This pattern eliminates the "profile not found" errors and provides a much better user experience!** 🚀
