# Codebase Overview

Complete guide to the Ethiopian Coffee Export Blockchain System codebase structure, components, and integrations.

---

## 📂 Directory Structure

```
coffee-export-blockchain/
├── .archive-backup-before-cleanup/    # Historical backups
├── .vscode/                           # VS Code settings
├── bin/                               # Binary executables
├── builders/                          # Fabric chaincode builders
├── cbc/                              # Consortium Blockchain (CBC) services
│   ├── frontend/                     # React + TypeScript UI
│   └── services/                     # Microservices
│       ├── commercial-bank/          # Commercial Bank service (Port 3002)
│       ├── custom-authorities/       # Customs service (Port 3005)
│       ├── ecta/                     # ECTA service (Port 3003)
│       ├── ecx/                      # ECX service (Port 3006)
│       ├── esw/                      # ESW integration service
│       ├── exporter-portal/          # Exporter portal (Port 3004)
│       ├── national-bank/            # National Bank service (Port 3005)
│       ├── shipping-line/            # Shipping service (Port 3007)
│       └── shared/                   # Shared libraries & database
├── chaincode/                        # Hyperledger Fabric chaincode
│   └── ecta/                         # ECTA chaincode (Port 3001)
├── coffee-export-gateway/            # API Gateway (Port 3000)
├── config/                           # Fabric network configuration
├── crypto-config/                    # Fabric cryptographic materials
├── docs/                             # Documentation
├── scripts/                          # Utility scripts
├── sdk/                              # Client SDKs
│   └── nodejs/                       # Node.js SDK
├── services/                         # Core services
│   └── blockchain-bridge/            # Fabric ↔ CBC sync (Port 3008)
├── tests/                            # Test suites
├── docker-compose-fabric.yml         # Fabric network
├── docker-compose-hybrid.yml         # Full hybrid system
└── README.md                         # Main documentation
```

---

## 🏗️ System Components

### 1. Frontend Layer

**Location:** `cbc/frontend/`  
**Technology:** React 18 + TypeScript + Material-UI  
**Port:** 5173 (dev), 80 (production via Nginx)

**Key Directories:**
```
cbc/frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── config/             # Configuration
│   └── services/           # API services
├── public/                 # Static assets
└── dist/                   # Production build
```

**Key Files:**
- `src/App.tsx` - Main application component
- `src/main.tsx` - Application entry point
- `src/config/api.config.ts` - API configuration
- `src/config/theme.config.enhanced.ts` - Theme configuration

---

### 2. API Gateway

**Location:** `coffee-export-gateway/`  
**Technology:** Node.js + Express  
**Port:** 3000

**Purpose:** Main entry point for all API requests, handles authentication, routing, and dual-write to PostgreSQL and Fabric.

**Key Files:**
```
coffee-export-gateway/
├── src/
│   ├── routes/              # API route definitions
│   │   ├── auth.routes.js
│   │   ├── exporter.routes.js
│   │   ├── exports.routes.js
│   │   ├── esw.routes.js
│   │   ├── certificates.routes.js
│   │   ├── ecta.routes.js
│   │   ├── statutory.routes.js
│   │   ├── shipment.routes.js
│   │   ├── customs.routes.js
│   │   ├── shipping.routes.js
│   │   ├── container.routes.js
│   │   └── vessel.routes.js
│   ├── services/            # Business logic
│   │   ├── fabric.js        # Fabric SDK integration
│   │   └── fabric-chaincode.js
│   ├── middleware/          # Express middleware
│   │   └── currency-validator.js
│   └── utils/               # Utility functions
│       ├── certificate-pdf.js
│       ├── invoice-pdf.js
│       └── logistics-pdf.js
├── server.js               # Main server file
├── package.json
└── Dockerfile
```

**Integration Points:**
- PostgreSQL (direct connection)
- Hyperledger Fabric (via Fabric SDK)
- Kafka (event publishing)
- Redis (caching)

---

### 3. Blockchain Bridge Service

**Location:** `services/blockchain-bridge/`  
**Technology:** TypeScript + Node.js  
**Port:** 3008

**Purpose:** Bidirectional synchronization between Hyperledger Fabric and PostgreSQL, event listening, and reconciliation.

**Key Files:**
```
services/blockchain-bridge/
├── src/
│   ├── index.ts                          # Main entry point
│   ├── services/
│   │   ├── fabric-event-listener.ts      # Listen to Fabric events
│   │   ├── data-sync-service.ts          # Sync CBC → Fabric
│   │   ├── reconciliation-service.ts     # Daily consistency checks
│   │   ├── kafka-producer.ts             # Publish events
│   │   ├── kafka-consumer.ts             # Consume events
│   │   └── health-check.ts               # Health monitoring
│   ├── clients/
│   │   ├── fabric-client.ts              # Fabric operations
│   │   ├── cbc-client.ts                 # CBC operations
│   │   └── redis-client.ts               # Redis operations
│   └── utils/
│       └── logger.ts                     # Logging utility
├── package.json
├── tsconfig.json
└── Dockerfile
```

**Key Responsibilities:**
1. Listen to Fabric chaincode events → Update PostgreSQL
2. Consume Kafka events from CBC → Write to Fabric
3. Daily reconciliation to ensure consistency
4. Retry failed syncs with exponential backoff
5. Dead letter queue for failed events

---

### 4. Hyperledger Fabric Chaincode

**Location:** `chaincode/ecta/`  
**Technology:** Node.js (Chaincode Server)  
**Port:** 3001

**Purpose:** Smart contracts for immutable ledger operations.

**Key Files:**
```
chaincode/ecta/
├── index.js                 # Chaincode entry point
├── server.js               # Chaincode server
├── customs-logistics.js    # Customs & logistics functions
├── package.json
└── Dockerfile
```

**Key Functions:**
- User registration and management
- Exporter profile management
- License issuance and revocation
- Certificate management
- Contract approval
- Shipment tracking
- Agency approvals
- Customs clearance

---

### 5. Microservices (CBC)

#### 5.1 ECTA Service
**Location:** `cbc/services/ecta/`  
**Port:** 3003  
**Responsibilities:**
- Exporter pre-registration approval
- License management
- Contract approval
- Quality certification
- Certificate issuance

#### 5.2 Commercial Bank Service
**Location:** `cbc/services/commercial-bank/`  
**Port:** 3002  
**Responsibilities:**
- Document verification
- Payment processing
- Banking services
- Exporter account management

#### 5.3 National Bank Service
**Location:** `cbc/services/national-bank/`  
**Port:** 3005  
**Responsibilities:**
- Foreign exchange (FX) approval ✅
- Export proceeds monitoring (basic) ✅
- Compliance monitoring ✅
- **MISSING:** Delinquency list management ❌
- **MISSING:** Export proceeds repatriation tracking ❌
- **MISSING:** FX rate management ❌
- **MISSING:** Exporter blacklist ❌

**See:** [NATIONAL-BANK-ENHANCEMENTS.md](../NATIONAL-BANK-ENHANCEMENTS.md) for detailed analysis.

#### 5.4 Customs Service
**Location:** `cbc/services/custom-authorities/`  
**Port:** 3005  
**Responsibilities:**
- Declaration processing
- Clearance management
- Duty calculation
- Risk assessment

#### 5.5 ECX Service
**Location:** `cbc/services/ecx/`  
**Port:** 3006  
**Responsibilities:**
- Contract verification
- Quality grading
- Warehouse receipts
- Trade settlement

#### 5.6 Shipping Line Service
**Location:** `cbc/services/shipping-line/`  
**Port:** 3007  
**Responsibilities:**
- Container tracking
- Vessel scheduling
- Bill of lading
- Logistics coordination

#### 5.7 Exporter Portal
**Location:** `cbc/services/exporter-portal/`  
**Port:** 3004  
**Responsibilities:**
- Exporter interface
- Export submission
- Document upload
- Status tracking

---

### 6. Shared Libraries

**Location:** `cbc/services/shared/`

**Key Components:**
```
cbc/services/shared/
├── database/
│   ├── init.sql                    # Database initialization
│   ├── pool.ts                     # Connection pooling
│   └── migrations/                 # Database migrations
│       ├── 001_create_ecta_preregistration_tables.sql
│       ├── 002_create_documents_table.sql
│       ├── 003_create_audit_log_table.sql
│       ├── 004_create_exports_table.sql
│       ├── 005_create_users_table.sql
│       ├── 006_fix_exports_status_values.sql
│       ├── 007_add_esw_integration.sql
│       ├── 008_add_organization_to_exports.sql
│       ├── 009_add_tin_to_exports.sql
│       ├── 011_create_universal_renewal_table.sql
│       ├── 002_add_sync_tables.sql
│       ├── 003_add_reconciliation_tables.sql
│       └── 004_add_phase4_tables.sql
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── monitoring.middleware.ts
├── services/
│   ├── email.service.ts
│   ├── monitoring.service.ts
│   └── websocket.service.ts
├── utils/
│   ├── logger.ts
│   └── env.validator.ts
├── api-endpoints.constants.ts
├── error-codes.ts
├── security.best-practices.ts
└── validation.schemas.ts
```

---

## 🗄️ Database Schema

**Database:** PostgreSQL 14  
**Name:** `coffee_export_db`

### Core Tables

#### Exporter Management
- `exporter_profiles` - Exporter information
- `exporter_documents` - Document storage
- `exporter_contacts` - Contact information
- `exporter_addresses` - Address information

#### License & Certification
- `export_licenses` - License records
- `quality_certificates` - Certificate records
- `certificate_inspections` - Inspection data

#### Export Management
- `exports` - Export transactions
- `export_status_history` - Status audit trail
- `export_documents` - Export documents
- `export_approvals` - Approval tracking
- `esw_submissions` - ESW submissions

#### Organizations
- `organizations` - All organizations (agencies, banks, exporters)
- `users` - User accounts

#### Customs & Logistics
- `customs_declarations` - Customs declarations
- `shipments` - Shipment tracking
- `containers` - Container tracking
- `vessels` - Vessel information

#### Blockchain Integration
- `sync_log` - Fabric ↔ CBC sync tracking
- `reconciliation_log` - Reconciliation runs
- `reconciliation_issues` - Unresolved conflicts

#### Audit & Compliance
- `preregistration_audit_log` - Audit trail
- `export_status_history` - Status changes

### Missing Tables (National Bank)
See [NATIONAL-BANK-ENHANCEMENTS.md](../NATIONAL-BANK-ENHANCEMENTS.md) for:
- `delinquent_exporters`
- `delinquency_history`
- `exporter_blacklist`
- `export_proceeds`
- `proceeds_transactions`
- `fx_rates`
- `fx_allocations`
- `fx_utilization`
- `compliance_violations`
- `exporter_compliance_scores`

---

## 🔗 Integration Points

### 1. Frontend ↔ API Gateway
- **Protocol:** REST API over HTTPS
- **Authentication:** JWT (access + refresh tokens)
- **Endpoints:** 12+ route groups

### 2. API Gateway ↔ PostgreSQL
- **Connection:** Direct via pg pool
- **Pattern:** Dual write (DB + Kafka)

### 3. API Gateway ↔ Fabric
- **SDK:** Fabric SDK for Node.js
- **Pattern:** Gateway with wallet-based identity
- **Operations:** submitTransaction, evaluateTransaction

### 4. Blockchain Bridge ↔ Fabric
- **Pattern:** Event listener (Fabric → CBC)
- **Events:** 12+ chaincode events monitored

### 5. Blockchain Bridge ↔ CBC
- **Pattern:** Kafka consumer (CBC → Fabric)
- **Topics:** 5+ Kafka topics

### 6. Kafka Event Streaming
- **Broker:** Apache Kafka + Zookeeper
- **Topics:**
  - `fabric.events` - Fabric chaincode events
  - `fabric.transactions` - Transaction records
  - `fabric.events.dlq` - Dead letter queue
  - `cbc.exporter.updates` - Exporter changes
  - `cbc.license.updates` - License changes
  - `cbc.certificate.issued` - Certificates
  - `cbc.inspection.completed` - Inspections
  - `cbc.approval.granted` - Approvals

### 7. Redis Caching
- **Port:** 6379
- **Use Cases:**
  - Session management
  - Rate limiting
  - Frequently accessed data

---

## 🔐 Security Components

### Authentication
- JWT tokens (access + refresh)
- Bcrypt password hashing
- Session management via Redis

### Authorization
- Role-based access control (RBAC)
- Organization-based permissions
- Route-level middleware

### Network Security
- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting (100 req/15min)
- Input validation (Zod schemas)

### Fabric Security
- X.509 certificate-based authentication
- MSP (Membership Service Provider)
- Channel-based access control

---

## 📊 Data Flow Patterns

### Write Operation
```
Frontend → API Gateway → PostgreSQL (write)
                      → Kafka (publish)
                      → Blockchain Bridge (consume)
                      → Fabric (invoke chaincode)
```

### Read Operation
```
Frontend → API Gateway → Redis (check cache)
                      → PostgreSQL (query if miss)
                      → Redis (update cache)
```

### Event-Driven Flow
```
Service A → PostgreSQL (update)
         → Kafka (publish)
         → Blockchain Bridge (consume)
         → Fabric (sync)
         → Event Listener (emit)
         → Kafka (publish)
         → Service B (consume)
```

---

## 🧪 Testing

### Test Files
```
tests/
├── test-hybrid-integration.js    # Integration tests
└── README.txt                    # Test documentation
```

### SDK Examples
```
sdk/nodejs/examples/
├── registration-flow.js          # Exporter registration
└── complete-export-flow.js       # End-to-end export
```

---

## 🚀 Deployment

### Docker Compose Files
- `docker-compose-fabric.yml` - Fabric network only
- `docker-compose-hybrid.yml` - Full hybrid system (production)

### Scripts
```
scripts/
├── create-channel-v2.bat         # Create Fabric channel
├── deploy-chaincode.bat          # Deploy chaincode
├── fabric-tools.bat              # Fabric utilities
├── preflight-check.bat           # Pre-deployment checks
├── test-chaincode.bat            # Test chaincode
└── test-couchdb.bat              # Test CouchDB
```

### Quick Start Scripts
- `START-ALL.bat` - Start all services
- `STOP-ALL.bat` - Stop all services
- `start-hybrid-system.bat` - Start hybrid system
- `setup-database.bat` - Initialize database
- `verify-setup.bat` - Verify installation

---

## 📝 Configuration Files

### Fabric Configuration
- `config/configtx.yaml` - Channel configuration
- `config/orderer.yaml` - Orderer configuration
- `crypto-config.yaml` - Cryptographic material

### Service Configuration
- `.env` files in each service directory
- `tsconfig.json` for TypeScript services
- `package.json` for dependencies

---

## 📚 Documentation Structure

```
docs/
├── CODEBASE.md                   # This file
├── DOCUMENTATION-INDEX.md        # Documentation index
├── README.md                     # Docs overview
├── api/                          # API documentation
├── architecture/                 # Architecture docs
│   ├── system-overview.md
│   ├── hybrid-architecture.md
│   ├── SYSTEM-COMPARISON.md
│   └── SYSTEM-DIAGRAMS.md
├── deployment/                   # Deployment guides
│   └── deployment-checklist.md
├── development/                  # Development guides
│   └── frontend-guide.md
├── implementation/               # Implementation guides
│   ├── HYBRID-SYSTEM-IMPLEMENTATION-GUIDE.md
│   ├── IMPLEMENTATION-CHECKLIST.md
│   └── QUICK-START-HYBRID.md
├── operations/                   # Operations guides
├── summary/                      # Project summaries
│   ├── DELIVERY-SUMMARY.md
│   ├── FINAL-SUMMARY.md
│   └── HYBRID-SYSTEM-SUMMARY.md
└── legacy/                       # Legacy documentation
```

---

## 🔍 Key Files Reference

### Root Level
- `README.md` - Main project documentation
- `CHANGELOG.md` - Version history
- `CONTRIBUTING.md` - Contribution guidelines
- `SYSTEM-INTEGRATIONS-ANALYSIS.md` - Integration analysis
- `NATIONAL-BANK-ENHANCEMENTS.md` - NBE missing features
- `SYSTEM-VERIFICATION-SUMMARY.md` - System verification
- `DEPLOYMENT-READY.md` - Deployment readiness
- `QUICK-DEPLOYMENT-GUIDE.md` - Quick deployment

### Configuration
- `.gitignore` - Git ignore rules
- `.dockerignore` - Docker ignore rules
- `docker-compose-hybrid.yml` - Production deployment

---

## 🎯 Service Ports Reference

| Service | Port | Technology | Status |
|---------|------|------------|--------|
| Frontend | 5173 | React + Vite | ✅ Ready |
| API Gateway | 3000 | Node.js + Express | ✅ Ready |
| Chaincode Server | 3001 | Node.js | ✅ Ready |
| Commercial Bank | 3002 | TypeScript | ✅ Ready |
| ECTA | 3003 | TypeScript | ✅ Ready |
| Exporter Portal | 3004 | TypeScript | ✅ Ready |
| National Bank | 3005 | TypeScript | 🟡 Partial |
| Customs | 3005 | TypeScript | ✅ Ready |
| ECX | 3006 | TypeScript | ✅ Ready |
| Shipping Line | 3007 | TypeScript | ✅ Ready |
| Blockchain Bridge | 3008 | TypeScript | ✅ Ready |
| PostgreSQL | 5432 | PostgreSQL 14 | ✅ Ready |
| Redis | 6379 | Redis 7 | ✅ Ready |
| Kafka | 9092/9093 | Apache Kafka | ✅ Ready |
| Zookeeper | 2181 | Apache Zookeeper | ✅ Ready |

---

## 🚧 Known Gaps & TODOs

### National Bank Service (Priority: HIGH)
See [NATIONAL-BANK-ENHANCEMENTS.md](../NATIONAL-BANK-ENHANCEMENTS.md) for:
- ❌ Delinquency list management
- ❌ Export proceeds repatriation tracking
- ❌ FX rate management
- ❌ Exporter blacklist
- ❌ Compliance violation tracking
- ❌ Compliance scoring system

**Estimated Effort:** 35 days

### Monitoring & Observability
- 🟡 Prometheus metrics (partial)
- 🟡 Grafana dashboards (planned)
- ❌ Distributed tracing (Jaeger)
- ❌ ELK stack integration

### API Documentation
- ❌ OpenAPI/Swagger specs
- ❌ Postman collections
- ❌ API versioning strategy

---

## 📖 Related Documentation

- [System Integrations Analysis](../SYSTEM-INTEGRATIONS-ANALYSIS.md)
- [National Bank Enhancements](../NATIONAL-BANK-ENHANCEMENTS.md)
- [System Architecture](architecture/system-overview.md)
- [Hybrid Architecture](architecture/hybrid-architecture.md)
- [Deployment Guide](../QUICK-DEPLOYMENT-GUIDE.md)

---

**Last Updated:** February 18, 2026  
**Version:** 1.0.0  
**Maintainer:** Development Team

