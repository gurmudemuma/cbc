# Coffee Export Consortium - System Architecture

## Overview
Enterprise blockchain platform for Ethiopian coffee export management using Hyperledger Fabric 2.5.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              React Frontend (Port 80)                        │  │
│  │  - Role-based dashboards                                     │  │
│  │  - Export workflow management                                │  │
│  │  - Document upload/verification                              │  │
│  │  - Real-time status tracking                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                            │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Commercial│  │ National │  │   ECTA   │  │   ECX    │          │
│  │Bank API  │  │Bank API  │  │   API    │  │   API    │          │
│  │Port 3001 │  │Port 3002 │  │Port 3003 │  │Port 3006 │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                                                     │
│  ┌──────────┐  ┌──────────┐                                       │
│  │Shipping  │  │ Custom   │                                       │
│  │Line API  │  │Auth API  │                                       │
│  │Port 3004 │  │Port 3005 │                                       │
│  └──────────┘  └──────────┘                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN LAYER                               │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              Hyperledger Fabric Network                    │   │
│  │                                                             │   │
│  │  Orderer (Port 7050)                                       │   │
│  │  ├─ Consensus: Raft                                        │   │
│  │  └─ Channel: coffeechannel                                 │   │
│  │                                                             │   │
│  │  Peer Organizations:                                       │   │
│  │  ├─ Commercial Bank (7051)  + CouchDB0 (5984)            │   │
│  │  ├─ National Bank (8051)    + CouchDB1 (6984)            │   │
│  │  ├─ ECTA (9051)             + CouchDB2 (7984)            │   │
│  │  ├─ Shipping Line (10051)   + CouchDB3 (8984)            │   │
│  │  ├─ Custom Auth (11051)     + CouchDB4 (9984)            │   │
│  │  └─ ECX (12051)             + CouchDB6 (11984)           │   │
│  │                                                             │   │
│  │  Chaincode: coffee-export v1.0                            │   │
│  │  ├─ Export management                                      │   │
│  │  ├─ FX retention tracking                                  │   │
│  │  ├─ Document verification                                  │   │
│  │  └─ Mode selection (Horizontal/Vertical)                  │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  PostgreSQL  │  │     IPFS     │  │    Redis     │            │
│  │  Port 5435   │  │  Port 5001   │  │  Port 6379   │            │
│  │              │  │              │  │              │            │
│  │ - User data  │  │ - Documents  │  │ - Cache      │            │
│  │ - Off-chain  │  │ - Files      │  │ - Sessions   │            │
│  │ - Metadata   │  │ - Images     │  │              │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Component Architecture

### 1. Frontend Layer

```
React Application (TypeScript)
├── Components
│   ├── Auth (Login, Register)
│   ├── Dashboard (Role-specific views)
│   ├── Export Management
│   ├── Document Upload
│   └── Status Tracking
├── Services
│   ├── API Client
│   ├── Authentication
│   └── WebSocket
├── State Management
│   ├── Context API
│   └── Local Storage
└── Routing
    └── React Router v6
```

**Technology Stack:**
- React 18
- TypeScript
- Material-UI / Tailwind CSS
- Axios for HTTP
- React Router

---

### 2. API Layer

```
Node.js Microservices (TypeScript)
├── Commercial Bank API (3001)
│   ├── Export creation
│   ├── LC management
│   └── Payment processing
├── National Bank API (3002)
│   ├── FX rate management
│   ├── Transaction approval
│   └── Compliance checks
├── ECTA API (3003)
│   ├── Pre-registration
│   ├── License issuance
│   └── Compliance verification
├── ECX API (3006)
│   ├── Coffee pricing
│   ├── Quality certification
│   └── Lot verification
├── Shipping Line API (3004)
│   ├── Booking management
│   ├── Shipment tracking
│   └── Bill of lading
└── Custom Authorities API (3005)
    ├── Customs clearance
    ├── Document verification
    └── Duty calculation

Shared Utilities:
├── Fabric Gateway
├── Database Pool
├── JWT Authentication
├── Input Validation
├── Error Handling
└── Logging
```

**Technology Stack:**
- Node.js 20
- TypeScript
- Express.js
- Fabric SDK
- PostgreSQL Client
- IPFS HTTP Client

---

### 3. Blockchain Layer

```
Hyperledger Fabric 2.5.14
├── Network Components
│   ├── Orderer (Raft consensus)
│   ├── 6 Peer Organizations
│   ├── 1 Channel (coffeechannel)
│   └── 6 CouchDB instances
├── Chaincode (Go)
│   ├── Export Management
│   │   ├── CreateExport
│   │   ├── UpdateExportStatus
│   │   ├── GetExport
│   │   └── GetExportsByExporter
│   ├── FX Retention
│   │   ├── CalculateRetention
│   │   ├── TrackRepatriation
│   │   └── CalculatePenalties
│   ├── Mode Selection
│   │   ├── SelectExportMode
│   │   ├── ValidateMode
│   │   └── GetModeUsageReport
│   └── Document Management
│       ├── InitializeChecklist
│       ├── UploadDocument
│       └── VerifyDocument
└── State Database
    └── CouchDB (JSON documents)
```

**Technology Stack:**
- Hyperledger Fabric 2.5.14
- Go 1.21
- CouchDB 3.3
- Docker containers

---

### 4. Data Layer

```
PostgreSQL Database
├── Tables
│   ├── users
│   ├── organizations
│   ├── preregistrations
│   ├── license_applications
│   ├── documents
│   ├── audit_logs
│   └── notifications
└── Features
    ├── Connection pooling
    ├── Transactions
    ├── Indexes
    └── Migrations

IPFS Storage
├── Document storage
├── Content addressing
├── Distributed storage
└── Gateway access

Redis Cache
├── Session management
├── API response cache
├── Rate limiting
└── Temporary data
```

---

## Network Topology

```
┌─────────────────────────────────────────────────────────────┐
│                  Docker Network                             │
│              coffee-export-network                          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Orderer  │  │  Peer0   │  │  Peer1   │  │  Peer2   │  │
│  │  7050    │  │  7051    │  │  8051    │  │  9051    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │              │         │
│       └─────────────┴──────────────┴──────────────┘         │
│                          │                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Peer3   │  │  Peer4   │  │  Peer5   │                 │
│  │  10051   │  │  11051   │  │  12051   │                 │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │
│       │             │              │                        │
│       └─────────────┴──────────────┘                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │PostgreSQL│  │   IPFS   │  │  Redis   │                 │
│  │  5435    │  │  5001    │  │  6379    │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Export Creation Flow

```
1. User (Frontend)
   │
   ├─► Commercial Bank API (3001)
   │   │
   │   ├─► Validate input
   │   ├─► Check authentication
   │   ├─► Store in PostgreSQL
   │   │
   │   └─► Fabric Gateway
   │       │
   │       └─► Chaincode: CreateExport
   │           │
   │           ├─► Validate business rules
   │           ├─► Store in CouchDB
   │           └─► Emit event
   │
   └─► Response to Frontend
```

### Document Upload Flow

```
1. User uploads document
   │
   ├─► API Service
   │   │
   │   ├─► Validate file
   │   ├─► Upload to IPFS
   │   │   └─► Returns CID
   │   │
   │   └─► Fabric Gateway
   │       │
   │       └─► Chaincode: UploadDocument
   │           │
   │           ├─► Store CID + metadata
   │           └─► Update checklist
   │
   └─► Response with CID
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
│                                                             │
│  1. Network Security                                        │
│     ├─ Docker network isolation                            │
│     ├─ TLS encryption (Fabric)                             │
│     └─ Firewall rules                                      │
│                                                             │
│  2. Application Security                                    │
│     ├─ JWT authentication                                   │
│     ├─ Role-based access control                           │
│     ├─ Input validation                                     │
│     ├─ SQL injection prevention                             │
│     └─ XSS protection                                       │
│                                                             │
│  3. Blockchain Security                                     │
│     ├─ MSP (Membership Service Provider)                   │
│     ├─ Certificate-based identity                          │
│     ├─ Endorsement policies                                │
│     └─ Chaincode access control                            │
│                                                             │
│  4. Data Security                                           │
│     ├─ Encrypted secrets (Docker)                          │
│     ├─ Environment variables                               │
│     ├─ Database encryption                                 │
│     └─ IPFS content addressing                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
Production Environment

┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                            │
│                   (Nginx/HAProxy)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐       ┌───────▼────────┐
│   Server 1     │       │   Server 2     │
│                │       │                │
│  - Frontend    │       │  - Frontend    │
│  - APIs        │       │  - APIs        │
│  - Peers       │       │  - Peers       │
└────────────────┘       └────────────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Database Cluster      │
        │  - PostgreSQL Primary   │
        │  - PostgreSQL Replica   │
        │  - Redis Cluster        │
        └─────────────────────────┘
```

---

## Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 18.x |
| | TypeScript | 5.x |
| | Vite | 5.x |
| **Backend** | Node.js | 20.x |
| | Express | 4.x |
| | TypeScript | 5.x |
| **Blockchain** | Hyperledger Fabric | 2.5.14 |
| | Go | 1.21 |
| | CouchDB | 3.3 |
| **Database** | PostgreSQL | 15 |
| | Redis | 7.x |
| **Storage** | IPFS | 0.32 |
| **Container** | Docker | 20+ |
| | Docker Compose | 2.0+ |

---

## Port Allocation

| Service | Port | Protocol |
|---------|------|----------|
| **Frontend** | 80 | HTTP |
| **APIs** |
| Commercial Bank | 3001 | HTTP |
| National Bank | 3002 | HTTP |
| ECTA | 3003 | HTTP |
| Shipping Line | 3004 | HTTP |
| Custom Authorities | 3005 | HTTP |
| ECX | 3006 | HTTP |
| **Blockchain** |
| Orderer | 7050 | gRPC |
| Peer0 (Commercial) | 7051 | gRPC |
| Peer1 (National) | 8051 | gRPC |
| Peer2 (ECTA) | 9051 | gRPC |
| Peer3 (Shipping) | 10051 | gRPC |
| Peer4 (Custom) | 11051 | gRPC |
| Peer5 (ECX) | 12051 | gRPC |
| **Databases** |
| PostgreSQL | 5435 | TCP |
| CouchDB0-6 | 5984-11984 | HTTP |
| Redis | 6379 | TCP |
| **Storage** |
| IPFS API | 5001 | HTTP |
| IPFS Gateway | 8080 | HTTP |

---

## Scalability Considerations

1. **Horizontal Scaling**
   - API services can be replicated
   - Load balancer distributes traffic
   - Stateless design

2. **Database Scaling**
   - PostgreSQL read replicas
   - Redis cluster mode
   - CouchDB sharding

3. **Blockchain Scaling**
   - Add more peers per organization
   - Multiple channels for isolation
   - Chaincode optimization

---

## Monitoring & Observability

```
Monitoring Stack
├── Prometheus (Metrics)
│   ├── API metrics
│   ├── Blockchain metrics
│   └── System metrics
├── Grafana (Visualization)
│   ├── Dashboards
│   └── Alerts
└── ELK Stack (Logs)
    ├── Elasticsearch
    ├── Logstash
    └── Kibana
```

---

**Document Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** Production Ready
