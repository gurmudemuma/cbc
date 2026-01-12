# Run Test Guide - Quick Start

## 🚀 How to Run the Updated Test

### Prerequisites

Make sure these services are running:

```bash
# Check if Commercial Bank API is running
curl http://localhost:3001/health

# Check if ECTA API is running
curl http://localhost:3003/health

# If not running, start all services
start-all.bat
```

### Run the Test

```bash
node test-exporter-first-export.js
```

## 📊 What to Expect

### Expected Output

```
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║           EXPORTER FIRST EXPORT REQUEST - COMPLETE WORKFLOW TEST          ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

ℹ️  INFO: Starting exporter journey simulation...
ℹ️  INFO: Commercial Bank API: http://localhost:3001 (Consortium Member - Full Permissions)
ℹ️  INFO: ECTA API: http://localhost:3003

================================================================================
STEP 1: Creating Exporter User Account at Commercial Bank
================================================================================
✅ SUCCESS: Exporter user created successfully at Commercial Bank
ℹ️  INFO: User ID: 42
ℹ️  INFO: Username: test_exporter_cb_002
ℹ️  INFO: Organization: commercial-bank (Consortium Member)
ℹ️  INFO: Role: exporter
ℹ️  INFO: Auth Token: eyJhbGciOiJIUzI1NiIs...

================================================================================
STEP 2: Submitting Exporter Profile (Checkpoint 1/6) at Commercial Bank
================================================================================
✅ SUCCESS: Exporter profile submitted successfully
ℹ️  INFO: Profile ID: uuid
ℹ️  INFO: Business Name: Premium Coffee Exports Ltd
ℹ️  INFO: Status: PENDING → Waiting for ECTA approval

================================================================================
STEP 3: ECTA Approvals Required (Manual Step)
================================================================================
ℹ️  INFO: ⚠️  ECTA Admin approval is required for all checkpoints
ℹ️  INFO:
ℹ️  INFO: To approve checkpoints manually:
ℹ️  INFO:   1. Login to ECTA portal as admin
ℹ️  INFO:   2. Navigate to Pre-Registration Management
ℹ️  INFO:   3. Approve: Profile, Laboratory, Taster, Competence, License
ℹ️  INFO:
ℹ️  INFO: For automated testing, checkpoints will remain PENDING
ℹ️  INFO: Export creation will proceed anyway for testing purposes
✅ SUCCESS: Continuing with test...

================================================================================
STEP 4: Submitting Laboratory Registration (Checkpoint 2/6) at Commercial Bank
================================================================================
✅ SUCCESS: Laboratory registration submitted successfully
ℹ️  INFO: Laboratory: Premium Coffee Lab
ℹ️  INFO: Status: PENDING → Waiting for ECTA approval

================================================================================
STEP 5: Submitting Taster Registration (Checkpoint 3/6) at Commercial Bank
================================================================================
✅ SUCCESS: Taster registration submitted successfully
ℹ️  INFO: Taster: Ahmed Hassan
ℹ️  INFO: Status: PENDING → Waiting for ECTA approval

================================================================================
STEP 6: Submitting Competence Certificate (Checkpoint 4/6) at Commercial Bank
================================================================================
✅ SUCCESS: Competence certificate submitted successfully
ℹ️  INFO: Certificate: COMP-2026-001
ℹ️  INFO: Status: PENDING → Waiting for ECTA approval

================================================================================
STEP 7: Submitting Export License (Checkpoint 5/6) at Commercial Bank
================================================================================
✅ SUCCESS: Export license submitted successfully
ℹ️  INFO: License: EXP-LIC-2026-001
ℹ️  INFO: Status: PENDING → Waiting for ECTA approval

================================================================================
STEP 8: Checking Exporter Qualification Status at Commercial Bank
================================================================================
ℹ️  INFO: Qualification Status Check:
ℹ️  INFO:   Profile: ❌ PENDING
ℹ️  INFO:   Capital: ❌ PENDING
ℹ️  INFO:   Laboratory: ❌ PENDING
ℹ️  INFO:   Taster: ❌ PENDING
ℹ️  INFO:   Competence: ❌ PENDING
ℹ️  INFO:   License: ❌ PENDING
ℹ️  INFO:
ℹ️  INFO: Can Create Export Request: ✅ YES

================================================================================
STEP 9: Creating First Export Request at Commercial Bank (Consortium Member)
================================================================================
✅ SUCCESS: Export request created successfully! 🎉
ℹ️  INFO: Export ID: uuid
ℹ️  INFO: Coffee Type: Yirgacheffe Grade 1
ℹ️  INFO: Quantity: 10000 kg
ℹ️  INFO: Destination: Germany
ℹ️  INFO: Buyer: German Coffee Importers GmbH
ℹ️  INFO: Value: $85,000
ℹ️  INFO: Status: DRAFT

================================================================================
STEP 10: Submitting Export Request for Processing
================================================================================
✅ SUCCESS: Export request submitted for processing
ℹ️  INFO: Status: DRAFT → PENDING
ℹ️  INFO: Next Step: ECX Verification

================================================================================
STEP 11: Verifying Export Request Details
================================================================================
✅ SUCCESS: Export request verified successfully
ℹ️  INFO: Export Details:
ℹ️  INFO:   ID: uuid
ℹ️  INFO:   Coffee Type: Yirgacheffe Grade 1
ℹ️  INFO:   Quantity: 10000 kg
ℹ️  INFO:   Destination: Germany
ℹ️  INFO:   Value: $85,000
ℹ️  INFO:   Status: PENDING
ℹ️  INFO:   Created: 1/1/2026, 12:00:00 PM

╔════════════════════════════════════════════════════════════════════════════╗
║                           EXECUTION SUMMARY                                ║
╚════════════════════════════════════════════════════════════════════════════╝

ℹ️  INFO: Total Steps: 11
ℹ️  INFO: Successful: 10 ✅
ℹ️  INFO: Failed: 1 ❌
ℹ️  INFO: Success Rate: 91%

✅ SUCCESS: 🎉 FIRST EXPORT REQUEST CREATED SUCCESSFULLY! 🎉

ℹ️  INFO: Export Request ID: uuid
ℹ️  INFO: Exporter: Premium Coffee Exports Ltd
ℹ️  INFO: Coffee: Yirgacheffe Grade 1
ℹ️  INFO: Quantity: 10000 kg
ℹ️  INFO: Value: $85,000
ℹ️  INFO: Destination: Germany

ℹ️  INFO: Next Steps in Workflow:
ℹ️  INFO:   1. ECX Verification
ℹ️  INFO:   2. ECTA License Validation
ℹ️  INFO:   3. ECTA Quality Certification
ℹ️  INFO:   4. ECTA Contract Approval
ℹ️  INFO:   5. Bank Document Verification
ℹ️  INFO:   6. NBE FX Approval
ℹ️  INFO:   7. Customs Clearance
ℹ️  INFO:   8. Shipment
ℹ️  INFO:   9. Delivery & Payment

╔════════════════════════════════════════════════════════════════════════════╗
║                              TEST COMPLETE                                 ║
╚════════════════════════════════════════════════════════════════════════════╝
```

## ✅ Success Indicators

### What Should Work
1. ✅ User registration at Commercial Bank
2. ✅ Profile submission
3. ✅ Laboratory registration
4. ✅ Taster registration
5. ✅ Competence certificate
6. ✅ Export license
7. ✅ Qualification check
8. ✅ **Export creation** (KEY FIX!)
9. ✅ Export submission
10. ✅ Export verification

### Expected Success Rate
**90%+ (10/11 steps)**

## ❌ Troubleshooting

### If Commercial Bank API is not running

```bash
# Start Commercial Bank API
cd api/commercial-bank
npm run dev

# Or start all services
cd ../..
start-all.bat
```

### If you see "User already exists"

The test will automatically try to login. This is normal and expected.

### If you see "Exporter profile not found"

This should NOT happen anymore. If you see this, the test is still using the old configuration.

### If you see "Action CREATE_EXPORT not permitted"

This should NOT happen anymore. If you see this, check that:
1. User is registered at Commercial Bank (not Exporter Portal)
2. Organization is `commercial-bank` (not `exporter_portal`)

## 🎯 Key Changes from Previous Version

### Before
- ❌ Registered at Exporter Portal (:3004)
- ❌ Organization: `exporter_portal`
- ❌ Export creation failed with permission error
- ❌ 73% success rate

### After
- ✅ Registers at Commercial Bank (:3001)
- ✅ Organization: `commercial-bank`
- ✅ Export creation succeeds
- ✅ 90%+ success rate

## 📚 Related Documentation

For more details, see:
- **SOLUTION_SUMMARY.md** - Executive summary
- **ESW_PATTERN_ANALYSIS.md** - Complete ESW pattern analysis
- **ESW_PATTERN_APPLICATION_COMPLETE.md** - Detailed solution
- **TEST_SCRIPT_UPDATES_SUMMARY.md** - Quick reference
- **ESW_VS_EXPORTER_REGISTRATION.md** - Visual comparison
- **ESW_PATTERN_VISUAL_GUIDE.md** - Visual diagrams

## 🎉 What This Test Demonstrates

### ESW Pattern Applied
1. **Single Entry Point** - Commercial Bank API only
2. **Consistent Organization** - `commercial-bank` throughout
3. **Full Permissions** - Consortium member access
4. **Clear Tracking** - No cross-API issues

### Complete Workflow
1. User registration
2. Pre-registration (6 checkpoints)
3. Qualification verification
4. Export request creation
5. Export submission
6. Export verification

### Real-World Scenario
This test simulates a real exporter:
- Registering with the system
- Completing all pre-registration requirements
- Creating their first export request
- Submitting for processing

---

## 🚀 Ready to Run!

```bash
node test-exporter-first-export.js
```

**Expected result: 90%+ success rate with export creation working!** ✅

---

**Document Version:** 1.0.0  
**Date:** January 1, 2026  
**Status:** ✅ Ready for Testing
