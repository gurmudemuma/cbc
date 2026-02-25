# Quick Start Guide - Hybrid Blockchain System

Get the complete hybrid system running in 5 minutes.

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ (for local development)
- 8GB RAM minimum
- 20GB free disk space

## Option 1: Docker Compose (Fastest)

### Step 1: Start the System

```bash
docker-compose -f docker-compose-hybrid.yml up -d
```

This starts:
- PostgreSQL database
- Redis cache
- Apache Kafka + Zookeeper
- Hyperledger Fabric chaincode
- API Gateway
- Blockchain Bridge
- All CBC microservices
- Frontend application

### Step 2: Wait for Services

```bash
# Watch logs
docker-compose -f docker-compose-hybrid.yml logs -f

# Wait for "healthy" status (about 30 seconds)
docker-compose -f docker-compose-hybrid.yml ps
```

### Step 3: Verify System

```bash
# Check API Gateway
curl http://localhost:3000/health

# Check Blockchain Bridge
curl http://localhost:3008/health

# Check Chaincode
curl http://localhost:3001/health
```

### Step 4: Access Services

Open your browser:
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:3000
- **Bridge Dashboard**: http://localhost:3008/metrics

## Option 2: Local Development

### Step 1: Install Dependencies

```bash
# Gateway
cd coffee-export-gateway && npm install && cd ..

# Bridge
cd services/blockchain-bridge && npm install && cd ../..

# CBC Services (example for ECTA)
cd cbc/services/ecta && npm install && cd ../../..
```

### Step 2: Setup Database

```bash
# Start infrastructure only
docker-compose -f docker-compose-hybrid.yml up -d postgres redis kafka zookeeper

# Wait 10 seconds
timeout /t 10

# Run migrations
psql -U postgres -d coffee_export_db -f cbc/services/shared/database/init.sql
psql -U postgres -d coffee_export_db -f cbc/services/shared/database/migrations/002_add_sync_tables.sql
psql -U postgres -d coffee_export_db -f cbc/services/shared/database/migrations/003_add_reconciliation_tables.sql
psql -U postgres -d coffee_export_db -f cbc/services/shared/database/migrations/004_add_phase4_tables.sql
```

### Step 3: Start Services

```bash
# Use the startup script
start-hybrid-system.bat

# Choose option 2 for local development
```

## Verify Installation

### 1. Health Checks

```bash
# All services should return {"status":"ok"}
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Chaincode
curl http://localhost:3002/health  # Commercial Bank
curl http://localhost:3003/health  # ECTA
curl http://localhost:3004/health  # National Bank
curl http://localhost:3005/health  # Customs
curl http://localhost:3006/health  # ECX
curl http://localhost:3007/health  # Shipping
curl http://localhost:3008/health  # Bridge
```

### 2. Bridge Status

```bash
curl http://localhost:3008/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "fabric": true,
    "cbc": true,
    "kafka": true,
    "redis": true,
    "postgres": true
  }
}
```

### 3. Database Connection

```bash
psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM exporter_profiles"
```

### 4. Kafka Topics

```bash
docker exec coffee-kafka kafka-topics --list --bootstrap-server localhost:9092

# Expected topics:
# fabric.events
# fabric.transactions
# cbc.exporter.updates
# cbc.license.updates
# cbc.certificate.issued
```

## Test the System

### Run Integration Test

```bash
node tests/test-hybrid-integration.js
```

Expected output:
```
========================================
Hybrid System Integration Test
========================================

=== Test 1: Health Checks ===
✓ API Gateway: ok
✓ Blockchain Bridge: healthy
✓ Chaincode Server: ok

=== Test 2: Exporter Registration ===
✓ Admin logged in
✓ Exporter registered: test_exporter_...
✓ Found in Fabric: PENDING_APPROVAL
✓ Found in CBC: PENDING_APPROVAL

=== Test 3: Sync Metrics ===
✓ Sync metrics: {...}
✓ Sync status: {...}

========================================
Test Results
========================================
✓ Health Checks
✓ Exporter Registration
✓ Sync Metrics

✓ ALL TESTS PASSED
```

## Common Issues

### Issue: Port Already in Use

```bash
# Check what's using the port
netstat -ano | findstr "3000"

# Kill the process or change port in .env
```

### Issue: Docker Containers Not Starting

```bash
# Check Docker is running
docker ps

# Restart Docker Desktop
# Then try again
docker-compose -f docker-compose-hybrid.yml up -d
```

### Issue: Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs coffee-postgres

# Restart if needed
docker-compose -f docker-compose-hybrid.yml restart postgres
```

### Issue: Kafka Not Ready

```bash
# Kafka takes 20-30 seconds to start
# Check status
docker logs coffee-kafka

# Wait and retry
```

## Stop the System

### Docker Compose

```bash
# Stop all services
docker-compose -f docker-compose-hybrid.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose-hybrid.yml down -v
```

### Local Development

Close all terminal windows or press Ctrl+C in each.

## Next Steps

1. ✅ System running
2. Read [HYBRID-SYSTEM-ARCHITECTURE.md](HYBRID-SYSTEM-ARCHITECTURE.md) for architecture
3. Read [HYBRID-SYSTEM-IMPLEMENTATION-GUIDE.md](HYBRID-SYSTEM-IMPLEMENTATION-GUIDE.md) for details
4. Explore API at http://localhost:3000
5. Monitor sync at http://localhost:3008/metrics

## Service URLs Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Web UI |
| API Gateway | http://localhost:3000 | REST API |
| Blockchain Bridge | http://localhost:3008 | Sync service |
| Chaincode | http://localhost:3001 | Smart contracts |
| ECTA | http://localhost:3003 | Coffee authority |
| Commercial Bank | http://localhost:3002 | Banking |
| National Bank | http://localhost:3004 | Central bank |
| Customs | http://localhost:3005 | Customs |
| ECX | http://localhost:3006 | Exchange |
| Shipping | http://localhost:3007 | Logistics |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |
| Kafka | localhost:9092 | Events |

## Support

- Documentation: See all `HYBRID-SYSTEM-*.md` files
- Troubleshooting: [HYBRID-SYSTEM-IMPLEMENTATION-GUIDE.md](HYBRID-SYSTEM-IMPLEMENTATION-GUIDE.md#troubleshooting)
- Architecture: [HYBRID-SYSTEM-ARCHITECTURE.md](HYBRID-SYSTEM-ARCHITECTURE.md)

---

**Ready to go!** 🚀
