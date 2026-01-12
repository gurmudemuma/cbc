# ESW Integration - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you quickly test the complete ESW integration.

---

## Prerequisites

- Docker Desktop running
- Node.js 18+ installed
- PostgreSQL container running
- All dependencies installed

---

## Step 1: Start Infrastructure (30 seconds)

```bash
# Start PostgreSQL, Redis, IPFS
docker-compose -f docker-compose.postgres.yml up -d

# Wait for services to be ready
timeout /t 10
```

---

## Step 2: Run Database Migration (30 seconds)

```bash
# Windows
run-esw-migration.bat

# Linux/Mac
./run-esw-migration.sh
```

**Expected Output:**
```
✓ Created esw_submissions table
✓ Created esw_agency_approvals table
✓ Created export_documents table
✓ Created export_certificates table
✓ Created esw_agencies table
✓ Seeded 16 Ethiopian agencies
✓ Added 6 new ESW statuses
✓ Migration complete!
```

---

## Step 3: Start ESW API (10 seconds)

```bash
# Windows
start-esw-api.bat

# Linux/Mac
./start-esw-api.sh
```

**Expected Output:**
```
🚀 ESW API server running on http://localhost:3008
📊 Health check: http://localhost:3008/health
```

---

## Step 4: Test ESW API (30 seconds)

```bash
node test-esw-api.js
```

**Expected Output:**
```
✓ Health check passed
✓ Retrieved 16 agencies
✓ Get submissions passed
✓ Get statistics passed
...
All tests passed! Success rate: 100%
```

---

## Step 5: Start Frontend (30 seconds)

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## Step 6: Access ESW Pages

### For Exporters:
1. Navigate to: http://localhost:5173/login
2. Login as exporter
3. Go to: **ESW Submission** (in ECTA menu)
4. Select an export with `ECTA_CONTRACT_APPROVED` status
5. Upload documents
6. Add certificates
7. Submit to ESW

### For Agency Officers:
1. Login as agency officer (ECTA role)
2. Go to: **Agency Dashboard** (in ESW Integration menu)
3. Select your agency (e.g., MOT, ERCA, NBE)
4. Review pending submissions
5. Approve/Reject submissions

### For Administrators:
1. Login as admin
2. Go to: **ESW Statistics** (in ESW Integration menu)
3. View metrics and analytics

---

## Quick Test Workflow

### Create Test Export (if needed)

```sql
-- Connect to database
docker exec -it postgres psql -U postgres -d coffee_export_db

-- Create test export
INSERT INTO exports (
  export_id, exporter_name, coffee_type, quantity, 
  destination_country, total_value, status
) VALUES (
  'EXP-TEST-001', 'Test Exporter', 'Arabica', 1000,
  'United States', 50000, 'ECTA_CONTRACT_APPROVED'
);
```

### Submit to ESW

1. Go to: http://localhost:5173/esw/submission
2. Select `EXP-TEST-001`
3. Click "Next"
4. Add documents:
   - Export Declaration
   - Commercial Invoice
   - Packing List
   - Bill of Lading
   - Certificate of Origin
   - Quality Certificate
   - Export License
   - Sales Contract
5. Click "Next"
6. (Optional) Add certificates
7. Click "Next"
8. Review and click "Submit to ESW"
9. Note the ESW Reference Number (e.g., `ESW-2026-000001`)

### Approve as Agency

1. Go to: http://localhost:5173/esw/agency-dashboard
2. Select agency: "Ministry of Trade (MOT)"
3. Find your submission
4. Click "Review"
5. Select "Approve"
6. Add notes (optional)
7. Click "Submit Decision"
8. Repeat for other agencies (16 total)

### View Statistics

1. Go to: http://localhost:5173/esw/statistics
2. View:
   - Total submissions
   - Pending/Approved/Rejected counts
   - Success rate
   - Processing time
   - Recent submissions

---

## Verify Database

```sql
-- Check ESW submission
SELECT * FROM esw_submissions ORDER BY submitted_at DESC LIMIT 1;

-- Check agency approvals
SELECT agency_name, status FROM esw_agency_approvals 
WHERE submission_id = 'YOUR_SUBMISSION_ID';

-- Check export status
SELECT export_id, status, esw_reference_number 
FROM exports WHERE export_id = 'EXP-TEST-001';
```

---

## API Endpoints

### Health Check
```bash
curl http://localhost:3008/health
```

### Get Agencies
```bash
curl http://localhost:3008/api/esw/agencies
```

### Get Submissions
```bash
curl http://localhost:3008/api/esw/submissions
```

### Get Statistics
```bash
curl http://localhost:3008/api/esw/statistics
```

---

## Troubleshooting

### ESW API not starting
```bash
# Check if port 3008 is in use
netstat -ano | findstr :3008

# Check ESW API logs
cd api/esw
npm run dev
```

### Database connection error
```bash
# Check PostgreSQL is running
docker ps | findstr postgres

# Test connection
docker exec postgres pg_isready -U postgres
```

### Frontend not loading ESW pages
```bash
# Check browser console for errors
# Verify routes are added in App.tsx
# Check navigation menu in Layout.tsx
```

### No exports showing in submission page
```sql
-- Update existing export to ECTA_CONTRACT_APPROVED
UPDATE exports 
SET status = 'ECTA_CONTRACT_APPROVED' 
WHERE export_id = 'YOUR_EXPORT_ID';
```

---

## Common Issues

### Issue: "No eligible exports found"
**Solution:** Ensure at least one export has status `ECTA_CONTRACT_APPROVED`

### Issue: "Missing required documents"
**Solution:** Add all 8 required documents before proceeding

### Issue: "Agency dropdown empty"
**Solution:** Run ESW migration to seed 16 agencies

### Issue: "ESW API 404 error"
**Solution:** Ensure ESW API is running on port 3008

### Issue: "Statistics showing 0"
**Solution:** Submit at least one export to ESW first

---

## Next Steps

After successful testing:

1. **Add Real File Upload**
   - Implement actual file upload to cloud storage
   - Add file validation (size, type)
   - Generate secure file URLs

2. **Add Real-time Updates**
   - Implement WebSocket for live status updates
   - Add notification system
   - Auto-refresh on status changes

3. **Add Email Notifications**
   - Notify exporters on submission
   - Notify agencies on new submissions
   - Notify exporters on approval/rejection

4. **Add Role-Based Access**
   - Restrict ESW submission to exporters
   - Restrict agency dashboard to agency officers
   - Restrict statistics to admins

5. **Add Advanced Features**
   - Document preview
   - PDF generation
   - Export to Excel
   - Advanced filtering
   - Search functionality

---

## Performance Tips

### For Development
- Use `npm run dev` for hot reload
- Keep browser DevTools open
- Use React DevTools extension

### For Testing
- Clear browser cache if styles don't update
- Use incognito mode for clean testing
- Check Network tab for API calls

### For Production
- Build frontend: `npm run build`
- Use production database
- Enable HTTPS
- Add rate limiting
- Enable caching

---

## Useful Commands

```bash
# Start everything
start-all.bat  # Windows
./start-all.sh # Linux/Mac

# Start only ESW API
start-esw-api.bat  # Windows
./start-esw-api.sh # Linux/Mac

# Test ESW API
node test-esw-api.js

# Check ESW API health
curl http://localhost:3008/health

# View ESW API logs
docker logs cbc-esw

# Stop everything
docker-compose -f docker-compose.postgres.yml down
docker-compose -f docker-compose.apis.yml down
```

---

## Support

### Documentation
- `ESW_COMPLETE_SUMMARY.md` - Complete overview
- `ESW_PHASE3_COMPLETE.md` - Frontend details
- `ESW_FRONTEND_INTEGRATION_GUIDE.md` - Integration guide
- `ESW_IMPLEMENTATION_SUMMARY.md` - Technical summary

### Logs
- ESW API: `api/esw/logs/`
- Frontend: Browser console
- Database: `docker logs postgres`

### Testing
- API Tests: `test-esw-api.js`
- Manual Testing: Follow this guide
- E2E Tests: To be added in Phase 4

---

## Success Criteria

✅ ESW API running on port 3008
✅ All 10 API tests passing
✅ 16 agencies seeded in database
✅ Frontend pages accessible
✅ Can submit export to ESW
✅ Can approve/reject as agency
✅ Statistics display correctly
✅ Export status updates to ESW_SUBMITTED
✅ Agency approvals tracked
✅ ESW reference number generated

---

## Estimated Time

- **Setup:** 2 minutes
- **Testing:** 5 minutes
- **Full Workflow:** 10 minutes
- **Total:** ~15-20 minutes

---

**Ready to start?** Follow Step 1 above! 🚀

---

**Last Updated:** January 1, 2026
**Version:** 1.0.0
**Status:** Production Ready
