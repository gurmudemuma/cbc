# Standardized Configuration Reference

## Overview

This document provides the complete standardized configuration for all components of the Coffee Blockchain Consortium.

---

## 1. Organization Definitions

### Standard Organization Identifiers

```
commercialbank      → commercialbank (Port 3001, MSP: commercialbankMSP)
national-bank      → National Bank (Port 3002, MSP: NationalBankMSP)
ncat               → ECTA (Port 3003, MSP: ECTAMSP)
shipping-line      → Shipping Line (Port 3004, MSP: ShippingLineMSP)
custom-authorities → Custom Authorities (Port 3005, MSP: CustomAuthoritiesMSP)
```

### Organization Configuration Table

| ID | Label | Port | MSP ID | API Endpoint | Directory | Description |
|----|-------|------|--------|--------------|-----------|-------------|
| commercialbank | commercialbank | 3001 | commercialbankMSP | /api/commercialbank | api/commercialbank | Initiates and completes exports |
| national-bank | National Bank | 3002 | NationalBankMSP | /api/national-bank | api/national-bank | Approves FX and regulatory compliance |
| ncat | ECTA | 3003 | ECTAMSP | /api/ncat | api/ncat | Quality assurance and certification |
| shipping-line | Shipping Line | 3004 | ShippingLineMSP | /api/shipping-line | api/shipping-line | Manages shipments and logistics |
| custom-authorities | Custom Authorities | 3005 | CustomAuthoritiesMSP | /api/custom-authorities | api/custom-authorities | Customs clearance and compliance |

---

## 2. Frontend Configuration

### api.config.js

```javascript
export const ORGANIZATIONS = [
  { 
    id: 'commercialbank',
    value: 'commercialbank', 
    label: 'commercialbank', 
    apiUrl: '/api/commercialbank',
    port: 3001,
    mspId: 'commercialbankMSP',
    description: 'commercialbank - Initiates and completes exports'
  },
  { 
    id: 'national-bank',
    value: 'national-bank', 
    label: 'National Bank', 
    apiUrl: '/api/national-bank',
    port: 3002,
    mspId: 'NationalBankMSP',
    description: 'National Bank - Approves FX and regulatory compliance'
  },
  { 
    id: 'ncat',
    value: 'ncat', 
    label: 'ECTA', 
    apiUrl: '/api/ncat',
    port: 3003,
    mspId: 'ECTAMSP',
    description: 'ECTA - Quality assurance and certification'
  },
  { 
    id: 'shipping-line',
    value: 'shipping-line', 
    label: 'Shipping Line', 
    apiUrl: '/api/shipping-line',
    port: 3004,
    mspId: 'ShippingLineMSP',
    description: 'Shipping Line - Manages shipments and logistics'
  },
  { 
    id: 'custom-authorities',
    value: 'custom-authorities', 
    label: 'Custom Authorities', 
    apiUrl: '/api/custom-authorities',
    port: 3005,
    mspId: 'CustomAuthoritiesMSP',
    description: 'Custom Authorities - Customs clearance and compliance'
  }
];
```

### App.jsx Organization Mapping

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

---

## 3. API Service Configuration

### Environment Variables Template

**File: `.env.example` (for each API service)**

```bash
# ============================================
# Organization Configuration
# ============================================
ORGANIZATION_ID=commercialbank
ORGANIZATION_NAME=commercialbank
MSP_ID=commercialbankMSP

# ============================================
# Server Configuration
# ============================================
PORT=3001
NODE_ENV=development
API_BASE_URL=http://localhost:3001
API_PREFIX=/api

# ============================================
# Fabric Configuration
# ============================================
FABRIC_NETWORK_CONFIG_PATH=../../network/organizations/peerOrganizations/commercialbank.coffee-export.com/connection-profile.json
FABRIC_WALLET_PATH=./wallet
FABRIC_USER_ID=admin
FABRIC_CA_URL=http://localhost:7054

# ============================================
# Blockchain Configuration
# ============================================
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management

# ============================================
# IPFS Configuration
# ============================================
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http
IPFS_GATEWAY=http://localhost:8080

# ============================================
# JWT Configuration
# ============================================
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# ============================================
# Database Configuration (if using)
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cbc_commercialbank
DB_USER=postgres
DB_PASSWORD=postgres

# ============================================
# Logging Configuration
# ============================================
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=14

# ============================================
# CORS Configuration
# ============================================
CORS_ORIGIN=http://localhost:5173,http://localhost:80
CORS_CREDENTIALS=true

# ============================================
# Rate Limiting
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# Email Configuration (if using)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@coffeeblockchain.com
```

### Service-Specific Environment Variables

#### commercialbank (Port 3001)

```bash
ORGANIZATION_ID=commercialbank
ORGANIZATION_NAME=commercialbank
MSP_ID=commercialbankMSP
PORT=3001
FABRIC_NETWORK_CONFIG_PATH=../../network/organizations/peerOrganizations/commercialbank.coffee-export.com/connection-profile.json
```

#### National Bank (Port 3002)

```bash
ORGANIZATION_ID=national-bank
ORGANIZATION_NAME=National Bank
MSP_ID=NationalBankMSP
PORT=3002
FABRIC_NETWORK_CONFIG_PATH=../../network/organizations/peerOrganizations/nationalbank.coffee-export.com/connection-profile.json
```

#### ECTA (Port 3003)

```bash
ORGANIZATION_ID=ncat
ORGANIZATION_NAME=ECTA
MSP_ID=ECTAMSP
PORT=3003
FABRIC_NETWORK_CONFIG_PATH=../../network/organizations/peerOrganizations/ncat.coffee-export.com/connection-profile.json
```

#### Shipping Line (Port 3004)

```bash
ORGANIZATION_ID=shipping-line
ORGANIZATION_NAME=Shipping Line
MSP_ID=ShippingLineMSP
PORT=3004
FABRIC_NETWORK_CONFIG_PATH=../../network/organizations/peerOrganizations/shippingline.coffee-export.com/connection-profile.json
```

#### Custom Authorities (Port 3005)

```bash
ORGANIZATION_ID=custom-authorities
ORGANIZATION_NAME=Custom Authorities
MSP_ID=CustomAuthoritiesMSP
PORT=3005
FABRIC_NETWORK_CONFIG_PATH=../../network/organizations/peerOrganizations/customauthorities.coffee-export.com/connection-profile.json
```

---

## 4. Docker Compose Configuration

### Service Template

```yaml
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
    - FABRIC_NETWORK_CONFIG_PATH=/app/network/organizations/peerOrganizations/commercialbank.coffee-export.com/connection-profile.json
  ports:
    - "3001:3001"
  networks:
    - coffee-export
  depends_on:
    - ipfs
    - peer0.commercialbank.coffee-export.com
  volumes:
    - commercialbank-wallet:/app/wallet
    - ./network/organizations/peerOrganizations/commercialbank.coffee-export.com:/app/network/organizations/peerOrganizations/commercialbank.coffee-export.com
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

### Complete Services List

```yaml
services:
  commercialbank-api:
    # Port 3001, commercialbankMSP
    
  national-bank-api:
    # Port 3002, NationalBankMSP
    
  ncat-api:
    # Port 3003, ECTAMSP
    
  shipping-line-api:
    # Port 3004, ShippingLineMSP
    
  custom-authorities-api:
    # Port 3005, CustomAuthoritiesMSP
```

---

## 5. Root package.json Configuration

### Workspaces

```json
{
  "name": "cbc-apis",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "commercialbank",
    "national-bank",
    "ncat",
    "shipping-line",
    "custom-authorities",
    "shared"
  ],
  "scripts": {
    "build:all": "npm run build --workspaces",
    "start:all": "npm run start --workspaces",
    "dev:all": "npm run dev --workspaces",
    "lint:all": "npm run lint --workspaces",
    "test:all": "npm run test --workspaces"
  }
}
```

---

## 6. Directory Structure

### API Directory Structure

```
api/
├── commercialbank/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── Dockerfile
│   └── README.md
├── national-bank/
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   └── README.md
├── ncat/
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   └── README.md
├── shipping-line/
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   └── README.md
├── custom-authorities/
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   ├─��� Dockerfile
│   └── README.md
├── shared/
│   ├── src/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── middleware/
│   │   └── constants/
│   ├── package.json
│   └── tsconfig.json
├── package.json
├── tsconfig.base.json
└── jest.config.js
```

---

## 7. API Endpoints

### commercialbank API (Port 3001)

```
Base URL: http://localhost:3001/api

Authentication:
  POST   /auth/register
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout

Exports:
  POST   /exports
  GET    /exports
  GET    /exports/:id
  GET    /exports/status/:status
  GET    /exports/:id/history
  PUT    /exports/:id/complete
  PUT    /exports/:id/cancel
  PUT    /exports/:id/update

Documents:
  POST   /documents/upload
  GET    /documents/:id
  DELETE /documents/:id
```

### National Bank API (Port 3002)

```
Base URL: http://localhost:3002/api

Authentication:
  POST   /auth/register
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout

FX Approval:
  GET    /fx/pending
  GET    /fx/exports
  GET    /fx/exports/:id
  POST   /fx/approve
  POST   /fx/reject

Banking:
  GET    /banking/pending
  POST   /banking/approve
  POST   /banking/reject
```

### ECTA API (Port 3003)

```
Base URL: http://localhost:3003/api

Authentication:
  POST   /auth/register
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout

Quality:
  GET    /quality/pending
  GET    /quality/exports
  GET    /quality/exports/:id
  POST   /quality/certify
  POST   /quality/reject

Origin Certificates:
  POST   /origin-certificates/issue
  GET    /origin-certificates/:id
```

### Shipping Line API (Port 3004)

```
Base URL: http://localhost:3004/api

Authentication:
  POST   /auth/register
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout

Shipments:
  GET    /shipments/ready
  GET    /shipments/exports
  GET    /shipments/exports/:id
  POST   /shipments/schedule
  POST   /shipments/confirm
  POST   /shipments/notify-arrival
```

### Custom Authorities API (Port 3005)

```
Base URL: http://localhost:3005/api

Authentication:
  POST   /auth/register
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout

Export Customs:
  GET    /export-customs/pending
  POST   /export-customs/clear
  POST   /export-customs/reject

Import Customs:
  GET    /import-customs/pending
  POST   /import-customs/clear
  POST   /import-customs/reject
```

---

## 8. Chaincode MSP Mapping

### Fabric MSP Configuration

```
Organization: commercialbank
  MSP ID: commercialbankMSP
  Peer: peer0.commercialbank.coffee-export.com
  Port: 7051
  
Organization: National Bank
  MSP ID: NationalBankMSP
  Peer: peer0.nationalbank.coffee-export.com
  Port: 8051
  
Organization: ECTA
  MSP ID: ECTAMSP
  Peer: peer0.ncat.coffee-export.com
  Port: 9051
  
Organization: Shipping Line
  MSP ID: ShippingLineMSP
  Peer: peer0.shippingline.coffee-export.com
  Port: 10051
  
Organization: Custom Authorities
  MSP ID: CustomAuthoritiesMSP
  Peer: peer0.customauthorities.coffee-export.com
  Port: 11051
```

---

## 9. Port Allocation

### Service Ports

```
3001 → commercialbank API
3002 → National Bank API
3003 → ECTA API
3004 → Shipping Line API
3005 → Custom Authorities API
5001 → IPFS API
5173 → Frontend (Dev)
80   → Frontend (Production)
7050 → Orderer
7051 → commercialbank Peer
8051 → National Bank Peer
9051 → ECTA Peer
10051 → Shipping Line Peer
11051 → Custom Authorities Peer
5984 → CouchDB (commercialbank)
6984 → CouchDB (National Bank)
7984 → CouchDB (ECTA)
8984 → CouchDB (Shipping Line)
9984 → CouchDB (Custom Authorities)
```

---

## 10. Validation Checklist

### Frontend
- [ ] api.config.js has all 5 organizations
- [ ] App.jsx organization mapping is correct
- [ ] Login page shows correct organization options
- [ ] API calls use correct endpoints

### API Services
- [ ] All 5 directories exist: commercialbank, national-bank, ncat, shipping-line, custom-authorities
- [ ] Each has package.json with correct name
- [ ] Each has .env.example with correct ORGANIZATION_ID
- [ ] Each has Dockerfile

### Docker Compose
- [ ] 5 API services defined
- [ ] Correct ports (3001-3005)
- [ ] Correct environment variables
- [ ] Correct volume mounts

### Chaincode
- [ ] MSP IDs match configuration
- [ ] Peer names match configuration
- [ ] Channel name is coffeechannel

### Documentation
- [ ] README.md updated
- [ ] ARCHITECTURE.md updated
- [ ] API endpoints documented
- [ ] Startup instructions updated

---

## 11. Quick Reference

### Start All Services

```bash
# Development
cd api && npm run dev:all

# Production (Docker)
docker-compose up -d
```

### Access Services

```
Frontend:     http://localhost:5173 (dev) or http://localhost (prod)
commercialbank API:    http://localhost:3001
National Bank API:    http://localhost:3002
ECTA API:             http://localhost:3003
Shipping Line API:    http://localhost:3004
Custom Authorities:   http://localhost:3005
IPFS:                 http://localhost:5001
```

### Login Credentials

```
Organization: commercialbank
Organization: national-bank
Organization: ncat
Organization: shipping-line
Organization: custom-authorities
```

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Standardized
