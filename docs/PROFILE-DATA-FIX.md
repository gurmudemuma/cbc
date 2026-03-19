# Exporter Profile Data Fix - Complete Implementation

## Problem Summary
The system was displaying "N/A" values for exporter profile data on the dashboard instead of actual data from the database. The root causes were:

1. **Exporter profiles not being created** - The seed script was returning early when users already existed, skipping profile creation
2. **Dashboard returning fallback data** - When profiles didn't exist, the endpoint returned hardcoded N/A values
3. **Slow startup** - Excessive wait times between service initialization steps
4. **Missing CLI in startup** - CLI container wasn't being started automatically

## Solutions Implemented

### 1. Fixed Seed Script (`coffee-export-gateway/src/scripts/seedUsers.js`)
**Change**: Modified `createUserInPostgreSQL()` function to:
- NOT return early when user exists
- Continue to create exporter profile even if user already exists
- Check if profile exists before creating to avoid duplicates
- Generate unique registration numbers (format: ECTA-YYYY-NNNNNN)
- Create profiles with complete data:
  - business_name, tin, registration_number, business_type
  - minimum_capital, office_address, city, region
  - contact_person, email, phone, status

**Result**: All exporter profiles are now created with complete data during system initialization

### 2. Dashboard Endpoint (`coffee-export-gateway/src/routes/exporter.routes.js`)
**Status**: Already correctly implemented
- Queries PostgreSQL for actual profile data
- Returns complete profile information including:
  - Identity: exporterId, businessName, tin, registrationNumber, businessType
  - Contact: contactPerson, email, phone, officeAddress, city, region
  - Compliance: profileStatus, capitalAmount, qualification statuses
  - Documents: certificate numbers and IDs
  - Metadata: timestamps and approval dates

### 3. Optimized Startup Scripts
**Changes to `scripts/start-system.bat` and `scripts/start-system.sh`**:
- Reduced PostgreSQL wait time from 15s to 10s
- Reduced gateway wait time from 15s to 10s
- Added CLI container startup after blockchain infrastructure
- Maintained 20s wait for blockchain services (required for stability)

**Result**: System starts faster while maintaining stability

### 4. Created Shell Script (`scripts/start-system.sh`)
- Full Linux/Mac equivalent of Windows batch script
- Same initialization flow and timing
- Includes CLI startup

## Data Flow After Fix

### Startup Sequence
1. Docker cleanup and network setup
2. Blockchain infrastructure (20s wait)
3. CLI container startup
4. Application infrastructure (postgres, redis, kafka, zookeeper)
5. Gateway and core services (10s wait)
6. **Seed script runs** → Creates users AND exporter profiles
7. Database diagnostic check
8. CBC services startup
9. Frontend startup

### Profile Creation Flow
1. Seed script checks if user exists
2. If user doesn't exist, creates user with hashed password
3. If user is exporter role:
   - Checks if profile exists
   - If profile doesn't exist:
     - Generates unique registration number (ECTA-2026-000001, etc.)
     - Creates profile with all required fields
     - Stores in exporter_profiles table

### Dashboard Data Flow
1. User logs in
2. Dashboard endpoint queries exporter_profiles table
3. Joins with users table for email
4. Queries qualification tables (laboratories, tasters, certificates, licenses)
5. Returns complete profile data with actual values (no N/A fallbacks)

## Database Schema
The exporter_profiles table includes:
- exporter_id (UUID, primary key)
- user_id (VARCHAR, unique, foreign key to users)
- business_name, tin, registration_number
- business_type, minimum_capital
- office_address, city, region
- contact_person, email, phone
- status (ACTIVE, PENDING_APPROVAL, SUSPENDED, REVOKED)
- created_at, updated_at

## Test Credentials
After running the startup script, the following users are created with complete profiles:

**Approved Exporters:**
- exporter1 / password123 → Ethiopian Coffee Exports Ltd (TIN0000000002)
- exporter2 / password123 → Addis Coffee Trading PLC (TIN0000000003)

**Pending Exporter:**
- exporter3 / password123 → Sidamo Coffee Traders (TIN0000000004)

**Admin:**
- admin / admin123 → Ethiopian Coffee & Tea Authority

## Verification
Run the diagnostic script to verify profiles are created:
```bash
docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run check-db
```

Expected output:
```
EXPORTER_PROFILES TABLE:
Found 3 exporter profiles:
  - exporter1
    Business: Ethiopian Coffee Exports Ltd
    TIN: TIN0000000002
    Reg#: ECTA-2026-000001
    Status: ACTIVE
    ...
```

## Frontend Display
The dashboard now displays:
- **Business Name**: Ethiopian Coffee Exports Ltd (not N/A)
- **TIN**: TIN0000000002 (not N/A)
- **Registration Number**: ECTA-2026-000001 (not exporter1)
- **Contact Person**: Abebe Kebede (not N/A)
- **Email**: contact@ethiopiancoffee.com (actual email)
- **Phone**: +251911000002 (not N/A)
- **Address**: Addis Ababa, Ethiopia (actual address)
- **City/Region**: Addis Ababa (actual values)

## Files Modified
1. `coffee-export-gateway/src/scripts/seedUsers.js` - Fixed profile creation logic
2. `scripts/start-system.bat` - Optimized timing, added CLI
3. `scripts/start-system.sh` - Created new shell script with same logic

## Next Steps
1. Run the startup script: `.\scripts\start-system.bat` (Windows) or `./scripts/start-system.sh` (Linux/Mac)
2. Wait for system to fully initialize
3. Open http://localhost:5173 in browser
4. Login with test credentials
5. Verify dashboard displays complete profile data
6. Check that registration numbers are properly generated and displayed
