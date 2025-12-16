# Coffee Export Consortium - Complete Codebase Analysis

**Generated**: 2025-12-12  
**Total Files**: 600+  
**Analysis Status**: In Progress

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Chaincode (Smart Contracts)](#chaincode)
4. [API Services](#api-services)
5. [Frontend Application](#frontend)
6. [Network Configuration](#network-configuration)
7. [Database Schema](#database-schema)
8. [Security & Authentication](#security)
9. [Deployment & DevOps](#deployment)
10. [File Structure Map](#file-structure)

---

## 1. System Overview

### Technology Stack
- **Blockchain**: Hyperledger Fabric 2.5
- **Backend**: Node.js 18+ with TypeScript
- **Frontend**: React 18
- **Databases**: PostgreSQL 15 + CouchDB (state DB)
- **Storage**: IPFS for documents
- **Caching**: Redis
- **Container**: Docker & Docker Compose

### Organizations (6 Total)
1. **Commercial Bank** - Port 3001 - Exporter financing
2. **National Bank** - Port 3002 - FX and regulatory
3. **ECTA** - Port 3003 - Exporter registration & compliance
4. **ECX** - Port 3004 - Coffee quality & pricing
5. **Shipping Line** - Port 3005 - Logistics
6. **Custom Authorities** - Port 3006 - Customs clearance

---

## 2. Architecture Layers

### Layer 1: Blockchain Network (Hyperledger Fabric)
```
Orderer (Raft consensus)
├── Channel: coffee-export-channel
├── Chaincode: coffee-export (v1.0)
├── Chaincode: user-management (v1.0)
└── State DB: CouchDB (per peer)
```

### Layer 2: API Services (Microservices)
```
Each Organization API
├── Express.js server
├── Fabric Gateway SDK
├── PostgreSQL connection
├── IPFS client
├── Redis cache
└── WebSocket support
```

### Layer 3: Frontend (React SPA)
```
React 18 Application
├── Authentication
├── Dashboard
├── Export Management
├── Document Upload
└── Real-time Updates (WebSocket)
```

### Layer 4: Infrastructure
```
Docker Compose
├── 7 Peer nodes (1 per org + orderer)
├── 7 CouchDB instances
├── 1 PostgreSQL
├── 1 IPFS node
├── 1 Redis
└── 6 API services
```

---

## 3. Chaincode (Smart Contracts)

### 3.1 Coffee Export Chaincode

**Location**: `/chaincode/coffee-export/`

**Main Contract**: `contract.go`
```go
type CoffeeExportContract struct {
    contractapi.Contract
}
```

**Data Structures**:
```go
type ExportRequest struct {
    ExportID        string
    ExporterID      string
    CoffeeType      string
    Quantity        int
    Destination     string
    EstimatedValue  int
    Status          string
    CreatedAt       string
}
```

**Functions**:
- `CreateExport(exportData)` - Create new export request
- `GetExport(exportID)` - Retrieve export by ID
- `GetAllExports()` - List all exports
- `UpdateExportStatus(exportID, status)` - Update status

**Additional Files**:
- `validation.go` - Input validation
- `helper_functions.go` - Utility functions
- `events.go` - Event emission
- `fx_mrp_functions.go` - FX and MRP calculations
- `mode_selection_functions.go` - Mode selection logic
- `notification_functions.go` - Notification handling
- `reporting_functions.go` - Reporting functions

### 3.2 User Management Chaincode

**Location**: `/chaincode/user-management/`

**Purpose**: User authentication and authorization on blockchain

**Main Contract**: `contract.go`
```go
type UserManagementContract struct {
    contractapi.Contract
}
```

---

## 4. API Services

### 4.1 Commercial Bank API

**Location**: `/apis/commercial-bank/`  
**Port**: 3001  
**Purpose**: Exporter financing and export request management

**Key Routes**:
- `/api/auth/login` - Authentication
- `/api/exports` - Export CRUD operations
- `/api/quality` - Quality management
- `/api/exporter/*` - Exporter-specific endpoints
- `/api/exporter-auth` - Exporter authentication
- `/api/exporter-export` - Exporter export management
- `/api/exporter-profile` - Exporter profile
- `/api/exporter-preregistration` - Preregistration

**Main Entry**: `src/index.ts`

**Key Services**:
- Fabric Gateway connection
- PostgreSQL queries
- IPFS document storage
- WebSocket notifications

### 4.2 National Bank API

**Location**: `/apis/national-bank/`  
**Port**: 3002  
**Purpose**: Foreign exchange and regulatory oversight

**Key Routes**:
- `/api/auth/login`
- `/api/fx-rates` - FX rate management
- `/api/approvals` - Transaction approvals

### 4.3 ECTA API

**Location**: `/apis/ecta/`  
**Port**: 3003  
**Purpose**: Exporter registration and compliance verification

**Key Routes**:
- `/api/preregistration` - Exporter preregistration
- `/api/compliance/verify` - Compliance verification
- `/api/license` - License management

**Database Tables**:
- `preregistration_applications`
- `license_applications`
- `compliance_records`

### 4.4 ECX API

**Location**: `/apis/ecx/`  
**Port**: 3004  
**Purpose**: Coffee quality certification and market pricing

**Key Routes**:
- `/api/coffee/prices` - Market prices
- `/api/quality/certify` - Quality certification
- `/api/grades` - Coffee grades

### 4.5 Shipping Line API

**Location**: `/apis/shipping-line/`  
**Port**: 3005  
**Purpose**: Shipping logistics and tracking

**Key Routes**:
- `/api/bookings` - Shipping bookings
- `/api/tracking/:id` - Shipment tracking
- `/api/containers` - Container management

### 4.6 Custom Authorities API

**Location**: `/apis/custom-authorities/`  
**Port**: 3006  
**Purpose**: Customs clearance and document verification

**Key Routes**:
- `/api/clearance` - Customs clearance
- `/api/documents/:id` - Document verification
- `/api/inspections` - Inspection records

### 4.7 Shared API Components

**Location**: `/apis/shared/`

**Key Modules**:
- `exportService.ts` - Export business logic
- `userService.ts` - User management
- `auditService.ts` - Audit logging
- `ipfs.service.ts` - IPFS integration
- `email.service.ts` - Email notifications
- `websocket.service.ts` - Real-time updates
- `cache.service.ts` - Redis caching
- `monitoring.service.ts` - Metrics & monitoring
- `resilience.service.ts` - Circuit breaker, retry
- `security.best-practices.ts` - Security middleware
- `validation.schemas.ts` - Input validation
- `password.validator.ts` - Password strength
- `input.sanitizer.ts` - XSS prevention

**Middleware**:
- `auth.ts` - JWT authentication
- `error-handler.middleware.ts` - Error handling
- `request-id.middleware.ts` - Request tracking

**Database**:
- `database/init.sql` - Initial schema
- `database/migrations/` - Schema migrations

---

## 5. Frontend Application

**Location**: `/frontend/`  
**Port**: 3000  
**Framework**: React 18 with Create React App

### 5.1 Structure
```
frontend/
├── public/
│   ├── index.html
│   └── coffee-icon.svg
├── src/
│   ├── index.js - Entry point
│   ├── App.js - Main component
│   ├── App.tsx - TypeScript version
│   ├── components/ - Reusable components
│   ├── pages/ - Page components
│   ├── services/ - API clients
│   ├── contexts/ - React contexts
│   ├── hooks/ - Custom hooks
│   ├── types/ - TypeScript types
│   ├── utils/ - Utility functions
│   ├── styles/ - CSS files
│   └── config/ - Configuration
└── package.json
```

### 5.2 Key Features
- User authentication (JWT)
- Export request management
- Document upload to IPFS
- Real-time notifications (WebSocket)
- Multi-organization support
- Responsive design

### 5.3 Configuration
- `.env` - Environment variables
- `tsconfig.json` - TypeScript config
- `vite.config.js` - Build config

---

## 6. Network Configuration

### 6.1 Fabric Network

**Location**: `/network/`

**Key Files**:
- `configtx/configtx.yaml` - Channel configuration
- `crypto-config.yaml` - Cryptographic material
- `docker/docker-compose.yaml` - Network containers
- `.env` - Network environment variables

**Organizations**:
```yaml
Organizations:
  - CommercialBankMSP
  - NationalBankMSP
  - ECTAMSP
  - ECXMSP
  - ShippingLineMSP
  - CustomAuthoritiesMSP
  - OrdererMSP
```

**Channel**: `coffee-export-channel`

**Consensus**: Raft (via Orderer)

### 6.2 Cryptographic Material

**Location**: `/network/organizations/`

```
organizations/
├── peerOrganizations/
│   ├── commercialbank.coffee-export.com/
│   ├── nationalbank.coffee-export.com/
│   ├── ecta.coffee-export.com/
│   ├── ecx.coffee-export.com/
│   ├── shippingline.coffee-export.com/
│   └── custom-authorities.coffee-export.com/
└── ordererOrganizations/
    └── coffee-export.com/
```

Each contains:
- `ca/` - Certificate Authority
- `msp/` - Membership Service Provider
- `peers/` - Peer certificates
- `users/` - User certificates

### 6.3 Network Scripts

**Location**: `/network/scripts/`

**Key Scripts**:
- `create-channel.sh` - Create channel
- `deployCC.sh` - Deploy chaincode
- `setAnchorPeer.sh` - Set anchor peers
- `envVar.sh` - Environment variables
- `health-check.sh` - Network health

---

## 7. Database Schema

### 7.1 PostgreSQL Tables

**Database**: `coffee_export_db`

**Tables**:

1. **preregistration_applications**
   - Application data for exporter registration
   - Status tracking
   - Document references

2. **license_applications**
   - Export license applications
   - Approval workflow
   - Validity periods

3. **documents**
   - Document metadata
   - IPFS hashes
   - Document types
   - Upload timestamps

4. **audit_log**
   - All system actions
   - User tracking
   - Timestamp
   - Action details

5. **users**
   - User credentials
   - Roles and permissions
   - Organization mapping

6. **exports**
   - Off-chain export data
   - Cached blockchain data
   - Search optimization

### 7.2 CouchDB (State Database)

**Purpose**: Blockchain state storage per peer

**Databases**:
- One per chaincode per channel
- `coffee-export-channel_coffee-export`
- `coffee-export-channel_user-management`

**Documents**: JSON representations of blockchain state

---

## 8. Security & Authentication

### 8.1 Authentication Flow

```
User Login
  ↓
API validates credentials
  ↓
Check PostgreSQL users table
  ↓
Generate JWT token (24h expiry)
  ↓
Return token to client
  ↓
Client includes token in Authorization header
  ↓
API validates JWT on each request
```

### 8.2 Security Features

**Implemented**:
- JWT authentication
- Password hashing (bcrypt)
- Rate limiting (100 req/15min)
- Input sanitization (XSS prevention)
- SQL injection prevention (parameterized queries)
- CORS configuration
- TLS encryption (production)
- Secret management (Docker secrets)
- Audit logging

**Middleware Stack**:
```
Request
  ↓
CORS
  ↓
Rate Limiter
  ↓
Request ID
  ↓
Body Parser
  ↓
Input Sanitizer
  ↓
JWT Validator
  ↓
Route Handler
  ↓
Error Handler
  ↓
Response
```

### 8.3 Blockchain Security

- Certificate-based identity (X.509)
- Mutual TLS between peers
- Channel-based access control
- Endorsement policies
- Private data collections (if needed)

---

## 9. Deployment & DevOps

### 9.1 Docker Compose Services

**Main File**: `docker-compose.yml`

**Services** (20+ containers):
1. `postgres` - PostgreSQL database
2. `ipfs` - IPFS node
3. `redis` - Redis cache
4. `orderer.coffee-export.com` - Orderer node
5. `peer0.commercialbank...` - Commercial Bank peer
6. `peer0.nationalbank...` - National Bank peer
7. `peer0.ecta...` - ECTA peer
8. `peer0.ecx...` - ECX peer
9. `peer0.shippingline...` - Shipping Line peer
10. `peer0.custom-authorities...` - Custom Authorities peer
11. `couchdb0-6` - CouchDB instances (7 total)
12. `commercial-bank-api` - Commercial Bank API
13. `national-bank-api` - National Bank API
14. `ecta-api` - ECTA API
15. `ecx-api` - ECX API
16. `shipping-line-api` - Shipping Line API
17. `custom-authorities-api` - Custom Authorities API
18. `frontend` - React frontend

### 9.2 Deployment Scripts

**Location**: `/scripts/`

**Key Scripts**:
- `start.sh` - Start entire system
- `stop.sh` - Stop all services
- `deploy.sh` - Production deployment
- `cleanup-system.sh` - Clean restart
- `generate-strong-secrets.sh` - Generate secrets
- `start-apis.sh` - Start API services
- `prebuild-chaincodes.sh` - Build chaincodes

### 9.3 Environment Files

- `.env` - Root environment
- `.env.production` - Production config
- `apis/*/. env` - Per-service config
- `frontend/.env` - Frontend config
- `network/.env` - Network config

### 9.4 Monitoring

**Prometheus**: Metrics collection (port 9090)
**Grafana**: Visualization (port 3001)

**Metrics**:
- API response times
- Transaction throughput
- Error rates
- Resource utilization
- Blockchain metrics

---

## 10. File Structure Map

### Root Level
```
cbc/
├── .env - Environment variables
├── .gitignore - Git ignore rules
├── package.json - Root dependencies
├── docker-compose.yml - Main orchestration
├── docker-compose.production.yml - Production config
├── LICENSE - MIT License
├── README.md - Project documentation
├── CHANGELOG.md - Version history
├── CONTRIBUTING.md - Contribution guidelines
├── SECURITY.md - Security policy
└── INDEX.md - Documentation index
```

### Directories
```
├── apis/ - API microservices
│   ├── commercial-bank/
│   ├── national-bank/
│   ├── ecta/
│   ├── ecx/
│   ├── shipping-line/
│   ├── custom-authorities/
│   └── shared/ - Shared utilities
├── chaincode/ - Smart contracts
│   ├── coffee-export/
│   └── user-management/
├── frontend/ - React application
├── network/ - Fabric network config
│   ├── configtx/
│   ├── crypto-config/
│   ├── docker/
│   ├── organizations/
│   └── scripts/
├── scripts/ - Deployment scripts
├── docs/ - Documentation
├── config/ - Configuration files
├── secrets/ - Secret files (gitignored)
├── logs/ - Log files
├── bin/ - Fabric binaries
├── k8s/ - Kubernetes manifests
└── monitoring/ - Monitoring configs
```

---

## Analysis Status

✅ **Completed**:
- System overview
- Architecture layers
- Chaincode analysis
- API services structure
- Frontend structure
- Network configuration
- Database schema
- Security analysis
- Deployment overview
- File structure mapping

⏳ **Pending Deep Dive**:
- Individual API route handlers
- Frontend component details
- Chaincode business logic details
- Database query optimization
- Performance tuning
- Integration test coverage

---

**Next Steps**: Ready for detailed implementation analysis of specific components.
