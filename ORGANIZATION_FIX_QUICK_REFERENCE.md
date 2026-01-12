# Organization Fix - Quick Reference

## What Was Fixed

**Problem:** ECTA and other agencies could see ALL exports, not just relevant ones.

**Solution:** Added `organization_id` to exports table and updated controllers to filter by organization.

## Run the Migration

### Windows
```bash
run-organization-migration.bat
```

### Linux/Mac
```bash
chmod +x run-organization-migration.sh
./run-organization-migration.sh
```

## What Changed

### Database
- ✅ Added `organization_id` column to `exports` table
- ✅ Created `organizations` table with 27 organizations
- ✅ Backfilled existing data
- ✅ Created helpful views

### Backend Controllers
- ✅ Updated `api/ecta/src/controllers/license.controller.ts`
- ✅ Updated `api/ecta/src/controllers/quality.controller.ts`
- ✅ Updated `api/ecta/src/controllers/contract.controller.ts`

### Key Changes
All ECTA controllers now:
1. Join with `exporter_profiles` to get exporter details
2. Filter to show only coffee/tea exports (ECTA's jurisdiction)
3. Add comprehensive logging
4. Return exporter name, TIN, and license number

## How It Works Now

### ECTA (Regulatory Agency)
- Can view ALL coffee/tea exports (their jurisdiction)
- Filters by `coffee_type IS NOT NULL`
- Sees exports from all exporters

### Exporters (Private Companies)
- Can view only THEIR OWN exports
- Filters by `organization_id = user.organizationId`
- Cannot see other exporters' data

### Banks
- Can view exports requiring banking services
- Filters by status and service type
- Sees exports needing their action

## Organizations Seeded

| Type | Count | Examples |
|------|-------|----------|
| Regulatory Agencies | 5 | ECTA, MOA, MOH, EPA, QSAE |
| Banking | 4 | NBE, Commercial Banks |
| Customs | 3 | ERCA, FDRE_CUSTOMS, Custom Authorities |
| Exchange | 1 | ECX |
| Shipping | 3 | ESLSE, Shipping Lines |
| Ministries | 4 | MOT, MOFED, MOTI, MIDROC |
| Government | 2 | EIC, TRADE_REMEDY |
| Exporters | 3 | Exporter Portal variants |

**Total: 27 organizations**

## Verify Migration

```sql
-- Check organization_id added
SELECT COUNT(*) as total, COUNT(organization_id) as with_org 
FROM exports;

-- View organizations
SELECT organization_id, organization_name, organization_type 
FROM organizations 
ORDER BY organization_type;

-- Check exports by organization
SELECT * FROM exports_by_organization;
```

## Example Queries

### ECTA: Get pending quality inspections
```sql
SELECT e.*, ep.business_name as exporter_name
FROM exports e
JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
WHERE e.status = 'ECTA_QUALITY_PENDING'
AND e.coffee_type IS NOT NULL;
```

### Exporter: Get my exports
```sql
SELECT e.*
FROM exports e
WHERE e.organization_id = 'EXPORTER_123';
```

### Bank: Get pending documents
```sql
SELECT e.*
FROM exports e
WHERE e.status = 'BANK_DOCUMENT_PENDING';
```

## Files Created/Modified

### New Files
- `api/shared/database/migrations/008_add_organization_to_exports.sql`
- `run-organization-migration.bat`
- `run-organization-migration.sh`
- `ORGANIZATION_INTEGRATION_ANALYSIS.md`
- `ORGANIZATION_FIX_IMPLEMENTATION.md`
- `ORGANIZATION_FIX_QUICK_REFERENCE.md` (this file)

### Modified Files
- `api/ecta/src/controllers/license.controller.ts`
- `api/ecta/src/controllers/quality.controller.ts`
- `api/ecta/src/controllers/contract.controller.ts`

## Testing

After migration, test:

1. **ECTA Dashboard**
   - Login as ECTA user
   - Check pending licenses, quality inspections, contracts
   - Verify only coffee exports shown

2. **Exporter Dashboard**
   - Login as exporter
   - Check export list
   - Verify only own exports shown

3. **Agency Approval Dashboard**
   - Select different agencies
   - Verify appropriate exports shown

## Troubleshooting

### Migration fails
- Check PostgreSQL is running
- Verify database credentials
- Check if migration already ran

### No data after migration
- Run backfill query manually
- Check exporter_profiles has user_id
- Verify users table has organization_id

### Controllers return empty results
- Check coffee_type is set on exports
- Verify organization_id is populated
- Check user JWT has organizationId

## Next Steps

1. Run the migration
2. Restart all API services
3. Test ECTA dashboard
4. Test exporter dashboard
5. Verify data filtering works correctly

## Support

For issues or questions, refer to:
- `ORGANIZATION_INTEGRATION_ANALYSIS.md` - Detailed problem analysis
- `ORGANIZATION_FIX_IMPLEMENTATION.md` - Complete implementation guide
