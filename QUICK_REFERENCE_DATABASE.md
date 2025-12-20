# Quick Reference - Database Connections

## API Services & Ports

```
Commercial Bank API    → http://localhost:3001
Custom Authorities API → http://localhost:3002
ECTA API              → http://localhost:3003
Exporter Portal API   → http://localhost:3004
National Bank API     → http://localhost:3005
ECX API               → http://localhost:3006
Shipping Line API     → http://localhost:3007
```

## Health Check Commands

```bash
# Test all services
for port in 3001 3002 3003 3004 3005 3006 3007; do
  echo "=== Port $port ==="
  curl -s http://localhost:$port/health | jq .
done

# Test specific service
curl http://localhost:3001/health
curl http://localhost:3001/ready
curl http://localhost:3001/live
```

## Database Connection

```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d coffee_export_db -c "SELECT NOW();"

# Check database tables
psql -h localhost -U postgres -d coffee_export_db -c "\dt"

# Check database size
psql -h localhost -U postgres -d coffee_export_db -c "SELECT pg_size_pretty(pg_database_size('coffee_export_db'));"
```

## Environment Variables

```bash
# Database connection
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coffee_export_db"
# OR
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=coffee_export_db
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_SSL=false

# API configuration
export NODE_ENV=development
export PORT=3001
export CORS_ORIGIN=http://localhost:5173
export LOG_LEVEL=info
```

## Common Endpoints

### Commercial Bank API (3001)
```bash
GET  /health                          # Health check
GET  /ready                           # Readiness probe
GET  /live                            # Liveness probe
POST /api/auth/login                  # Login
GET  /api/exports                     # Get all exports
GET  /api/exports/:id                 # Get export by ID
GET  /api/quality/pending             # Get pending quality checks
POST /api/quality/certify             # Issue quality certificate
```

### National Bank API (3005) - NEW ENDPOINTS
```bash
GET  /health                          # Health check
GET  /ready                           # Readiness probe
GET  /live                            # Liveness probe
POST /api/auth/login                  # Login
GET  /api/exports                     # Get all exports (NEW)
GET  /api/exports/:id                 # Get export by ID (NEW)
GET  /api/fx/pending                  # Get pending FX approvals (NEW)
GET  /api/exports/status/:status      # Get by status (NEW)
POST /api/fx/:id/approve              # Approve FX
POST /api/fx/:id/reject               # Reject FX
```

### ECTA API (3003) - NEW ENDPOINTS
```bash
GET  /health                          # Health check
GET  /ready                           # Readiness probe
GET  /live                            # Liveness probe
POST /api/auth/login                  # Login
GET  /api/preregistration/exporters   # Get all exporters (NEW)
GET  /api/preregistration/exporters/pending  # Get pending apps (NEW)
GET  /api/quality/pending             # Get pending quality checks
GET  /api/licenses/pending            # Get pending licenses
GET  /api/contracts/pending           # Get pending contracts
```

## Database Tables

```sql
-- Core tables
users                    -- User accounts
exports                  -- Export records
export_status_history    -- Status change history
export_approvals         -- Approval records
exporter_profiles        -- Exporter information
coffee_laboratories      -- Lab certifications
competence_certificates  -- Competence certs
export_licenses          -- Export licenses
```

## Troubleshooting

### Service won't start
```bash
# Check if port is in use
lsof -i :3001

# Check logs
tail -f logs/commercial-bank.log

# Check database connection
psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1"
```

### Database connection failed
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Check connection parameters
echo $DATABASE_URL
echo $DB_HOST $DB_PORT $DB_NAME $DB_USER

# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT NOW()"
```

### Slow queries
```bash
# Check query performance
psql -h localhost -U postgres -d coffee_export_db -c "EXPLAIN ANALYZE SELECT * FROM exports LIMIT 10;"

# Check indexes
psql -h localhost -U postgres -d coffee_export_db -c "\di"

# Check table size
psql -h localhost -U postgres -d coffee_export_db -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname != 'pg_catalog' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## Monitoring

### Check connection pool status
```bash
# From application logs
grep "Database pool" logs/*.log

# Check active connections
psql -h localhost -U postgres -d coffee_export_db -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

### Check error rates
```bash
# From application logs
grep "ERROR" logs/*.log | wc -l

# Check specific errors
grep "database" logs/*.log | grep -i error
```

## Deployment

### Pre-deployment
```bash
# Verify all services start
npm run start:all

# Test health endpoints
for port in 3001 3002 3003 3004 3005 3006 3007; do
  curl -f http://localhost:$port/health || echo "FAILED: $port"
done

# Test database queries
curl http://localhost:3001/api/exports
curl http://localhost:3005/api/exports
curl http://localhost:3003/api/preregistration/exporters
```

### Post-deployment
```bash
# Verify services are running
ps aux | grep node

# Check health
curl http://localhost:3001/health

# Check logs for errors
tail -f logs/*.log | grep -i error

# Monitor database
watch -n 1 'psql -h localhost -U postgres -d coffee_export_db -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"'
```

## Files Modified

```
/api/national-bank/src/controllers/fx.controller.ts
  ✅ Added getAllExports()
  ✅ Added getExport()
  ✅ Added getPendingFXApprovals()
  ✅ Added getExportsByStatus()

/api/ecta/src/controllers/preregistration.controller.ts
  ✅ Added database imports
  ✅ Implemented getAllExporters()
  ✅ Implemented getPendingApplications()
```

## Documentation

- `API_DATABASE_CONNECTION_REPORT.md` - Comprehensive report
- `DATABASE_CONNECTION_FIXES_SUMMARY.md` - Summary of fixes
- `VERIFICATION_CHECKLIST.md` - Deployment checklist
- `API_DATABASE_CONNECTION_COMPLETE.md` - Complete status
- `QUICK_REFERENCE_DATABASE.md` - This file

## Status

✅ All APIs connected to database
✅ All health checks implemented
✅ All endpoints tested
✅ Ready for production

---

**Last Updated:** 2024
**Status:** ✅ COMPLETE
