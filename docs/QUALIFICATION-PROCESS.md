# Exporter Qualification Process

## Date: March 4, 2026
## Understanding Auto-Approval vs Full Qualification

---

## 🎯 Two Different Things

### 1. Registration Approval (Auto-Validated) ✅
**What it means**: User can login to the system

**What the smart contract checks**:
- ✅ Capital >= minimum requirement (50M ETB for private exporters)
- ✅ Valid TIN format (TIN followed by 10+ digits)
- ✅ No duplicate TIN
- ✅ Valid email format
- ✅ Company name >= 3 characters

**Result**: User status = `approved`, can login immediately

### 2. Full Qualification (Manual ECTA Approval) ❌
**What it means**: User can create export requests and export coffee

**What ECTA must approve**:
1. ❌ Competence Certificate (training completed)
2. ❌ Laboratory Certificate (facility inspected)
3. ❌ Taster Certificate (Q Grader certified)
4. ❌ Export License (final license issued)

**Result**: User status = `active`, has `licenseNumber`

---

## 📊 Qualification Stages

### Stage 1: Registration (AUTO-APPROVED)
```
User registers with valid data
  ↓
Smart contract validates:
  - Capital sufficient?
  - TIN valid?
  - Email valid?
  ↓
If all pass → status = 'approved'
If any fail → status = 'rejected'
```

**User can now**:
- ✅ Login to system
- ✅ View dashboard
- ✅ Submit qualification documents

**User CANNOT**:
- ❌ Create export requests
- ❌ Export coffee
- ❌ Issue certificates

---

### Stage 2: Competence Certificate (ECTA APPROVAL REQUIRED)
```
Exporter submits:
  - Training completion proof
  - Assessment results
  ↓
ECTA reviews and approves
  ↓
System generates PDF certificate
```

**API Endpoint**:
```
POST /api/ecta/qualifications/:username/competenceCertificate/approve
Authorization: Bearer ECTA_TOKEN

Body:
{
  "comments": "Training completed successfully",
  "trainingProgram": "Coffee Export Competence Training",
  "assessmentScore": "95%"
}
```

---

### Stage 3: Laboratory Certificate (ECTA APPROVAL REQUIRED)
```
Exporter submits:
  - Laboratory facility details
  - Equipment list
  ↓
ECTA inspects facility
  ↓
ECTA approves
  ↓
System generates PDF certificate
```

**API Endpoint**:
```
POST /api/ecta/qualifications/:username/laboratory/approve
Authorization: Bearer ECTA_TOKEN

Body:
{
  "comments": "Facility meets all requirements",
  "laboratoryName": "Exporter Coffee Lab",
  "inspector": "ECTA Inspector Name"
}
```

---

### Stage 4: Taster Certificate (ECTA APPROVAL REQUIRED)
```
Exporter submits:
  - Q Grader certification
  - Tasting experience
  ↓
ECTA verifies credentials
  ↓
ECTA approves
  ↓
System generates PDF certificate
```

**API Endpoint**:
```
POST /api/ecta/qualifications/:username/taster/approve
Authorization: Bearer ECTA_TOKEN

Body:
{
  "comments": "Q Grader certified",
  "tasterName": "Taster Name",
  "certificationLevel": "Q Grader Certified"
}
```

---

### Stage 5: Export License (ECTA ISSUES)
```
All 3 certificates approved
  ↓
ECTA issues export license
  ↓
System generates PDF license
  ↓
User status = 'active'
  ↓
User is now FULLY QUALIFIED
```

**API Endpoint**:
```
POST /api/ecta/license/issue
Authorization: Bearer ECTA_TOKEN

Body:
{
  "exporterId": "username",
  "licenseNumber": "LIC-2026-001",
  "expiryDate": "2027-03-04"
}
```

---

## 🔍 Checking Qualification Status

### Via API:
```bash
GET /api/exporter/profile/:username
Authorization: Bearer TOKEN
```

**Response**:
```json
{
  "profile": {
    "status": "approved",  // or "active" when fully qualified
    "licenseNumber": null  // or "LIC-2026-001" when licensed
  },
  "qualifications": {
    "competenceCertificate": { "status": "not_started" },
    "laboratory": { "status": "not_started" },
    "taster": { "status": "not_started" },
    "exportLicense": { "status": "not_started" }
  },
  "isFullyQualified": false  // true when status='active' AND licenseNumber exists
}
```

### Via Database:
```sql
-- Check exporter profile
SELECT user_id, business_name, status 
FROM exporter_profiles 
WHERE user_id = 'username';

-- Check if fully qualified
SELECT user_id, business_name, status
FROM exporter_profiles 
WHERE user_id = 'username' 
  AND status = 'ACTIVE';
```

### Via Blockchain:
```javascript
const fabricCLI = require('./src/services/fabric-cli-final');
const user = await fabricCLI.getUser('username');

console.log('Status:', user.status);  // 'approved' or 'active'
console.log('Pre-registration:', user.preRegistrationStatus);
```

---

## 📈 Qualification Progress

### Just Registered (Auto-Approved):
```
Profile: ✅ Approved (auto)
Competence: ❌ Not started
Laboratory: ❌ Not started
Taster: ❌ Not started
License: ❌ Not started

Status: approved
Can login: YES
Can export: NO
```

### Partially Qualified:
```
Profile: ✅ Approved
Competence: ✅ Approved
Laboratory: ✅ Approved
Taster: ⏳ Pending
License: ❌ Not started

Status: approved
Can login: YES
Can export: NO
```

### Fully Qualified:
```
Profile: ✅ Approved
Competence: ✅ Approved
Laboratory: ✅ Approved
Taster: ✅ Approved
License: ✅ Issued (LIC-2026-001)

Status: active
Can login: YES
Can export: YES ✅
```

---

## 🚀 Quick Test: Approve All Stages

To quickly create a fully qualified exporter for testing:

```bash
# 1. Register exporter (auto-approved)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_qualified",
    "password": "Test@1234",
    "email": "qualified@test.com",
    "companyName": "Test Qualified Coffee PLC",
    "tin": "TIN1234567890",
    "capitalETB": 75000000,
    "businessType": "PRIVATE_EXPORTER",
    "phone": "+251911234567",
    "address": "Addis Ababa"
  }'

# 2. Login as ECTA admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ecta_admin","password":"admin123"}'
# Save the token

# 3. Approve competence certificate
curl -X POST http://localhost:3000/api/ecta/qualifications/test_qualified/competenceCertificate/approve \
  -H "Authorization: Bearer ECTA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comments":"Approved","trainingProgram":"Training","assessmentScore":"95%"}'

# 4. Approve laboratory certificate
curl -X POST http://localhost:3000/api/ecta/qualifications/test_qualified/laboratory/approve \
  -H "Authorization: Bearer ECTA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comments":"Approved","laboratoryName":"Lab","inspector":"Inspector"}'

# 5. Approve taster certificate
curl -X POST http://localhost:3000/api/ecta/qualifications/test_qualified/taster/approve \
  -H "Authorization: Bearer ECTA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comments":"Approved","tasterName":"Taster","certificationLevel":"Q Grader"}'

# 6. Issue export license
curl -X POST http://localhost:3000/api/ecta/license/issue \
  -H "Authorization: Bearer ECTA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exporterId":"test_qualified","licenseNumber":"LIC-2026-TEST-001","expiryDate":"2027-03-04"}'

# 7. Verify fully qualified
curl -X GET http://localhost:3000/api/exporter/profile/test_qualified \
  -H "Authorization: Bearer EXPORTER_TOKEN"
```

---

## 💡 Key Takeaways

1. **Auto-approval ≠ Fully qualified**
   - Auto-approval: Can login
   - Fully qualified: Can export coffee

2. **ECTA must manually approve 4 stages**
   - Competence Certificate
   - Laboratory Certificate
   - Taster Certificate
   - Export License

3. **Status progression**:
   - `pending_approval` → Registration not validated
   - `rejected` → Failed validation
   - `approved` → Can login, but not export
   - `active` → Fully qualified, can export

4. **Frontend should show**:
   - Current qualification stage
   - What documents are needed
   - Progress indicator
   - Next steps

---

## 📝 Related Documentation

- `docs/MANUAL-TESTING-GUIDE.md` - Complete testing guide
- `docs/CERTIFICATE-QUICK-REFERENCE.md` - Certificate generation
- `docs/AUTO-VALIDATION-SUCCESS.md` - Auto-validation details
- `docs/TASK-5-COMPLETE.md` - Auto-validation implementation

---

**Status**: 📚 DOCUMENTED
**Last Updated**: March 4, 2026
