# Manual Testing Guide - Complete System Verification

## Prerequisites

Before starting manual tests, ensure:
- ✅ All Docker services are running
- ✅ Blockchain network is operational
- ✅ PostgreSQL database is accessible
- ✅ You have Postman or similar API testing tool

---

## Test Environment Setup

### 1. Verify Services are Running

```powershell
# Check all services
docker ps --filter "name=coffee"

# Expected output: All services should show "healthy" status
# - coffee-frontend (Up, healthy)
# - coffee-gateway (Up, healthy)
# - coffee-postgres (Up, healthy)
# - coffee-redis (Up, healthy)
# - coffee-kafka (Up, healthy)
```

### 2. Verify Blockchain Status

```powershell
# Check chaincode version
docker exec cli peer lifecycle chaincode querycommitted --channelID coffeechannel --name ecta

# Expected output:
# Version: 1.1, Sequence: 3
# Approvals: [BankMSP: true, CustomsMSP: true, ECTAMSP: true, NBEMSP: true, ShippingMSP: true]
```

### 3. Get API Base URL

```
Base URL: http://localhost:3000
Frontend URL: http://localhost:5173
```

---

## TEST SUITE 1: Smart Contract Auto-Validation

### Test 1.1: Register Valid Exporter (Should AUTO-APPROVE)

**Endpoint**: `POST http://localhost:3000/api/auth/register`

**Request Body**:
```json
{
  "username": "manual_test_valid",
  "password": "Test@1234",
  "email": "valid@testcompany.com",
  "role": "exporter",
  "companyName": "Valid Test Coffee Exporters PLC",
  "tin": "TIN1234567890",
  "capitalETB": 75000000,
  "businessType": "PRIVATE_EXPORTER",
  "phone": "+251911234567",
  "address": "Addis Ababa, Ethiopia"
}
```

**Expected Response**:
```json
{
  "success": true,
  "username": "manual_test_valid",
  "status": "approved",
  "autoValidated": true,
  "rejectionReasons": null
}
```

**Verification Steps**:
1. ✅ Response status: 200 OK
2. ✅ `status` field: "approved"
3. ✅ `autoValidated` field: true
4. ✅ `rejectionReasons` field: null
5. ✅ User can login immediately

---

### Test 1.2: Register Exporter with Insufficient Capital (Should AUTO-REJECT)

**Endpoint**: `POST http://localhost:3000/api/auth/register`

**Request Body**:
```json
{
  "username": "manual_test_lowcap",
  "password": "Test@1234",
  "email": "lowcap@testcompany.com",
  "role": "exporter",
  "companyName": "Low Capital Coffee Co",
  "tin": "TIN9876543210",
  "capitalETB": 10000000,
  "businessType": "PRIVATE_EXPORTER",
  "phone": "+251911234568",
  "address": "Addis Ababa, Ethiopia"
}
```

**Expected Response**:
```json
{
  "success": true,
  "username": "manual_test_lowcap",
  "status": "rejected",
  "autoValidated": true,
  "rejectionReasons": [
    "Insufficient capital: 10000000 ETB (minimum: 50000000 ETB for PRIVATE_EXPORTER)"
  ]
}
```

**Verification Steps**:
1. ✅ Response status: 200 OK
2. ✅ `status` field: "rejected"
3. ✅ `autoValidated` field: true
4. ✅ `rejectionReasons` array contains capital error
5. ✅ User CANNOT login (403 error)

---

### Test 1.3: Register Exporter with Invalid TIN (Should AUTO-REJECT)

**Endpoint**: `POST http://localhost:3000/api/auth/register`

**Request Body**:
```json
{
  "username": "manual_test_badtin",
  "password": "Test@1234",
  "email": "badtin@testcompany.com",
  "role": "exporter",
  "companyName": "Bad TIN Coffee Co",
  "tin": "INVALID123",
  "capitalETB": 60000000,
  "businessType": "PRIVATE_EXPORTER",
  "phone": "+251911234569",
  "address": "Addis Ababa, Ethiopia"
}
```

**Expected Response**:
```json
{
  "success": true,
  "username": "manual_test_badtin",
  "status": "rejected",
  "autoValidated": true,
  "rejectionReasons": [
    "Invalid TIN format (must be TIN followed by 10+ digits)"
  ]
}
```

**Verification Steps**:
1. ✅ Response status: 200 OK
2. ✅ `status` field: "rejected"
3. ✅ `rejectionReasons` contains TIN error

---

### Test 1.4: Login with Auto-Approved User

**Endpoint**: `POST http://localhost:3000/api/auth/login`

**Request Body**:
```json
{
  "username": "manual_test_valid",
  "password": "Test@1234"
}
```

**Expected Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "manual_test_valid",
    "username": "manual_test_valid",
    "email": "valid@testcompany.com",
    "role": "exporter",
    "status": "approved"
  }
}
```

**Verification Steps**:
1. ✅ Response status: 200 OK
2. ✅ Token received
3. ✅ User status: "approved"
4. ✅ Save token for next tests

---

### Test 1.5: Login with Auto-Rejected User (Should FAIL)

**Endpoint**: `POST http://localhost:3000/api/auth/login`

**Request Body**:
```json
{
  "username": "manual_test_lowcap",
  "password": "Test@1234"
}
```

**Expected Response**:
```json
{
  "error": "Account is pending approval or has been rejected"
}
```

**Verification Steps**:
1. ✅ Response status: 403 Forbidden
2. ✅ Error message indicates rejection
3. ✅ No token provided

---

## TEST SUITE 2: Certificate Generation

### Setup: Login as ECTA Admin

**Endpoint**: `POST http://localhost:3000/api/auth/login`

**Request Body**:
```json
{
  "username": "ecta_admin",
  "password": "admin123"
}
```

**Save the token** for authorization in next tests.

**Authorization Header** for all subsequent requests:
```
Authorization: Bearer YOUR_ECTA_TOKEN_HERE
```

---

### Test 2.1: Approve Competence Certificate

**Endpoint**: `POST http://localhost:3000/api/ecta/qualifications/manual_test_valid/competenceCertificate/approve`

**Headers**:
```
Authorization: Bearer YOUR_ECTA_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "comments": "Training completed successfully",
  "trainingProgram": "Coffee Export Competence Training",
  "assessmentScore": "95%"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "competenceCertificate qualification approved",
  "username": "manual_test_valid",
  "stage": "competenceCertificate",
  "certificate": {
    "certificateNumber": "COMP-1772623857406",
    "filename": "Competence-Certificate-manual_test_valid.pdf",
    "filepath": "/certificates/Competence-Certificate-manual_test_valid.pdf",
    "downloadUrl": "/api/ecta/certificates/competenceCertificate/manual_test_valid/download"
  }
}
```

**Verification Steps**:
1. ✅ Response status: 200 OK
2. ✅ `success` field: true
3. ✅ `certificate` object present
4. ✅ Certificate number starts with "COMP-"
5. ✅ Download URL provided

---

### Test 2.2: Download Competence Certificate

**Endpoint**: `GET http://localhost:3000/api/ecta/certificates/competenceCertificate/manual_test_valid/download`

**Headers**:
```
Authorization: Bearer YOUR_ECTA_TOKEN
```

**Expected Response**:
- Content-Type: `application/pdf`
- File download starts
- Filename: `Competence-Certificate-manual_test_valid.pdf`

**Verification Steps**:
1. ✅ Response status: 200 OK
2. ✅ PDF file downloads
3. ✅ File size: ~10-11 KB
4. ✅ Open PDF and verify:
   - Company name correct
   - Certificate number present
   - QR code visible
   - ECTA branding present
   - Competencies listed (8 items)
   - Signature sections present

---

### Test 2.3: Approve Laboratory Certificate

**Endpoint**: `POST http://localhost:3000/api/ecta/qualifications/manual_test_valid/laboratory/approve`

**Headers**:
```
Authorization: Bearer YOUR_ECTA_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "comments": "Facility meets all requirements",
  "laboratoryName": "Valid Test Coffee Lab",
  "inspector": "ECTA Inspector"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "laboratory qualification approved",
  "username": "manual_test_valid",
  "stage": "laboratory",
  "certificate": {
    "certificateNumber": "LAB-1772623858697",
    "filename": "Laboratory-Certificate-manual_test_valid.pdf",
    "downloadUrl": "/api/ecta/certificates/laboratory/manual_test_valid/download"
  }
}
```

**Verification Steps**:
1. ✅ Response status: 200 OK
2. ✅ Certificate number starts with "LAB-"
3. ✅ Download URL provided

---

### Test 2.4: Download Laboratory Certificate

**Endpoint**: `GET http://localhost:3000/api/ecta/certificates/laboratory/manual_test_valid/download`

**Headers**:
```
Authorization: Bearer YOUR_ECTA_TOKEN
```

**Verification Steps**:
1. ✅ PDF downloads successfully
2. ✅ File size: ~8-9 KB
3. ✅ Open PDF and verify:
   - Laboratory name correct
   - Equipment checklist present (7 items)
   - Inspection details present
   - QR code visible
   - Valid for 2 years

---

### Test 2.5: Approve Taster Certificate

**Endpoint**: `POST http://localhost:3000/api/ecta/qualifications/manual_test_valid/taster/approve`

**Headers**:
```
Authorization: Bearer YOUR_ECTA_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "comments": "Q Grader certified",
  "tasterName": "Abebe Kebede",
  "certificationLevel": "Q Grader Certified"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "taster qualification approved",
  "username": "manual_test_valid",
  "stage": "taster",
  "certificate": {
    "certificateNumber": "TASTER-1772623858854",
    "filename": "Taster-Certificate-manual_test_valid.pdf",
    "downloadUrl": "/api/ecta/certificates/taster/manual_test_valid/download"
  }
}
```

**Verification Steps**:
1. ✅ Response status: 200 OK
2. ✅ Certificate number starts with "TASTER-"

---

### Test 2.6: Download Taster Certificate

**Endpoint**: `GET http://localhost:3000/api/ecta/certificates/taster/manual_test_valid/download`

**Headers**:
```
Authorization: Bearer YOUR_ECTA_TOKEN
```

**Verification Steps**:
1. ✅ PDF downloads successfully
2. ✅ File size: ~8 KB
3. ✅ Open PDF and verify:
   - Taster name correct
   - Qualifications listed (6 items)
   - Q Grader certification mentioned
   - Valid for 3 years

---

### Test 2.7: Issue Export License

**Endpoint**: `POST http://localhost:3000/api/ecta/license/issue`

**Headers**:
```
Authorization: Bearer YOUR_ECTA_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "exporterId": "manual_test_valid",
  "licenseNumber": "LIC-2026-TEST-001",
  "expiryDate": "2027-03-04"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Export license issued successfully",
  "exporterId": "manual_test_valid",
  "licenseNumber": "LIC-2026-TEST-001",
  "expiryDate": "2027-03-04",
  "certificate": {
    "certificateNumber": "LIC-2026-TEST-001",
    "filename": "Export-License-manual_test_valid.pdf",
    "downloadUrl": "/api/ecta/certificates/license/manual_test_valid/download"
  }
}
```

**Verification Steps**:
1. ✅ Response status: 200 OK
2. ✅ License number matches request
3. ✅ Certificate info provided

---

### Test 2.8: Download Export License

**Endpoint**: `GET http://localhost:3000/api/ecta/certificates/license/manual_test_valid/download`

**Headers**:
```
Authorization: Bearer YOUR_ECTA_TOKEN
```

**Verification Steps**:
1. ✅ PDF downloads successfully
2. ✅ File size: ~11 KB
3. ✅ Open PDF and verify:
   - License number correct
   - Company details correct
   - License scope listed (5 authorizations)
   - License conditions listed (6 requirements)
   - Director General signature section
   - Official seal placeholder
   - Valid for 1 year

---

## TEST SUITE 3: Authorization & Security

### Test 3.1: Exporter Downloads Own Certificate

**Login as Exporter**:
```
POST http://localhost:3000/api/auth/login
{
  "username": "manual_test_valid",
  "password": "Test@1234"
}
```

**Download Own Certificate**:
```
GET http://localhost:3000/api/ecta/certificates/competenceCertificate/manual_test_valid/download
Authorization: Bearer EXPORTER_TOKEN
```

**Expected**: ✅ Success (200 OK)

---

### Test 3.2: Exporter Tries to Download Another User's Certificate

**Endpoint**: `GET http://localhost:3000/api/ecta/certificates/competenceCertificate/other_user/download`

**Headers**:
```
Authorization: Bearer EXPORTER_TOKEN
```

**Expected Response**:
```json
{
  "error": "Not authorized"
}
```

**Verification Steps**:
1. ✅ Response status: 403 Forbidden
2. ✅ Error message indicates unauthorized access

---

### Test 3.3: Unauthenticated Access (No Token)

**Endpoint**: `GET http://localhost:3000/api/ecta/certificates/competenceCertificate/manual_test_valid/download`

**Headers**: None (no Authorization header)

**Expected Response**:
```json
{
  "error": "No token provided"
}
```

**Verification Steps**:
1. ✅ Response status: 401 Unauthorized
2. ✅ Access denied

---

## TEST SUITE 4: QR Code Verification

### Test 4.1: Scan QR Code

**Steps**:
1. Open any generated PDF certificate
2. Use smartphone QR scanner app
3. Scan the QR code on the certificate

**Expected QR Code URL Format**:
```
https://ecta.gov.et/verify/competenceCertificate/COMP-1772623857406
https://ecta.gov.et/verify/laboratory/LAB-1772623858697
https://ecta.gov.et/verify/taster/TASTER-1772623858854
https://ecta.gov.et/verify/license/LIC-2026-TEST-001
```

**Verification Steps**:
1. ✅ QR code scans successfully
2. ✅ URL format is correct
3. ✅ Certificate number in URL matches PDF
4. ✅ URL opens in browser (endpoint pending deployment)

---

## TEST SUITE 5: End-to-End Workflow

### Complete Exporter Journey

**Step 1: Register** (Auto-Validation)
```
POST /api/auth/register
→ Auto-approved if compliant
→ Auto-rejected if non-compliant
```

**Step 2: Login**
```
POST /api/auth/login
→ Success if approved
→ Fail if rejected/pending
```

**Step 3: ECTA Approves Competence**
```
POST /api/ecta/qualifications/:username/competenceCertificate/approve
→ PDF certificate generated
→ Download URL returned
```

**Step 4: ECTA Approves Laboratory**
```
POST /api/ecta/qualifications/:username/laboratory/approve
→ PDF certificate generated
```

**Step 5: ECTA Approves Taster**
```
POST /api/ecta/qualifications/:username/taster/approve
→ PDF certificate generated
```

**Step 6: ECTA Issues License**
```
POST /api/ecta/license/issue
→ PDF license generated
→ User status updated to 'active'
```

**Step 7: Exporter Downloads All Certificates**
```
GET /api/ecta/certificates/competenceCertificate/:username/download
GET /api/ecta/certificates/laboratory/:username/download
GET /api/ecta/certificates/taster/:username/download
GET /api/ecta/certificates/license/:username/download
```

**Verification**:
1. ✅ All steps complete without errors
2. ✅ 4 PDF certificates generated
3. ✅ All certificates downloadable
4. ✅ User status is 'active'
5. ✅ Total time: < 5 minutes

---

## TEST SUITE 6: Error Handling

### Test 6.1: Approve Non-Existent User

**Endpoint**: `POST http://localhost:3000/api/ecta/qualifications/nonexistent_user/competenceCertificate/approve`

**Expected**: 404 Not Found

---

### Test 6.2: Issue License Without Required Fields

**Endpoint**: `POST http://localhost:3000/api/ecta/license/issue`

**Request Body**:
```json
{
  "exporterId": "manual_test_valid"
}
```

**Expected Response**:
```json
{
  "error": "Missing required fields"
}
```

**Expected**: 400 Bad Request

---

### Test 6.3: Download Certificate for User Without Approval

**Endpoint**: `GET http://localhost:3000/api/ecta/certificates/competenceCertificate/unapproved_user/download`

**Expected**: Certificate generates with current data (graceful handling)

---

## TEST SUITE 7: Performance Testing

### Test 7.1: Certificate Generation Speed

**Steps**:
1. Note start time
2. Approve qualification (generates certificate)
3. Note end time

**Expected**: < 500ms total time

---

### Test 7.2: Concurrent Certificate Downloads

**Steps**:
1. Open 5 browser tabs
2. Download same certificate in all tabs simultaneously

**Expected**:
- All downloads succeed
- No errors
- Files identical

---

## VERIFICATION CHECKLIST

### Auto-Validation ✅
- [ ] Valid exporter auto-approved
- [ ] Low capital exporter auto-rejected
- [ ] Invalid TIN exporter auto-rejected
- [ ] Invalid email exporter auto-rejected
- [ ] Approved user can login
- [ ] Rejected user cannot login

### Certificate Generation ✅
- [ ] Competence certificate generates
- [ ] Laboratory certificate generates
- [ ] Taster certificate generates
- [ ] Export license generates
- [ ] All PDFs open correctly
- [ ] QR codes present on all certificates
- [ ] Certificate numbers unique
- [ ] File sizes appropriate (8-11 KB)

### Authorization ✅
- [ ] ECTA can download all certificates
- [ ] Exporter can download own certificates
- [ ] Exporter cannot download others' certificates
- [ ] Unauthenticated access denied

### PDF Content ✅
- [ ] Company name correct
- [ ] Certificate numbers present
- [ ] Dates formatted correctly
- [ ] QR codes scannable
- [ ] ECTA branding present
- [ ] Signature sections present
- [ ] Professional formatting

### Integration ✅
- [ ] Blockchain status updated
- [ ] PostgreSQL synced
- [ ] API responses correct
- [ ] Error handling works
- [ ] Performance acceptable

---

## TROUBLESHOOTING

### Issue: Certificate not generating

**Check**:
```powershell
# Check logs
docker logs coffee-gateway --tail 50

# Check certificates directory
ls coffee-export-gateway/certificates/

# Check permissions
icacls coffee-export-gateway\certificates
```

### Issue: Download fails

**Check**:
- Token is valid
- User has authorization
- Certificate file exists
- File permissions correct

### Issue: QR code not working

**Check**:
- QR code URL format
- Verification endpoint deployed
- Network connectivity

---

## REPORTING RESULTS

### Test Report Template

```
TEST EXECUTION REPORT
Date: [DATE]
Tester: [NAME]
Environment: [PRODUCTION/STAGING]

AUTO-VALIDATION TESTS:
✅ Test 1.1: Valid exporter auto-approved
✅ Test 1.2: Low capital auto-rejected
✅ Test 1.3: Invalid TIN auto-rejected
✅ Test 1.4: Approved user login success
✅ Test 1.5: Rejected user login blocked

CERTIFICATE GENERATION TESTS:
✅ Test 2.1: Competence certificate approved
✅ Test 2.2: Competence certificate downloaded
✅ Test 2.3: Laboratory certificate approved
✅ Test 2.4: Laboratory certificate downloaded
✅ Test 2.5: Taster certificate approved
✅ Test 2.6: Taster certificate downloaded
✅ Test 2.7: Export license issued
✅ Test 2.8: Export license downloaded

AUTHORIZATION TESTS:
✅ Test 3.1: Exporter downloads own certificate
✅ Test 3.2: Exporter blocked from others' certificates
✅ Test 3.3: Unauthenticated access denied

QR CODE TESTS:
✅ Test 4.1: QR codes scan successfully

END-TO-END TESTS:
✅ Complete workflow executed successfully

PERFORMANCE:
- Certificate generation: [TIME]ms
- Download speed: [TIME]ms
- Concurrent downloads: [RESULT]

ISSUES FOUND: [NONE/LIST]

OVERALL STATUS: ✅ PASS / ❌ FAIL
```

---

## CONCLUSION

This manual testing guide covers:
- ✅ Smart contract auto-validation (6 tests)
- ✅ Certificate generation (8 tests)
- ✅ Authorization & security (3 tests)
- ✅ QR code verification (1 test)
- ✅ End-to-end workflow (1 test)
- ✅ Error handling (3 tests)
- ✅ Performance testing (2 tests)

**Total**: 24 manual test cases

**Expected Duration**: 30-45 minutes for complete test suite

**Success Criteria**: All tests pass ✅
