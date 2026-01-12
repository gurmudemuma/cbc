# Pending Items Filter Fix

## Problem
After approving/rejecting items in the ECTA Pre-Registration Management dashboard, the items remained visible in the "pending" tables instead of moving to their appropriate status view.

## Root Cause
All `getPending*` methods in the backend were returning ALL items (PENDING, REJECTED, ACTIVE) sorted by priority, not just truly pending items. This meant:
- Approved items stayed in "Pending Approvals" tab
- Rejected items stayed in "Pending" tabs
- Users couldn't distinguish between pending and processed items

## Solution
Updated all 5 backend methods to filter by status and only return truly pending items:

### 1. `getPendingApplications()`
**Before:**
```sql
SELECT * FROM exporter_profiles 
ORDER BY 
  CASE 
    WHEN status = 'PENDING_APPROVAL' THEN 0
    WHEN status = 'REJECTED' THEN 1
    WHEN status = 'ACTIVE' THEN 2
    ELSE 3
  END,
  created_at DESC
```

**After:**
```sql
SELECT * FROM exporter_profiles 
WHERE status = 'PENDING_APPROVAL'
ORDER BY created_at DESC
```

### 2. `getPendingLaboratories()`
**Before:**
```sql
SELECT ... FROM coffee_laboratories cl
LEFT JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id
ORDER BY 
  CASE 
    WHEN cl.status = 'PENDING' THEN 0
    WHEN cl.status = 'REJECTED' THEN 1
    WHEN cl.status = 'ACTIVE' THEN 2
    ELSE 3
  END,
  cl.created_at DESC
```

**After:**
```sql
SELECT ... FROM coffee_laboratories cl
LEFT JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id
WHERE cl.status = 'PENDING'
ORDER BY cl.created_at DESC
```

### 3. `getPendingTasters()`
**Before:**
```sql
SELECT ... FROM coffee_tasters ct
LEFT JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id
ORDER BY 
  CASE 
    WHEN ct.status = 'PENDING' THEN 0
    WHEN ct.status = 'REJECTED' THEN 1
    WHEN ct.status = 'ACTIVE' THEN 2
    ELSE 3
  END,
  ct.created_at DESC
```

**After:**
```sql
SELECT ... FROM coffee_tasters ct
LEFT JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id
WHERE ct.status = 'PENDING'
ORDER BY ct.created_at DESC
```

### 4. `getPendingCompetenceCertificates()`
**Before:**
```sql
SELECT ... FROM competence_certificates cc
JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
ORDER BY 
  CASE 
    WHEN cc.status = 'PENDING' THEN 0
    WHEN cc.status = 'REJECTED' THEN 1
    WHEN cc.status = 'ACTIVE' THEN 2
    ELSE 3
  END,
  cc.created_at DESC
```

**After:**
```sql
SELECT ... FROM competence_certificates cc
JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
WHERE cc.status = 'PENDING'
ORDER BY cc.created_at DESC
```

### 5. `getPendingLicenses()`
**Before:**
```sql
SELECT ... FROM export_licenses el
JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
ORDER BY 
  CASE 
    WHEN el.status = 'PENDING_REVIEW' THEN 0
    WHEN el.status = 'PENDING' THEN 1
    WHEN el.status = 'REJECTED' THEN 2
    WHEN el.status = 'ACTIVE' THEN 3
    ELSE 4
  END,
  el.created_at DESC
```

**After:**
```sql
SELECT ... FROM export_licenses el
JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
WHERE el.status IN ('PENDING_REVIEW', 'PENDING')
ORDER BY 
  CASE 
    WHEN el.status = 'PENDING_REVIEW' THEN 0
    WHEN el.status = 'PENDING' THEN 1
    ELSE 2
  END,
  el.created_at DESC
```

## Files Modified
- `api/ecta/src/controllers/preregistration.controller.ts` - Updated 5 methods

## Expected Behavior
1. **Pending Tabs Show Only Pending Items:**
   - Exporter Profiles tab: Only `PENDING_APPROVAL` status
   - Laboratories tab: Only `PENDING` status
   - Tasters tab: Only `PENDING` status
   - Competence Certificates tab: Only `PENDING` status
   - Export Licenses tab: Only `PENDING_REVIEW` or `PENDING` status

2. **Items Disappear After Action:**
   - When approved: Item disappears from pending tab, moves to "All Exporters" tab with ACTIVE status
   - When rejected: Item disappears from pending tab, moves to "All Exporters" tab with REJECTED status
   - When issued: Certificate/license disappears from pending tab

3. **Real-time Updates:**
   - Combined with the `refreshAllData()` fix, both table and dashboard stats update immediately
   - Pending counts decrease when items are processed
   - Active counts increase when items are approved

## Testing Steps
1. Navigate to ECTA Pre-Registration Management
2. Go to "Exporter Profiles" tab
3. Note the count of pending items
4. Approve an exporter
5. **Verify:** Item disappears from the table immediately
6. **Verify:** "Pending Approvals" stat card decreases by 1
7. Go to "All Exporters" tab
8. **Verify:** The approved exporter appears with ACTIVE status
9. Repeat for other tabs (Laboratories, Tasters, Competence, Licenses)

## Status
✅ **COMPLETE** - All pending methods now properly filter by status
