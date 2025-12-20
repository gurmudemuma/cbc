# CBC Database Connection Verification Guide

## Overview
This document provides a comprehensive guide to verify and troubleshoot database connections in the CBC project.

## Current Configuration

### Database Setup
- **Database Type**: PostgreSQL 15 (Alpine)
- **Container Name**: postgres
- **Host**: postgres (within Docker network)
- **Port**: 5432
- **Database Name**: coffee_export_db
- **Username**: postgres
- **Password**: postgres
- **Network**: coffee-export-network

### Redis Setup
- **Container Name**: redis
- **Host**: redis (within Docker network)
- **Port**: 6379
- **Network**: coffee-export-network

### IPFS Setup
- **Container Name**: ipfs
- **Host**: ipfs (within Docker network)
- **Port**: 5001 (API), 8080 (Gateway)
- **Network**: coffee-export-network

## API Services Configuration

All 7 API services are configured to connect to the database using:
- **DB_HOST**: postgres (Docker service name)
- **DB_PORT**: 5432
- **DB_NAME**: coffee_export_db
- **DB_USER**: postgres
- **DB_PASSWORD**: postgres
- **DB_SSL**: false

### API Services
1. **Commercial Bank** (Port 3001)
2. **Custom Authorities** (Port 3002)
3. **ECTA** (Port 3003)
4. **Exporter Portal** (Port 3004)
5. **National Bank** (Port 3005)
6. **ECX** (Port 3006)
7. **Shipping Line** (Port 3007)

## Verification Steps

### 1. Check Docker Network
```bash
docker network ls | grep coffee-export
```
Expected output: `coffee-export-network` should be listed

### 2. Check PostgreSQL Container Status
```bash
docker ps | grep postgres
```
Expected: Container should be running with status "Up"

### 3. Test PostgreSQL Connection
```bash
docker exec postgres pg_isready -U postgres
```
Expected output: `/var/run/postgresql:5432 - accepting connections`

### 4. Verify Database Exists
```bash
docker exec postgres psql -U postgres -d coffee_export_db -c "\dt"
```
Expected: List of 20 tables should be displayed

### 5. Check Redis Connection
```bash
docker exec redis redis-cli ping
```
Expected output: `PONG`

### 6. Verify All Tables
```bash
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```
Expected: Should return 20 tables

### 7. Test API Health Endpoints
```bash
# Commercial Bank
curl http://localhost:3001/health

# Custom Authorities
curl http://localhost:3002/health

# ECTA
curl http://localhost:3003/health

# Exporter Portal
curl http://localhost:3004/health

# National Bank
curl http://localhost:3005/health

# ECX
curl http://localhost:3006/health

# Shipping Line
curl http://localhost:3007/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Service Name",
  "database": "connected",
  "timestamp": "2025-12-19T...",
  "uptime": 123.45
}
```

## Database Tables

The following 20 tables are created during initialization:

1. **certificates_of_origin** - Coffee origin certificates
2. **coffee_laboratories** - Laboratory information
3. **coffee_lots** - Coffee lot tracking
4. **coffee_tasters** - Taster profiles
5. **competence_certificates** - Competence certifications
6. **export_approvals** - Export approval records
7. **export_documents** - Export documentation
8. **export_licenses** - Export licenses
9. **export_permits** - Export permits
10. **export_status_history** - Export status tracking
11. **exporter_profiles** - Exporter information
12. **exports** - Main export records
13. **preregistration_audit_log** - Pre-registration audit logs
14. **preregistration_documents** - Pre-registration documents
15. **quality_inspections** - Quality inspection records
16. **sales_contracts** - Sales contract records
17. **user_audit_log** - User action audit logs
18. **user_roles** - User role definitions
19. **user_sessions** - User session tracking
20. **users** - User accounts

## Connection Pool Configuration

The database connection pool is configured with:
- **Max Connections**: 20
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 2 seconds
- **Support**: Both DATABASE_URL and individual parameters

## Environment Variables

### Database Connection Parameters
```
DB_HOST=postgres
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Redis Configuration
```
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Troubleshooting

### Issue: "Connection refused"
**Solution**: 
1. Verify postgres container is running: `docker ps | grep postgres`
2. Check network connectivity: `docker network inspect coffee-export-network`
3. Restart postgres: `docker-compose -f docker-compose.postgres.yml restart postgres`

### Issue: "Database does not exist"
**Solution**:
1. Verify database creation: `docker exec postgres psql -U postgres -l`
2. Recreate database: `docker-compose -f docker-compose.postgres.yml down && docker-compose -f docker-compose.postgres.yml up -d postgres`

### Issue: "Authentication failed"
**Solution**:
1. Verify credentials in .env files
2. Check postgres user exists: `docker exec postgres psql -U postgres -c "\du"`
3. Reset password if needed

### Issue: "Connection timeout"
**Solution**:
1. Check if postgres is responding: `docker exec postgres pg_isready -U postgres`
2. Increase connection timeout in pool.ts
3. Check system resources: `docker stats postgres`

### Issue: "Pool exhausted"
**Solution**:
1. Increase max connections in pool.ts (currently 20)
2. Check for connection leaks in application code
3. Monitor active connections: `docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT count(*) FROM pg_stat_activity;"`

## Docker Compose Commands

### Start Infrastructure
```bash
docker-compose -f docker-compose.postgres.yml up -d
```

### Start All APIs
```bash
docker-compose -f docker-compose.apis.yml up -d
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.postgres.yml logs -f

# Specific service
docker-compose -f docker-compose.postgres.yml logs -f postgres
```

### Stop All Services
```bash
docker-compose -f docker-compose.postgres.yml down
docker-compose -f docker-compose.apis.yml down
```

### Check Service Status
```bash
docker-compose -f docker-compose.postgres.yml ps
docker-compose -f docker-compose.apis.yml ps
```

## Health Check Configuration

All services include health checks:
- **Interval**: 10 seconds
- **Timeout**: 5 seconds
- **Retries**: 5
- **Start Period**: 40 seconds (for APIs)

Health check endpoints:
- `/health` - Full health status with database connection
- `/ready` - Readiness probe (database connectivity)
- `/live` - Liveness probe (service is running)

## Performance Monitoring

### Check Connection Pool Stats
```bash
# From within API container
curl http://localhost:3001/health
```

### Monitor Database Connections
```bash
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

### Check Query Performance
```bash
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

## Security Considerations

### Current Setup (Development)
- Default credentials used (postgres/postgres)
- SSL disabled (DB_SSL=false)
- No authentication on Redis

### Production Recommendations
1. Change default PostgreSQL password
2. Enable SSL connections (DB_SSL=true)
3. Use strong, unique passwords
4. Implement Redis authentication
5. Use environment-specific .env files
6. Restrict network access
7. Enable audit logging
8. Regular backups

## Backup and Recovery

### Backup Database
```bash
docker exec postgres pg_dump -U postgres coffee_export_db > backup.sql
```

### Restore Database
```bash
docker exec -i postgres psql -U postgres coffee_export_db < backup.sql
```

### Backup Volume
```bash
docker run --rm -v postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

## Next Steps

1. Verify all connections using the verification steps above
2. Test API endpoints with sample requests
3. Monitor logs for any connection issues
4. Set up monitoring and alerting
5. Configure backups for production
6. Document any custom configurations
