# Data Consistency Fix - Dashboard Endpoints

## Problem Identified

The dashboard endpoints (`/api/exporter/dashboard` and `/api/ecta/preregistration`) were not consistently fetching data due to:

1. **Multiple separate queries** instead of single JOIN query
2. **LIMIT 1 without status filtering** - fetching any record, not ACTIVE ones
3. **Inconsistent data sources** - mixing blockchain and PostgreSQL
4. **Missing relationship validation** - not checking if related records exist

## Solution Implemented

### 1. Single Comprehensive Query with JOINs

**Before:**
```javascript
// 5 separate queries
const labResult = await query(labQuery, [exporterUUID]);
const tasterResult = await query(tasterQuery, [exporterUUID]);
const compResult = await query(compQuery, [exporterUUID]);
const licenseResult = await query(licenseQuery, [exporterUUID]);
```

**After:**
```javascript
// Single query with proper JOINs
const dashboardQuery = `
  SELECT 
    ep.*, u.email, 
    cl.* (ACTIVE only),
    ct.* (ACTIVE only),
    cc.* (ACTIVE only),
    el.* (ACTIVE only)
  FROM exporter_profiles ep
  LEFT JOIN users u ON ep.user_id = u.username
  LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id AND cl.status = 'ACTIVE'
  LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id AND ct.status = 'ACTIVE'
  LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id AND cc.status = 'ACTIVE'
  LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id AND el.status = 'ACTIVE'
  WHERE ep.user_id = $1
`;
```

### 2. Status Filtering

All LEFT JOINs now include `AND table.status = 'ACTIVE'` to ensure only approved records are returned.

### 3. Complete Data Response

Dashboard now returns:
- **identity**: exporterId, businessName, tin, registrationNumber, businessType
- **contact**: contactPerson, email, phone, address, city, region
- **compliance**: All status fields with ACTIVE/MISSING values
- **qualificationProgress**: Overall progress percentage

### 4. Error Handling

- Returns 404 if exporter profile not found
- Logs all queries for debugging
- Validates profile status before returning data

## Files Modified

- `coffee-export-gateway/src/routes/exporter.routes.js` - Dashboard endpoint

## Testing

Run the test script:
```bash
bash scripts/test-dashboard-data.sh
```

Expected output:
- Identity data present ✓
- Compliance data present ✓
- Contact data present ✓
- All status fields correctly populated ✓

## Data Flow

1. Frontend calls `/api/exporter/dashboard`
2. Gateway executes single SQL query with JOINs
3. PostgreSQL returns complete exporter profile with all related data
4. Gateway transforms response to dashboard format
5. Frontend receives consistent, complete data

## Status Values

- **ACTIVE**: Record is approved and valid
- **MISSING**: No record exists for this stage
- **PENDING_APPROVAL**: Record exists but not yet approved
- **EXPIRED**: Record has expired
- **SUSPENDED**: Record is temporarily suspended
- **REVOKED**: Record has been revoked

## Next Steps

1. Apply same fix to ECTA preregistration endpoint
2. Add caching layer for frequently accessed data
3. Implement real-time updates via WebSocket
4. Add data validation middleware
