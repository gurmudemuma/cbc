# Quick Test Manual - Coffee Export System

## System Overview

Hybrid blockchain system with:
- **Blockchain**: Hyperledger Fabric (3 orderers, 6 peers)
- **Database**: PostgreSQL (fast queries)
- **Chaincode**: ecta v1.2 (ECTA two-category system)
- **Architecture**: All services run in Docker containers

---

## Quick Start

### 1. Start the System

```bash
START-SYSTEM.bat
```

This will:
1. Start Fabric network (30s wait)
2. Start application services (25s wait)
3. Enroll admin identity
4. Seed 10 default users
5. Verify system health

**Total time**: ~3 minutes

### 2. Verify System is Running

```bash
CHECK-STATUS.bat
```

Or manually:
```bash
docker ps --filter name=coffee
curl http://localhost:3000/health
```

---

## Test Scenarios

### Test 1: Login with Admin

```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

**Expected**: `{"success":true,"token":"eyJ...","user":{...}}`

### Test 2: Login with Exporter

```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"exporter1\",\"password\":\"password123\"}"
```

**Expected**: `{"success":true,"token":"eyJ...","user":{...}}`

### Test 3: Register Individual Exporter (15M ETB)

```bash
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"test_individual\",\"password\":\"Test@123\",\"email\":\"test@individual.com\",\"companyName\":\"Individual Coffee Trader\",\"tin\":\"TIN1234567890\",\"capitalETB\":15000000,\"businessType\":\"PRIVATE_EXPORTER\",\"phone\":\"+251911234567\",\"address\":\"Addis Ababa\"}"
```

**Expected**: 
- Status: `approved` or `active`
- Fully qualified (all certificates auto-approved)
- License issued

### Test 4: Register Company Exporter (20M ETB)

```bash
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"test_union\",\"password\":\"Test@123\",\"email\":\"test@union.com\",\"companyName\":\"Coffee Union\",\"tin\":\"TIN0987654321\",\"capitalETB\":20000000,\"businessType\":\"UNION\",\"phone\":\"+251911234567\",\"address\":\"Addis Ababa\"}"
```

**Expected**:
- Status: `approved` or `active`
- Fully qualified
- License issued

### Test 5: Register with Insufficient Capital (Should Fail)

```bash
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"test_low\",\"password\":\"Test@123\",\"email\":\"test@low.com\",\"companyName\":\"Small Trader\",\"tin\":\"TIN1111111111\",\"capitalETB\":10000000,\"businessType\":\"PRIVATE_EXPORTER\"}"
```

**Expected**:
- Status: `rejected`
- Error: "Insufficient capital: 10000000 ETB (minimum: 15000000 ETB)"

### Test 6: Test Blockchain CLI

```bash
docker exec coffee-gateway node test-cli-final.js
```

**Expected**:
```
========================================
  TESTING FABRIC CLI - FINAL VERSION
========================================

1. Test connection... ✓ Connection OK
2. Register user... ✓ User registered successfully
3. Get user... ✓ User retrieved successfully

========================================
  ✅ ALL TESTS PASSED
========================================
```

### Test 7: Check PostgreSQL Users

```bash
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, role, is_active FROM users;"
```

**Expected**: List of 10 users

### Test 8: Check Blockchain Channel

```bash
docker exec cli peer channel list
```

**Expected**: `Channels peers has joined: coffeechannel`

### Test 9: Query Chaincode

```bash
docker exec cli peer chaincode query -C coffeechannel -n ecta -c "{\"Args\":[\"GetUser\",\"admin\"]}"
```

**Expected**: JSON with admin user data

---

## Default User Accounts

| Username | Password | Role | Status | Capital Type |
|----------|----------|------|--------|--------------|
| admin | admin123 | Admin | Approved | N/A |
| exporter1 | password123 | Exporter | Approved | N/A |
| exporter2 | password123 | Exporter | Approved | N/A |
| exporter3 | password123 | Exporter | Pending | N/A |
| bank1 | password123 | Bank | Approved | N/A |
| ecta1 | password123 | ECTA | Approved | N/A |
| customs1 | password123 | Customs | Approved | N/A |
| nbe1 | password123 | NBE | Approved | N/A |
| ecx1 | password123 | ECX | Approved | N/A |
| shipping1 | password123 | Shipping | Approved | N/A |

---

## ECTA Two-Category System

### Individual/Private Exporters
- **Business Types**: `PRIVATE_EXPORTER`, `INDIVIDUAL`
- **Minimum Capital**: 15,000,000 ETB
- **Result**: Full qualification (all certificates + license)

### Company Exporters
- **Business Types**: `UNION`, `FARMER_COOPERATIVE`
- **Minimum Capital**: 20,000,000 ETB
- **Result**: Full qualification (all certificates + license)

### Auto-Qualification
When capital requirement is met:
- ✅ Profile approved
- ✅ Laboratory certificate issued
- ✅ Taster certificate issued
- ✅ Competence certificate issued
- ✅ Export license issued
- ✅ Status: `active` (can export immediately)

---

## Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Gateway API | http://localhost:3000 | Main API |
| Frontend | http://localhost:5173 | Web UI |
| Bridge API | http://localhost:3008 | Blockchain sync |
| ECTA Service | http://localhost:3003 | ECTA operations |
| Commercial Bank | http://localhost:3002 | Bank operations |
| National Bank | http://localhost:3004 | NBE operations |
| Customs | http://localhost:3005 | Customs operations |
| ECX | http://localhost:3006 | ECX operations |
| Shipping | http://localhost:3007 | Shipping operations |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |
| Kafka | localhost:9093 | Messaging |

---

## Troubleshooting

### Gateway not responding
```bash
docker logs coffee-gateway --tail 50
docker restart coffee-gateway
```

### PostgreSQL not ready
```bash
docker logs coffee-postgres
docker exec coffee-postgres pg_isready -U postgres
```

### Fabric CLI not working
```bash
docker logs cli
docker exec cli peer channel list
```

### Admin enrollment failed
```bash
# Check if crypto-config exists
dir crypto-config\peerOrganizations\ecta.example.com\users\Admin@ecta.example.com

# Re-run enrollment
docker exec coffee-gateway node src/scripts/enrollAdminFromCrypto.js
```

### Users not seeded
```bash
# Re-run seeding
docker exec coffee-gateway node src/scripts/seedUsers.js

# Check PostgreSQL
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM users;"
```

### Container not starting
```bash
# Check logs
docker logs <container-name>

# Restart specific container
docker restart <container-name>

# Restart all
STOP-SYSTEM.bat
START-SYSTEM.bat
```

---

## Stop the System

```bash
STOP-SYSTEM.bat
```

Or manually:
```bash
docker-compose -f docker-compose-hybrid.yml down
docker-compose -f docker-compose-fabric.yml down
```

---

## Performance Expectations

| Operation | Expected Time |
|-----------|---------------|
| System startup | ~3 minutes |
| Login | <100ms |
| Registration | 2-5 seconds |
| Blockchain query | 200-500ms |
| PostgreSQL query | <10ms |

---

## Next Steps

1. ✅ System started and verified
2. ✅ Test login with default users
3. ✅ Test registration with different capital amounts
4. ✅ Verify auto-qualification logic
5. ✅ Test frontend at http://localhost:5173
6. ✅ Monitor logs for any errors

---

**System Status**: Production Ready  
**Chaincode Version**: v1.2  
**Last Updated**: March 5, 2026
