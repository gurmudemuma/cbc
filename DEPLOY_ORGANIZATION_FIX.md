# Deploy Organization Fix - Step-by-Step Checklist

## Pre-Deployment Checklist

### ✅ Preparation
- [x] Database migration created (`008_add_organization_to_exports.sql`)
- [x] Controllers updated (license, quality, contract)
- [x] Migration scripts created (Windows & Linux)
- [x] Documentation complete (5 documents)
- [x] Testing guidelines provided

### ⚠️ Before You Start
- [ ] Backup your database
- [ ] Ensure PostgreSQL is running
- [ ] Stop all API services (optional but recommended)
- [ ] Have database credentials ready

## Deployment Steps

### Step 1: Backup Database (CRITICAL!)

```bash
# Windows
pg_dump -U postgres -d cbc_db > backup_before_org_fix_%date%.sql

# Linux/Mac
pg_dump -U postgres -d cbc_db > backup_before_org_fix_$(date +%Y%m%d).sql
```

**Status:** [ ] Complete

---

### Step 2: Run Migration

**Windows:**
```bash
run-organization-migration.bat
```

**Linux/Mac:**
```bash
chmod +x run-organization-migration.sh
./run-organization-migration.sh
```

**Expected Output:**
```
============================================================================
Running Organization Migration (Migration 008)
============================================================================

PostgreSQL connection successful!

Running migration 008_add_organization_to_exports.sql...

============================================================================
Migration completed successfully!
============================================================================

Verifying migration...
```

**Status:** [ ] Complete

---

### Step 3: Verify Migration

Run these queries to verify:

```sql
-- 1. Check organization_id column exists
SELECT COUNT(*) as total_exports, 
       COUNT(organization_id) as with_org_id 
FROM exports;
```
**Expected:** Both numbers should be equal

```sql
-- 2. Check organizations table
SELECT COUNT(*) FROM organizations;
```
**Expected:** 27 organizations

```sql
-- 3. View organizations by type
SELECT organization_type, COUNT(*) 
FROM organizations 
GROUP BY organization_type;
```
**Expected:** 8 different types

```sql
-- 4. Check exports by organization
SELECT * FROM exports_by_organization LIMIT 5;
```
**Expected:** Statistics grouped by organization

**Status:** [ ] Complete

---

### Step 4: Restart API Services

**Option A: Restart All Services**
```bash
# Windows
start-all.bat

# Linux/Mac
./start-all.sh
```

**Option B: Restart ECTA API Only**
```bash
cd api/ecta
npm run dev
```

**Status:** [ ] Complete

---

### Step 5: Test ECTA Dashboard

1. **Login as ECTA User**
   - Username: `ecta1` (or your ECTA test user)
   - Password: Your test password

2. **Test License Approval Page**
   - Navigate to: `/licenses` or `/licenses/applications`
   - Expected: Only coffee/tea exports shown
   - Expected: Exporter details visible (name, TIN, license)

3. **Test Quality Certification Page**
   - Navigate to: `/quality` or `/quality/pending`
   - Expected: Only coffee/tea exports shown
   - Expected: Exporter details visible

4. **Test Contract Approval Page**
   - Navigate to: `/contracts` or `/contracts/pending`
   - Expected: Only coffee/tea exports shown
   - Expected: Exporter details visible

**Status:** [ ] Complete

---

### Step 6: Test Exporter Dashboard

1. **Login as Exporter**
   - Use your test exporter credentials

2. **Check Export List**
   - Navigate to: `/exports`
   - Expected: Only own exports shown
   - Expected: Cannot see other exporters' data

**Status:** [ ] Complete

---

### Step 7: Test Agency Approval Dashboard

1. **Navigate to ESW Agency Dashboard**
   - URL: `/esw/agency-dashboard`

2. **Select Different Agencies**
   - Try: ECTA, MOA, NBE, ERCA
   - Expected: Appropriate exports shown for each agency

**Status:** [ ] Complete

---

### Step 8: Check Logs

Review API logs for:
- [ ] No errors during startup
- [ ] Organization filtering logs present
- [ ] Queries executing successfully

**Example log entries to look for:**
```
INFO: Fetched all coffee exports for ECTA { userId: '...', count: 10 }
INFO: Fetched pending licenses for ECTA { userId: '...', count: 5 }
```

**Status:** [ ] Complete

---

### Step 9: Monitor Performance

Check query performance:

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'exports'
AND indexname = 'idx_exports_organization_id';
```

**Expected:** idx_scan should increase as queries run

**Status:** [ ] Complete

---

## Post-Deployment Verification

### Database Verification

```sql
-- 1. All exports have organization_id
SELECT COUNT(*) as missing_org_id
FROM exports
WHERE organization_id IS NULL;
```
**Expected:** 0

```sql
-- 2. Organizations are active
SELECT COUNT(*) as active_orgs
FROM organizations
WHERE is_active = true;
```
**Expected:** 27

```sql
-- 3. Check data distribution
SELECT organization_id, COUNT(*) as export_count
FROM exports
GROUP BY organization_id
ORDER BY export_count DESC;
```
**Expected:** Reasonable distribution

**Status:** [ ] Complete

---

### API Verification

Test these endpoints:

1. **GET /ecta/license/pending**
   - Expected: 200 OK
   - Expected: Only coffee exports
   - Expected: Exporter details included

2. **GET /ecta/quality/pending**
   - Expected: 200 OK
   - Expected: Only coffee exports
   - Expected: Exporter details included

3. **GET /ecta/contract/pending**
   - Expected: 200 OK
   - Expected: Only coffee exports
   - Expected: Exporter details included

**Status:** [ ] Complete

---

## Rollback Plan (If Needed)

If something goes wrong:

### Step 1: Restore Database Backup
```bash
# Windows
psql -U postgres -d cbc_db < backup_before_org_fix_YYYYMMDD.sql

# Linux/Mac
psql -U postgres -d cbc_db < backup_before_org_fix_YYYYMMDD.sql
```

### Step 2: Revert Code Changes
```bash
git checkout HEAD -- api/ecta/src/controllers/
```

### Step 3: Restart Services
```bash
start-all.bat  # Windows
./start-all.sh # Linux/Mac
```

---

## Troubleshooting

### Issue: Migration Script Fails

**Error:** "Cannot connect to PostgreSQL"
**Solution:**
1. Check PostgreSQL is running
2. Verify credentials in connection string
3. Check database name is correct

**Error:** "Column already exists"
**Solution:**
- Migration already ran
- Check if organization_id exists: `\d exports`
- If exists, skip migration

**Error:** "Syntax error"
**Solution:**
- Check PostgreSQL version (needs 12+)
- Review migration file for typos

---

### Issue: No Data After Migration

**Problem:** Exports have NULL organization_id

**Solution:**
```sql
-- Manual backfill
UPDATE exports e
SET organization_id = 'ECTA'
WHERE e.coffee_type IS NOT NULL
AND e.organization_id IS NULL;
```

---

### Issue: Controllers Return Empty

**Problem:** No exports shown in ECTA dashboard

**Checklist:**
1. Check coffee_type is set on exports
   ```sql
   SELECT COUNT(*) FROM exports WHERE coffee_type IS NOT NULL;
   ```

2. Check exporter_profiles exists
   ```sql
   SELECT COUNT(*) FROM exporter_profiles;
   ```

3. Check join works
   ```sql
   SELECT e.*, ep.business_name
   FROM exports e
   JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
   LIMIT 5;
   ```

---

## Success Criteria

### ✅ Migration Successful If:
- [ ] Database migration completed without errors
- [ ] 27 organizations seeded
- [ ] All exports have organization_id
- [ ] Indexes created successfully
- [ ] Views created successfully

### ✅ Controllers Working If:
- [ ] ECTA sees only coffee/tea exports
- [ ] Exporter details included in responses
- [ ] Logging shows organization context
- [ ] No errors in API logs

### ✅ Frontend Working If:
- [ ] ECTA dashboard shows filtered data
- [ ] Exporter dashboard shows own data only
- [ ] Agency dashboard works correctly
- [ ] No console errors

---

## Documentation Reference

| Document | Purpose |
|----------|---------|
| `ORGANIZATION_FIX_QUICK_REFERENCE.md` | Quick start guide |
| `ORGANIZATION_INTEGRATION_ANALYSIS.md` | Problem analysis |
| `ORGANIZATION_FIX_IMPLEMENTATION.md` | Detailed implementation |
| `ORGANIZATION_FIX_VISUAL_GUIDE.md` | Visual diagrams |
| `ORGANIZATION_FIX_COMPLETE.md` | Complete summary |
| `DEPLOY_ORGANIZATION_FIX.md` | This deployment guide |

---

## Final Checklist

- [ ] Database backed up
- [ ] Migration executed successfully
- [ ] Migration verified
- [ ] API services restarted
- [ ] ECTA dashboard tested
- [ ] Exporter dashboard tested
- [ ] Agency dashboard tested
- [ ] Logs reviewed
- [ ] Performance checked
- [ ] No errors found

---

## Sign-Off

**Deployed By:** ___________________

**Date:** ___________________

**Time:** ___________________

**Database Backup Location:** ___________________

**Issues Encountered:** ___________________

**Status:** [ ] Success  [ ] Partial  [ ] Failed

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the documentation files
3. Check API logs for errors
4. Verify database state with SQL queries
5. Consider rollback if critical issues found

**Remember:** You have a database backup, so you can always rollback if needed!
