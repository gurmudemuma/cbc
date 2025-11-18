# Naming Standardization Plan

## Current Inconsistencies

### Issue 1: API Directory Names vs Frontend Configuration

**Current State:**
```
API Directories:
- /api/exporter
- /api/banker
- /api/nb-regulatory
- /api/ncat
- /api/shipping-line
- /api/custom-authorities

Frontend Config (api.config.js):
- exporter
- banker
- nb-regulatory
- ncat
- shipping (MISMATCH: should be shipping-line)
- customs (MISMATCH: should be custom-authorities)

Root package.json workspaces:
- commercialbank (MISMATCH: directory is /api/exporter)
- exporter-portal (MISSING: no directory)
- national-bank (MISSING: directory is /api/nb-regulatory)
- ncat
- shipping-line
- custom-authorities
```

### Issue 2: Organization Naming Convention

**Inconsistent naming across the system:**

| Component | commercialbank | National Bank | ECTA | Shipping | Customs |
|-----------|---------------|---------------|------|----------|---------|
| API Dir | `exporter` | `nb-regulatory` | `ncat` | `shipping-line` | `custom-authorities` |
| Frontend | `banker` | `nb-regulatory` | `ncat` | `shipping` | `customs` |
| Chaincode MSP | `commercialbankMSP` | `NationalBankMSP` | `ECTAMSP` | `ShippingLineMSP` | `CustomAuthoritiesMSP` |
| Docker Service | `commercialbank-api` | `national-bank-api` | `ncat-api` | `shipping-line-api` | `custom-authorities-api` |

### Issue 3: Environment Variables & Configuration

**Missing standardization:**
- No consistent naming in `.env` files
- Port assignments unclear
- API endpoint paths inconsistent
- MSP ID mapping not standardized

---

## Proposed Standardization

### Standard Naming Convention

**Adopt: `<organization>-<component>` format**

```
Organization Identifiers:
- commercialbank (for commercialbank)
- national-bank (for National Bank)
- ncat (for ECTA)
- shipping-line (for Shipping Line)
- custom-authorities (for Custom Authorities)

Short Codes (for frontend/config):
- commercialbank → eb
- national-bank → nb
- ncat → ncat
- shipping-line → sl
- custom-authorities → ca
```

### Standardized Structure

```
/api/
├── commercialbank/              # commercialbank API
│   ├── src/
│   ├── package.json
│   └── .env.example
├── national-bank/              # National Bank API
│   ├── src/
│   ├── package.json
│   └── .env.example
├── ncat/                       # ECTA API
│   ├── src/
│   ├── package.json
│   └── .env.example
├── shipping-line/              # Shipping Line API
│   ├── src/
│   ├── package.json
│   └── .env.example
├── custom-authorities/         # Custom Authorities API
│   ├── src/
│   ├── package.json
│   └── .env.example
├── shared/                     # Shared utilities
├── package.json                # Root workspace
└── tsconfig.base.json
```

### Frontend Configuration

```javascript
// api.config.js
export const ORGANIZATIONS = [
  { 
    id: 'commercialbank',
    value: 'commercialbank',
    label: 'commercialbank',
    shortCode: 'eb',
    apiUrl: '/api/commercialbank',
    port: 3001,
    mspId: 'commercialbankMSP'
  },
  { 
    id: 'national-bank',
    value: 'national-bank',
    label: 'National Bank',
    shortCode: 'nb',
    apiUrl: '/api/national-bank',
    port: 3002,
    mspId: 'NationalBankMSP'
  },
  { 
    id: 'ncat',
    value: 'ncat',
    label: 'ECTA',
    shortCode: 'ncat',
    apiUrl: '/api/ncat',
    port: 3003,
    mspId: 'ECTAMSP'
  },
  { 
    id: 'shipping-line',
    value: 'shipping-line',
    label: 'Shipping Line',
    shortCode: 'sl',
    apiUrl: '/api/shipping-line',
    port: 3004,
    mspId: 'ShippingLineMSP'
  },
  { 
    id: 'custom-authorities',
    value: 'custom-authorities',
    label: 'Custom Authorities',
    shortCode: 'ca',
    apiUrl: '/api/custom-authorities',
    port: 3005,
    mspId: 'CustomAuthoritiesMSP'
  }
];
```

### Docker Compose Services

```yaml
services:
  commercialbank-api:
    build: ./api/commercialbank
    container_name: commercialbank-api
    environment:
      - PORT=3001
      - ORGANIZATION_ID=commercialbank
      - MSP_ID=commercialbankMSP
    ports:
      - "3001:3001"

  national-bank-api:
    build: ./api/national-bank
    container_name: national-bank-api
    environment:
      - PORT=3002
      - ORGANIZATION_ID=national-bank
      - MSP_ID=NationalBankMSP
    ports:
      - "3002:3002"

  ncat-api:
    build: ./api/ncat
    container_name: ncat-api
    environment:
      - PORT=3003
      - ORGANIZATION_ID=ncat
      - MSP_ID=ECTAMSP
    ports:
      - "3003:3003"

  shipping-line-api:
    build: ./api/shipping-line
    container_name: shipping-line-api
    environment:
      - PORT=3004
      - ORGANIZATION_ID=shipping-line
      - MSP_ID=ShippingLineMSP
    ports:
      - "3004:3004"

  custom-authorities-api:
    build: ./api/custom-authorities
    container_name: custom-authorities-api
    environment:
      - PORT=3005
      - ORGANIZATION_ID=custom-authorities
      - MSP_ID=CustomAuthoritiesMSP
    ports:
      - "3005:3005"
```

### Environment Variables (.env)

```bash
# .env.example for each API service

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

### Root package.json Workspaces

```json
{
  "workspaces": [
    "commercialbank",
    "national-bank",
    "ncat",
    "shipping-line",
    "custom-authorities",
    "shared"
  ]
}
```

---

## Migration Steps

### Phase 1: Rename API Directories

```bash
# Backup current state
cp -r api api.backup.$(date +%s)

# Rename directories to match standard
mv api/exporter api/commercialbank
mv api/banker api/national-bank  # if exists
mv api/nb-regulatory api/national-bank  # if different
# shipping-line and custom-authorities already correct
```

### Phase 2: Update package.json Files

**Each API service package.json:**
```json
{
  "name": "commercialbank-api",
  "version": "1.0.0",
  "description": "commercialbank API",
  "main": "dist/src/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/src/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts"
  }
}
```

### Phase 3: Update Frontend Configuration

**frontend/src/config/api.config.js:**
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

### Phase 4: Update Frontend App.jsx

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

### Phase 5: Update Docker Compose

**docker-compose.yml:**
- Update service names
- Update environment variables
- Update port mappings
- Update volume mounts

### Phase 6: Update Root package.json

**api/package.json:**
```json
{
  "workspaces": [
    "commercialbank",
    "national-bank",
    "ncat",
    "shipping-line",
    "custom-authorities",
    "shared"
  ]
}
```

### Phase 7: Update Documentation

- Update README.md
- Update ARCHITECTURE.md
- Update API_QUICK_REFERENCE.md
- Update all startup guides

### Phase 8: Update Network Configuration

- Update Fabric MSP configurations
- Update connection profiles
- Update organization mappings

---

## Validation Checklist

- [ ] All API directories renamed consistently
- [ ] All package.json files updated
- [ ] Frontend configuration matches API structure
- [ ] Docker Compose services aligned
- [ ] Environment variables standardized
- [ ] Root workspace configuration updated
- [ ] Documentation updated
- [ ] Network configuration aligned
- [ ] Tests passing
- [ ] Startup scripts working

---

## Benefits

✅ **Consistency** - Same naming across all components
✅ **Clarity** - Clear organization identification
✅ **Maintainability** - Easier to understand and modify
✅ **Scalability** - Easy to add new organizations
✅ **Documentation** - Self-documenting code
✅ **Debugging** - Easier to trace issues
✅ **Onboarding** - New developers understand structure faster

---

## Timeline

- **Phase 1-2**: 30 minutes (Rename & update package.json)
- **Phase 3-4**: 30 minutes (Update frontend)
- **Phase 5-6**: 30 minutes (Update Docker & root config)
- **Phase 7-8**: 1 hour (Documentation & network config)
- **Testing**: 1 hour (Validation & testing)

**Total: ~3.5 hours**

---

**Status**: Ready for Implementation
**Priority**: High (Blocking consistency issues)
**Impact**: All components
