# CBC Complete Startup Guide - Database Connection Verified

## Quick Start (5 minutes)

### Prerequisites
- Docker and Docker Compose installed
- Port 5432 (PostgreSQL), 6379 (Redis), 3001-3007 (APIs) available
- At least 4GB RAM available

### Step 1: Start Infrastructure (Database, Redis, IPFS)
```bash
cd /home/gu-da/cbc
docker-compose -f docker-compose.postgres.yml up -d
```

**Expected Output:**
```
[+] Running 3/3
 ✔ Container postgres  Started
 ✔ Container redis    Started
 ✔ Container ipfs     Started
```

### Step 2: Verify Database Connection
```bash
./verify-database-connection.sh
```

**Expected Output:**
```
✓ PostgreSQL: Running and accepting connections
✓ Database: coffee_export_db with 29 tables
✓ Redis: Running and accepting connections
✓ Docker Network: coffee-export-network configured
Database Connection Status: VERIFIED ✓
```

### Step 3: Start All API Services
```bash
docker-compose -f docker-compose.apis.yml up -d
```

**Expected Output:**
```
[+] Running 7/7
 ✔ Container cbc-commercial-bank    Started
 ✔ Container cbc-custom-authorities Started
 ✔ Container cbc-ecta               Started
 ✔ Container cbc-exporter-portal    Started
 ✔ Container cbc-national-bank      Started
 ✔ Container cbc-ecx                Started
 ✔ Container cbc-shipping-line      Started
```

### Step 4: Verify All Services Are Healthy
```bash
# Check all containers
docker-compose -f docker-compose.apis.yml ps

# Test Commercial Bank API
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "Commercial Bank API",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2025-12-19T...",
  "uptime": 12.34,
  "database": "connected",
  "memory": {
    "used": 45,
    "total": 512,
    "unit": "MB"
  }
}
```

## Detailed Configuration

### Database Configuration

**PostgreSQL Connection Details:**
- Host: `postgres` (Docker service name)
- Port: `5432`
- Database: `coffee_export_db`
- User: `postgres`
- Password: `postgres`
- SSL: `false`

**Connection Pool Settings:**
- Max Connections: 20
- Idle Timeout: 30 seconds
- Connection Timeout: 2 seconds

### API Services Configuration

All 7 API services use the same database configuration:

```yaml
environment:
  DB_HOST: postgres
  DB_PORT: 5432
  DB_NAME: coffee_export_db
  DB_USER: postgres
  DB_PASSWORD: postgres
  DB_SSL: "false"
  REDIS_HOST: redis
  REDIS_PORT: 6379
```

### Service Ports

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| Commercial Bank | 3001 | http://localhost:3001/health |
| Custom Authorities | 3002 | http://localhost:3002/health |
| ECTA | 3003 | http://localhost:3003/health |
| Exporter Portal | 3004 | http://localhost:3004/health |
| National Bank | 3005 | http://localhost:3005/health |
| ECX | 3006 | http://localhost:3006/health |
| Shipping Line | 3007 | http://localhost:3007/health |

## Database Tables (29 Total)

### Core Tables
1. **users** - User accounts
2. **user_roles** - User role definitions
3. **user_sessions** - User session tracking
4. **user_audit_log** - User action audit logs

### Export Management
5. **exports** - Main export records
6. **export_status_history** - Export status tracking
7. **export_documents** - Export documentation
8. **export_approvals** - Export approval records
9. **export_licenses** - Export licenses
10. **export_permits** - Export permits

### Pre-registration System
11. **preregistration_audit_log** - Pre-registration audit logs
12. **preregistration_documents** - Pre-registration documents

### Coffee Quality & Inspection
13. **coffee_lots** - Coffee lot tracking
14. **coffee_laboratories** - Laboratory information
15. **coffee_tasters** - Taster profiles
16. **quality_inspections** - Quality inspection records

### Certificates & Compliance
17. **certificates_of_origin** - Coffee origin certificates
18. **competence_certificates** - Competence certifications
19. **sales_contracts** - Sales contract records

### Additional Tables (10 more)
20-29. Additional system and audit tables

## Verification Commands

### Check Infrastructure Status
```bash
# View all running containers
docker ps

# Check specific service
docker ps | grep postgres
docker ps | grep redis
docker ps | grep cbc-

# View container logs
docker logs postgres
docker logs redis
docker logs cbc-commercial-bank
```

### Test Database Connectivity
```bash
# Test PostgreSQL
docker exec postgres pg_isready -U postgres

# List all databases
docker exec postgres psql -U postgres -l

# List all tables
docker exec postgres psql -U postgres -d coffee_export_db -c "\dt"

# Count tables
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Test Redis
docker exec redis redis-cli ping
```

### Test API Connectivity
```bash
# Test all APIs
for port in 3001 3002 3003 3004 3005 3006 3007; do
  echo "Testing port $port..."
  curl -s http://localhost:$port/health | jq .
done

# Test specific API
curl http://localhost:3001/health | jq .

# Test readiness
curl http://localhost:3001/ready

# Test liveness
curl http://localhost:3001/live
```

## Monitoring and Logs

### View Real-time Logs
```bash
# All infrastructure logs
docker-compose -f docker-compose.postgres.yml logs -f

# All API logs
docker-compose -f docker-compose.apis.yml logs -f

# Specific service logs
docker logs -f postgres
docker logs -f cbc-commercial-bank

# Follow logs with timestamps
docker logs -f --timestamps postgres
```

### Monitor Database Connections
```bash
# Active connections
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Connection details
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT pid, usename, application_name, state FROM pg_stat_activity;"

# Query performance
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### Monitor Container Resources
```bash
# Real-time resource usage
docker stats

# Specific container
docker stats postgres
docker stats redis
docker stats cbc-commercial-bank
```

## Troubleshooting

### Issue: PostgreSQL Connection Refused
```bash
# Check if container is running
docker ps | grep postgres

# Check container logs
docker logs postgres

# Restart PostgreSQL
docker-compose -f docker-compose.postgres.yml restart postgres

# Verify connection
docker exec postgres pg_isready -U postgres
```

### Issue: Database Not Found
```bash
# List databases
docker exec postgres psql -U postgres -l

# Recreate database
docker-compose -f docker-compose.postgres.yml down
docker-compose -f docker-compose.postgres.yml up -d postgres

# Wait for initialization
sleep 30

# Verify tables
docker exec postgres psql -U postgres -d coffee_export_db -c "\dt"
```

### Issue: API Cannot Connect to Database
```bash
# Check API logs
docker logs cbc-commercial-bank

# Verify database is running
docker exec postgres pg_isready -U postgres

# Check network connectivity
docker network inspect coffee-export-network

# Verify environment variables
docker exec cbc-commercial-bank env | grep DB_

# Test connection from API container
docker exec cbc-commercial-bank psql -h postgres -U postgres -d coffee_export_db -c "SELECT NOW();"
```

### Issue: Connection Pool Exhausted
```bash
# Check active connections
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT count(*) FROM pg_stat_activity WHERE datname='coffee_export_db';"

# Kill idle connections
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='coffee_export_db' AND state='idle';"

# Increase pool size in pool.ts if needed
```

### Issue: Redis Connection Failed
```bash
# Check Redis status
docker ps | grep redis

# Test Redis connection
docker exec redis redis-cli ping

# Check Redis logs
docker logs redis

# Restart Redis
docker-compose -f docker-compose.postgres.yml restart redis
```

## Stopping Services

### Stop All Services
```bash
# Stop APIs
docker-compose -f docker-compose.apis.yml down

# Stop infrastructure
docker-compose -f docker-compose.postgres.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.postgres.yml down -v
```

### Stop Specific Service
```bash
# Stop single API
docker-compose -f docker-compose.apis.yml stop commercial-bank

# Stop single infrastructure service
docker-compose -f docker-compose.postgres.yml stop postgres
```

## Backup and Recovery

### Backup Database
```bash
# Full backup
docker exec postgres pg_dump -U postgres coffee_export_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker exec postgres pg_dump -U postgres coffee_export_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database
```bash
# From SQL file
docker exec -i postgres psql -U postgres coffee_export_db < backup.sql

# From compressed file
gunzip < backup.sql.gz | docker exec -i postgres psql -U postgres coffee_export_db
```

### Backup Volumes
```bash
# Backup PostgreSQL volume
docker run --rm -v postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Backup Redis volume
docker run --rm -v redis-data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz /data
```

## Performance Tuning

### Increase Connection Pool
Edit `/home/gu-da/cbc/api/shared/database/pool.ts`:
```typescript
const poolConfig = {
  max: 50,  // Increase from 20
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

### Enable Query Logging
```bash
# Enable slow query log
docker exec postgres psql -U postgres -d coffee_export_db -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"

# Reload configuration
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT pg_reload_conf();"
```

### Monitor Query Performance
```bash
# Enable pg_stat_statements extension
docker exec postgres psql -U postgres -d coffee_export_db -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# View slowest queries
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

## Production Deployment Checklist

- [ ] Change default PostgreSQL password
- [ ] Enable SSL for database connections
- [ ] Configure Redis authentication
- [ ] Set up automated backups
- [ ] Configure monitoring and alerting
- [ ] Enable audit logging
- [ ] Set resource limits for containers
- [ ] Configure log rotation
- [ ] Set up health check monitoring
- [ ] Document custom configurations
- [ ] Test disaster recovery procedures
- [ ] Configure firewall rules
- [ ] Set up VPN/network isolation
- [ ] Enable encryption at rest
- [ ] Configure database replication

## Support and Documentation

For more information, see:
- `DATABASE_CONNECTION_VERIFICATION.md` - Detailed verification guide
- `docker-compose.postgres.yml` - Infrastructure configuration
- `docker-compose.apis.yml` - API services configuration
- `api/shared/database/pool.ts` - Database connection pool configuration
- `api/*/src/index.ts` - Individual API service configurations

## Quick Reference

```bash
# Start everything
docker-compose -f docker-compose.postgres.yml up -d && \
docker-compose -f docker-compose.apis.yml up -d

# Verify everything
./verify-database-connection.sh

# Check status
docker-compose -f docker-compose.postgres.yml ps
docker-compose -f docker-compose.apis.yml ps

# View logs
docker-compose -f docker-compose.apis.yml logs -f

# Stop everything
docker-compose -f docker-compose.apis.yml down && \
docker-compose -f docker-compose.postgres.yml down

# Test API
curl http://localhost:3001/health | jq .
```

---

**Last Updated**: 2025-12-19
**Status**: Database Connection Verified ✓
**All Services**: Ready for deployment
