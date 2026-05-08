# Manual Testing Steps - Coffee Blockchain System

## System is Ready! ✅

All containers are running and the system is accessible at:
- **Frontend**: http://localhost:5173
- **Gateway API**: http://localhost:3000

---

## Complete Testing Flow (45 minutes)

### PHASE 1: Exporter Registration (5 min)

1. **Open Browser**
   ```
   http://localhost:5173
   ```

2. **Register New Exporter**
   - Click "Register here" link
   - Fill in Account Information:
     - Username: `testexporter2025`
     - Email: `test2025@example.com`
     - Password: `Test123!`
   - Click "Next"
   
3. **Fill Business Profile**
   - Business Name: `Test Coffee Exports 2025`
   - Business Type: `Private Ltd (15M ETB)`
   - TIN Number: `1234567890`
   - Office Address: `Bole Road, Building 123`
   - City: `Addis Ababa`
   - Region: `Addis Ababa`
   - Contact Person: `John Doe`
   - Phone: `+251911234567`
   - Click "Complete Registration"

4. **Verify Success**
   - Should see: "Registration successful! You can login now..."
   - Wait 3 seconds for auto-redirect to login

---

### PHASE 2: Login & Check Auto-Qualification (3 min)

1. **Login**
   - Organization: `Exporter Portal`
   - Username: `testexporter2025`
   - Password: `Test123!`
   - Click "Sign In"

2. **Verify Dashboard**
   - Should redirect to `/my-applications`
   - Should see "Application Dashboard"
   - Should see 5 qualification stages

3. **Check Auto-Qualification**
   - Click "Application Tracking" in sidebar
   - Verify ALL 5 stages show "APPROVED":
     - ✅ Profile Certificate: APPROVED
     - ✅ Laboratory Certificate: APPROVED
     - ✅ Taster Certificate: APPROVED
     - ✅ Competence Certificate: APPROVED
     - ✅ Export License: APPROVED

**Expected**: All auto-approved because capital ≥ 15M ETB

---

### PHASE 3: Create Sales Contract (5 min)

1. **Navigate to Sales Contracts**
   - Click "Sales Contracts" in sidebar
   - Click "Draft Contracts"

2. **Create New Contract**
   - Click "Create New Contract" button
   - Fill in details:
     - Buyer Name: `Global Coffee Importers Inc`
     - Buyer Country: `United States`
     - Coffee Type: `Arabica`
     - Quantity: `1000` kg
     - Unit Price: `5.50` USD
     - Total Value: (auto-calculated: $5,500)
     - Delivery Terms: `FOB`
     - Payment Terms: `Letter of Credit`
     - Delivery Date: (select future date)
   - Click "Save Draft"

3. **Submit for Negotiation**
   - Find your draft contract
   - Click "Submit for Negotiation"
   - Confirm submission

4. **Finalize Contract**
   - Go to "Negotiations" tab
   - Find your contract
   - Click "Finalize Contract"
   - Confirm finalization

5. **Verify ECTA Reference**
   - Should see ECTA Reference Number (e.g., `ECTA-SC-2025-00001`)
   - Status should be "FINALIZED"
   - Copy this reference number for later use

---

### PHASE 4: Request Documents (10 min)

1. **Navigate to Documents**
   - Click "Documents" in sidebar
   - Click "Request Documents" tab

2. **Request All 8 Documents**
   For each document type, click "Request" and provide:
   - Sales Contract Reference: `ECTA-SC-2025-00001` (your reference)
   - Additional notes: (optional)

   Required documents:
   - [ ] Export License (from ECTA)
   - [ ] Phytosanitary Certificate (from MOA)
   - [ ] Health Certificate (from MOH)
   - [ ] Quality Certificate (from ECTA)
   - [ ] Certificate of Origin (from ECTA)
   - [ ] Bank Guarantee (from Commercial Bank)
   - [ ] Shipping Booking (from Shipping Line)
   - [ ] Customs Clearance (from Customs)

3. **Verify Requests**
   - All 8 requests should show status "PENDING"
   - Note the request IDs

---

### PHASE 5: Issue Documents (Network Members) (20 min)

**For EACH network member, repeat these steps:**

#### 5.1 ECTA (Issues 4 documents)

1. **Logout** from exporter account
2. **Login as ECTA**:
   - Organization: `ECTA`
   - Username: `ecta1`
   - Password: `password`
3. **Verify Redirect**: Should go to `/network/agency-dashboard`
4. **Navigate to Document Issuance**:
   - Click "Document Issuance" tab
5. **Issue Documents**:
   - Find pending requests for:
     - Export License
     - Quality Certificate
     - Certificate of Origin
   - For each, click "Issue Document":
     - Verify sales contract reference
     - Document Number: (auto-generated)
     - Expiry Date: (select 1 year from now)
     - Click "Issue Document"
6. **Verify**: Documents should show "ISSUED" status

#### 5.2 Commercial Bank

1. **Logout** and **Login as Bank**:
   - Organization: `Commercial Bank`
   - Username: `bank1`
   - Password: `password`
2. **Issue**: Bank Guarantee
3. **Verify**: Status "ISSUED"

#### 5.3 Shipping Line

1. **Logout** and **Login as Shipping**:
   - Organization: `Shipping Line`
   - Username: `shipping1`
   - Password: `password`
2. **Issue**: Shipping Booking
3. **Verify**: Status "ISSUED"

#### 5.4 Customs

1. **Logout** and **Login as Customs**:
   - Organization: `Custom Authorities`
   - Username: `customs1`
   - Password: `password`
2. **Issue**: Customs Clearance
3. **Verify**: Status "ISSUED"

#### 5.5 MOA & MOH (if separate users exist)

- Issue Phytosanitary Certificate (MOA)
- Issue Health Certificate (MOH)

**Note**: If MOA/MOH users don't exist, ECTA can issue these on their behalf.

---

### PHASE 6: Submit to Network (5 min)

1. **Logout** and **Login as Exporter**:
   - Username: `testexporter2025`
   - Password: `Test123!`

2. **Verify Documents Issued**:
   - Go to "Documents" → "All Documents"
   - Should see all 8 documents with status "ACTIVE"

3. **Navigate to Network Submission**:
   - Click "Network Submission" in sidebar
   - Click "Submit to Network"

4. **Review Information**:
   - Exporter info should be auto-filled
   - Should see list of 8 issued documents

5. **Select Documents**:
   - Check all 8 documents in the checklist
   - Add supporting documents (optional)

6. **Submit**:
   - Click "Submit to Network"
   - Confirm submission

7. **Verify Submission Created**:
   - Should see success message
   - Note the Submission ID (e.g., `SUB-1775564044602`)
   - Note the Network Reference Number (e.g., `NET-REF-1775564044602`)

---

### PHASE 7: Verify Auto-Approval (5 min)

1. **View Submission Details**:
   - Go to "My Submissions"
   - Click on your submission

2. **Verify Export Information**:
   - Export ID: (shown)
   - Exporter Name: Test Coffee Exports 2025
   - Coffee Type: Arabica
   - Quantity: 1000 kg
   - Destination: United States
   - Submitted Date: (today's date)

3. **Check Agency Approval Status**:
   Should see all agencies APPROVED (auto-approval):
   - ✅ ECTA: APPROVED
   - ✅ Bank: APPROVED
   - ✅ NBE: APPROVED
   - ✅ Customs: APPROVED
   - ✅ Shipping: APPROVED

4. **Verify Overall Status**:
   - Status: `EXPORT_APPROVED`
   - Approval Progress: 100%
   - Completed Date: (timestamp)

5. **Check Certificates**:
   - Scroll to "Certificates" section
   - Should see all 8 certificates listed
   - Each should have download button

6. **Download Certificates**:
   - Click download button for each certificate
   - Verify PDF downloads successfully

---

### PHASE 8: View Statistics (2 min)

1. **Navigate to Network Statistics**:
   - Click "Network Statistics" in sidebar

2. **Verify Data**:
   - Total Submissions: 1 (or more)
   - Approved: 1 (or more)
   - Pending: 0
   - Average Processing Time: (calculated)
   - Charts display correctly

---

## Success Criteria Checklist

- [ ] Exporter registration successful
- [ ] Auto-qualification: All 5 stages APPROVED
- [ ] Sales contract created and finalized
- [ ] ECTA reference number generated
- [ ] All 8 documents requested
- [ ] All 8 documents issued by network members
- [ ] Network submission created
- [ ] Auto-approval triggered
- [ ] All 5 agencies show APPROVED
- [ ] Overall status: EXPORT_APPROVED
- [ ] All certificates downloadable
- [ ] Statistics display correctly

---

## Test Accounts Summary

| Role | Username | Password | Organization | Landing Page |
|------|----------|----------|--------------|--------------|
| New Exporter | testexporter2025 | Test123! | Exporter Portal | /my-applications |
| ECTA | ecta1 | password | ECTA | /network/agency-dashboard |
| Bank | bank1 | password | Commercial Bank | /network/agency-dashboard |
| NBE | nbe1 | password | National Bank | /network/agency-dashboard |
| Customs | customs1 | password | Custom Authorities | /network/agency-dashboard |
| Shipping | shipping1 | password | Shipping Line | /network/agency-dashboard |
| ECX | ecx1 | password | ECX | /network/agency-dashboard |

---

## Troubleshooting

### Issue: Can't register
- Clear browser cache
- Try different username
- Check gateway logs: `docker logs coffee-gateway --tail 50`

### Issue: Auto-qualification not working
- Verify capital amount ≥ 15M ETB (Private) or 20M ETB (Union)
- Check database: 
  ```bash
  docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT * FROM exporter_qualifications WHERE username='testexporter2025';"
  ```

### Issue: Documents not appearing
- Verify document status is "ACTIVE"
- Check issued_documents table:
  ```bash
  docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT document_id, document_type, status FROM issued_documents ORDER BY issued_at DESC LIMIT 10;"
  ```

### Issue: Submission fails
- Ensure all 8 documents are issued
- Verify documents not expired
- Check sales contract is finalized

### Issue: Auto-approval not working
- Check gateway logs for blockchain verification
- Verify document hashes match
- Check submission_documents table

---

## Database Verification Commands

```bash
# Check exporter profile
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT * FROM exporter_profiles WHERE user_id='testexporter2025';"

# Check qualifications
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT stage, status FROM exporter_qualifications WHERE username='testexporter2025';"

# Check sales contracts
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT draft_id, ecta_reference_number, status FROM contract_drafts ORDER BY created_at DESC LIMIT 5;"

# Check document requests
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT request_id, document_type, status FROM document_requests ORDER BY requested_at DESC LIMIT 10;"

# Check issued documents
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT document_id, document_type, status FROM issued_documents ORDER BY issued_at DESC LIMIT 10;"

# Check network submissions
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT submission_id, status, ecta_status, bank_status, nbe_status, customs_status, shipping_status FROM network_submissions ORDER BY submitted_at DESC LIMIT 5;"
```

---

## Expected Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Registration | 5 min | 5 min |
| Login & Qualification | 3 min | 8 min |
| Sales Contract | 5 min | 13 min |
| Request Documents | 10 min | 23 min |
| Issue Documents | 20 min | 43 min |
| Submit to Network | 5 min | 48 min |
| Verify Approval | 5 min | 53 min |
| View Statistics | 2 min | 55 min |

**Total**: ~55 minutes for complete end-to-end test

---

## Next Steps After Testing

1. ✅ Verify all phases completed successfully
2. ✅ Document any issues found
3. ✅ Test edge cases (rejections, expired documents)
4. ✅ Performance testing with multiple users
5. ✅ Security testing
6. ✅ Integration testing

---

**System Status**: ✅ READY FOR TESTING
**Documentation**: Complete
**Test Accounts**: Available
**Expected Duration**: ~55 minutes

🚀 **Start testing now at http://localhost:5173**
