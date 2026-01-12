# CBC System Verification Guide

## Overview

This guide helps you verify that all Exporter and ECTA functionality is working correctly in the Coffee Blockchain Consortium (CBC) system.

## What This System Does

### Exporters
Coffee exporters use the system to:
- Register their business profile with ECTA
- Register coffee laboratories and tasters (if not a farmer)
- Apply for competence certificates and export licenses
- Create and submit export requests
- Track export status through the complete workflow
- Upload required documents
- View dashboard statistics

### ECTA (Ethiopian Coffee & Tea Authority)
ECTA officials use the system to:
- Review and approve exporter profiles
- Certify coffee laboratories
- Verify coffee tasters
- Issue competence certificates
- Issue export licenses
- Approve quality certifications
- Approve sales contracts
- Manage the complete pre-registration workflow

## Quick Verification

### Step 1: Start the System

**Option A: Using PowerShell (Recommended)**
```powershell
.\start-all.ps1
```

**Option B: Using Batch File**
```batch
start-all.bat
```

**Option C: Manual Docker Compose**
```powershell
# Start infrastructure
docker-compose -f docker-compose.postgres.yml up -d

# Wait 30 seconds
Start-Sleep -Seconds 30

# Start APIs
docker-compose -f docker-compose.apis.yml up -d

# Start frontend (in separate terminal)
cd frontend
npm run dev
```

### Step 2: Run Comprehensive Verification

Once all services are running:

```bash
node comprehensive-verification.js
```

This script will test:
- ✅ All 7 API services are running
- ✅ Database connectivity and schema
- ✅ Exporter Portal functionality
- ✅ ECTA Pre-Registration system
- ✅ ECTA Licensing system
- ✅ ECTA Quality Certification
- ✅ Data integrity (no orphaned records)
- ✅ Export workflow status

## Manual Verification Steps

### 1. Verify Services Are Running

```powershell
# Check Docker containers
docker ps

# Should show:
# - postgres
# - redis
# - ipfs
# - cbc-commercial-bank
# - cbc-custom-authorities
# - cbc-ecta
# - cbc-exporter-portal
# - cbc-national-bank
# - cbc-ecx
# - cbc-shipping-line
```

### 2. Test Exporter Portal

```bash
# Run exporter verification
node verify_stats_api.js
```

Expected output:
- ✅ Login successful
- ✅ Stats endpoint working
- ✅ Export data structure correct

### 3. Test ECTA System

```bash
# Run ECTA verification
node verify_ecta_stats.js
```

Expected output:
- ✅ ECTA login successful
- ✅ Dashboard stats working
- ✅ Exporter data accessible

### 4. Test Database

```powershell
# Connect to database
docker exec -it postgres psql -U postgres -d coffee_export_db

# Check key tables
\dt

# Check exporter profiles
SELECT COUNT(*) FROM exporter_profiles;

# Check exports
SELECT status, COUNT(*) FROM exports GROUP BY status;

# Exit
\q
```

## Service URLs

Once running, access services at:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Main UI for all users |
| **Exporter Portal API** | http://localhost:3004 | Exporter operations |
| **ECTA API** | http://localhost:3003 | ECTA operations |
| **Commercial Bank API** | http://localhost:3001 | Banking operations |
| **Custom Authorities API** | http://localhost:3002 | Customs clearance |
| **National Bank API** | http://localhost:3005 | FX approval |
| **ECX API** | http://localhost:3006 | Lot verification |
| **Shipping Line API** | http://localhost:3007 | Shipment scheduling |

## Key Functionality to Test

### Exporter Workflow

1. **Registration**
   - Navigate to http://localhost:5173
   - Register as exporter
   - Fill in business details (TIN, registration number, etc.)
   - Submit for ECTA approval

2. **Laboratory Registration** (if not farmer)
   - Register coffee laboratory
   - Provide certification details
   - Wait for ECTA certification

3. **Taster Registration** (if not farmer)
   - Register coffee taster
   - Provide qualification details
   - Wait for ECTA verification

4. **Competence Certificate**
   - Apply for competence certificate
   - Provide required documents
   - Wait for ECTA approval

5. **Export License**
   - Apply for export license
   - Provide competence certificate
   - Wait for ECTA approval

6. **Create Export Request**
   - Create new export
   - Provide all required documents:
     - Export license number
     - Competence certificate number
     - ECX lot number
     - Warehouse receipt number
     - Quality certificate number
     - Sales contract number
     - Export permit number
     - Origin certificate number
   - Submit for processing

7. **Track Export**
   - View export status
   - Monitor workflow progression:
     - DRAFT → ECX_PENDING → ECX_VERIFIED
     - → ECTA_LICENSE_PENDING → ECTA_LICENSE_APPROVED
     - → QUALITY_PENDING → QUALITY_CERTIFIED
     - → BANK_DOCUMENT_PENDING → SHIPPED → COMPLETED

### ECTA Workflow

1. **Review Exporter Profiles**
   - Login as ECTA official
   - View pending applications
   - Approve or reject profiles

2. **Certify Laboratories**
   - View pending laboratory certifications
   - Review documentation
   - Issue certification

3. **Verify Tasters**
   - View pending taster verifications
   - Review qualifications
   - Verify taster

4. **Issue Competence Certificates**
   - View pending certificate applications
   - Review exporter qualifications
   - Issue certificate

5. **Issue Export Licenses**
   - View pending license applications
   - Verify competence certificate
   - Issue export license

6. **Quality Certification**
   - View exports pending quality inspection
   - Review quality data
   - Issue quality certificate

7. **Contract Approval**
   - View pending sales contracts
   - Review contract details
   - Approve or reject

## Troubleshooting

### Services Not Starting

**Problem:** Docker containers not starting
```powershell
# Check Docker is running
docker ps

# View logs
docker-compose -f docker-compose.postgres.yml logs
docker-compose -f docker-compose.apis.yml logs

# Restart services
docker-compose -f docker-compose.postgres.yml restart
docker-compose -f docker-compose.apis.yml restart
```

### Database Connection Failed

**Problem:** Cannot connect to database
```powershell
# Check PostgreSQL is running
docker exec postgres pg_isready -U postgres

# Check database exists
docker exec postgres psql -U postgres -l

# Recreate database if needed
docker exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS coffee_export_db;"
docker exec postgres psql -U postgres -c "CREATE DATABASE coffee_export_db;"
```

### API Not Responding

**Problem:** API service not responding
```powershell
# Check specific service logs
docker logs cbc-exporter-portal
docker logs cbc-ecta

# Restart specific service
docker-compose -f docker-compose.apis.yml restart exporter-portal
docker-compose -f docker-compose.apis.yml restart ecta
```

### Port Already in Use

**Problem:** Port conflict
```powershell
# Find process using port
netstat -ano | findstr ":3004"

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or stop all services and restart
.\start-all.ps1 stop
.\start-all.ps1
```

## Expected Test Results

### Comprehensive Verification

When running `node comprehensive-verification.js`, you should see:

```
╔════════════════════════════════════════════════════════════╗
║   Comprehensive Verification: Exporters & ECTA System     ║
╚════════════════════════════════════════════════════════════╝

=== Testing Service Health ===
✅ Commercial Bank: Running
✅ Custom Authorities: Running
✅ ECTA: Running
✅ Exporter Portal: Running
✅ National Bank: Running
✅ ECX: Running
✅ Shipping Line: Running

=== Testing Database Connection ===
✅ Database connection successful
✅ Table: exporter_profiles
✅ Table: coffee_laboratories
✅ Table: coffee_tasters
✅ Table: competence_certificates
✅ Table: export_licenses
✅ Table: exports
✅ Table: export_status_history
✅ Table: users

=== Testing Exporter Portal ===
✅ Exporter login successful
✅ Export stats endpoint working
✅ Get exports working

=== Testing ECTA Pre-Registration ===
✅ ECTA login successful
✅ ECTA dashboard stats working
✅ Get exporters working
✅ Pending applications working

=== Testing ECTA Licensing ===
✅ Pending licenses working
✅ Get exports working

=== Testing ECTA Quality Certification ===
✅ Pending quality inspections working
✅ Get exports working

=== Testing Data Integrity ===
✅ Coffee laboratories without exporters: Clean
✅ Coffee tasters without exporters: Clean
✅ Exports without exporters: Clean
✅ Export status history without exports: Clean

=== Testing Export Workflow ===
✅ Export status distribution
✅ No stuck exports found

╔════════════════════════════════════════════════════════════╗
║                    VERIFICATION SUMMARY                    ║
╚════════════════════════════════════════════════════════════╝

✅ Service Health
✅ Database Connection
✅ Exporter Portal
✅ ECTA Pre-Registration
✅ ECTA Licensing
✅ ECTA Quality
✅ Data Integrity
✅ Export Workflow

📊 Success Rate: 8/8 (100.0%)

🎉 All tests passed! System is fully operational.
```

## Database Schema Verification

Key tables that must exist:

### Pre-Registration Tables
- `exporter_profiles` - Exporter business information
- `coffee_laboratories` - Lab certifications
- `coffee_tasters` - Taster qualifications
- `competence_certificates` - Exporter competence
- `export_licenses` - Export licenses

### Export Workflow Tables
- `exports` - Export requests
- `export_status_history` - Audit trail
- `export_documents` - Document attachments
- `export_approvals` - Approval tracking

### Supporting Tables
- `coffee_lots` - ECX lot information
- `quality_inspections` - Quality data
- `sales_contracts` - Contract information
- `export_permits` - Export permits
- `certificates_of_origin` - Origin certificates

### System Tables
- `users` - Authentication
- `user_roles` - RBAC
- `user_sessions` - Session management
- `preregistration_audit_log` - Compliance audit

## Performance Benchmarks

Expected response times:
- Login: < 500ms
- Get stats: < 200ms
- Get exports list: < 300ms
- Create export: < 1000ms
- Database queries: < 100ms

## Security Checks

Verify:
- ✅ JWT authentication working
- ✅ Role-based access control enforced
- ✅ Audit logging enabled
- ✅ Sensitive data not exposed in logs
- ✅ CORS configured correctly
- ✅ SQL injection protection (parameterized queries)

## Next Steps

After verification passes:

1. **Test with Real Data**
   - Create test exporter profiles
   - Submit test export requests
   - Process through complete workflow

2. **Load Testing**
   - Test with multiple concurrent users
   - Verify performance under load

3. **Integration Testing**
   - Test complete end-to-end workflows
   - Verify all stakeholder interactions

4. **User Acceptance Testing**
   - Have actual users test the system
   - Gather feedback and iterate

## Support

If you encounter issues:

1. Check logs: `docker-compose -f docker-compose.apis.yml logs -f`
2. Check database: `docker exec -it postgres psql -U postgres -d coffee_export_db`
3. Restart services: `.\start-all.ps1 stop` then `.\start-all.ps1`
4. Review error messages in verification output

## Summary

This verification ensures:
- ✅ All services are running correctly
- ✅ Database schema is complete
- ✅ Exporter functionality works end-to-end
- ✅ ECTA functionality works end-to-end
- ✅ Data integrity is maintained
- ✅ Export workflow progresses correctly
- ✅ Security measures are in place
- ✅ Performance is acceptable

The system is production-ready when all verifications pass!
