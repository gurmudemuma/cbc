# Database Quick Reference Guide

## Connection Details

### PostgreSQL
```
Host:     localhost
Port:     5432
Database: coffee_export_db
User:     postgres
Password: postgres
```

### Redis
```
Host:     localhost
Port:     6379
Password: (empty)
```

### IPFS
```
Host:     localhost
Port:     5001 (API)
Port:     8080 (Gateway)
```

---

## Common Commands

### PostgreSQL

#### Connect to Database
```bash
psql -h localhost -U postgres -d coffee_export_db
```

#### List All Tables
```bash
psql -h localhost -U postgres -d coffee_export_db -c "\dt"
```

#### Check Database Size
```bash
psql -h localhost -U postgres -d coffee_export_db -c "SELECT pg_size_pretty(pg_database_size('coffee_export_db'));"
```

#### View Active Connections
```bash
psql -h localhost -U postgres -d coffee_export_db -c "SELECT * FROM pg_stat_activity WHERE datname = 'coffee_export_db';"
```

#### Backup Database
```bash
pg_dump -h localhost -U postgres coffee_export_db > backup.sql
```

#### Restore Database
```bash
psql -h localhost -U postgres coffee_export_db < backup.sql
```

### Redis

#### Connect to Redis
```bash
redis-cli -h localhost
```

#### Check Redis Status
```bash
redis-cli -h localhost ping
```

#### View All Keys
```bash
redis-cli -h localhost KEYS "*"
```

#### Clear All Data
```bash
redis-cli -h localhost FLUSHALL
```

#### Monitor Redis Commands
```bash
redis-cli -h localhost MONITOR
```

### IPFS

#### Check IPFS Status
```bash
curl http://localhost:5001/api/v0/id
```

#### Add File to IPFS
```bash
curl -F file=@filename http://localhost:5001/api/v0/add
```

#### Get File from IPFS
```bash
curl http://localhost:8080/ipfs/QmHash
```

---

## Database Schema Overview

### Core Tables

#### exporter_profiles
- Exporter business information
- Capital verification status
- Approval workflow

#### coffee_laboratories
- Laboratory certification
- Equipment and facilities
- Inspection records

#### coffee_tasters
- Taster qualifications
- Proficiency certificates
- Employment details

#### competence_certificates
- Facility inspection results
- Quality management system
- Approval status

#### export_licenses
- Annual export authorization
- Coffee types and origins
- Annual quota

#### coffee_lots
- ECX warehouse lots
- Purchase information
- Status tracking

#### quality_inspections
- Physical analysis results
- Cupping evaluation scores
- Final grade and certificate

#### sales_contracts
- Buyer information
- Contract terms
- Registration and approval

#### export_permits
- Per-shipment permits
- Shipment details
- Validity period

#### certificates_of_origin
- Origin certification
- Exporter and buyer details
- Issuance tracking

#### exports
- Export requests
- Multi-stage approvals
- Status workflow

#### users
- User authentication
- Organization assignment
- Role-based access

---

## Key Views

### qualified_exporters
Shows exporters ready to create exports with all required certifications.

```sql
SELECT * FROM qualified_exporters WHERE is_qualified = TRUE;
```

### export_ready_lots
Shows coffee lots ready for export permit issuance.

```sql
SELECT * FROM export_ready_lots WHERE ready_for_permit = TRUE;
```

### pending_approvals_by_org
Shows pending approvals grouped by organization.

```sql
SELECT * FROM pending_approvals_by_org ORDER BY created_at ASC;
```

### export_summary
Shows export status with approval and document counts.

```sql
SELECT * FROM export_summary WHERE status = 'PENDING';
```

### compliance_audit_summary
Shows compliance-relevant audit events by date.

```sql
SELECT * FROM compliance_audit_summary ORDER BY audit_date DESC;
```

### active_users
Shows currently active users.

```sql
SELECT * FROM active_users ORDER BY created_at DESC;
```

---

## Useful Queries

### Count Exporters by Status
```sql
SELECT status, COUNT(*) as count 
FROM exporter_profiles 
GROUP BY status;
```

### Export Workflow Status
```sql
SELECT status, COUNT(*) as count 
FROM exports 
GROUP BY status 
ORDER BY count DESC;
```

### Pending Approvals by Organization
```sql
SELECT organization, approval_type, COUNT(*) as count 
FROM export_approvals 
WHERE status = 'PENDING' 
GROUP BY organization, approval_type;
```

### Recent Audit Events
```sql
SELECT timestamp, event_type, entity_type, action, severity 
FROM preregistration_audit_log 
ORDER BY timestamp DESC 
LIMIT 100;
```

### Exporter Activity Summary
```sql
SELECT * FROM exporter_audit_activity 
ORDER BY last_activity DESC 
LIMIT 20;
```

### Database Size by Table
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Connection Pool Status
```sql
SELECT 
  datname,
  usename,
  application_name,
  state,
  COUNT(*) as connections
FROM pg_stat_activity
WHERE datname = 'coffee_export_db'
GROUP BY datname, usename, application_name, state;
```

---

## Performance Optimization

### Index Status
```sql
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY tablename;
```

### Slow Queries (if logging enabled)
```sql
SELECT query, calls, mean_time, max_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Vacuum and Analyze
```bash
# Connect to database
psql -h localhost -U postgres -d coffee_export_db

# Run maintenance
VACUUM ANALYZE;
```

---

## Backup & Recovery

### Automated Backup Script
```bash
#!/bin/bash
BACKUP_DIR="/backups/cbc"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U postgres coffee_export_db | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz
```

### Point-in-Time Recovery
```bash
# Restore to specific time
pg_restore -h localhost -U postgres -d coffee_export_db backup.sql
```

---

## Monitoring

### Check Container Status
```bash
docker ps | grep -E "postgres|redis|ipfs"
```

### View Container Logs
```bash
docker logs postgres
docker logs redis
docker logs ipfs
```

### Monitor Resource Usage
```bash
docker stats postgres redis ipfs
```

### Check Network Connectivity
```bash
docker network inspect coffee-export-network
```

---

## Troubleshooting

### Connection Issues
```bash
# Test PostgreSQL
nc -zv localhost 5432

# Test Redis
nc -zv localhost 6379

# Test IPFS
nc -zv localhost 5001
```

### Database Locks
```sql
SELECT * FROM pg_locks WHERE NOT granted;
```

### Kill Long-Running Queries
```sql
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'coffee_export_db' 
AND pid <> pg_backend_pid() 
AND state = 'active';
```

### Reset Sequences
```sql
SELECT setval(pg_get_serial_sequence(tablename, colname), 
  (SELECT MAX(id) FROM tablename) + 1)
FROM pg_tables t
WHERE schemaname = 'public';
```

---

## API Health Checks

### Test All APIs
```bash
for port in 3001 3002 3003 3004 3005 3006 3007; do
  echo "Testing port $port..."
  curl -s http://localhost:$port/health | jq .
done
```

### Check Database Connection from API
```bash
curl http://localhost:3001/health | jq '.database'
```

---

## Environment Variables

### All APIs Use
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
REDIS_HOST=localhost
REDIS_PORT=6379
IPFS_HOST=localhost
IPFS_PORT=5001
```

---

## Docker Commands

### Start Infrastructure
```bash
docker-compose -f docker-compose.postgres.yml up -d
```

### Stop Infrastructure
```bash
docker-compose -f docker-compose.postgres.yml down
```

### View Logs
```bash
docker-compose -f docker-compose.postgres.yml logs -f
```

### Restart Services
```bash
docker-compose -f docker-compose.postgres.yml restart
```

### Remove Volumes (WARNING: Deletes Data)
```bash
docker-compose -f docker-compose.postgres.yml down -v
```

---

## Important Notes

1. **Data Persistence:** PostgreSQL data is stored in Docker volume `postgres-data`
2. **Redis Data:** Redis data is stored in Docker volume `redis-data`
3. **IPFS Data:** IPFS data is stored in Docker volume `ipfs-data`
4. **Backups:** Regular backups recommended for production
5. **Connection Pooling:** Each API maintains up to 20 connections
6. **Audit Trail:** 7-year retention for compliance
7. **SSL:** Disabled for development, enable for production

---

## Support

For issues or questions:
1. Check logs: `docker logs <container_name>`
2. Test connectivity: `nc -zv localhost <port>`
3. Review audit logs: Query `preregistration_audit_log`
4. Check API health: `curl http://localhost:<port>/health`

---

**Last Updated:** 2024-12-19  
**Version:** 1.0
