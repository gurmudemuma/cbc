# End-to-End Testing Guide: Exporter Journey

This guide walks through the complete exporter journey from registration to final export approval in the Coffee Export Consortium system.

## Prerequisites

- System is running: `docker ps` shows all containers healthy
- Frontend accessible at: `http://localhost` (production) or `http://localhost:5173` (dev)
- Gateway accessible at: `http://localhost:3000`

## Complete Exporter Journey

### Phase 1: Exporter Registration & Pre-Registration

#### Step 1.1: Register New Exporter Account
1. Navigate to `http://localhost`
2. Click "Register here" link
3. Fill in Account Information (Step 1):
   - Username: `testexporter1`
   - Email: `test@example.com`
   - Password: `password123`
4. Click "Next"
5. Fill in Business Profile (Step 2):
   - Business Name: `Test Coffee Exports Ltd`
   - Business Type: `Private Ltd (15M ETB)` or `Union (20M ETB)`
   - TIN Number: `1234567890`
   - Office Address: `Bole Road, Building 123`
   - City: `Addis Ababa`
   - Region: `Addis Ababa`
   - Contact Person: `John Doe`
   - Phone: `+251911234567`
6. Click "Complete Registration"
7. Wait for success message: "Registration successful! You can login now..."

**Expected Result**: Account created, user can login immediately

#### Step 1.2: Login as Exporter
1. Login with:
   - Organization: `Exporter Portal`
   - Username: `testexporter1`
   - Password: `password123`
2. Should redirect to `/my-applications` (Application Dashboard)

**Expected Result**: Dashboard shows pre-registration progress with 5 qualification stages

#### Step 1.3: Check Auto-Qualification Status
Navigate to "Application Tracking" from sidebar

**Expected Result**: 
- All 5 stages should show "APPROVED" status (auto-qualified)
- Profile Certificate: APPROVED
- Laboratory Certificate: APPROVED
- Taster Certificate: APPROVED
- Competence Certificate: APPROVED
- Export License: APPROVED

**Note**: Auto-qualification happens because:
- Private Ltd/Individual: 15M ETB capital ≥ 15M requirement
- Union/Cooperative: 20M ETB capital ≥ 20M requirement

---

### Phase 2: Sales Contract Management

#### Step 2.1: Create Sales Contract Draft
1. Navigate to "Sales Contracts" → "Draft Contracts"
2. Click "Create New Contract"
3. Fill in contract details:
   - Buyer Name: `Global Coffee Importers Inc`
   - Buyer Country: `United States`
   - Coffee Type: `Arabica`
   - Quantity: `1000` kg
   - Unit Price: `5.50` USD
   - Total Value: Auto-calculated
   - Delivery Terms: `FOB`
   - Payment Terms: `Letter of Credit`
   - Delivery Date: Select future date
4. Click "Save Draft"

**Expected Result**: Contract saved with status "DRAFT"

#### Step 2.2: Submit Contract for Negotiation
1. Find the draft contract
2. Click "Submit for Negotiation"
3. Confirm submission

**Expected Result**: Contract status changes to "NEGOTIATION"

#### Step 2.3: Finalize Contract
1. Navigate to "Negotiations"
2. Find the contract
3. Click "Finalize Contract"
4. Confirm finalization

**Expected Result**: 
- Contract status changes to "FINALIZED"
- ECTA Reference Number generated (e.g., `ECTA-SC-2025-00001`)
- Contract notifications sent to all network members

---

### Phase 3: Document Request & Issuance

#### Step 3.1: Request Documents from Network Members
1. Navigate to "Documents" → "Request Documents" tab
2. For each required document type, click "Request":
   - Export License (from ECTA)
   - Phytosanitary Certificate (from MOA)
   - Health Certificate (from MOH)
   - Quality Certificate (from ECTA)
   - Certificate of Origin (from ECTA)
   - Bank Guarantee (from Commercial Bank)
   - Shipping Booking (from Shipping Line)
   - Customs Clearance (from Customs)

3. For each request, provide:
   - Sales Contract Reference: `ECTA-SC-2025-00001`
   - Additional notes if needed

**Expected Result**: 8 document requests created with status "PENDING"

#### Step 3.2: Network Members Issue Documents

**For each network member (ECTA, Bank, Shipping, Customs, MOA, MOH):**

1. Logout from exporter account
2. Login as network member:
   - Organization: Select appropriate org (e.g., "ECTA")
   - Username: `ecta1` (or `bank1`, `shipping1`, etc.)
   - Password: `password`
3. Should redirect to `/network/agency-dashboard`
4. Navigate to "Document Issuance" tab
5. Find pending document requests
6. For each request:
   - Click "Issue Document"
   - Verify sales contract reference
   - Fill in document metadata:
     - Document Number: Auto-generated or custom
     - Expiry Date: Select future date
     - Additional metadata as needed
   - Click "Issue Document"

**Expected Result**: 
- Document status changes to "ISSUED"
- Document appears in exporter's "All Documents" tab
- Document is blockchain-verified

#### Step 3.3: Verify Documents Issued (as Exporter)
1. Logout from network member account
2. Login as `testexporter1`
3. Navigate to "Documents" → "All Documents"

**Expected Result**: 
- All 8 documents show status "ACTIVE"
- Each document has download button
- Blockchain verification status shown

---

### Phase 4: Network Submission

#### Step 4.1: Submit to Network
1. Navigate to "Network Submission" → "Submit to Network"
2. Review exporter information (auto-filled)
3. Select all 8 issued documents from the checklist
4. Add any supporting documents (optional)
5. Click "Submit to Network"

**Expected Result**:
- Submission created with ID (e.g., `SUB-1775564044602`)
- Network Reference Number generated (e.g., `NET-REF-1775564044602`)
- Status: "SUBMITTED"
- Auto-approval process initiated

#### Step 4.2: Check Submission Status
1. Navigate to "My Submissions"
2. Click on the submission to view details

**Expected Result**:
- Export Information displayed:
  - Export ID
  - Exporter Name
  - Coffee Type: Arabica
  - Quantity: 1000 kg
  - Destination: United States
  - Submitted Date
- Agency Approval Progress shows:
  - ECTA: PENDING → APPROVED (auto)
  - Bank: PENDING → APPROVED (auto)
  - NBE: PENDING → APPROVED (auto)
  - Customs: PENDING → APPROVED (auto)
  - Shipping: PENDING → APPROVED (auto)
- Certificates section shows all 8 documents
- Overall Status: "SUBMITTED" → "EXPORT_APPROVED"

**Note**: Auto-approval happens because all documents are blockchain-verified

---

### Phase 5: Network Member Approval (Manual Review)

If auto-approval is disabled or manual review is needed:

#### Step 5.1: ECTA Approval
1. Login as `ecta1`
2. Navigate to Network Agency Dashboard
3. Find pending submission
4. Click "Review"
5. Verify:
   - Sales Contract Reference
   - All documents present
   - Export details correct
6. Enter approval notes
7. Click "Approve"

**Expected Result**: ECTA status changes to "APPROVED"

#### Step 5.2: Repeat for Other Agencies
Repeat Step 5.1 for:
- Commercial Bank (`bank1`)
- National Bank (`nbe1`)
- Customs (`customs1`)
- Shipping Line (`shipping1`)

**Expected Result**: 
- Each agency status changes to "APPROVED"
- When all 5 agencies approve, overall status changes to "EXPORT_APPROVED"

---

### Phase 6: Final Verification

#### Step 6.1: Check Final Status (as Exporter)
1. Login as `testexporter1`
2. Navigate to "My Submissions"
3. View submission details

**Expected Result**:
- Overall Status: "EXPORT_APPROVED"
- All 5 agencies show "APPROVED"
- Approval Progress: 100%
- Completed Date: Timestamp shown
- All certificates available for download

#### Step 6.2: Download Certificates
1. In submission details, scroll to "Certificates" section
2. Click download button for each certificate

**Expected Result**: PDF certificates download successfully

#### Step 6.3: View Network Statistics
1. Navigate to "Network Statistics"

**Expected Result**:
- Total Submissions: 1
- Approved: 1
- Pending: 0
- Average Processing Time: Calculated
- Charts and graphs display correctly

---

## Testing Checklist

### Registration & Pre-Registration
- [ ] New exporter can register
- [ ] Auto-qualification works for eligible exporters
- [ ] All 5 certificates auto-approved
- [ ] Exporter can login and see dashboard

### Sales Contracts
- [ ] Can create contract draft
- [ ] Can submit for negotiation
- [ ] Can finalize contract
- [ ] ECTA reference number generated
- [ ] Network members receive notifications

### Document Management
- [ ] Can request documents from all 8 agencies
- [ ] Network members can issue documents
- [ ] Documents appear in exporter's dashboard
- [ ] Documents are blockchain-verified
- [ ] Can download issued documents

### Network Submission
- [ ] Can submit with all required documents
- [ ] Submission ID and reference number generated
- [ ] Auto-approval works (if enabled)
- [ ] Export information displays correctly
- [ ] Agency statuses update correctly

### Network Member Approval
- [ ] Network members see pending submissions
- [ ] Can approve/reject submissions
- [ ] Sales contract verification works
- [ ] Approval notes saved
- [ ] Overall status updates when all approve

### Final Stage
- [ ] Export approved status shown
- [ ] All certificates downloadable
- [ ] Statistics update correctly
- [ ] Blockchain records created
- [ ] Audit trail complete

---

## Common Issues & Solutions

### Issue: Auto-qualification not working
**Solution**: Check capital amount meets minimum:
- Private/Individual: ≥ 15M ETB
- Union/Cooperative: ≥ 20M ETB

### Issue: Documents not appearing
**Solution**: 
- Check document status is "ACTIVE"
- Verify blockchain verification completed
- Check network member issued correctly

### Issue: Submission fails
**Solution**:
- Ensure all 8 required documents are issued
- Check documents not expired
- Verify sales contract is finalized

### Issue: Network member can't see submissions
**Solution**:
- Verify user logged in with correct organization
- Check submission status is "SUBMITTED"
- Verify documents belong to that member

### Issue: Auto-approval not triggering
**Solution**:
- Check all documents blockchain-verified
- Verify document hashes match
- Check gateway logs for errors

---

## Database Verification Queries

```sql
-- Check exporter profile
SELECT * FROM exporter_profiles WHERE user_id = 'testexporter1';

-- Check qualifications
SELECT * FROM exporter_qualifications WHERE username = 'testexporter1';

-- Check sales contracts
SELECT * FROM contract_drafts WHERE exporter_id = (
  SELECT exporter_id FROM exporter_profiles WHERE user_id = 'testexporter1'
);

-- Check document requests
SELECT * FROM document_requests WHERE exporter_id = (
  SELECT exporter_id FROM exporter_profiles WHERE user_id = 'testexporter1'
);

-- Check issued documents
SELECT * FROM issued_documents WHERE exporter_id = (
  SELECT exporter_id FROM exporter_profiles WHERE user_id = 'testexporter1'
);

-- Check network submissions
SELECT * FROM network_submissions WHERE exporter_id = (
  SELECT exporter_id FROM exporter_profiles WHERE user_id = 'testexporter1'
);

-- Check submission documents
SELECT sd.*, id.document_type, id.status 
FROM submission_documents sd
JOIN issued_documents id ON sd.document_id = id.document_id
WHERE sd.submission_id = 'SUB-1775564044602';
```

---

## API Testing with cURL

```bash
# Login as exporter
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testexporter1","password":"password123"}'

# Get exporter profile
curl -X GET http://localhost:3000/api/exporter/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get qualifications
curl -X GET http://localhost:3000/api/ecta/qualifications/testexporter1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get submissions
curl -X GET http://localhost:3000/api/network/submissions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get submission details
curl -X GET http://localhost:3000/api/network/submissions/SUB-1775564044602 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get submission certificates
curl -X GET http://localhost:3000/api/network/submissions/SUB-1775564044602/certificates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Success Criteria

The system passes end-to-end testing when:

1. ✅ Exporter can register and auto-qualify
2. ✅ Sales contracts can be created and finalized
3. ✅ All 8 document types can be requested and issued
4. ✅ Network submission accepts all documents
5. ✅ Auto-approval works for verified documents
6. ✅ Manual approval works for all agencies
7. ✅ Final export approval status reached
8. ✅ All certificates downloadable
9. ✅ Statistics and dashboards update correctly
10. ✅ Blockchain records created and verifiable

---

## Next Steps After Testing

1. Review any failed test cases
2. Check gateway and container logs for errors
3. Verify database consistency
4. Test edge cases (rejections, expired documents, etc.)
5. Performance testing with multiple concurrent users
6. Security testing (authentication, authorization)
7. Integration testing with external systems

---

**Last Updated**: 2025-01-XX
**System Version**: 1.0
**Test Environment**: Docker Compose
