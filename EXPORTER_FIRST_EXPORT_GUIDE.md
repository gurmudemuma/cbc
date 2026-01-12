# Exporter First Export Request - Step-by-Step Guide

## 🎯 Objective
Guide an exporter through creating their first export request in the Coffee Blockchain Export System.

---

## 📋 Prerequisites

Before an exporter can create an export request, they must complete **6 qualification checkpoints**:

1. ✅ **Exporter Profile** - Business registration and details
2. ✅ **Minimum Capital** - Capital verification (5M ETB minimum)
3. ✅ **Laboratory** - Coffee testing laboratory certification
4. ✅ **Taster** - Licensed coffee taster registration
5. ✅ **Competence Certificate** - Training and competence certification
6. ✅ **Export License** - Valid export license from ECTA

**Note:** Farmer-exporters are exempt from capital, laboratory, and taster requirements.

---

## 🚀 Complete Workflow

### Phase 1: User Registration

#### Step 1: Access the System
1. Open browser and navigate to: `http://localhost:3000`
2. You should see the Coffee Blockchain login page

#### Step 2: Register as Exporter
1. Click "Register" or "Sign Up" button
2. Fill in registration form:
   - **Username:** `test_exporter_001`
   - **Password:** `Test123!`
   - **Email:** `exporter001@test.com`
   - **Organization:** Select "Exporter Portal"
   - **Role:** Select "Exporter"
3. Click "Register" button
4. System creates your account and logs you in automatically

---

### Phase 2: Pre-Registration (6 Checkpoints)

#### Step 3: Navigate to Pre-Registration
1. After login, you'll see the dashboard
2. Click on "Pre-Registration" in the sidebar menu
3. You'll see the qualification progress page with 6 checkpoints

#### Step 4: Complete Checkpoint 1 - Exporter Profile
1. Click "Start" or "Complete Profile" button
2. Fill in business information:
   - **Business Name:** `Premium Coffee Exports Ltd`
   - **Business Type:** Select "Exporter"
   - **Registration Number:** `REG-2026-001`
   - **TIN Number:** `TIN-123456789`
   - **Address:** `Addis Ababa, Ethiopia`
   - **Phone:** `+251911234567`
   - **Email:** `info@premiumcoffee.et`
   - **Contact Person:** `John Doe`
   - **Contact Phone:** `+251911234567`
   - **Contact Email:** `john@premiumcoffee.et`
3. Fill in banking information:
   - **Bank Name:** `Commercial Bank of Ethiopia`
   - **Account Number:** `CBE-1234567890`
4. Fill in capital information:
   - **Minimum Capital:** `5000000` (5 million ETB)
   - **Upload:** Capital verification document
5. Click "Submit Profile" button
6. Status changes to "PENDING" - waiting for ECTA approval

#### Step 5: Complete Checkpoint 2 - Laboratory Registration
1. Click "Register Laboratory" button
2. Fill in laboratory information:
   - **Laboratory Name:** `Premium Coffee Lab`
   - **Location:** `Addis Ababa`
   - **Certification Number:** `LAB-CERT-2026-001`
   - **Certification Date:** `2026-01-01`
   - **Expiry Date:** `2027-01-01`
   - **Equipment:** `Modern coffee testing equipment`
   - **Upload:** Laboratory certification document
3. Click "Submit Laboratory" button
4. Status changes to "PENDING" - waiting for ECTA approval

#### Step 6: Complete Checkpoint 3 - Taster Registration
1. Click "Register Taster" button
2. Fill in taster information:
   - **Taster Name:** `Ahmed Hassan`
   - **License Number:** `TASTER-2026-001`
   - **Certification Date:** `2026-01-01`
   - **Expiry Date:** `2027-01-01`
   - **Experience:** `10 years`
   - **Upload:** Taster certification document
3. Click "Submit Taster" button
4. Status changes to "PENDING" - waiting for ECTA approval

#### Step 7: Complete Checkpoint 4 - Competence Certificate
1. Click "Submit Competence Certificate" button
2. Fill in certificate information:
   - **Certificate Number:** `COMP-2026-001`
   - **Issue Date:** `2026-01-01`
   - **Expiry Date:** `2027-01-01`
   - **Training Institution:** `Ethiopian Coffee Training Center`
   - **Upload:** Competence certificate document
3. Click "Submit Certificate" button
4. Status changes to "PENDING" - waiting for ECTA approval

#### Step 8: Complete Checkpoint 5 - Export License
1. Click "Apply for Export License" button
2. Fill in license information:
   - **License Number:** `EXP-LIC-2026-001`
   - **Issue Date:** `2026-01-01`
   - **Expiry Date:** `2027-01-01`
   - **License Type:** Select "Export"
   - **Upload:** Export license document
3. Click "Submit License" button
4. Status changes to "PENDING" - waiting for ECTA approval

#### Step 9: Wait for ECTA Approvals
**Note:** In a real system, ECTA officers would review and approve each checkpoint. For testing, you can:

**Option A: Use ECTA Admin Account**
1. Logout from exporter account
2. Login as ECTA admin:
   - **Username:** `ecta_admin`
   - **Password:** `admin123`
3. Navigate to "Pre-Registration Management"
4. Approve all pending applications:
   - Profile → Click "Approve"
   - Laboratory → Click "Approve"
   - Taster → Click "Approve"
   - Competence → Click "Approve"
   - License → Click "Approve"
5. Logout and login back as exporter

**Option B: Use Test Script**
Run the automated approval script:
```bash
node test-exporter-first-export.js
```

---

### Phase 3: Create First Export Request

#### Step 10: Verify Qualification Status
1. Login as exporter (if not already logged in)
2. Navigate to "My Applications" or "Pre-Registration"
3. Check that all 6 checkpoints show "✅ ACTIVE" or "✅ APPROVED"
4. You should see: "✅ You are qualified to create export requests"

#### Step 11: Navigate to Export Management
1. Click "Export Dashboard" or "Export Management" in sidebar
2. You'll see the export management page
3. Look for "Quick Actions" panel on the right side

#### Step 12: Create Export Request
1. In Quick Actions panel, click "Create Export Request" button
2. A modal dialog opens with export request form

#### Step 13: Fill Export Request Form

**Exporter Details:**
- **Exporter Name:** `Premium Coffee Exports Ltd` (auto-filled)
- **Exporter Address:** `Addis Ababa, Ethiopia` (auto-filled)
- **Exporter Contact:** `+251911234567` (auto-filled)
- **Exporter Email:** `info@premiumcoffee.et` (auto-filled)

**Coffee Details:**
- **Coffee Type:** Select `Yirgacheffe Grade 1`
- **Quantity (kg):** `10000`
- **Unit Price (USD/kg):** `8.50`
- **Estimated Value:** `85000` (auto-calculated)

**Destination Details:**
- **Destination Country:** Select `Germany`
- **Destination Port:** `Hamburg`

**Buyer Details:**
- **Buyer Name:** `German Coffee Importers GmbH`
- **Buyer Address:** `Hamburg, Germany`
- **Buyer Contact:** `+49301234567`

**Contract Details:**
- **Contract Number:** `CONTRACT-2026-001`
- **Contract Date:** `2026-01-01`
- **Payment Terms:** `LC at sight`

**Shipment Details:**
- **Expected Shipment Date:** `2026-02-01`

**Additional Information:**
- **Notes:** `First export request - Premium Yirgacheffe coffee`

#### Step 14: Submit Export Request
1. Review all information carefully
2. Click "Create Export Request" button
3. System validates the request
4. Success message appears: "Export request created successfully!"
5. Modal closes and you see your new export in the list

#### Step 15: View Export Request Details
1. Find your export in the list (should be at the top)
2. Click "View Details" button
3. You'll see complete export information:
   - Export ID
   - Status: "DRAFT" or "PENDING"
   - Coffee details
   - Buyer information
   - Contract details
   - Timeline
   - Next steps

---

## 📊 Export Request Workflow

After creating the export request, it goes through this workflow:

### Stage 1: Created (DRAFT)
- **Status:** DRAFT
- **Actor:** Exporter
- **Action:** Review and submit

### Stage 2: ECX Verification
- **Status:** ECX_PENDING → ECX_VERIFIED
- **Actor:** ECX Officer
- **Action:** Verify lot and quality

### Stage 3: ECTA License Validation
- **Status:** ECTA_LICENSE_PENDING → ECTA_LICENSE_APPROVED
- **Actor:** ECTA Officer
- **Action:** Validate export license

### Stage 4: ECTA Quality Certification
- **Status:** ECTA_QUALITY_PENDING → ECTA_QUALITY_APPROVED
- **Actor:** ECTA Inspector
- **Action:** Certify coffee quality

### Stage 5: ECTA Contract Approval
- **Status:** ECTA_CONTRACT_PENDING → ECTA_CONTRACT_APPROVED
- **Actor:** ECTA Officer
- **Action:** Approve export contract

### Stage 6: Bank Document Verification
- **Status:** BANK_DOCUMENT_PENDING → BANK_DOCUMENT_VERIFIED
- **Actor:** Bank Officer
- **Action:** Verify export documents

### Stage 7: NBE FX Approval
- **Status:** FX_PENDING → FX_APPROVED
- **Actor:** NBE Governor
- **Action:** Approve foreign exchange

### Stage 8: Customs Clearance
- **Status:** CUSTOMS_PENDING → CUSTOMS_CLEARED
- **Actor:** Customs Officer
- **Action:** Clear for export

### Stage 9: Shipment
- **Status:** SHIPMENT_PENDING → SHIPPED
- **Actor:** Shipping Line
- **Action:** Schedule and ship

### Stage 10: Completion
- **Status:** DELIVERED → COMPLETED
- **Actor:** System
- **Action:** Mark as complete

---

## 🎉 Success Indicators

You've successfully created your first export request when you see:

✅ Export request appears in your export list  
✅ Export ID is generated  
✅ Status shows "DRAFT" or "PENDING"  
✅ All export details are saved  
✅ You can view export details  
✅ Timeline shows creation timestamp  
✅ Next steps are displayed  

---

## 🔍 Verification

### Check Export in Database
```sql
-- Connect to PostgreSQL
psql -U postgres -d coffee_export_db

-- View your export
SELECT id, coffee_type, quantity, destination_country, status, created_at
FROM exports
WHERE exporter_id = 'your-exporter-id'
ORDER BY created_at DESC
LIMIT 1;
```

### Check via API
```bash
# Get auth token (from login response)
TOKEN="your-auth-token"

# Get export details
curl -X GET http://localhost:3001/api/exports/your-export-id \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Troubleshooting

### Issue: "Cannot create export request"
**Solution:** Check qualification status
- Ensure all 6 checkpoints are approved
- Verify exporter profile is ACTIVE
- Check export license is valid

### Issue: "Validation error"
**Solution:** Check required fields
- All required fields must be filled
- Quantity must be positive number
- Unit price must be positive number
- Dates must be valid

### Issue: "Authentication error"
**Solution:** Re-login
- Token might have expired
- Logout and login again
- Check you're logged in as exporter

### Issue: "Profile not found"
**Solution:** Complete pre-registration
- Go to Pre-Registration page
- Complete all 6 checkpoints
- Wait for ECTA approvals

---

## 📝 Test Data Summary

### Exporter Account
- **Username:** `test_exporter_001`
- **Password:** `Test123!`
- **Organization:** Exporter Portal

### Business Profile
- **Name:** Premium Coffee Exports Ltd
- **Registration:** REG-2026-001
- **TIN:** TIN-123456789

### Export Request
- **Coffee:** Yirgacheffe Grade 1
- **Quantity:** 10,000 kg
- **Value:** $85,000
- **Destination:** Germany
- **Buyer:** German Coffee Importers GmbH

---

## 🚀 Automated Testing

Run the complete automated test:

```bash
# Install dependencies (if not already installed)
npm install axios

# Run the test script
node test-exporter-first-export.js
```

The script will:
1. Create exporter user
2. Complete all 6 pre-registration checkpoints
3. Approve all checkpoints (as ECTA admin)
4. Create first export request
5. Submit export request
6. Verify export was created

---

## ✅ Checklist

- [ ] System is running (all APIs started)
- [ ] Database is accessible
- [ ] Exporter user created
- [ ] Profile submitted and approved
- [ ] Laboratory registered and approved
- [ ] Taster registered and approved
- [ ] Competence certificate submitted and approved
- [ ] Export license submitted and approved
- [ ] All 6 checkpoints show ✅ ACTIVE
- [ ] Export request form filled correctly
- [ ] Export request created successfully
- [ ] Export appears in export list
- [ ] Export details can be viewed
- [ ] Export ID is generated
- [ ] Status is DRAFT or PENDING

---

**Congratulations! You've successfully created your first export request in the Coffee Blockchain Export System!** 🎉☕

---

**Document Version:** 1.0.0  
**Last Updated:** January 1, 2026  
**Status:** ✅ Complete Guide
