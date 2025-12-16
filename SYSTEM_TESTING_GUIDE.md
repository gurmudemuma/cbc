# System Testing Guide

## Overview

This guide provides comprehensive testing procedures for the standardized Coffee Blockchain Consortium system.

---

## Pre-Testing Checklist

- [ ] All .env files created for each API service
- [ ] docker-compose.yml updated with API services
- [ ] Frontend configuration updated
- [ ] Documentation reviewed
- [ ] System requirements met (Docker, Node.js, etc.)

---

## Test 1: Environment Configuration Verification

### Objective
Verify that all environment files are correctly configured.

### Steps

```bash
# Check commercialbank .env
cat /home/gu-da/cbc/api/commercialbank/.env | grep ORGANIZATION_ID
# Expected: ORGANIZATION_ID=commercialbank

# Check national-bank .env
cat /home/gu-da/cbc/api/national-bank/.env | grep ORGANIZATION_ID
# Expected: ORGANIZATION_ID=national-bank

# Check ncat .env
cat /home/gu-da/cbc/api/ncat/.env | grep ORGANIZATION_ID
# Expected: ORGANIZATION_ID=ncat

# Check shipping-line .env
cat /home/gu-da/cbc/api/shipping-line/.env | grep ORGANIZATION_ID
# Expected: ORGANIZATION_ID=shipping-line

# Check custom-authorities .env
cat /home/gu-da/cbc/api/custom-authorities/.env | grep ORGANIZATION_ID
# Expected: ORGANIZATION_ID=custom-authorities
```

### Expected Result
✅ All .env files have correct ORGANIZATION_ID values

---

## Test 2: Frontend Configuration Verification

### Objective
Verify that frontend configuration is correctly standardized.

### Steps

```bash
# Check api.config.js
grep -A 5 "ORGANIZATIONS = " /home/gu-da/cbc/frontend/src/config/api.config.js

# Verify organization names
grep "value: 'commercialbank'" /home/gu-da/cbc/frontend/src/config/api.config.js
grep "value: 'national-bank'" /home/gu-da/cbc/frontend/src/config/api.config.js
grep "value: 'ncat'" /home/gu-da/cbc/frontend/src/config/api.config.js
grep "value: 'shipping-line'" /home/gu-da/cbc/frontend/src/config/api.config.js
grep "value: 'custom-authorities'" /home/gu-da/cbc/frontend/src/config/api.config.js
```

### Expected Result
✅ All 5 organizations present with correct names and ports

---

## Test 3: Docker Compose Configuration Verification

### Objective
Verify that docker-compose.yml has all API services configured.

### Steps

```bash
# Check docker-compose.yml for API services
grep "container_name:" /home/gu-da/cbc/docker-compose.yml | grep -api

# Expected output:
# - commercialbank-api
# - national-bank-api
# - ncat-api
# - shipping-line-api
# - custom-authorities-api

# Verify ports
grep "3001:3001" /home/gu-da/cbc/docker-compose.yml
grep "3002:3002" /home/gu-da/cbc/docker-compose.yml
grep "3003:3003" /home/gu-da/cbc/docker-compose.yml
grep "3004:3004" /home/gu-da/cbc/docker-compose.yml
grep "3005:3005" /home/gu-da/cbc/docker-compose.yml
```

### Expected Result
✅ All 5 API services configured with correct ports (3001-3005)

---

## Test 4: Frontend Build Test

### Objective
Verify that frontend builds without errors.

### Steps

```bash
cd /home/gu-da/cbc/frontend

# Install dependencies
npm install

# Build frontend
npm run build

# Check build output
ls -la dist/
```

### Expected Result
✅ Frontend builds successfully with no errors
✅ dist/ directory contains built files

---

## Test 5: API Services Startup Test (Development)

### Objective
Verify that API services can start in development mode.

### Steps

```bash
# Terminal 1: Start commercialbank API
cd /home/gu-da/cbc/api/commercialbank
npm install
npm run dev

# Terminal 2: Start National Bank API
cd /home/gu-da/cbc/api/national-bank
npm install
npm run dev

# Terminal 3: Start ECTA API
cd /home/gu-da/cbc/api/ncat
npm install
npm run dev

# Terminal 4: Start Shipping Line API
cd /home/gu-da/cbc/api/shipping-line
npm install
npm run dev

# Terminal 5: Start Custom Authorities API
cd /home/gu-da/cbc/api/custom-authorities
npm install
npm run dev
```

### Expected Result
✅ All 5 API services start without errors
✅ Services listen on correct ports (3001-3005)
✅ No connection errors to Fabric network

---

## Test 6: API Health Check Test

### Objective
Verify that all API services respond to health checks.

### Steps

```bash
# Test commercialbank API
curl http://localhost:3001/health

# Test National Bank API
curl http://localhost:3002/health

# Test ECTA API
curl http://localhost:3003/health

# Test Shipping Line API
curl http://localhost:3004/health

# Test Custom Authorities API
curl http://localhost:3005/health
```

### Expected Result
✅ All endpoints return 200 OK
✅ Response includes health status

---

## Test 7: Frontend Startup Test

### Objective
Verify that frontend starts in development mode.

### Steps

```bash
cd /home/gu-da/cbc/frontend

# Start frontend dev server
npm run dev

# Expected output:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

### Expected Result
✅ Frontend starts on port 5173
✅ No build errors
✅ Ready to accept connections

---

## Test 8: Frontend Login Test

### Objective
Verify that frontend login page displays all organizations.

### Steps

1. Open browser: http://localhost:5173
2. Check login page displays:
   - commercialbank
   - National Bank
   - ECTA
   - Shipping Line
   - Custom Authorities
3. Verify organization selector works

### Expected Result
✅ All 5 organizations visible in login page
✅ Organization selector functional

---

## Test 9: Docker Compose Startup Test

### Objective
Verify that entire system starts with Docker Compose.

### Steps

```bash
cd /home/gu-da/cbc

# Start all services
docker-compose up -d

# Wait for services to start (60 seconds)
sleep 60

# Check running containers
docker ps

# Expected containers:
# - ipfs
# - orderer.coffee-export.com
# - peer0.commercialbank.coffee-export.com
# - couchdb0-4
# - commercialbank-api
# - national-bank-api
# - ncat-api
# - shipping-line-api
# - custom-authorities-api
# - frontend
```

### Expected Result
✅ All containers running
✅ No container restarts
✅ All health checks passing

---

## Test 10: Docker Compose Health Check Test

### Objective
Verify that all Docker services are healthy.

### Steps

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Check specific service health
docker inspect commercialbank-api | grep -A 5 "Health"

# Check logs for errors
docker-compose logs commercialbank-api
docker-compose logs national-bank-api
docker-compose logs ncat-api
docker-compose logs shipping-line-api
docker-compose logs custom-authorities-api
```

### Expected Result
✅ All containers show "healthy" status
✅ No error messages in logs
✅ All services responding

---

## Test 11: API Connectivity Test (Docker)

### Objective
Verify that API services are accessible from Docker containers.

### Steps

```bash
# Test from host machine
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health

# Test from inside container
docker exec commercialbank-api curl http://localhost:3001/health
docker exec national-bank-api curl http://localhost:3002/health
docker exec ncat-api curl http://localhost:3003/health
docker exec shipping-line-api curl http://localhost:3004/health
docker exec custom-authorities-api curl http://localhost:3005/health
```

### Expected Result
✅ All endpoints return 200 OK
✅ Services accessible from both host and containers

---

## Test 12: Frontend Docker Test

### Objective
Verify that frontend is accessible from Docker.

### Steps

```bash
# Test frontend accessibility
curl http://localhost

# Check frontend logs
docker-compose logs frontend

# Open browser
# http://localhost (should show frontend)
```

### Expected Result
✅ Frontend accessible on port 80
✅ No errors in logs
✅ Frontend loads in browser

---

## Test 13: Cross-Service Communication Test

### Objective
Verify that services can communicate with each other.

### Steps

```bash
# Test API to IPFS communication
curl -X GET http://localhost:3001/api/ipfs/status

# Test API to Fabric communication
curl -X GET http://localhost:3001/api/fabric/status

# Test API to API communication
curl -X GET http://localhost:3001/api/health
curl -X GET http://localhost:3002/api/health
```

### Expected Result
✅ All services can communicate
✅ No connection timeouts
✅ Proper error handling

---

## Test 14: Environment Variable Test

### Objective
Verify that environment variables are correctly loaded.

### Steps

```bash
# Check environment variables in running container
docker exec commercialbank-api env | grep ORGANIZATION_ID
# Expected: ORGANIZATION_ID=commercialbank

docker exec national-bank-api env | grep ORGANIZATION_ID
# Expected: ORGANIZATION_ID=national-bank

docker exec ncat-api env | grep ORGANIZATION_ID
# Expected: ORGANIZATION_ID=ncat

docker exec shipping-line-api env | grep ORGANIZATION_ID
# Expected: ORGANIZATION_ID=shipping-line

docker exec custom-authorities-api env | grep ORGANIZATION_ID
# Expected: ORGANIZATION_ID=custom-authorities
```

### Expected Result
✅ All environment variables correctly set
✅ Organization IDs match expected values

---

## Test 15: Port Allocation Test

### Objective
Verify that all ports are correctly allocated and accessible.

### Steps

```bash
# Check port allocation
netstat -tuln | grep LISTEN

# Expected ports:
# 3001 - commercialbank API
# 3002 - National Bank API
# 3003 - ECTA API
# 3004 - Shipping Line API
# 3005 - Custom Authorities API
# 5001 - IPFS API
# 5173 - Frontend (dev)
# 7050 - Orderer
# 7051 - commercialbank Peer
# 8080 - IPFS Gateway
```

### Expected Result
✅ All expected ports are listening
✅ No port conflicts
✅ All services accessible

---

## Test 16: Cleanup Test

### Objective
Verify that system can be cleanly shut down.

### Steps

```bash
# Stop all Docker services
docker-compose down

# Verify containers are stopped
docker ps

# Remove volumes (optional)
docker-compose down -v

# Verify all stopped
docker ps -a | grep coffee-export
```

### Expected Result
✅ All containers stopped
✅ No orphaned containers
✅ Clean shutdown

---

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use Docker to stop containers
docker-compose down
```

### Issue: API Service Won't Start

```bash
# Check logs
docker-compose logs commercialbank-api

# Check .env file
cat api/commercialbank/.env

# Verify Fabric network is running
docker ps | grep peer
```

### Issue: Frontend Can't Connect to API

```bash
# Check API is running
curl http://localhost:3001/health

# Check frontend config
cat frontend/src/config/api.config.js

# Check browser console for errors
# (Open DevTools: F12)
```

### Issue: Docker Compose Fails

```bash
# Check Docker is running
docker ps

# Validate docker-compose.yml
docker-compose config

# View detailed logs
docker-compose logs -f
```

---

## Test Summary Checklist

- [ ] Test 1: Environment Configuration ✅
- [ ] Test 2: Frontend Configuration ✅
- [ ] Test 3: Docker Compose Configuration ✅
- [ ] Test 4: Frontend Build ✅
- [ ] Test 5: API Services Startup ✅
- [ ] Test 6: API Health Check ✅
- [ ] Test 7: Frontend Startup ✅
- [ ] Test 8: Frontend Login ✅
- [ ] Test 9: Docker Compose Startup ✅
- [ ] Test 10: Docker Health Check ✅
- [ ] Test 11: API Connectivity ✅
- [ ] Test 12: Frontend Docker ✅
- [ ] Test 13: Cross-Service Communication ✅
- [ ] Test 14: Environment Variables ✅
- [ ] Test 15: Port Allocation ✅
- [ ] Test 16: Cleanup ✅

---

## Success Criteria

✅ All 16 tests pass
✅ No errors in logs
✅ All services accessible
✅ Frontend displays all organizations
✅ API services respond to health checks
✅ Docker Compose deployment works
✅ Clean shutdown possible

---

## Next Steps

1. Run all tests in order
2. Document any failures
3. Fix issues using troubleshooting guide
4. Re-run failed tests
5. Proceed to production deployment

---

**Test Date**: January 2024
**Status**: Ready for Testing
**Estimated Time**: 2-3 hours
