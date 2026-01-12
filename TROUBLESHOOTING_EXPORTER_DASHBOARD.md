# Troubleshooting: Exporter Dashboard Not Showing Data

## Problem
When logging in as `exporter1`, the dashboard shows no data or the profile doesn't exist.

## Root Cause
The exporter user (`exporter1`) needs to have:
1. A user account in the `users` table
2. An exporter profile in the `exporter_profiles` table linked via `user_id`
3. Application records (laboratory, taster, competence, license) linked to the exporter profile

## Diagnostic Steps

### Step 1: Check if Data Exists

Connect to your PostgreSQL database and run:

```bash
psql -U postgres -d coffee_export_db -f cbc/scripts/check-exporter-data.sql
```

Or manually:

```sql
-- Check if user exists
SELECT * FROM users WHERE username = 'exporter1';

-- Check if exporter profile exists
SELECT * FROM exporter_profiles WHERE user_id = (SELECT id FROM users WHERE username = 'exporter1');
```

### Step 2: Check API Response

Open browser DevTools (F12) → Network tab, then:

1. Login as `exporter1`
2. Navigate to "My Applications" → "Application Dashboard"
3. Look for these API calls:
   - `GET /api/exporter/profile` - Should return exporter profile
   - `GET /api/ecta/preregistration/dashboard/exporter/{exporterId}` - Should return dashboard data

**Expected Response for `/api/exporter/profile`:**
```json
{
  "success": true,
  "data": {
    "exporterId": "EXP-abc123",
    "userId": "user-id-here",
    "businessName": "Test Coffee Exporter Ltd",
    "tin": "TIN-1234567890",
    "status": "PENDING_APPROVAL",
    ...
  }
}
```

**If you get 404 Not Found:**
The exporter profile doesn't exist. Proceed to Step 3.

### Step 3: Seed Test Data

If the exporter profile doesn't exist, create it:

```bash
psql -U postgres -d coffee_export_db -f cbc/scripts/seed-exporter1-data.sql
```

This will create:
- ✅ Exporter profile (status: PENDING_APPROVAL)
- ✅ Laboratory (status: PENDING)
- ✅ Taster (status: PENDING)
- ✅ Competence certificate application (status: PENDING)
- ✅ Export license application (status: PENDING_REVIEW)

### Step 4: Verify Data Was Created

```sql
SELECT 
    ep.business_name,
    ep.status as profile_status,
    (SELECT status FROM coffee_laboratories WHERE exporter_id = ep.exporter_id LIMIT 1) as lab_status,
    (SELECT status FROM coffee_tasters WHERE exporter_id = ep.exporter_id LIMIT 1) as taster_status,
    (SELECT status FROM competence_certificates WHERE exporter_id = ep.exporter_id LIMIT 1) as competence_status,
    (SELECT status FROM export_licenses WHERE exporter_id = ep.exporter_id LIMIT 1) as license_status
FROM exporter_profiles ep
WHERE ep.user_id = (SELECT id FROM users WHERE username = 'exporter1');
```

**Expected Output:**
```
business_name              | profile_status    | lab_status | taster_status | competence_status | license_status
---------------------------+-------------------+------------+---------------+-------------------+----------------
Test Coffee Exporter Ltd   | PENDING_APPROVAL  | PENDING    | PENDING       | PENDING           | PENDING_REVIEW
```

### Step 5: Test Dashboard Again

1. Refresh the browser (Ctrl+F5 or Cmd+Shift+R)
2. Login as `exporter1`
3. Navigate to "My Applications" → "Application Dashboard"
4. You should now see:
   - Business name and details
   - Profile status: PENDING_APPROVAL ⏳
   - Laboratory status: PENDING ⏳
   - Taster status: PENDING ⏳
   - Competence status: PENDING ⏳
   - License status: PENDING_REVIEW ⏳

## Testing Approval Flow

### Step 6: Test ECTA Approvals

1. **Login as ECTA Official:**
   - Logout from exporter account
   - Login with ECTA credentials
   - Select "Ethiopian Coffee & Tea Authority (ECTA)"

2. **Approve Profile:**
   - Navigate to "Pre-Registration Management" → "Pending Profiles"
   - Find "Test Coffee Exporter Ltd"
   - Click "Approve"
   - Profile status changes to: ACTIVE ✅

3. **Certify Laboratory:**
   - Navigate to "Pending Laboratories"
   - Find the laboratory
   - Click "Certify"
   - Enter certificate number (e.g., "LAB-CERT-2024-001")
   - Laboratory status changes to: ACTIVE ✅

4. **Verify Taster:**
   - Navigate to "Pending Tasters"
   - Find the taster
   - Click "Verify"
   - Taster status changes to: ACTIVE ✅

5. **Issue Competence Certificate:**
   - Navigate to "Competence Applications"
   - Find the application
   - Click "Issue Certificate"
   - Enter certificate number (e.g., "COMP-2024-001")
   - Competence status changes to: ACTIVE ✅

6. **Issue Export License:**
   - Navigate to "License Applications"
   - Find the application
   - Click "Issue License"
   - Enter license number (e.g., "EXP-LIC-2024-001")
   - License status changes to: ACTIVE ✅

### Step 7: Verify as Exporter

1. **Logout and login as exporter1**
2. **Navigate to "My Applications" → "Application Dashboard"**
3. **You should now see:**
   ```
   Profile: ACTIVE ✅
   Laboratory: ACTIVE ✅
   Taster: ACTIVE ✅
   Competence: ACTIVE ✅
   License: ACTIVE ✅
   Overall: Fully Qualified ✅
   ```

## Common Issues

### Issue 1: "Exporter profile not found"

**Cause:** No profile exists for the user
**Solution:** Run `seed-exporter1-data.sql` script

### Issue 2: "Failed to load dashboard"

**Cause:** ECTA API not running or proxy misconfigured
**Solution:** 
- Check if ECTA API is running on port 3003
- Verify Vite proxy configuration has `/api/ecta` route
- Check browser console for CORS errors

### Issue 3: Dashboard shows all "MISSING"

**Cause:** Applications haven't been created yet
**Solution:** 
- Complete the pre-registration wizard at `/pre-registration`
- Or run the seed script to create test data

### Issue 4: 401 Unauthorized

**Cause:** Token expired or invalid
**Solution:**
- Logout and login again
- Check if JWT token is being sent in Authorization header

### Issue 5: Network Error

**Cause:** Backend services not running
**Solution:**
```bash
cd cbc
npm run start:all
```

## Manual Testing Checklist

- [ ] User `exporter1` exists in database
- [ ] Exporter profile exists with `user_id` matching the user
- [ ] Laboratory record exists
- [ ] Taster record exists
- [ ] Competence certificate application exists
- [ ] Export license application exists
- [ ] ECTA API running on port 3003
- [ ] Exporter Portal API running on port 3004
- [ ] Frontend running on port 5173
- [ ] Can login as exporter1
- [ ] Can navigate to "My Applications" → "Application Dashboard"
- [ ] Dashboard loads without errors
- [ ] All statuses are visible
- [ ] Can approve applications as ECTA official
- [ ] Statuses update after approval

## Database Schema Reference

### exporter_profiles
- `exporter_id` (PK) - Unique exporter identifier
- `user_id` (FK) - Links to users table
- `status` - PENDING_APPROVAL, ACTIVE, REJECTED

### coffee_laboratories
- `laboratory_id` (PK)
- `exporter_id` (FK) - Links to exporter_profiles
- `status` - PENDING, ACTIVE, REJECTED

### coffee_tasters
- `taster_id` (PK)
- `exporter_id` (FK) - Links to exporter_profiles
- `status` - PENDING, ACTIVE, REJECTED

### competence_certificates
- `certificate_id` (PK)
- `exporter_id` (FK) - Links to exporter_profiles
- `status` - PENDING, ACTIVE, REJECTED

### export_licenses
- `license_id` (PK)
- `exporter_id` (FK) - Links to exporter_profiles
- `status` - PENDING_REVIEW, ACTIVE, REJECTED

## Support

If issues persist after following these steps:

1. Check backend logs:
   ```bash
   # ECTA API logs
   tail -f cbc/logs/ecta-api.log
   
   # Exporter Portal logs
   tail -f cbc/logs/exporter-portal-api.log
   ```

2. Check database connection:
   ```bash
   psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM exporter_profiles;"
   ```

3. Verify all services are running:
   ```bash
   # Check if ports are listening
   netstat -an | grep "3003\|3004\|5173"
   ```
