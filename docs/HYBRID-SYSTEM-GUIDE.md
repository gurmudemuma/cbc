# Hybrid System Architecture Guide

## Overview

The Coffee Export System operates in **HYBRID MODE**, combining the strengths of both traditional databases and blockchain technology.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HYBRID ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  PostgreSQL  │ ◄─────► │   Gateway    │                  │
│  │  (Primary)   │         │   Service    │                  │
│  └──────────────┘         └──────┬───────┘                  │
│         ▲                        │                           │
│         │                        ▼                           │
│         │                 ┌──────────────┐                  │
│         │                 │   Fabric     │                  │
│         │                 │  Blockchain  │                  │
│         │                 │  (Audit)     │                  │
│         │                 └──────────────┘                  │
│         │                                                    │
│         └────────────── Kafka Events ──────────────┐        │
│                                                     │        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────▼──┐     │
│  │ ECTA Service │  │ Buyer Verify │  │ Other Services│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Blockchain Layer (Fabric)
- **Purpose**: Immutable audit trail, cross-org consensus
- **Components**:
  - 3 Orderer nodes (Raft consensus)
  - 6 Peer nodes across 5 organizations (ECTA, Bank, NBE, Customs, Shipping)
  - CouchDB state databases
  - Smart contracts (chaincode)

### 2. Hybrid Services Layer
- **PostgreSQL**: Primary data store for fast queries
- **Kafka**: Event streaming and service communication
- **Redis**: Caching and session management
- **Gateway**: Main API service with dual-write logic

### 3. Microservices
- **ECTA Service**: Handles ECTA-specific operations
- **Buyer Verification**: Manages buyer verification workflows
- **National Bank**: Banking operations
- **Customs**: Customs clearance
- **Shipping Line**: Shipping logistics

## Data Flow

### Write Operations (Dual-Write Pattern)
```
1. Client Request → Gateway API
2. Gateway writes to PostgreSQL (PRIMARY)
3. Gateway publishes event to Kafka
4. Gateway writes to Blockchain (ASYNC)
5. Response sent to client (after PostgreSQL write)
```

### Read Operations
```
1. Client Request → Gateway API
2. Gateway reads from PostgreSQL (FAST)
3. Response sent to client
```

### Audit/Verification Operations
```
1. Audit Request → Gateway API
2. Gateway queries Blockchain
3. Compare with PostgreSQL data
4. Return verification result
```

## Configuration

### Environment Variables (.env)
```bash
# Dual Write Strategy
DUAL_WRITE_ENABLED=true
BLOCKCHAIN_PRIMARY=false  # PostgreSQL is primary

# Fabric Configuration
FABRIC_USE_CLI=false      # Use SDK, not CLI
FABRIC_TEST_MODE=fabric   # Full Fabric mode
```

### Database Router
The system uses `database-router.js` to intelligently route operations:
- **PostgreSQL**: User management, quick queries, reports
- **Blockchain**: Registrations, approvals, certificates (audit trail)
- **Shared Pool**: Connection pooling for efficiency

## Startup Sequence

### Correct Startup Order
```batch
1. Fabric Network (docker-compose-fabric.yml)
   - Orderers
   - Peers
   - CouchDB

2. Channel Creation (if not exists)
   - Create channel
   - Join peers

3. Chaincode Deployment
   - Package
   - Install
   - Approve
   - Commit

4. Hybrid Services (docker-compose-hybrid.yml)
   - PostgreSQL
   - Kafka
   - Redis
   - Gateway
   - Microservices
   - Frontend

5. Initialization
   - Enroll admin
   - Seed users
```

## Scripts

### Start System
```batch
START-HYBRID-SYSTEM.bat
```
Starts the entire hybrid system in the correct order.

### Stop System
```batch
STOP-SYSTEM.bat
```
Stops all services (hybrid + fabric).

### Check Status
```batch
CHECK-HYBRID-STATUS.bat
```
Verifies all components are running correctly.

### Verify Fixes
```batch
VERIFY-FIXES.bat
```
Checks that all system consistency fixes are applied.

## Common Issues & Solutions

### Issue: Channel Already Exists Errors
**Status**: Normal - These are informational, not errors
**Solution**: The script handles this gracefully

### Issue: Chaincode Path Not Found
**Status**: Fixed in deploy-chaincode-auto.bat
**Solution**: Path corrected to `/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta`

### Issue: Services Not Starting
**Check**:
```batch
docker ps
docker-compose -f docker-compose-hybrid.yml logs
```

### Issue: Database Connection Errors
**Check**:
```batch
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "\dt"
```

## Performance Characteristics

### PostgreSQL (Primary)
- **Read Latency**: ~1-5ms
- **Write Latency**: ~5-10ms
- **Throughput**: 1000+ TPS

### Blockchain (Audit)
- **Write Latency**: ~2-5 seconds (consensus)
- **Read Latency**: ~100-500ms
- **Throughput**: ~100 TPS

## Benefits of Hybrid Approach

1. **Performance**: Fast reads/writes via PostgreSQL
2. **Scalability**: Database can scale independently
3. **Auditability**: Blockchain provides immutable history
4. **Flexibility**: Can query either system based on needs
5. **Reliability**: Dual storage provides redundancy

## Monitoring

### Check Fabric Network
```batch
docker ps --filter "name=orderer" --filter "name=peer"
```

### Check Hybrid Services
```batch
docker ps --filter "name=coffee-"
```

### View Logs
```batch
# Gateway logs
docker logs coffee-gateway -f

# All hybrid services
docker-compose -f docker-compose-hybrid.yml logs -f

# Specific peer
docker logs peer0.ecta.example.com -f
```

### Health Checks
```batch
# Gateway health
curl http://localhost:3000/health

# Database check
docker exec coffee-postgres psql -U postgres -c "SELECT version();"

# Blockchain check
docker exec cli peer channel list
```

## Next Steps

1. Start the system: `START-HYBRID-SYSTEM.bat`
2. Check status: `CHECK-HYBRID-STATUS.bat`
3. Access frontend: http://localhost:5173
4. Test API: http://localhost:3000/health
5. View documentation: `docs/` folder

## Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose-hybrid.yml logs`
2. Verify status: `CHECK-HYBRID-STATUS.bat`
3. Review documentation in `docs/` folder
