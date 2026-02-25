# Hybrid System Implementation Guide

Complete guide to implementing and deploying the consolidated hybrid blockchain system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Setup](#system-setup)
3. [Database Setup](#database-setup)
4. [Service Configuration](#service-configuration)
5. [Deployment](#deployment)
6. [Testing](#testing)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** 18+ and npm
- **Docker** 24+ and Docker Compose
- **PostgreSQL** 14+ (if running locally)
- **Git** for version control

### System Requirements

**Development:**
- CPU: 4 cores
- RAM: 8 GB
- Disk: 20 GB

**Production:**
- CPU: 8+ cores
- RAM: 16+ GB
- Disk: 100+ GB SSD

## System Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd coffee-export-blockchain
```

### 2. Install Dependencies

```bash
# Gateway service
cd coffee-export-gateway
npm install
cd ..

# Blockchain Bridge
cd services/blockchain-bridge
npm install
cd ../..

# CBC Services (repeat for each service)
cd cbc/services/ecta
npm install
cd ../../..

# Frontend
cd cbc/frontend
npm install
cd ../..
```

### 3. Environment Configuration

Copy environment templates:

```bash
# Gateway
cp coffee-export-gateway/.env.example coffee-export-gateway/.env

# Blockchain Bridge
cp services/blockchain-bridge/.env.example services/blockchain-bridge/.env

# CBC Services
cp cbc/services/ecta/.env.example cbc/services/ecta/.env
# Repeat for other services...
```

Edit each `.env` file with appropriate values.

## Database Setup

### 1. Create Database

```bash
# Using Docker
docker-compose -f docker-compose-hybrid.yml up -d postgres

# Or locally
createdb coffee_export_db
```

### 2. Run Migrations

```bash
# Apply schema
psql -U postgres -d coffee_export_db -f cbc/services/shared/database/init.sql

# Apply migrations
psql -U postgres -d coffee_export_db -f cbc/services/shared/database/migrations/001_create_tables.sql
psql -U postgres -d coffee_export_db -f cbc/services/shared/database/migrations/002_add_sync_tables.sql
psql -U postgres -d coffee_export_db -f cbc/services/shared/database/migrations/003_add_reconciliation_tables.sql
```

### 3. Verify Database

```bash
psql -U postgres -d coffee_export_db -c "\dt"
```

Expected tables:
- exporter_profiles
- export_licenses
- coffee_laboratories
- coffee_tasters
- quality_certificates
- shipments
- esw_submissions
- sync_log
- reconciliation_log
- reconciliation_issues

## Service Configuration

### 1. Hyperledger Fabric Chaincode

```bash
cd chaincode/ecta
npm install

# Configure
export PORT=3001
export NODE_ENV=production

# Start
npm start
```

### 2. API Gateway

```bash
cd coffee-export-gateway

# Configure
cat > .env << EOF
PORT=3000
CHAINCODE_URL=http://localhost:3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
KAFKA_BROKERS=localhost:9092
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key-change-in-production
EOF

# Start
npm start
```

### 3. Blockchain Bridge

```bash
cd services/blockchain-bridge

# Build
npm run build

# Start
npm start
```

### 4. CBC Services

Each service follows the same pattern:

```bash
cd cbc/services/[service-name]

# Configure
cat > .env << EOF
PORT=[service-port]
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
KAFKA_BROKERS=localhost:9092
EOF

# Start
npm run dev
```

Service ports:
- ECTA: 3003
- Commercial Bank: 3002
- National Bank: 3004
- Customs: 3005
- ECX: 3006
- Shipping: 3007

## Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Start entire system
docker-compose -f docker-compose-hybrid.yml up -d

# View logs
docker-compose -f docker-compose-hybrid.yml logs -f

# Stop system
docker-compose -f docker-compose-hybrid.yml down
```

### Option 2: Local Development

```bash
# Use the startup script
./start-hybrid-system.bat  # Windows
# or
./start-hybrid-system.sh   # Linux/Mac

# Choose option 2 for local development
```

### Option 3: Kubernetes (Production)

```bash
# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress.yaml

# Verify deployment
kubectl get pods -n coffee-export
kubectl get services -n coffee-export
```

## Testing

### 1. Health Checks

```bash
# API Gateway
curl http://localhost:3000/health

# Blockchain Bridge
curl http://localhost:3008/health

# Chaincode
curl http://localhost:3001/health

# CBC Services
curl http://localhost:3003/health  # ECTA
curl http://localhost:3002/health  # Commercial Bank
# etc...
```

### 2. Integration Tests

```bash
# Run complete workflow test
node tests/test-hybrid-integration.js

# Run sync tests
node tests/test-blockchain-bridge.js

# Run reconciliation tests
node tests/test-reconciliation.js
```

### 3. Manual Testing

```bash
# 1. Register exporter
curl -X POST http://localhost:3000/api/exporter/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "username": "test_exporter",
    "password": "test123",
    "companyName": "Test Coffee Export",
    "tin": "1234567890"
  }'

# 2. Check Fabric
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{
    "fcn": "GetExporter",
    "args": ["test_exporter"]
  }'

# 3. Check CBC
curl http://localhost:3003/api/exporters/test_exporter

# 4. Verify sync
curl http://localhost:3008/sync/status
```

## Monitoring

### 1. Service Health

```bash
# Check all services
curl http://localhost:3008/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-02-17T...",
  "services": {
    "fabric": true,
    "cbc": true,
    "kafka": true,
    "redis": true,
    "postgres": true
  }
}
```

### 2. Sync Metrics

```bash
curl http://localhost:3008/metrics

# Expected response:
{
  "successful_syncs_1h": 150,
  "failed_syncs_1h": 2,
  "unresolved_issues": 0
}
```

### 3. Database Monitoring

```sql
-- Check sync status
SELECT 
  sync_type,
  status,
  COUNT(*) as count,
  MAX(synced_at) as last_sync
FROM sync_log
WHERE synced_at > NOW() - INTERVAL '1 hour'
GROUP BY sync_type, status;

-- Check reconciliation issues
SELECT * FROM reconciliation_issues WHERE resolved = false;

-- Check recent reconciliations
SELECT * FROM reconciliation_log ORDER BY run_at DESC LIMIT 10;
```

### 4. Kafka Monitoring

```bash
# List topics
docker exec coffee-kafka kafka-topics --list --bootstrap-server localhost:9092

# Check consumer lag
docker exec coffee-kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe --group blockchain-bridge-group
```

## Troubleshooting

### Issue: Services Not Starting

**Symptoms:**
- Services fail to start
- Connection errors in logs

**Solutions:**
1. Check if ports are available:
   ```bash
   netstat -an | findstr "3000 3001 3008 5432 6379 9092"
   ```

2. Verify Docker containers:
   ```bash
   docker ps
   docker logs coffee-postgres
   docker logs coffee-kafka
   ```

3. Check environment variables:
   ```bash
   # In each service directory
   cat .env
   ```

### Issue: Sync Failures

**Symptoms:**
- High failed_syncs count
- Data inconsistencies

**Solutions:**
1. Check sync log:
   ```sql
   SELECT * FROM sync_log WHERE status = 'failed' ORDER BY synced_at DESC LIMIT 10;
   ```

2. Retry failed syncs:
   ```bash
   curl -X POST http://localhost:3008/sync/retry \
     -H "Content-Type: application/json" \
     -d '{"syncId": "sync-id-from-log"}'
   ```

3. Check Kafka connectivity:
   ```bash
   docker logs coffee-bridge | grep -i kafka
   ```

### Issue: Reconciliation Mismatches

**Symptoms:**
- Unresolved reconciliation issues
- Data differences between Fabric and CBC

**Solutions:**
1. Check reconciliation issues:
   ```sql
   SELECT * FROM reconciliation_issues WHERE resolved = false;
   ```

2. Manual reconciliation:
   ```bash
   curl -X POST http://localhost:3008/reconcile/trigger
   ```

3. Review resolution strategy in logs:
   ```bash
   docker logs coffee-bridge | grep -i reconciliation
   ```

### Issue: Kafka Consumer Lag

**Symptoms:**
- Events not processed timely
- Increasing consumer lag

**Solutions:**
1. Check consumer lag:
   ```bash
   docker exec coffee-kafka kafka-consumer-groups \
     --bootstrap-server localhost:9092 \
     --describe --group blockchain-bridge-group
   ```

2. Restart consumer:
   ```bash
   docker-compose -f docker-compose-hybrid.yml restart blockchain-bridge
   ```

3. Increase consumer instances (in production):
   ```bash
   kubectl scale deployment blockchain-bridge --replicas=3
   ```

### Issue: Database Connection Pool Exhausted

**Symptoms:**
- "Too many connections" errors
- Slow query performance

**Solutions:**
1. Check active connections:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

2. Increase pool size in `.env`:
   ```
   DB_POOL_MAX=50
   ```

3. Close idle connections:
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'idle' AND state_change < NOW() - INTERVAL '5 minutes';
   ```

## Performance Tuning

### 1. Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_sync_log_status ON sync_log(status, synced_at);
CREATE INDEX idx_sync_log_type ON sync_log(sync_type, entity_id);
CREATE INDEX idx_reconciliation_issues_resolved ON reconciliation_issues(resolved, created_at);

-- Vacuum and analyze
VACUUM ANALYZE sync_log;
VACUUM ANALYZE reconciliation_log;
VACUUM ANALYZE reconciliation_issues;
```

### 2. Kafka Optimization

```bash
# Increase partitions for high-throughput topics
docker exec coffee-kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --alter --topic fabric.events --partitions 3
```

### 3. Redis Caching

Configure caching in API Gateway:

```javascript
// Cache exporter profiles for 5 minutes
const cachedProfile = await redis.get(`exporter:${exporterId}`);
if (cachedProfile) return JSON.parse(cachedProfile);

const profile = await getFromDatabase(exporterId);
await redis.setex(`exporter:${exporterId}`, 300, JSON.stringify(profile));
```

## Security Checklist

- [ ] Change default passwords
- [ ] Generate strong JWT secret
- [ ] Enable TLS for all services
- [ ] Configure firewall rules
- [ ] Set up VPN for inter-service communication
- [ ] Enable audit logging
- [ ] Configure backup encryption
- [ ] Set up intrusion detection
- [ ] Regular security updates
- [ ] Penetration testing

## Backup and Recovery

### Daily Backups

```bash
# PostgreSQL
pg_dump -U postgres coffee_export_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Kafka topics
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic fabric.events --from-beginning > fabric_events_backup.json
```

### Recovery

```bash
# Restore PostgreSQL
gunzip < backup_20260217.sql.gz | psql -U postgres coffee_export_db

# Run reconciliation
curl -X POST http://localhost:3008/reconcile/trigger
```

## Production Deployment Checklist

- [ ] All services configured
- [ ] Database migrations applied
- [ ] Kafka topics created
- [ ] Redis configured
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Alerting set up
- [ ] Backup strategy implemented
- [ ] Disaster recovery tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Team trained
- [ ] Rollback plan prepared

---

**Version:** 1.0.0  
**Last Updated:** February 17, 2026  
**Status:** Production Ready
