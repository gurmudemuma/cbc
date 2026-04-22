# Coffee Export Blockchain System - Professional Deployment Plan

**Date**: April 21, 2026  
**System**: Ethiopian Coffee Export Management Platform  
**Architecture**: Hybrid Blockchain (Hyperledger Fabric + PostgreSQL)

---

## Executive Summary

This document outlines the professional deployment strategy for a production-grade coffee export blockchain system featuring:

- **Hyperledger Fabric Network**: 3 orderers, 6 peers across 5 organizations
- **Hybrid Architecture**: PostgreSQL for performance + Blockchain for immutability
- **Microservices**: 6 CBC services + Gateway + Bridge + Verification service
- **Frontend**: React/TypeScript production build
- **Performance**: 10-50x faster queries with blockchain audit trail

---

## Deployment Strategy

### Phase 1: Infrastructure Setup
1. Create Docker network
2. Start Fabric network (orderers, peers, CouchDB)
3. Start infrastructure services (PostgreSQL, Redis, Kafka)

### Phase 2: Blockchain Initialization
1. Generate channel artifacts
2. Create channel and join peers
3. Package and deploy chaincode
4. Verify blockchain readiness

### Phase 3: Application Services
1. Build and start Gateway service
2. Build and start Blockchain Bridge
3. Build and start CBC microservices
4. Build and start Frontend

### Phase 4: Data Initialization
1. Run database migrations
2. Enroll admin identities
3. Seed test users and data
4. Sync data to blockchain

### Phase 5: Verification
1. Health checks on all services
2. End-to-end workflow testing
3. Performance validation
4. Security verification

---

## Pre-Deployment Checklist

### System Requirements
- [ ] Docker Desktop installed and running
- [ ] At least 8GB RAM available
- [ ] At least 20GB free disk space
- [ ] Windows with PowerShell/Bash or Linux/Mac
- [ ] Internet connection (for first-time image pulls)

### Environment Verification
```bash
# Check Docker
docker --version
docker-compose --version
docker ps

# Check available resources
docker system df
docker system info | grep -i memory
```

### Clean Previous Deployment
```bash
# Stop all containers
docker-compose -f docker-compose-hybrid.yml down
docker-compose -f docker-compose-fabric.yml down

# Remove volumes (optional - only if fresh start needed)
docker volume prune -f

# Remove old chaincode containers
docker rm -f $(docker ps -aq --filter "name=dev-peer")
```

---

## Deployment Execution

### Step 1: Create Docker Network
```bash
docker network create fabric-network
```

### Step 2: Start Fabric Network
```bash
# Start orderers, peers, and CouchDB
docker-compose -f docker-compose-fabric.yml up -d

# Wait for services to be ready (30 seconds)
timeout /t 30

# Verify all containers running
docker ps --filter "network=fabric-network"
```

### Step 3: Initialize Blockchain
```bash
# Create channel and deploy chaincode
cd scripts
./install-blockchain.bat  # Windows
# OR
bash install-blockchain.sh  # Linux/Mac

# Verify deployment
./verify-chaincode-status.bat
```

### Step 4: Build Application Images
```bash
# Build Gateway
docker-compose -f docker-compose-hybrid.yml build gateway

# Build Blockchain Bridge
docker-compose -f docker-compose-hybrid.yml build blockchain-bridge

# Build CBC Services
docker-compose -f docker-compose-hybrid.yml build ecta-service
docker-compose -f docker-compose-hybrid.yml build commercial-bank-service
docker-compose -f docker-compose-hybrid.yml build national-bank-service
docker-compose -f docker-compose-hybrid.yml build customs-service
docker-compose -f docker-compose-hybrid.yml build ecx-service
docker-compose -f docker-compose-hybrid.yml build shipping-service

# Build Buyer Verification
docker-compose -f docker-compose-hybrid.yml build buyer-verification

# Build Frontend
docker-compose -f docker-compose-hybrid.yml build frontend
```

### Step 5: Start Application Services
```bash
# Start infrastructure
docker-compose -f docker-compose-hybrid.yml up -d postgres redis zookeeper kafka

# Wait for infrastructure (30 seconds)
timeout /t 30

# Start application services
docker-compose -f docker-compose-hybrid.yml up -d gateway blockchain-bridge

# Wait for gateway (20 seconds)
timeout /t 20

# Start CBC services
docker-compose -f docker-compose-hybrid.yml up -d ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service buyer-verification

# Start frontend
docker-compose -f docker-compose-hybrid.yml up -d frontend
```

### Step 6: Initialize Data
```bash
# Enroll admin
docker-compose -f docker-compose-hybrid.yml exec gateway npm run enroll-admin

# Seed users
docker-compose -f docker-compose-hybrid.yml exec gateway npm run seed-users

# Sync to blockchain
docker-compose -f docker-compose-hybrid.yml exec gateway npm run sync-users

# Verify database
docker-compose -f docker-compose-hybrid.yml exec gateway npm run check-db
```

---

## Post-Deployment Verification

### Health Checks
```bash
# Gateway
curl http://localhost:3000/health

# Blockchain Bridge
curl http://localhost:3008/health

# ECTA Service
curl http://localhost:3003/health

# Frontend
curl http://localhost:5173/

# PostgreSQL
docker-compose -f docker-compose-hybrid.yml exec postgres psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM users;"

# Blockchain
docker exec cli peer channel getinfo -c coffeechannel
```

### Service Status
```bash
# All containers
docker ps

# Fabric network
docker ps --filter "network=fabric-network"

# Application network
docker ps --filter "network=coffee-export-network"

# Chaincode containers
docker ps --filter "name=dev-peer"
```

### Functional Testing
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test user query
curl http://localhost:3000/api/users

# Test blockchain query
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n ecta \
  -c '{"function":"queryAllUsers","Args":[]}'
```

---

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | admin / admin123 |
| **Gateway API** | http://localhost:3000 | - |
| **Bridge API** | http://localhost:3008 | - |
| **ECTA Service** | http://localhost:3003 | - |
| **Commercial Bank** | http://localhost:3002 | - |
| **National Bank** | http://localhost:3004 | - |
| **Customs** | http://localhost:3005 | - |
| **ECX** | http://localhost:3006 | - |
| **Shipping** | http://localhost:3007 | - |
| **Buyer Verification** | http://localhost:3009 | - |
| **PostgreSQL** | localhost:5432 | postgres / postgres |
| **CouchDB** | http://localhost:5984/_utils | admin / adminpw |
| **Redis** | localhost:6379 | - |
| **Kafka** | localhost:9093 | - |

---

## Test Credentials

### Admin User (ECTA)
- Username: `admin`
- Password: `admin123`
- Role: ECTA Administrator
- Permissions: Approve registrations, manage system

### Exporter Users
- Username: `exporter1` / Password: `password123`
- Username: `exporter2` / Password: `password123`
- Role: Coffee Exporter
- Permissions: Submit applications, manage exports

### Bank Users
- Username: `bank_user` / Password: `password123`
- Role: Bank Officer
- Permissions: Verify documents, approve transactions

---

## Monitoring & Logs

### View Logs
```bash
# Gateway logs
docker logs coffee-gateway -f

# Blockchain bridge logs
docker logs coffee-bridge -f

# Peer logs
docker logs peer0.ecta.example.com -f

# All services
docker-compose -f docker-compose-hybrid.yml logs -f
```

### Performance Metrics
```bash
# Container stats
docker stats

# Database connections
docker-compose -f docker-compose-hybrid.yml exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Blockchain height
docker exec cli peer channel getinfo -c coffeechannel
```

---

## Troubleshooting

### Issue: Containers Not Starting
**Solution**:
```bash
# Check logs
docker logs <container-name>

# Restart specific service
docker-compose -f docker-compose-hybrid.yml restart <service-name>

# Full restart
docker-compose -f docker-compose-hybrid.yml down
docker-compose -f docker-compose-hybrid.yml up -d
```

### Issue: Chaincode Not Deployed
**Solution**:
```bash
# Verify chaincode status
docker exec cli peer lifecycle chaincode querycommitted --channelID coffeechannel --name ecta

# Redeploy if needed
cd scripts
./deploy-chaincode.bat
```

### Issue: Database Connection Failed
**Solution**:
```bash
# Check PostgreSQL
docker-compose -f docker-compose-hybrid.yml exec postgres pg_isready

# Restart PostgreSQL
docker-compose -f docker-compose-hybrid.yml restart postgres

# Check migrations
docker-compose -f docker-compose-hybrid.yml exec postgres psql -U postgres -d coffee_export_db -c "\dt"
```

### Issue: Frontend 502 Error
**Solution**:
```bash
# Check gateway is running
curl http://localhost:3000/health

# Restart frontend
docker-compose -f docker-compose-hybrid.yml restart frontend

# Rebuild if needed
docker-compose -f docker-compose-hybrid.yml build frontend
docker-compose -f docker-compose-hybrid.yml up -d frontend
```

---

## Backup & Recovery

### Backup Database
```bash
docker-compose -f docker-compose-hybrid.yml exec postgres pg_dump -U postgres coffee_export_db > backup_$(date +%Y%m%d).sql
```

### Backup Blockchain Data
```bash
# Backup peer data
docker cp peer0.ecta.example.com:/var/hyperledger/production ./backup/peer0-ecta-$(date +%Y%m%d)

# Backup orderer data
docker cp orderer1.orderer.example.com:/var/hyperledger/production ./backup/orderer1-$(date +%Y%m%d)
```

### Restore Database
```bash
docker-compose -f docker-compose-hybrid.yml exec -T postgres psql -U postgres coffee_export_db < backup_20260421.sql
```

---

## Security Considerations

### Network Security
- All Fabric communication uses TLS
- Peer-to-peer gossip encrypted
- Orderer-to-peer communication secured

### Application Security
- JWT authentication with 24-hour expiry
- Password hashing with bcrypt
- CORS configured for production
- Rate limiting enabled (100 req/15min)

### Database Security
- PostgreSQL password authentication
- Connection pooling with max 20 connections
- Prepared statements to prevent SQL injection

### Blockchain Security
- MSP-based identity management
- Endorsement policies enforced
- Immutable audit trail
- Multi-organization consensus

---

## Performance Optimization

### Database Indexes
- 10+ indexes on frequently queried columns
- 2 materialized views for analytics
- Connection pooling enabled

### Caching Strategy
- Redis for session management
- Query result caching (5-minute TTL)
- Static asset caching in nginx

### Blockchain Optimization
- Dual-write strategy (PostgreSQL primary)
- Blockchain for audit trail only
- Async sync every 5 minutes
- Read from PostgreSQL (10-50x faster)

---

## Maintenance

### Regular Tasks
- Monitor disk space: `docker system df`
- Check logs for errors: `docker-compose logs --tail=100`
- Verify blockchain sync: `npm run verify-users`
- Database vacuum: `VACUUM ANALYZE;`

### Updates
- Chaincode updates: Use `deploy-chaincode.bat`
- Service updates: Rebuild and restart containers
- Database migrations: Auto-applied on startup

---

## Success Criteria

✅ All 20+ containers running  
✅ Blockchain channel operational  
✅ Chaincode deployed and queryable  
✅ Database migrations applied  
✅ Admin enrolled and users seeded  
✅ Frontend accessible at port 5173  
✅ API responding to health checks  
✅ Login successful with test credentials  
✅ End-to-end workflow functional  

---

## Support & Documentation

### Documentation Files
- `README.md` - System overview
- `docs/QUICK-START-GUIDE.md` - Quick start instructions
- `docs/SYSTEM-STARTUP-GUIDE.md` - Detailed startup guide
- `docs/DEPLOYMENT-CHECKLIST.md` - Deployment verification
- `scripts/README.md` - Script documentation

### Getting Help
1. Check logs: `docker logs <container-name>`
2. Review documentation in `docs/` directory
3. Verify system status: `docker ps`
4. Check health endpoints: `curl http://localhost:3000/health`

---

**Deployment Status**: Ready for execution  
**Estimated Time**: 10-15 minutes  
**Complexity**: Medium  
**Risk Level**: Low (rollback available)

