# Ethiopian Coffee Export - Hybrid Blockchain System Architecture

## Executive Summary

This document describes the consolidated hybrid blockchain architecture combining:
- **Hyperledger Fabric** - Immutable distributed ledger for transaction records
- **PostgreSQL Consortium Blockchain (CBC)** - Regulatory compliance and data persistence
- **Blockchain Bridge** - Real-time synchronization layer
- **Event Streaming** - Kafka-based inter-service communication

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Web Portal   │  │ Mobile App   │  │ Agency Portal│              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼──────────────────┼──────────────────┼──────────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ HTTPS/REST
┌─────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Unified API Gateway (Port 3000)                              │  │
│  │  - Authentication & Authorization                             │  │
│  │  - Request Routing                                            │  │
│  │  - Rate Limiting                                              │  │
│  │  - Cross-System Validation                                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │                                              │
          ├──────────────────────────────────────────────┤
          │                                              │
┌─────────▼──────────────────────┐    ┌─────────────────▼─────────────┐
│  HYPERLEDGER FABRIC LAYER      │    │  CBC CONSORTIUM LAYER          │
│  ┌──────────────────────────┐  │    │  ┌──────────────────────────┐ │
│  │ Chaincode (Smart Contract)│  │    │  │ PostgreSQL Database      │ │
│  │ - 100+ Functions          │  │    │  │ - Regulatory Data        │ │
│  │ - Immutable Records       │  │    │  │ - Compliance Records     │ │
│  │ - Transaction History     │  │    │  │ - Audit Logs             │ │
│  └──────────────────────────┘  │    │  └──────────────────────────┘ │
│  ┌──────────────────────────┐  │    │  ┌──────────────────────────┐ │
│  │ Fabric Network           │  │    │  │ Microservices            │ │
│  │ - Orderer (Raft)         │  │    │  │ - ECTA (3001)            │ │
│  │ - Peers (ECTA, Bank, NBE)│  │    │  │ - Commercial Bank (3002) │ │
│  │ - CouchDB State DB       │  │    │  │ - National Bank (3003)   │ │
│  │ - Fabric CA              │  │    │  │ - Customs (3004)         │ │
│  └──────────────────────────┘  │    │  │ - ECX (3005)             │ │
└────────────┬───────────────────┘    │  │ - Shipping (3007)        │ │
             │                        │  │ - ESW (3008)             │ │
             │                        │  └──────────────────────────┘ │
             │                        └────────────┬───────────────────┘
             │                                     │
             └──────────────┬──────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                  INTEGRATION LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Blockchain Bridge Service (Port 3008)                         │ │
│  │  - Event Listener (Fabric → CBC)                               │ │
│  │  - Data Sync Service (CBC → Fabric)                            │ │
│  │  - Conflict Resolution                                         │ │
│  │  - Retry Mechanism                                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Apache Kafka Event Streaming                                  │ │
│  │  Topics:                                                        │ │
│  │  - fabric.transactions                                         │ │
│  │  - cbc.approvals                                               │ │
│  │  - cbc.certificates                                            │ │
│  │  - cbc.compliance                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Reconciliation Service                                        │ │
│  │  - Periodic Consistency Checks                                 │ │
│  │  - Mismatch Detection                                          │ │
│  │  - Automatic Correction                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## System Components

### 1. Hyperledger Fabric Layer (Immutable Ledger)

**Purpose:** Source of truth for all transactions and state changes

**Responsibilities:**
- User registration and identity management
- Export workflow state machine
- Contract creation and approvals
- Certificate issuance records
- Payment transaction records
- Shipment status tracking
- Customs clearance records
- Complete audit trail

**Technology Stack:**
- Hyperledger Fabric 2.x
- CouchDB for state database
- Fabric CA for identity management
- Node.js chaincode

**Key Features:**
- Immutability - Records cannot be altered
- Distributed consensus - Multi-party agreement
- Smart contracts - Automated business logic
- Event emission - Real-time notifications

### 2. CBC Consortium Layer (Regulatory Compliance)

**Purpose:** Detailed regulatory data and compliance records

**Responsibilities:**
- Exporter profile details (capital, licenses, certifications)
- Laboratory certification and inspection records
- Coffee taster qualifications and employment
- Competence certificate details
- Quality inspection results (cupping scores, defects)
- Sales contract detailed terms
- ESW agency-specific approvals
- Document storage and verification

**Technology Stack:**
- PostgreSQL 14+
- TypeScript microservices
- Express.js REST APIs
- Shared data models

**Key Features:**
- Relational data model - Complex queries
- ACID transactions - Data consistency
- Full-text search - Document retrieval
- Flexible schema - Regulatory changes

### 3. Blockchain Bridge Service (Integration Layer)

**Purpose:** Synchronize data between Fabric and CBC systems

**Components:**

#### a. Event Listener Service
```typescript
// Listens to Fabric chaincode events
// Forwards to appropriate CBC services
```

**Responsibilities:**
- Subscribe to Fabric chaincode events
- Parse event data
- Route to appropriate CBC service
- Handle failures with retry logic

#### b. Data Sync Service
```typescript
// Synchronizes CBC data to Fabric
// Ensures consistency
```

**Responsibilities:**
- Monitor CBC database changes
- Update Fabric ledger when needed
- Conflict resolution
- Maintain sync status

#### c. Reconciliation Service
```typescript
// Periodic consistency checks
// Detects and corrects mismatches
```

**Responsibilities:**
- Daily consistency audits
- Mismatch detection
- Alert generation
- Automatic/manual correction

### 4. Event Streaming Layer (Kafka)

**Purpose:** Decouple services and enable real-time communication

**Topics:**
- `fabric.transactions` - All Fabric transactions
- `fabric.events` - Chaincode events
- `cbc.exporter.updates` - Exporter profile changes
- `cbc.license.updates` - License status changes
- `cbc.certificate.issued` - Certificate issuances
- `cbc.inspection.completed` - Quality inspections
- `cbc.approval.granted` - Agency approvals
- `system.reconciliation` - Sync status updates

**Benefits:**
- Guaranteed delivery
- Event replay capability
- Audit trail
- Scalability

### 5. Unified API Gateway

**Purpose:** Single entry point for all client requests

**Responsibilities:**
- Authentication (JWT)
- Authorization (RBAC)
- Request routing
- Rate limiting
- Cross-system validation
- Response aggregation
- Caching

**Endpoints:**
- `/api/v1/exporter/*` - Exporter operations
- `/api/v1/shipment/*` - Shipment workflow
- `/api/v1/certificate/*` - Certificate management
- `/api/v1/esw/*` - Export Single Window
- `/api/v1/customs/*` - Customs operations
- `/api/v1/compliance/*` - Compliance checks

## Data Flow Patterns

### Pattern 1: Exporter Registration

```
1. Client → API Gateway: POST /api/v1/exporter/register
2. API Gateway → Fabric: RegisterUser (immutable record)
3. Fabric → Event: UserRegistered
4. Bridge → Kafka: Publish to fabric.transactions
5. Bridge → CBC: Create exporter profile (detailed data)
6. CBC → Kafka: Publish to cbc.exporter.updates
7. API Gateway → Client: Success response
```

### Pattern 2: License Issuance

```
1. ECTA Officer → API Gateway: POST /api/v1/license/issue
2. API Gateway → CBC: Create license record (regulatory details)
3. CBC → Kafka: Publish to cbc.license.updates
4. Bridge → Fabric: IssueLicense (immutable record)
5. Fabric → Event: LicenseIssued
6. Bridge → Kafka: Publish to fabric.events
7. Reconciliation: Verify consistency
8. API Gateway → Client: Success response
```

### Pattern 3: Quality Certificate Request

```
1. Exporter → API Gateway: POST /api/v1/certificate/request
2. API Gateway: Validate exporter has valid license (CBC check)
3. API Gateway: Validate laboratory certified (CBC check)
4. API Gateway: Validate taster qualified (CBC check)
5. API Gateway → Fabric: RequestCertificate (immutable record)
6. Fabric → Event: CertificateRequested
7. Bridge → CBC: Create certificate request (detailed data)
8. Agency → CBC: Complete inspection (cupping scores, defects)
9. CBC → Kafka: Publish to cbc.inspection.completed
10. Bridge → Fabric: IssueCertificate (immutable record)
11. Fabric → Event: CertificateIssued
12. API Gateway → Client: Certificate PDF
```

### Pattern 4: ESW Submission

```
1. Exporter → API Gateway: POST /api/v1/esw/submit
2. API Gateway → Fabric: SubmitESWRequest (immutable record)
3. Fabric → Event: ESWSubmitted
4. Bridge → CBC: Create ESW submission
5. CBC → Multiple Agencies: Notify for approval
6. Each Agency → CBC: Approve/Reject
7. CBC → Kafka: Publish to cbc.approval.granted
8. Bridge → Fabric: UpdateESWStatus (immutable record)
9. Reconciliation: Verify all approvals synced
10. API Gateway → Client: ESW status
```

## Data Ownership & Source of Truth

### Fabric is Source of Truth For:
- User identity and authentication
- Transaction history
- State transitions (pending → approved → completed)
- Approval timestamps
- Payment records
- Shipment status
- Certificate issuance records

### CBC is Source of Truth For:
- Exporter profile details (capital, address, contact)
- Laboratory certification details
- Taster qualifications
- Competence certificate details
- Quality inspection results (cupping scores)
- Sales contract terms
- ESW agency-specific requirements
- Document storage

### Shared Responsibility (Must Sync):
- Exporter status (active/suspended/revoked)
- License validity
- Certificate validity
- Compliance status

## Synchronization Strategy

### Real-Time Sync (Event-Driven)
- User registration
- License issuance/revocation
- Certificate issuance
- Payment verification
- Customs clearance
- Shipment status updates

### Batch Sync (Scheduled)
- Exporter profile updates
- Laboratory inspection reports
- Quality inspection results
- Document metadata

### On-Demand Sync (API-Triggered)
- Compliance status checks
- Certificate verification
- License validation
- Exporter qualification status

## Conflict Resolution

### Strategy 1: Fabric Wins (State Changes)
- If Fabric says "approved" but CBC says "pending"
- Fabric state takes precedence
- CBC updated to match Fabric

### Strategy 2: CBC Wins (Detailed Data)
- If CBC has updated exporter address
- CBC data takes precedence
- Fabric metadata updated if needed

### Strategy 3: Manual Review (Critical Conflicts)
- License validity mismatch
- Certificate status mismatch
- Payment verification mismatch
- Alert sent to admin for review

## Security Architecture

### Authentication
- JWT tokens issued by API Gateway
- Fabric CA certificates for chaincode invocation
- Service-to-service mTLS

### Authorization
- Role-Based Access Control (RBAC)
- Roles: exporter, ecta_officer, bank_officer, customs_officer, admin
- Permissions enforced at API Gateway and service level

### Data Protection
- TLS 1.3 for all communications
- Encryption at rest (PostgreSQL, Fabric)
- Encryption in transit (Kafka, APIs)
- PII masking in logs

### Audit Trail
- All API requests logged
- All Fabric transactions recorded
- All CBC changes tracked
- Kafka events retained for 90 days

## Monitoring & Observability

### Metrics
- API Gateway: Request rate, latency, error rate
- Fabric: Transaction throughput, block time, endorsement failures
- CBC: Query performance, connection pool usage
- Bridge: Sync lag, failed syncs, retry count
- Kafka: Message lag, consumer lag, partition health

### Logging
- Centralized logging (ELK Stack)
- Structured JSON logs
- Correlation IDs across services
- Log levels: ERROR, WARN, INFO, DEBUG

### Alerting
- Sync lag > 5 minutes
- Failed syncs > 10 in 1 hour
- Data mismatch detected
- Service health check failures
- Certificate expiration warnings

## Deployment Architecture

### Development Environment
```
Docker Compose:
- Fabric network (1 orderer, 3 peers)
- PostgreSQL
- Kafka + Zookeeper
- All microservices
- API Gateway
- Blockchain Bridge
```

### Staging Environment
```
Kubernetes:
- Fabric network (3 orderers, 9 peers)
- PostgreSQL (primary + replica)
- Kafka cluster (3 brokers)
- Microservices (2 replicas each)
- API Gateway (3 replicas)
- Blockchain Bridge (2 replicas)
```

### Production Environment
```
Kubernetes + Cloud:
- Fabric network (5 orderers, 15 peers)
- PostgreSQL (primary + 2 replicas)
- Kafka cluster (5 brokers)
- Microservices (3+ replicas)
- API Gateway (5+ replicas)
- Blockchain Bridge (3 replicas)
- Load balancer
- CDN for static assets
```

## Disaster Recovery

### Backup Strategy
- Fabric: Ledger snapshots daily
- PostgreSQL: Continuous archiving + daily snapshots
- Kafka: Topic replication factor 3
- Configuration: Git repository

### Recovery Procedures
- Fabric: Restore from snapshot + replay transactions
- PostgreSQL: Point-in-time recovery
- Kafka: Replay from earliest offset
- Full system: Restore all components + reconciliation

### RTO/RPO Targets
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 15 minutes

## Performance Targets

### API Gateway
- Throughput: 1000 req/sec
- Latency: p50 < 100ms, p99 < 500ms
- Availability: 99.9%

### Fabric Network
- Transaction throughput: 500 TPS
- Block time: 2 seconds
- Endorsement time: < 200ms

### CBC Services
- Query latency: p50 < 50ms, p99 < 200ms
- Write latency: p50 < 100ms, p99 < 300ms
- Database connections: 100 per service

### Blockchain Bridge
- Sync lag: < 1 minute
- Event processing: < 100ms
- Failed sync retry: Exponential backoff (1s, 2s, 4s, 8s, 16s)

## Best Practices Implemented

### 1. Separation of Concerns
- Fabric for immutable state
- CBC for mutable details
- Bridge for synchronization
- API Gateway for routing

### 2. Event-Driven Architecture
- Loose coupling between services
- Asynchronous communication
- Event sourcing for audit trail

### 3. Idempotency
- All API endpoints idempotent
- Duplicate event handling
- Retry-safe operations

### 4. Circuit Breaker Pattern
- Prevent cascade failures
- Graceful degradation
- Automatic recovery

### 5. Saga Pattern
- Distributed transactions
- Compensating transactions
- Eventual consistency

### 6. CQRS (Command Query Responsibility Segregation)
- Separate read and write models
- Optimized queries
- Scalable reads

### 7. API Versioning
- URL-based versioning (/api/v1/)
- Backward compatibility
- Deprecation policy

### 8. Rate Limiting
- Per-user limits
- Per-IP limits
- Burst allowance

### 9. Caching Strategy
- API Gateway cache (Redis)
- Database query cache
- CDN for static assets

### 10. Health Checks
- Liveness probes
- Readiness probes
- Dependency checks

## Technology Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| Blockchain | Hyperledger Fabric | 2.5+ |
| Database | PostgreSQL | 14+ |
| Message Queue | Apache Kafka | 3.0+ |
| API Gateway | Node.js + Express | 18+ |
| Microservices | TypeScript + Express | 5.0+ |
| Container | Docker | 24+ |
| Orchestration | Kubernetes | 1.28+ |
| Monitoring | Prometheus + Grafana | Latest |
| Logging | ELK Stack | 8.0+ |
| Cache | Redis | 7.0+ |
| Load Balancer | nginx | 1.24+ |

## Next Steps

1. ✅ Architecture design complete
2. 🔄 Implement Blockchain Bridge Service
3. 🔄 Set up Kafka event streaming
4. 🔄 Build Reconciliation Service
5. 🔄 Create Unified API Gateway
6. 🔄 Complete Phase 4 CBC models
7. 🔄 Integration testing
8. 🔄 Performance testing
9. 🔄 Security audit
10. 🔄 Production deployment

---

**Document Version:** 1.0.0  
**Last Updated:** February 17, 2026  
**Status:** Architecture Approved
