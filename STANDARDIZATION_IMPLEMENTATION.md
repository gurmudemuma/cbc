# Naming Standardization Implementation Guide

## Overview

This document provides step-by-step instructions to standardize naming conventions across the Coffee Blockchain Consortium codebase.

## Current Issues Identified

### 1. API Directory Naming Inconsistencies

**Problem:**
```
Current directories:
- /api/exporter (should be commercialbank)
- /api/banker (should be national-bank)
- /api/nb-regulatory (should be national-bank)
- /api/shipping-line ✓ (correct)
- /api/custom-authorities ✓ (correct)
- /api/ncat ✓ (correct)
```

### 2. Frontend Configuration Mismatch

**Problem:**
```
Frontend expects:
- exporter, banker, nb-regulatory, ncat, shipping, customs

Should be:
- commercialbank, national-bank, ncat, shipping-line, custom-authorities
```

### 3. Root Workspace Configuration

**Problem:**
```
Current workspaces:
- commercialbank (but directory is /api/exporter)
- exporter-portal (no directory exists)
- national-bank (but directory is /api/nb-regulatory)
- ncat ✓
- shipping-line ✓
- custom-authorities ✓
```

---

## Implementation Steps

### Step 1: Update Frontend Configuration ✅ COMPLETED

**File: `frontend/src/config/api.config.js`**

Changes made:
- Updated API_ENDPOINTS to use standardized names
- Updated ORGANIZATIONS array with consistent naming
- Added mspId field for each organization
- Added helper functions: getOrganization(), getMspId()

**Result:**
```javascript
export const ORGANIZATIONS = [
  { 
    id: 'commercialbank',
    value: 'commercialbank', 
    label: 'commercialbank', 
    apiUrl: '/api/commercialbank',
    port: 3001,
    mspId: 'commercialbankMSP'
  },
  // ... rest of organizations
];
```

### Step 2: Update Frontend App.jsx ✅ COMPLETED

**File: `frontend/src/App.jsx`**

Changes made:
- Updated getOrgClass() mapping to use standardized names
- Now maps: commercialbank, national-bank, ncat, shipping-line, custom-authorities

**Result:**
```javascript
const getOrgClass = (org) => {
  const map = {
    'commercialbank': 'commercialbank',
    'national-bank': 'national-bank',
    'ncat': 'ncat',
    'shipping-line': 'shipping-line',
    'custom-authorities': 'custom-authorities',
  };
  return map[org] || 'commercialbank';
};
```

### Step 3: Update Root package.json ✅ COMPLETED

**File: `api/package.json`**

Changes made:
- Removed non-existent workspaces: exporter-portal
- Corrected workspace names to match actual directories
- Added shared workspace

**Result:**
```json
"workspaces": [
  "commercialbank",
  "national-bank",
  "ncat",
  "shipping-line",
  "custom-authorities",
  "shared"
]
```

### Step 4: Rename API Directories (PENDING)

**Action Required:**

```bash
# Backup current state
cd /home/gu-da/cbc
cp -r api api.backup.$(date +%s)

# Rename directories to match standard
# Note: Some directories already have correct names

# Check current state:
ls -la api/ | grep "^d" | awk '{print $NF}'

# Directories that need attention:
# - /api/exporter → should be /api/commercialbank (but commercialbank already exists!)
# - /api/banker → should be /api/national-bank (but national-bank already exists!)
# - /api/nb-regulatory → should be consolidated with national-bank
```

**Issue Found:** There are duplicate/conflicting directories!

```
Current state:
- /api/exporter (exporter-api)
- /api/commercialbank (commercialbank-api) ← DUPLICATE
- /api/banker (banker-api)
- /api/national-bank (national-bank-api) ← DUPLICATE
- /api/nb-regulatory (nb-regulatory-api)
```

**Resolution Strategy:**

```bash
# 1. Identify which version is active/correct
cd /home/gu-da/cbc/api

# Check commercialbank versions
echo "=== commercialbank ===" && cat commercialbank/package.json | grep name
echo "=== exporter ===" && cat exporter/package.json | grep name

# Check national-bank versions
echo "=== national-bank ===" && cat national-bank/package.json | grep name
echo "=== nb-regulatory ===" && cat nb-regulatory/package.json | grep name
echo "=== banker ===" && cat banker/package.json | grep name

# 2. Keep the most recent/complete version
# 3. Remove duplicates and old versions
# 4. Consolidate into single directory per organization
```

### Step 5: Consolidate API Directories (PENDING)

**Recommended Action:**

```bash
# Keep these (already correct):
- /api/ncat
- /api/shipping-line
- /api/custom-authorities
- /api/shared

# For commercialbank - Keep commercialbank, remove exporter
# For National Bank - Keep national-bank, remove nb-regulatory and banker

# Backup old versions
mkdir -p api/deprecated
mv api/exporter api/deprecated/exporter.backup
mv api/banker api/deprecated/banker.backup
mv api/nb-regulatory api/deprecated/nb-regulatory.backup

# Verify structure
ls -la api/ | grep "^d" | awk '{print $NF}'
```

### Step 6: Update Environment Variables (PENDING)

**Create standardized .env files for each API:**

**File: `api/commercialbank/.env.example`**
```bash
# Organization Configuration
ORGANIZATION_ID=commercialbank
ORGANIZATION_NAME=commercialbank
MSP_ID=commercialbankMSP

# Server Configuration
PORT=3001
NODE_ENV=development

# Fabric Configuration
FABRIC_NETWORK_CONFIG_PATH=../../network/organizations/peerOrganizations/commercialbank.coffee-export.com/connection-profile.json
FABRIC_WALLET_PATH=./wallet
FABRIC_USER_ID=admin

# Blockchain Configuration
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management

# IPFS Configuration
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http

# API Configuration
API_BASE_URL=http://localhost:3001
API_PREFIX=/api

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

**Repeat for each API service with appropriate values:**
- national-bank (Port 3002, NationalBankMSP)
- ncat (Port 3003, ECTAMSP)
- shipping-line (Port 3004, ShippingLineMSP)
- custom-authorities (Port 3005, CustomAuthoritiesMSP)

### Step 7: Update Docker Compose (PENDING)

**File: `docker-compose.yml`**

Update service definitions:

```yaml
services:
  commercialbank-api:
    build:
      context: ./api/commercialbank
      dockerfile: Dockerfile
    container_name: commercialbank-api
    environment:
      - PORT=3001
      - ORGANIZATION_ID=commercialbank
      - ORGANIZATION_NAME=commercialbank
      - MSP_ID=commercialbankMSP
      - CHANNEL_NAME=coffeechannel
      - CHAINCODE_NAME_EXPORT=coffee-export
      - IPFS_HOST=ipfs
      - IPFS_PORT=5001
    ports:
      - "3001:3001"
    networks:
      - coffee-export
    depends_on:
      - ipfs
      - peer0.commercialbank.coffee-export.com
    volumes:
      - commercialbank-wallet:/app/wallet
      - ./network/organizations/peerOrganizations/commercialbank.coffee-export.com:/crypto
    restart: unless-stopped

  national-bank-api:
    build:
      context: ./api/national-bank
      dockerfile: Dockerfile
    container_name: national-bank-api
    environment:
      - PORT=3002
      - ORGANIZATION_ID=national-bank
      - ORGANIZATION_NAME=National Bank
      - MSP_ID=NationalBankMSP
      - CHANNEL_NAME=coffeechannel
      - CHAINCODE_NAME_EXPORT=coffee-export
      - IPFS_HOST=ipfs
      - IPFS_PORT=5001
    ports:
      - "3002:3002"
    networks:
      - coffee-export
    depends_on:
      - ipfs
      - peer0.nationalbank.coffee-export.com
    volumes:
      - national-bank-wallet:/app/wallet
      - ./network/organizations/peerOrganizations/nationalbank.coffee-export.com:/crypto
    restart: unless-stopped

  ncat-api:
    build:
      context: ./api/ncat
      dockerfile: Dockerfile
    container_name: ncat-api
    environment:
      - PORT=3003
      - ORGANIZATION_ID=ncat
      - ORGANIZATION_NAME=ECTA
      - MSP_ID=ECTAMSP
      - CHANNEL_NAME=coffeechannel
      - CHAINCODE_NAME_EXPORT=coffee-export
      - IPFS_HOST=ipfs
      - IPFS_PORT=5001
    ports:
      - "3003:3003"
    networks:
      - coffee-export
    depends_on:
      - ipfs
      - peer0.ncat.coffee-export.com
    volumes:
      - ncat-wallet:/app/wallet
      - ./network/organizations/peerOrganizations/ncat.coffee-export.com:/crypto
    restart: unless-stopped

  shipping-line-api:
    build:
      context: ./api/shipping-line
      dockerfile: Dockerfile
    container_name: shipping-line-api
    environment:
      - PORT=3004
      - ORGANIZATION_ID=shipping-line
      - ORGANIZATION_NAME=Shipping Line
      - MSP_ID=ShippingLineMSP
      - CHANNEL_NAME=coffeechannel
      - CHAINCODE_NAME_EXPORT=coffee-export
      - IPFS_HOST=ipfs
      - IPFS_PORT=5001
    ports:
      - "3004:3004"
    networks:
      - coffee-export
    depends_on:
      - ipfs
      - peer0.shippingline.coffee-export.com
    volumes:
      - shipping-line-wallet:/app/wallet
      - ./network/organizations/peerOrganizations/shippingline.coffee-export.com:/crypto
    restart: unless-stopped

  custom-authorities-api:
    build:
      context: ./api/custom-authorities
      dockerfile: Dockerfile
    container_name: custom-authorities-api
    environment:
      - PORT=3005
      - ORGANIZATION_ID=custom-authorities
      - ORGANIZATION_NAME=Custom Authorities
      - MSP_ID=CustomAuthoritiesMSP
      - CHANNEL_NAME=coffeechannel
      - CHAINCODE_NAME_EXPORT=coffee-export
      - IPFS_HOST=ipfs
      - IPFS_PORT=5001
    ports:
      - "3005:3005"
    networks:
      - coffee-export
    depends_on:
      - ipfs
      - peer0.customauthorities.coffee-export.com
    volumes:
      - custom-authorities-wallet:/app/wallet
      - ./network/organizations/peerOrganizations/customauthorities.coffee-export.com:/crypto
    restart: unless-stopped
```

### Step 8: Update Documentation (PENDING)

**Files to update:**
- README.md - Update API service descriptions
- ARCHITECTURE.md - Update service names
- API_QUICK_REFERENCE.md - Update endpoint references
- STARTUP_ORDER.md - Update service startup order
- DEPLOYMENT_GUIDE.md - Update deployment instructions

---

## Validation Checklist

### Frontend
- [ ] api.config.js uses standardized names
- [ ] App.jsx organization mapping updated
- [ ] Login page shows correct organization options
- [ ] API calls use correct endpoints

### API Services
- [ ] All directories follow naming convention
- [ ] package.json files have correct names
- [ ] .env files have correct ORGANIZATION_ID
- [ ] Environment variables standardized

### Docker Compose
- [ ] Service names match organization IDs
- [ ] Environment variables correct
- [ ] Port mappings correct (3001-3005)
- [ ] Volume mounts correct

### Documentation
- [ ] README.md updated
- [ ] ARCHITECTURE.md updated
- [ ] API endpoints documented
- [ ] Startup instructions updated

### Testing
- [ ] Frontend builds without errors
- [ ] API services start correctly
- [ ] Docker Compose up works
- [ ] Login with each organization works
- [ ] API calls succeed

---

## Standardized Naming Convention

### Final Structure

```
/api/
├── commercialbank/              # commercialbank API (Port 3001)
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── national-bank/              # National Bank API (Port 3002)
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── ncat/                       # ECTA API (Port 3003)
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── shipping-line/              # Shipping Line API (Port 3004)
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── custom-authorities/         # Custom Authorities API (Port 3005)
│   ├─��� src/
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── shared/                     # Shared utilities
├── package.json                # Root workspace
└── tsconfig.base.json
```

### Organization Mapping

| Organization | Directory | Port | MSP ID | API Endpoint |
|--------------|-----------|------|--------|--------------|
| commercialbank | commercialbank | 3001 | commercialbankMSP | /api/commercialbank |
| National Bank | national-bank | 3002 | NationalBankMSP | /api/national-bank |
| ECTA | ncat | 3003 | ECTAMSP | /api/ncat |
| Shipping Line | shipping-line | 3004 | ShippingLineMSP | /api/shipping-line |
| Custom Authorities | custom-authorities | 3005 | CustomAuthoritiesMSP | /api/custom-authorities |

---

## Completed Changes Summary

✅ **Frontend Configuration Updated**
- api.config.js: Standardized organization definitions
- App.jsx: Updated organization class mapping

✅ **Root Configuration Updated**
- api/package.json: Corrected workspace definitions

## Pending Changes

⏳ **API Directory Consolidation**
- Resolve duplicate directories (exporter vs commercialbank, etc.)
- Consolidate into single directory per organization

⏳ **Environment Variables**
- Create .env.example files for each service
- Standardize environment variable names

⏳ **Docker Compose**
- Update service definitions
- Standardize environment variables
- Update volume mounts

⏳ **Documentation**
- Update all documentation files
- Update startup guides
- Update API references

---

## Next Steps

1. **Resolve API Directory Conflicts**
   - Identify which version of each API is active
   - Consolidate into single directory
   - Remove deprecated versions

2. **Create Environment Files**
   - Create .env.example for each service
   - Document all environment variables

3. **Update Docker Compose**
   - Update service definitions
   - Test Docker Compose startup

4. **Update Documentation**
   - Update all references
   - Test startup procedures

5. **Validation & Testing**
   - Test frontend login
   - Test API connectivity
   - Test Docker Compose deployment

---

**Status**: Partially Complete (Frontend & Root Config Done)
**Priority**: High
**Impact**: All Components
**Estimated Time to Complete**: 2-3 hours
