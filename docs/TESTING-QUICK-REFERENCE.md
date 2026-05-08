# Testing Quick Reference Card

## Quick Start Testing

### 1. System Check
```bash
scripts\test-system-readiness.bat
```

### 2. Access Points
- **Frontend**: http://localhost
- **Dev Frontend**: http://localhost:5173
- **Gateway API**: http://localhost:3000

---

## Test Accounts

| Role | Username | Password | Organization | Landing Page |
|------|----------|----------|--------------|--------------|
| Exporter | testexporter1 | password123 | Exporter Portal | /my-applications |
| ECTA | ecta1 | password | ECTA | /network/agency-dashboard |
| Bank | bank1 | password | Commercial Bank | /network/agency-dashboard |
| NBE | nbe1 | password | National Bank | /network/agency-dashboard |
| Customs | customs1 | password | Custom Authorities | /network/agency-dashboard |
| Shipping | shipping1 | password | Shipping Line | /network/agency-dashboard |
| ECX | ecx1 | password | ECX | /network/agency-dashboard |

---

## 6-Phase Testing Flow

### Phase 1: Registration (5 min)
1. Register new exporter → `testexporter1`
2. Login → Check auto-qualification
3. ✅ All 5 certificates APPROVED

### Phase 2: Sales Contract (3 min)
1. Create draft → Fill details
2. Submit for negotiation
3. Finalize contract → Get ECTA reference
4. ✅ Contract status: FINALIZED

### Phase 3: Document Requests (10 min)
1. Request 8 documents:
   - Export License (ECTA)
   - Phytosanitary (MOA)
   - Health (MOH)
   - Quality (ECTA)
   - Origin (ECTA)
   - Bank Guarantee (Bank)
   - Shipping Booking (Shipping)
   - Customs Clearance (Customs)
2. ✅ All requests: PENDING

### Phase 4: Document Issuance (15 min)
For each network member:
1. Logout exporter
2. Login as member (ecta1, bank1, etc.)
3. Go to Document Issuance tab
4. Issue requested documents
5. ✅ All documents: ISSUED/ACTIVE

### Phase 5: Network Submission (5 min)
1. Login as exporter
2. Navigate to Network Submission
3. Select all 8 documents
4. Submit to network
5. ✅ Status: SUBMITTED → EXPORT_APPROVED (auto)

### Phase 6: Verification (5 min)
1. Check submission details
2. Verify all agencies APPROVED
3. Download certificates
4. Check statistics
5. ✅ Overall: EXPORT_APPROVED

---

## Required Documents Checklist

- [ ] Export License (ECTA)
- [ ] Phytosanitary Certificate (MOA)
- [ ] Health Certificate (MOH)
- [ ] Quality Certificate (ECTA)
- [ ] Certificate of Origin (ECTA)
- [ ] Bank Guarantee (Commercial Bank)
- [ ] Shipping Booking (Shipping Line)
- [ ] Customs Clearance (Customs)

---

## Key URLs

### Exporter Routes
- `/my-applications` - Application Dashboard
- `/applications` - Application Tracking
- `/sales-contracts` - Sales Contracts
- `/documents` - Document Management
- `/network/submission` - Network Submission
- `/network/submissions` - My Submissions

### Network Member Routes
- `/network/agency-dashboard` - Agency Dashboard
- `/network/statistics` - Network Statistics

---

## Expected Timings

| Phase | Duration | Status |
|-------|----------|--------|
| Registration | 5 min | Auto-approved |
| Sales Contract | 3 min | Finalized |
| Document Requests | 10 min | 8 requests |
| Document Issuance | 15 min | 8 documents |
| Network Submission | 5 min | Auto-approved |
| Verification | 5 min | Complete |
| **TOTAL** | **~45 min** | **End-to-End** |

---

## Success Indicators

### ✅ Registration Success
- Account created
- Login successful
- 5 certificates auto-approved
- Dashboard accessible

### ✅ Contract Success
- Draft saved
- Negotiation submitted
- Contract finalized
- ECTA reference generated

### ✅ Documents Success
- 8 requests created
- All documents issued
- All documents ACTIVE
- Blockchain verified

### ✅ Submission Success
- Submission ID generated
- Network reference created
- Auto-approval triggered
- All agencies APPROVED

### ✅ Final Success
- Status: EXPORT_APPROVED
- Approval: 100%
- Certificates downloadable
- Statistics updated

---

## Troubleshooting Quick Fixes

### Issue: Can't login
```bash
# Check gateway logs
docker logs coffee-gateway --tail 50
```

### Issue: Documents not appearing
```sql
-- Check in database
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT * FROM issued_documents LIMIT 5;"
```

### Issue: Auto-approval not working
```bash
# Check gateway logs for blockchain verification
docker logs coffee-gateway --tail 100 | grep "Auto-approval"
```

### Issue: Frontend not loading
```bash
# Restart frontend container
docker restart coffee-frontend
```

### Issue: Network member can't see submissions
```bash
# Check user organization
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, organization, role FROM users WHERE username='ecta1';"
```

---

## Database Quick Checks

```bash
# Check exporter exists
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT * FROM exporter_profiles WHERE user_id='testexporter1';"

# Check qualifications
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT stage, status FROM exporter_qualifications WHERE username='testexporter1';"

# Check submissions
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT submission_id, status, ecta_status, bank_status FROM network_submissions ORDER BY submitted_at DESC LIMIT 5;"

# Check documents
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT document_id, document_type, status FROM issued_documents ORDER BY issued_at DESC LIMIT 10;"
```

---

## API Quick Tests

```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"testexporter1\",\"password\":\"password123\"}"

# Test submissions (replace TOKEN)
curl -X GET http://localhost:3000/api/network/submissions -H "Authorization: Bearer TOKEN"
```

---

## Container Management

```bash
# View all containers
docker ps

# View logs
docker logs coffee-gateway --tail 50
docker logs coffee-frontend --tail 50
docker logs coffee-postgres --tail 50

# Restart services
docker restart coffee-gateway
docker restart coffee-frontend

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## Testing Checklist

- [ ] System readiness check passed
- [ ] Can register new exporter
- [ ] Auto-qualification works
- [ ] Can create sales contract
- [ ] Can request documents
- [ ] Network members can issue documents
- [ ] Can submit to network
- [ ] Auto-approval works
- [ ] Can view submission details
- [ ] Can download certificates
- [ ] Statistics display correctly
- [ ] All 6 phases completed successfully

---

**Total Test Time**: ~45 minutes
**Success Rate Target**: 100%
**Critical Path**: Registration → Contract → Documents → Submission → Approval
