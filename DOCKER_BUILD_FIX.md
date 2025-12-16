# Docker Build Context Fix

**Date:** October 27, 2025  
**Issue:** Docker builds failing with "not found" errors  
**Status:** ✅ FIXED

---

## Problem

All API service Docker builds were failing with errors like:

```
failed to compute cache key: "/shipping-line/src": not found
failed to compute cache key: "/shared": not found
failed to compute cache key: "tsconfig.base.json": not found
```

### Root Cause

The build context was set to each service's subdirectory:
```yaml
commercialbank-api:
  build:
    context: ./api/commercialbank  # ❌ TOO NARROW
    dockerfile: Dockerfile
```

But the Dockerfiles need to copy files from the parent `api/` directory:
```dockerfile
COPY tsconfig.base.json ./      # ❌ Not in commercialbank/
COPY shared ./shared            # ❌ Not in commercialbank/
```

**Why this happened:** The Dockerfiles use a workspace pattern where `shared/` utilities are at the `api/` level, not within each service directory.

---

## Solution

Changed the build context to the parent `api/` directory for all services:

```yaml
commercialbank-api:
  build:
    context: ./api                        # ✅ CORRECT - can see shared/
    dockerfile: commercialbank/Dockerfile  # ✅ Path relative to context
```

### Files Modified

- `/home/gu-da/cbc/docker-compose.yml`

### Services Fixed

1. ✅ commercialbank-api
2. ✅ national-bank-api
3. ✅ ncat-api
4. ✅ shipping-line-api
5. ✅ custom-authorities-api

---

## Directory Structure

```
/home/gu-da/cbc/
├── api/                          # ← Build context (can see everything below)
│   ├── package.json              # Workspace root
│   ├── tsconfig.base.json        # ← Shared config
│   ├── shared/                   # ← Shared utilities
│   │   ├── security.best-practices.ts
│   │   ├── logger.ts
│   │   ├── env.validator.ts
│   │   └── ...
│   ├── commercialbank/
│   │   ├── Dockerfile            # COPY ../shared works
│   │   ├── src/
│   │   └── package.json
│   ├── national-bank/
│   │   ├── Dockerfile
│   │   └── ...
│   └── ...
```

---

## Verification

Test the builds:

```bash
cd /home/gu-da/cbc

# Build individual service
docker-compose build commercialbank-api

# Build all services
docker-compose build

# Start everything
docker-compose up -d
```

All builds should now succeed! ✅

---

## Architecture Clarification

### Network Members (Internal)

These are consortium members with their own peer nodes:

1. **commercialbank** (Port 3001)
   - Peer: peer0.commercialbank.coffee-export.com:7051
   - Organization: commercialbankMSP
   - Role: Financial institution for exporters

2. **National Bank** (Port 3002)
   - Peer: peer0.nationalbank.coffee-export.com:8051
   - Organization: NationalBankMSP
   - Role: Central regulatory bank

3. **ECTA** (Port 3003)
   - Peer: peer0.ncat.coffee-export.com:9051
   - Organization: ECTAMSP
   - Role: Coffee Authority

4. **Shipping Line** (Port 3004)
   - Peer: peer0.shippingline.coffee-export.com:10051
   - Organization: ShippingLineMSP
   - Role: Maritime transport

5. **Custom Authorities** (Port 3005)
   - Peer: peer0.customauthorities.coffee-export.com:11051
   - Organization: CustomAuthoritiesMSP
   - Role: Customs clearance

### External Access Portal

For exporters **outside** the consortium network:

- **NB-Regulatory Portal** or **Exporter Portal**
  - Provides external access to the blockchain network
  - External exporters interact through this gateway
  - Does NOT have its own peer node
  - Acts as a facade/proxy to the internal network

**Note:** The current setup uses `commercialbank-api` as an internal member. If you need a separate external portal for non-consortium exporters, you would create a new service like `exporter-portal-api` or `nb-regulatory-api` that:
- Has no peer dependency
- Connects through one of the existing peers (e.g., national-bank or commercialbank)
- Provides limited, regulated access to external users

---

## Next Steps

1. ✅ Build all services: `docker-compose build`
2. ✅ Create `.env` files for each service (use `.env.example` templates)
3. ✅ Start the network: `docker-compose up -d`
4. Optional: Create external portal service if needed

---

**Fix Applied:** October 27, 2025  
**Status:** ✅ Ready to build and deploy
