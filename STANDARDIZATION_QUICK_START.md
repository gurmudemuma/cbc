# Standardization Quick Start Guide

## What Was Done ✅

The following changes have been completed:

1. ✅ **Frontend Configuration** - Updated api.config.js with standardized organization names
2. ✅ **Frontend App.jsx** - Updated organization mapping
3. ✅ **Root package.json** - Updated workspace definitions

## What Needs to Be Done ⏳

Follow these steps to complete the standardization:

---

## Step 1: Consolidate API Directories (5 minutes)

### Run the Standardization Script

```bash
cd /home/gu-da/cbc
./standardize-naming.sh
```

**What it does:**
- Creates backup at `api.backup.<timestamp>`
- Moves deprecated directories to `api/deprecated/`
- Verifies final structure

**Expected output:**
```
✓ Backup created at: api.backup.1234567890
✓ Moved: exporter → deprecated/exporter.backup
✓ Moved: banker → deprecated/banker.backup
✓ Moved: nb-regulatory → deprecated/nb-regulatory.backup
```

---

## Step 2: Create Environment Files (10 minutes)

### For Each API Service

Create `.env` file from `.env.example`:

```bash
# commercialbank
cd /home/gu-da/cbc/api/commercialbank
cp .env.example .env

# National Bank
cd /home/gu-da/cbc/api/national-bank
cp .env.example .env

# ECTA
cd /home/gu-da/cbc/api/ncat
cp .env.example .env

# Shipping Line
cd /home/gu-da/cbc/api/shipping-line
cp .env.example .env

# Custom Authorities
cd /home/gu-da/cbc/api/custom-authorities
cp .env.example .env
```

### Verify Environment Files

Each `.env` file should have:

```bash
ORGANIZATION_ID=<organization-id>
ORGANIZATION_NAME=<Organization Name>
MSP_ID=<OrganizationMSP>
PORT=<port>
```

**Example for commercialbank:**
```bash
ORGANIZATION_ID=commercialbank
ORGANIZATION_NAME=commercialbank
MSP_ID=commercialbankMSP
PORT=3001
```

---

## Step 3: Test Frontend (5 minutes)

### Start Frontend

```bash
cd /home/gu-da/cbc/frontend
npm install
npm run dev
```

### Verify

1. Open http://localhost:5173
2. Check login page shows all 5 organizations:
   - commercialbank
   - National Bank
   - ECTA
   - Shipping Line
   - Custom Authorities

---

## Step 4: Test API Services (10 minutes)

### Start All APIs

```bash
cd /home/gu-da/cbc/api
npm install
npm run dev:all
```

### Verify Each Service

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

---

## Step 5: Test Docker Compose (15 minutes)

### Start Services

```bash
cd /home/gu-da/cbc
docker-compose up -d
```

### Verify Services

```bash
# Check running containers
docker ps

# Expected containers:
# - commercialbank-api (port 3001)
# - national-bank-api (port 3002)
# - ncat-api (port 3003)
# - shipping-line-api (port 3004)
# - custom-authorities-api (port 3005)
# - ipfs (port 5001)
# - orderer.coffee-export.com (port 7050)
# - peer0.commercialbank.coffee-export.com (port 7051)
# - frontend (port 80)
```

### Test Endpoints

```bash
# Test each API
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health

# Test frontend
curl http://localhost
```

---

## Step 6: Update Documentation (20 minutes)

### Files to Update

1. **README.md**
   - Update API service descriptions
   - Update port references
   - Update organization names

2. **ARCHITECTURE.md**
   - Update service names
   - Update port mappings
   - Update organization descriptions

3. **STARTUP_ORDER.md**
   - Update service startup order
   - Update port references

4. **DEPLOYMENT_GUIDE.md**
   - Update deployment instructions
   - Update environment variables

### Search and Replace

```bash
# In all documentation files:
# Replace: exporter → commercialbank
# Replace: banker → national-bank
# Replace: nb-regulatory → national-bank
# Replace: shipping → shipping-line
# Replace: customs → custom-authorities
```

---

## Step 7: Final Validation (10 minutes)

### Checklist

- [ ] Frontend builds without errors
- [ ] Frontend shows all 5 organizations
- [ ] All API services start correctly
- [ ] All API health checks pass
- [ ] Docker Compose up works
- [ ] Frontend can login with each organization
- [ ] API calls succeed
- [ ] Documentation updated

### Test Login Flow

1. Start frontend: `npm run dev` (in frontend directory)
2. Open http://localhost:5173
3. Select "commercialbank"
4. Login with test credentials
5. Verify dashboard loads
6. Repeat for other organizations

---

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Issue: API Service Won't Start

```bash
# Check logs
cd api/commercialbank
npm run dev

# Check .env file
cat .env

# Verify ORGANIZATION_ID matches
```

### Issue: Frontend Can't Connect to API

```bash
# Check API is running
curl http://localhost:3001/health

# Check frontend config
cat frontend/src/config/api.config.js

# Check browser console for errors
```

### Issue: Docker Compose Fails

```bash
# Check Docker is running
docker ps

# Check docker-compose.yml syntax
docker-compose config

# View logs
docker-compose logs -f
```

---

## Quick Reference

### Organization IDs

```
commercialbank      (Port 3001, MSP: commercialbankMSP)
national-bank      (Port 3002, MSP: NationalBankMSP)
ncat               (Port 3003, MSP: ECTAMSP)
shipping-line      (Port 3004, MSP: ShippingLineMSP)
custom-authorities (Port 3005, MSP: CustomAuthoritiesMSP)
```

### Service URLs

```
Frontend:     http://localhost:5173 (dev) or http://localhost (prod)
commercialbank API:    http://localhost:3001
National Bank API:    http://localhost:3002
ECTA API:             http://localhost:3003
Shipping Line API:    http://localhost:3004
Custom Authorities:   http://localhost:3005
IPFS:                 http://localhost:5001
```

### Useful Commands

```bash
# Start all APIs
cd api && npm run dev:all

# Start frontend
cd frontend && npm run dev

# Start Docker Compose
docker-compose up -d

# Stop Docker Compose
docker-compose down

# View logs
docker-compose logs -f <service-name>

# Rebuild Docker images
docker-compose up -d --build
```

---

## Estimated Time

- Step 1 (Consolidate): 5 min
- Step 2 (Env Files): 10 min
- Step 3 (Frontend): 5 min
- Step 4 (APIs): 10 min
- Step 5 (Docker): 15 min
- Step 6 (Docs): 20 min
- Step 7 (Validation): 10 min

**Total: ~75 minutes**

---

## Success Criteria

✅ All 5 organizations accessible from frontend
✅ All 5 API services running on correct ports
✅ All health checks passing
✅ Docker Compose deployment working
✅ Documentation updated
✅ No naming inconsistencies

---

## Next Steps After Completion

1. **Commit changes** to version control
2. **Deploy** to staging environment
3. **Test** end-to-end workflows
4. **Deploy** to production
5. **Monitor** for any issues

---

## Support Documents

- **STANDARDIZATION_SUMMARY.md** - Overall status and progress
- **STANDARDIZATION_IMPLEMENTATION.md** - Detailed implementation guide
- **STANDARDIZED_CONFIGURATION_REFERENCE.md** - Configuration reference
- **STANDARDIZATION_BEFORE_AFTER.md** - Before/after comparison

---

**Status**: Ready to Complete
**Priority**: High
**Estimated Time**: ~75 minutes
**Last Updated**: January 2024
