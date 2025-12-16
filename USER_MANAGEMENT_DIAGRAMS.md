# User Management Diagrams & Flows
## Visual Reference Guide

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                            │
│                    (HTTPS, JWT Token Storage)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  API Gateway    │
                    │  (Rate Limit)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌────▼────┐         ┌────▼────┐
   │ Auth    │          │ Export  │         │ Exporter│
   │ Service │          │ Service │         │ Service │
   │ (JWT)   │          │ (JWT)   │         │ (JWT)   │
   └────┬────┘          └────┬────┘         └────┬────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Fabric Gateway  │
                    │ (mTLS, RBAC)    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌────▼────┐         ┌────▼────┐
   │ Orderer │          │ Peer 1  │         │ Peer 2  │
   │ (TLS)   │          │ (TLS)   │         │ (TLS)   │
   └────┬────┘          └────┬────┘         └────┬────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌────▼────┐         ┌────▼────┐
   │CouchDB 1│          │CouchDB 2│         │CouchDB 3│
   │(Auth)   │          │(Auth)   │         │(Auth)   │
   └─────────┘          └─────────┘         └─────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  PostgreSQL     │
                    │  (Users, Audit) │
                    └─────────────────┘
```

---

## 2. User Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Registration Flow                       │
└─────────────────────────────────────────────────────────────────┘

Client                          API                    Blockchain    Database
  │                              │                         │            │
  │ POST /register               │                         │            │
  │ {username, password, email}  │                         │            │
  ├─────────────────────────────>│                         │            │
  │                              │                         │            │
  │                              │ Validate Input          │            │
  │                              │ Hash Password           │            │
  │                              │                         │            │
  │                              │ RegisterUser (TX)       │            │
  │                              ├────────────────────────>│            │
  │                              │                         │            │
  │                              │ Consensus               │            │
  │                              │<────────────────────────┤            │
  │                              │                         │            │
  │                              │ GetUser (Query)         │            │
  │                              ├────────────────────────>│            │
  │                              │                         │            │
  │                              │ User Data               │            │
  │                              │<────────────────────────┤            │
  │                              │                         │            │
  │                              │ INSERT INTO users       │            │
  │                              ├───────────────────────────────────────>│
  │                              │                         │            │
  │                              │ INSERT INTO audit_logs  │            │
  │                              ├───────────────────────────────────────>│
  │                              │                         │            │
  │                              │ Generate JWT            │            │
  │                              │                         │            │
  │ {success, token, user}       │                         │            │
  │<─────────────────────────────┤                         │            │
  │                              │                         │            │
```

---

## 3. User Authentication Flow

```
┌──────────────────────────────────────────────────────���──────────┐
│                    User Authentication Flow                     │
└─────────────────────────────────────────────────────────────────┘

Client                          API                    Blockchain    Database
  │                              │                         │            │
  │ POST /login                  │                         │            │
  │ {username, password}         │                         │            │
  ├─────────────────────────────>│                         │            │
  │                              │                         │            │
  │                              │ Check Rate Limit        │            │
  │                              │ (Redis)                 │            │
  │                              │                         │            │
  │                              │ GetUserByUsername (Q)   │            │
  │                              ├────────────────────────>│            │
  │                              │                         │            │
  │                              │ User Data               │            │
  │                              │<────────────────────────┤            │
  │                              │                         │            │
  │                              │ Verify Password         │            │
  │                              │ (bcrypt.compare)        │            │
  │                              │                         │            │
  │                              │ UpdateLastLogin (TX)    │            │
  │                              ├────────────────────────>│            │
  │                              │                         │            │
  │                              │ Consensus               │            │
  │                              │<────────────────────────┤            │
  │                              │                         │            │
  │                              │ INSERT INTO sessions    │            │
  │                              ├────────────��──────────────────────────>│
  │                              │                         │            │
  │                              │ INSERT INTO audit_logs  │            │
  │                              ├───────────────────────────────────────>│
  │                              │                         │            │
  │                              │ Generate JWT (24h)      │            │
  │                              │                         │            │
  │ {success, token, user}       │                         │            │
  │<─────────────────────────────┤                         │            │
  │                              │                         │            │
```

---

## 4. Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authorization Flow                           │
└────────────────────��────────────────────────────────────────────┘

Client                          API                    Database
  │                              │                         │
  │ GET /exports                 │                         │
  │ Authorization: Bearer <token>│                         │
  ├─────────────────────────────>│                         │
  │                              │                         │
  │                              │ Extract Token           │
  │                              │ Verify Signature        │
  │                              │ Check Expiration        │
  │                              │                         │
  │                              │ SELECT FROM sessions    │
  │                              ├────────────────────────>│
  │                              │                         │
  │                              │ Session Valid?          │
  │                              │<────────────────────────┤
  │                              │                         │
  │                              │ Check Role              │
  │                              │ Check Permissions       │
  │                              │ Check Organization      │
  │                              │                         │
  │                              │ ✓ Authorized            │
  │                              │                         │
  │                              │ Execute Business Logic  │
  │                              │                         │
  │                              │ SELECT FROM exports     │
  │                              ├────────────────────────>│
  │                              │                         │
  │                              │ Export Data             │
  │                              │<────────────────────────┤
  │                              │                         │
  │ {success, exports}           │                         │
  │<─────────────────────────────┤                         │
  │                              │                         │
```

---

## 5. Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│                    RBAC Hierarchy                               │
└─────────────────────────────────────────────────────────────────┘

                              ADMIN
                         (All Permissions)
                                │
                ┌───────────────┼───────────────┐
                │               │               │
            ┌───▼───┐      ┌────▼────┐    ┌───▼────┐
            │ ECTA  │      │ Banking │    │Customs │
            │Officer│      │ Officer │    │Officer │
            └───┬───┘      └────┬────┘    └───┬────┘
                │               │             │
        ┌───────┼───────┐   ┌───┼───┐    ┌───┼───┐
        │       │       │   │   │   │    │   │   │
    ┌───▼──┐ ┌──▼──┐ ┌──▼──┐ │   │   │    │   │   │
    ���Quality│ │Lot  │ │Exporter│   │   │    │   │   │
    │Officer│ │Verif│ │      │   │   │    │   │   │
    └───────┘ └─────┘ └──────┘   │   │    │   │   │
                                  │   │    │   │   │
                            ┌─────▼───▼────▼───▼───▼─┐
                            │  Exporter (Portal)    │
                            │  - Create Exports     │
                            │  - View Applications  │
                            │  - Submit Documents   │
                            └───────────────────────┘
```

---

## 6. Permission Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    Permission Matrix                            │
└─────────────────────────────────────────────────────────────────┘

Role                 │ Create │ Read │ Update │ Delete │ Approve │
─────────────────────┼────────┼──────┼────────┼────────┼─────────┤
Admin                │   ✓    │  ✓   │   ✓    │   ✓    │    ✓    │
ECTA Officer         │   ✓    │  ✓   │   ✓    │   ✗    │    ✓    │
Banking Officer      │   ✓    │  ✓   │   ✓    │   ✗    │    ✓    │
Customs Officer      │   ✗    │  ✓   │   ✓    │   ✗    │    ✓    │
Shipping Officer     │   ✗    │  ✓   │   ✓    │   ✗    │    ✓    │
Exporter             │   ✓    │  ✓   │   ✓    │   ✗    │    ✗    │
Auditor              │   ✗    │  ✓   │   ✗    │   ✗    │    ✗    │
```

---

## 7. Data Synchronization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Synchronization                         │
└──────────────────────────────────────────────────────────��──────┘

Blockchain (Source of Truth)
    │
    │ User Registration
    │ ├─ RegisterUser (TX)
    │ ├─ Consensus
    │ └─ Immutable Record
    │
    ├─────────────────────────────────────────┐
    │                                         │
    ▼                                         ▼
PostgreSQL (Cache)                    Retry Queue
    │                                    │
    ├─ INSERT users                      ├─ Failed syncs
    ├─ INSERT audit_logs                 ├─ Reconciliation
    ├─ INSERT sessions                   └─ Periodic jobs
    └─ Quick queries
    
    │
    ├─────────────────────────────────────────┐
    │                                         │
    ▼                                         ▼
Read Operations                    Conflict Resolution
    │                                    │
    ├─ Try DB cache first                ├─ Blockchain wins
    ├─ If miss → Query blockchain        ├─ Update DB
    └─ Update cache                      └─ Log mismatch
```

---

## 8. Session Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    Session Lifecycle                            │
└─────────────────────────────────────────────────────────────────┘

User Login
    │
    ▼
┌─────────────────────┐
│  Session Created    │
│  - ID: UUID         │
│  - Token Hash       │
│  - IP Address       │
│  - User Agent       │
│  - Expires: 24h     │
│  - Active: true     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Session Active     │
│  - Token validated  │
│  - Requests allowed │
│  - Activity tracked │
└──────────┬──────────┘
           │
           ├─ Logout ──────────┐
           │                   │
           ├─ Timeout (24h) ───┤
           │                   │
           └─ Revocation ──────┤
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Session Inactive   │
                    │  - Active: false    │
                    │  - Requests denied  │
                    │  - Token blacklist  │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Session Deleted    │
                    │  (Cleanup job)      │
                    └─────────────────────┘
```

---

## 9. Exporter Profile Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Exporter Profile Workflow                    │
└────────────────────────────────────────────────────────��────────┘

User Registration
    │
    ▼
┌──────────────────────────┐
│  User Account Created    │
│  - ID: USER-{UUID}       │
│  - Role: exporter        │
│  - Status: ACTIVE        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Create Exporter Profile │
│  - Business Name         │
│  - TIN                   │
│  - Registration Number   │
│  - Business Type         │
│  - Contact Info          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Profile Status:         │
│  PENDING_APPROVAL        │
└──────────┬───────────────┘
           │
           ├─ ECTA Review ──────────┐
           │                        │
           ├─ Approve ──────────────┤
           │                        │
           └─ Reject ───────────���───┤
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
                    ▼                                ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │  Profile: ACTIVE     │      │  Profile: REJECTED   │
        │  - Can create exports│      │  - Cannot export     │
        │  - Can submit docs   │      │  - Must reapply      │
        │  - Full access       │      │  - Limited access    │
        └──────────────────────┘      └──────────────────────┘
```

---

## 10. Audit Trail

```
┌─────────────────────────────────────────────────────────────────┐
│                    Audit Trail                                  │
└──────────────────────────────────────────���──────────────────────┘

User Action
    │
    ├─ Blockchain
    │  └─ Immutable Record
    │     ├─ Timestamp
    │     ├─ User ID
    │     ├─ Action
    │     └─ Data Hash
    │
    └─ Database
       └─ Queryable Log
          ├─ Timestamp
          ├─ User ID
          ├─ Action
          ├─ Details (JSON)
          ├─ IP Address
          └─ User Agent

Audit Events:
├─ REGISTER
├─ LOGIN
├─ LOGOUT
├─ PASSWORD_CHANGE
├─ PROFILE_UPDATE
├─ ROLE_CHANGE
├─ ACCOUNT_DEACTIVATION
├─ ACCOUNT_ACTIVATION
├─ CREATE_EXPORT
├─ APPROVE_EXPORT
├─ REJECT_EXPORT
└─ ... (many more)
```

---

## 11. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Error Handling Flow                          │
└─────────────────────────────────────────────────────────────────┘

API Request
    │
    ▼
Try Block
    │
    ├─ Validation Error ──────────────────┐
    │                                     │
    ├─ Authentication Error ──────────────┤
    │                                     │
    ├─ Authorization Error ───────────────┤
    │                                     │
    ├─ User Not Found Error ──────────────┤
    │                                     │
    ├─ User Already Exists Error ─────────┤
    │                                     │
    ├─ Blockchain Error ──────────────────┤
    │                                     │
    ├─ Database Error ────────────────────┤
    │                                     │
    └─ Unknown Error ─────────────────────┤
                                          │
                                          ▼
                            ┌──────────────────────────┐
                            │  Error Handler           │
                            │  - Log Error             │
                            │  - Sanitize Message      │
                            │  - Return HTTP Status    │
                            │  - Send Response         │
                            └──────────────────────────┘
                                          │
                                          ▼
                            ┌──────────────────────────┐
                            │  Client Response         │
                            │  {                       │
                            │    success: false,       │
                            │    error: "...",         │
                            │    code: "..."           │
                            │  }                       │
                            └──────────────────────────┘
```

---

## 12. Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                              │
└────────────────���────────────────────────────────────────────────┘

Layer 1: Network Security
├─ HTTPS/TLS 1.2+
├─ mTLS for peer-to-peer
└─ Docker network isolation

Layer 2: Authentication
├─ Password hashing (bcrypt)
├─ JWT tokens (24h expiry)
├─ Rate limiting
└─ Session management

Layer 3: Authorization
├─ Role-based access control
├─ Permission-based access
├─ Organization boundaries
└─ Resource ownership

Layer 4: Data Protection
├─ Encryption at rest
├─ Encryption in transit
├─ Input validation
└─ SQL injection prevention

Layer 5: Audit & Monitoring
├─ Immutable blockchain logs
├─ Database audit logs
├─ Security event logging
└─ Anomaly detection

Layer 6: Compliance
├─ GDPR compliance
├─ Data retention policy
├─ Privacy controls
└─ Regulatory requirements
```

---

## 13. Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Optimization                     │
└────────────���────────────────────────────────────────────────────┘

Request
    │
    ▼
┌──────────────────────┐
│  Check Redis Cache   │
│  - User profiles     │
│  - Permissions       │
│  - Roles             │
└──────┬───────────────┘
       │
       ├─ Cache Hit ──────────────────┐
       │                              │
       └─ Cache Miss ────────────────┐│
                                     ││
                                     ▼▼
                        ┌──────────────────────┐
                        │  Query PostgreSQL    │
                        │  - Indexed queries   │
                        │  - Connection pool   │
                        │  - Prepared stmts    │
                        └──────┬───────────────┘
                               │
                               ├─ DB Hit ──────────────┐
                               │                       │
                               └─ DB Miss ────────────┐│
                                                      ││
                                                      ▼▼
                                     ┌──────────────────────┐
                                     │  Query Blockchain    │
                                     │  - Evaluate TX       │
                                     │  - Consensus        │
                                     └──────┬───────────────┘
                                            │
                                            ▼
                                     ┌──────────────────────┐
                                     │  Update Cache        │
                                     │  - Redis set         │
                                     │  - TTL: 1h           │
                                     └──────────────────────┘
                                            │
                                            ▼
                                     ┌──────────────��───────┐
                                     │  Return Response     │
                                     └──────────────────────┘
```

---

## 14. Deployment Architecture

```
┌─────────���───────────────────────────────────────────────────────┐
│                    Deployment Architecture                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Docker Compose Network                       │
│                  (coffee-export-network)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Services (5 containers)                            │  │
│  │  ├─ Commercial Bank API (port 3001)                     │  │
│  │  ├─ National Bank API (port 3002)                       │  │
│  │  ├─ ECTA API (port 3003)                                │  │
│  │  ├─ Shipping Line API (port 3004)                       │  │
│  │  └─ Custom Authorities API (port 3005)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Blockchain Network                                      │  │
│  │  ├─ Orderer (port 7050)                                 │  │
│  │  ├─ Peers (6 peers, ports 7051-11051)                   │  │
│  │  └─ CouchDB (6 instances, ports 5984-11984)             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Data Layer                                              │  │
│  │  ├─ PostgreSQL (port 5435)                              │  │
│  │  ├─ Redis (cache)                                       │  │
│  │  └─ IPFS (port 5001)                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Frontend                                                │  │
│  │  └─ React App (port 80)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 15. Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                    Monitoring Dashboard                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  User Management Metrics                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Active Users: 1,234                                            │
│  ├─ Commercial Bank: 45                                         │
│  ├─ National Bank: 38                                           │
│  ├─ ECTA: 52                                                    │
│  ├─ ECX: 28                                                     │
│  ├─ Customs: 35                                                 │
│  ├─ Shipping Line: 22                                           │
│  └─ Exporters: 1,014                                            │
│                                                                 │
│  Failed Logins (24h): 23                                        │
│  ├─ Invalid credentials: 18                                     │
│  ├─ Account locked: 3                                           │
│  └─ Rate limited: 2                                             │
│                                                                 │
│  Active Sessions: 456                                           │
│  ├─ Average duration: 2.5 hours                                 │
│  ├─ Max concurrent: 12                                          │
│  └─ Timeout events: 5                                           ��
│                                                                 │
│  API Performance                                                │
│  ├─ Avg response time: 245ms                                    │
│  ├─ P95 response time: 890ms                                    │
│  ├─ Error rate: 0.2%                                            │
│  └─ Throughput: 1,234 req/min                                   │
│                                                                 │
│  Blockchain Performance                                         │
│  ├─ Avg TX time: 2.3s                                           │
│  ├─ Block time: 5s                                              │
│  ├─ Network health: ✓ Good                                      │
│  └─ Peer sync: ✓ In sync                                        │
│                                                                 │
│  Database Performance                                           │
│  ├─ Avg query time: 45ms                                        │
│  ├─ Connection pool: 20/50                                      │
│  ├─ Cache hit rate: 78%                                         │
│  └─ Disk usage: 45GB / 100GB                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Document Version:** 1.0
**Last Updated:** 2024
