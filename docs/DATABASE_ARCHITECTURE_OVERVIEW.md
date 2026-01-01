# Database Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Coffee Blockchain Consortium (CBC)                   │
│                         Database Architecture                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          Frontend Application                            │
│                        (React/Vite - Port 80)                           │
└─────────────���────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
        ┌───────────▼──────┐  ┌────▼────────┐  ┌──▼──────────────┐
        │ Commercial Bank  │  │ National    │  │ ECTA API        │
        │ API (Port 3001)  │  │ Bank API    │  │ (Port 3003)     │
        │                  │  │ (Port 3002) │  │                 │
        └───────────┬──────┘  └────┬────────┘  └──┬──────────────┘
                    │               │               │
        ┌───────────▼──────┐  ┌────▼────────┐  ┌──▼──────────────┐
        │ Shipping Line    │  │ Custom      │  │ Shared Services │
        │ API (Port 3004)  │  │ Authorities │  │ (Connection     │
        │                  │  │ API (3005)  │  │  Pool, Logger,  │
        └───────────┬──────┘  └────┬────────┘  │  Validators)    │
                    │               │          └──┬──────────────┘
                    └───────────────┼─────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
        ┌───────────▼──────┐  ┌────▼────────┐  ┌──▼──────────────┐
        │   PostgreSQL     │  │    IPFS     │  │  Environment    │
        │   Database       │  │    Node     │  │  Configuration  │
        │   (Port 5432)    │  │ (Ports 4001,│  │  & Validation   │
        │                  │  │  5001, 8080)│  │                 │
        └──────────────────┘  └────────────┘  └─────────────────┘
```

---

## Database Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database Layer                          │
│                    (coffee_export_db - Port 5432)                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        Connection Pool (pool.ts)                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Max Connections: 20 | Idle Timeout: 30s | Connection Timeout: 2s│   │
│  │ Supports: DATABASE_URL or Individual Parameters (DB_HOST, etc)  ��   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
        ┌───────────▼──────┐  ┌────▼────────┐  ┌──▼──────────────┐
        │  Pre-Registration│  │   Export    │  │   User & Auth   │
        │  System Tables   │  │  Workflow   │  │   Management    │
        │                  │  │   Tables    │  │   Tables        │
        └──────────────────┘  └─────────────┘  └─────────────────┘
```

---

## Table Organization

### 1. Pre-Registration System (Migration 001)
```
┌─────────────────────────────────────────────────────────────────┐
│              Pre-Registration System Tables                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  exporter_profiles                                              │
│  ├── exporter_id (UUID, PK)                                    │
│  ├── business_name, tin, registration_number                  │
│  ├── business_type (PRIVATE, TRADE_ASSOCIATION, etc)          │
│  ├── capital_verified, capital_verification_date              │
│  ├── status (ACTIVE, SUSPENDED, REVOKED, PENDING_APPROVAL)    │
│  └── timestamps (created_at, updated_at)                      ���
│                                                                 │
│  coffee_laboratories (FK: exporter_id)                         │
│  ├── laboratory_id (UUID, PK)                                 │
│  ├── certification_number, certified_date, expiry_date        │
│  ├── equipment, has_roasting_facility, has_cupping_room       │
│  ├── last_inspection_date, inspection_reports                 │
│  └── status (ACTIVE, EXPIRED, SUSPENDED, REVOKED, PENDING)    │
│                                                                 │
│  coffee_tasters (FK: exporter_id)                              │
│  ├── taster_id (UUID, PK)                                     │
│  ├── full_name, date_of_birth, national_id                    │
│  ├── qualification_level, qualification_document              │
│  ├── proficiency_certificate_number, certificate_expiry_date  │
│  ├── employment_start_date, is_exclusive_employee             │
│  └── status (ACTIVE, EXPIRED, SUSPENDED, REVOKED, PENDING)    │
│                                                                 │
│  competence_certificates (FK: exporter_id)                     │
│  ├── certificate_id (UUID, PK)                                │
│  ├── certificate_number, issued_date, expiry_date             │
│  ├── laboratory_id, taster_id (FKs)                           │
│  ├── facility_inspection_date, inspection_passed              │
│  ├── has_quality_management_system, storage_capacity          │
│  ├── approved_by, approved_at, rejection_reason               │
│  └── renewal_history (JSONB)                                  │
│                                                                 │
│  export_licenses (FK: exporter_id)                             │
│  ├── license_id (UUID, PK)                                    │
│  ├── license_number, issued_date, expiry_date                 │
│  ├── competence_certificate_id (FK)                           │
│  ├── authorized_coffee_types, authorized_origins (JSONB)      │
│  ├── annual_quota, approved_by, approved_at                   │
│  └── renewal_history (JSONB)                                  │
│                                                                 │
│  coffee_lots (FK: purchased_by -> exporter_id)                │
│  ├── lot_id (UUID, PK)                                        │
│  ├── ecx_lot_number, warehouse_receipt_number                 │
│  ├── coffee_type, origin_region, processing_method            │
│  ├── quantity, preliminary_grade                              │
│  ├── purchase_date, purchase_price                            │
│  └── status (IN_WAREHOUSE, INSPECTED, RESERVED, EXPORTED)     │
│                                                                 │
│  quality_inspections (FK: lot_id, exporter_id)                │
│  ├── inspection_id (UUID, PK)                                 │
│  ├── inspection_date, inspection_center, inspector            │
│  ├── Physical Analysis (bean_size, moisture, defects)         │
│  ├── Cupping Evaluation (cupping_score, flavor, aroma, etc)   │
│  ├── final_grade, quality_certificate_number, passed          │
│  └── inspection_report, cupping_form                          │
│                                                                 │
│  sales_contracts (FK: exporter_id)                             │
│  ├── contract_id (UUID, PK)                                   │
│  ├── contract_number, buyer_name, buyer_country               │
│  ├── coffee_type, quantity, contract_value, price_per_kg      │
│  ├── payment_terms, incoterms, delivery_date                  │
│  ├── port_of_loading, port_of_discharge                       │
│  ├── registration_date, approved_by, approved_at              │
│  ├── status (REGISTERED, APPROVED, REJECTED, EXPIRED)         │
│  └── contract_document, buyer_proof_of_business               │
│                                                                 │
│  export_permits (FK: exporter_id, license_id, cert_id, etc)   │
│  ├── permit_id (UUID, PK)                                     │
│  ├── permit_number, issued_date, valid_until                  │
│  ├── coffee_type, quantity, grade, destination_country        │
│  ├── status (ISSUED, USED, EXPIRED, CANCELLED)                │
│  └── issued_by                                                │
│                                                                 │
│  certificates_of_origin (FK: export_permit_id, exporter_id)   │
│  ├── certificate_id (UUID, PK)                                │
│  ├── certificate_number, issued_date, issued_by               │
│  ├── exporter_name, exporter_address                          │
│  ├── buyer_name, buyer_country, buyer_address                 │
│  ├── coffee_type, origin_region, quantity, grade              │
│  └── processing_method, certificate_document                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Document Management (Migration 002)
```
┌──────────────────────────────────────��──────────────────────────┐
│              Document Management Tables                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  preregistration_documents                                      │
│  ├── document_id (UUID, PK)                                    │
│  ├── entity_id, entity_type (exporter, lab, taster, etc)      │
│  ├── document_type (capital_proof, certificate, etc)          │
│  ├── file_name, file_size, mime_type                          │
│  ├── ipfs_hash (UNIQUE), ipfs_url                             │
│  ├── uploaded_by, uploaded_at                                 │
│  ├── is_active (soft delete), deactivated_by, deactivated_at  │
│  └── timestamps (created_at, updated_at)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Audit & Compliance (Migration 003)
```
┌─────────────────────────────────────────────────────────────────┐
│              Audit & Compliance Tables                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  preregistration_audit_log                                      │
│  ├── audit_id (UUID, PK)                                       │
│  ├── event_type, entity_type, entity_id                        │
│  ├── user_id, user_role, organization_id                       │
│  ├── action, description, old_values, new_values (JSONB)       │
│  ├── metadata (JSONB)                                          │
│  ├── ip_address, user_agent, session_id                        │
│  ├── timestamp (DESC indexed)                                  │
│  ├── severity (LOW, MEDIUM, HIGH, CRITICAL)                   │
��  ├── compliance_relevant (BOOLEAN)                             │
│  ├── retention_period_days (default: 2555 = 7 years)           │
│  ├── archived, archived_at                                     │
│  └── Immutable (prevent modification/deletion)                 │
│                                                                 │
│  Views:                                                         │
│  ├── compliance_audit_summary                                  │
│  ├── security_audit_summary                                    │
│  └── exporter_audit_activity                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Export Workflow (Migration 004)
```
┌─────────────────────────────────────────────────────────────────┐
│              Export Workflow Tables                              │
├───────────────────���──────────��──────────────────────────────────┤
│                                                                 │
│  exports (Core export requests)                                 │
│  ├── export_id (UUID, PK)                                      │
│  ├── exporter_id (FK)                                          │
│  ├── coffee_type, origin_region, quantity, destination         │
│  ├── buyer_name, buyer_country, buyer_email                    │
│  ├── status (PENDING → FX_APPROVED → QUALITY_CERTIFIED →       │
│  │           SHIPMENT_SCHEDULED → SHIPPED → COMPLETED)         │
│  ├── FX Approval (fx_approved_by, fx_approved_at)              │
│  ├── Quality Certification (quality_approved_by, grade)        │
│  ├── Shipment (vessel_name, departure_date, arrival_date)      │
│  ├── Customs (customs_cleared_by, customs_clearance_number)    │
│  ├── Completion (completed_by, completed_at)                   │
│  ├── Cancellation (cancelled_by, cancelled_at, reason)         │
│  └── timestamps (created_at, updated_at)                       │
│                                                                 │
│  export_status_history (Immutable audit trail)                  │
│  ├── history_id (UUID, PK)                                     │
│  ├── export_id (FK)                                            │
│  ├── old_status, new_status                                    │
│  ├── changed_by, organization, reason                          │
│  └── created_at                                                │
│                                                                 │
│  export_documents (Document attachments)                        │
│  ├── document_id (UUID, PK)                                    │
│  ├── export_id (FK)                                            │
│  ├── document_type (INVOICE, PACKING_LIST, CERTIFICATE, etc)   │
│  ├── document_name, document_path, file_size, mime_type        │
│  ├── uploaded_by, uploaded_at                                  │
│  ├── ipfs_hash (optional)                                      │
│  └─�� created_at                                                │
│                                                                 │
│  export_approvals (Approval tracking)                           │
│  ├── approval_id (UUID, PK)                                    │
│  ├── export_id (FK)                                            │
│  ├── approval_type (FX_APPROVAL, QUALITY_CERT, SHIPMENT, etc)  │
│  ├── organization, approved_by                                 │
│  ├── status (PENDING, APPROVED, REJECTED)                      │
│  ├── approval_date, rejection_reason                           │
│  ├── approval_data (JSONB)                                     │
│  └── timestamps (created_at, updated_at)                       │
│                                                                 │
│  Views:                                                         │
│  ├── pending_approvals_by_org                                  │
│  └── export_summary                                            │
│                                                                 │
└──��──────────────────────────────────────────────────────────────┘
```

### 5. User Management (Migration 005)
```
┌─────────────────────────────────────────────────────────────────┐
│              User Management Tables                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  users (Authentication)                                         │
│  ├── id (SERIAL, PK)                                           │
│  ├── username (UNIQUE), email (UNIQUE)                         │
│  ├── password_hash (bcrypt)                                    │
│  ├── organization_id, role                                     │
│  ├── is_active, last_login                                     │
│  └── timestamps (created_at, updated_at)                       │
│                                                                 │
│  user_roles (RBAC)                                              │
│  ├── id (SERIAL, PK)                                           │
│  ├── user_id (FK), role_name                                   │
│  ├── granted_at, granted_by (FK)                               │
│  └── UNIQUE(user_id, role_name)                                │
│                                                                 │
│  user_sessions (Session tracking)                               │
│  ├── id (SERIAL, PK)                                           │
│  ├── user_id (FK), token_hash                                  │
│  ├── ip_address, user_agent                                    │
│  ├── expires_at, created_at, last_activity                     │
│                                                                 │
│  user_audit_log (Activity tracking)                             │
│  ├── id (SERIAL, PK)                                           │
│  ├── user_id (FK), action                                      │
│  ├── details (JSONB), ip_address, user_agent                   │
│  ├── status, created_at                                        │
│                                                                 │
│  Views:                                                         │
│  ├── active_users                                              │
│  └── user_statistics                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Export Workflow Data Flow                     │
└─────────────────────────────────────────────────────────────────┘

1. EXPORTER REGISTRATION
   ┌──────────────────┐
   │ Exporter Profile │
   └────────┬─────────┘
            │
            ├─→ Coffee Laboratory (if not farmer)
            │
            ├─→ Coffee Taster (if not farmer)
            │
            ├─→ Competence Certificate
            │
            └─→ Export License

2. COFFEE SOURCING
   ┌──────────────────┐
   │   Coffee Lots    │ (from ECX)
   └────────┬─────────┘
            │
            └─→ Quality Inspection
                    │
                    └─→ Sales Contract

3. EXPORT WORKFLOW
   ┌──────────────────┐
   │  Export Request  │ (PENDING)
   └────────┬─────────┘
            │
            ├─→ FX Approval (National Bank)
            │   └─→ Status: FX_APPROVED
            │
            ├─→ Quality Certification (ECTA)
            │   └─→ Status: QUALITY_CERTIFIED
            │
            ├─→ Shipment Scheduling (Shipping Line)
            │   └─→ Status: SHIPMENT_SCHEDULED
            │
            ├─→ Customs Clearance (Custom Authorities)
            │   └─→ Status: SHIPPED
            │
            └─→ Completion
                └─→ Status: COMPLETED

4. DOCUMENTATION
   ┌──────────────────┐
   │ Export Permit    │
   └────────┬─────────┘
            │
            └─→ Certificate of Origin
                    │
                    └─→ Export Documents
                        (Invoice, Packing List, etc)

5. AUDIT & COMPLIANCE
   ┌──────────────────┐
   │  Audit Log       │ (All events logged)
   └────────┬─────────┘
            │
            ├─→ Compliance Reporting
            │
            ├─→ Security Monitoring
            │
            └─→ Activity Tracking
```

---

## Connection Pool Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Connection Pool (pool.ts)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Configuration:                                                 │
│  ├── Max Connections: 20                                        │
│  ├── Idle Timeout: 30 seconds                                   │
│  ├── Connection Timeout: 2 seconds                              │
│  └── SSL Support: Available                                     │
│                                                                 │
│  Connection Modes:                                              │
│  ├── Mode 1: DATABASE_URL (connection string)                   │
│  │   postgresql://user:password@host:port/database              │
│  │                                                              │
│  └── Mode 2: Individual Parameters                              │
│      ├── DB_HOST                                               │
│      ├── DB_PORT                                               │
│      ├── DB_NAME                                               │
│      ├── DB_USER                                               │
│      ├── DB_PASSWORD                                           │
│      └── DB_SSL                                                │
│                                                                 │
│  Functions:                                                     │
│  ├── initializePool() → Initialize pool                         │
│  ├── getPool() → Get existing pool                              │
│  ├── closePool() → Graceful shutdown                            │
│  └── getPoolStats() → Monitor pool health                       │
│                                                                 │
│  Pool Statistics:                                               │
│  ├── totalConnections (current)                                 │
│  ├── idleConnections (available)                                │
│  └── waitingRequests (queued)                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Configuration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│            Environment Configuration (env.validator)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Validation Layers:                                             │
│  ├── Layer 1: Variable Presence Check                           │
│  │   └── Verify all required variables exist                    │
│  │                                                              │
│  ├── Layer 2: Type Validation                                   │
│  │   ├── PORT: number (1-65535)                                │
│  │   ├── NODE_ENV: enum (dev/prod/test)                        │
│  │   ├── LOG_LEVEL: enum (error/warn/info/debug)               │
│  │   └── Boolean flags: true/false                             │
│  │                                                              │
│  ├── Layer 3: Range Validation                                  │
│  │   ├── PORT: 1-65535                                         │
│  │   ├── DB_PORT: 1-65535                                      │
│  │   ├── EMAIL_PORT: 1-65535                                   │
│  │   ├── DB_POOL_MIN: >= 1                                     │
│  │   └── DB_POOL_MAX: >= DB_POOL_MIN                           │
│  │                                                              │
│  └── Layer 4: Security Validation                               │
│      ├── JWT_SECRET: >= 32 characters                           │
│      ├── ENCRYPTION_KEY: 32 bytes for AES-256                  │
│      └── Password fields: non-empty                            │
│                                                                 │
│  Output:                                                        │
│  ├── ✅ Configuration loaded (on success)                       │
│  ├── ❌ Detailed error messages (on failure)                    │
│  └── Configuration logging (without sensitive data)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Docker Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Docker Network: coffee-export-network              │
├────────────────────────────────��────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Frontend (Port 80)                    │   │
│  │                  nginx reverse proxy                    │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
│         ┌───────────────┼───────────────┐                       │
│         │               │               │                       │
│  ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐                │
│  │ Commercial  │ │ National  │ │    ECTA     │                │
│  │ Bank API    │ │ Bank API  │ │    API      │                │
│  │ (3001)      │ │ (3002)    │ │  (3003)     │                │
│  └──────┬──────┘ └─────┬─────┘ └──────┬──────┘                │
│         │               │               │                       │
│  ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐                │
│  │ Shipping    │ │  Custom   │ │  Shared     │                │
│  │ Line API    │ │ Authorities│ │ Services   │                │
│  │ (3004)      │ │ API (3005) │ │ (pool, log) │                │
│  └──────┬──────┘ └─────┬─────┘ └──────┬──────┘                │
│         │               │               │                       │
│         └───────────────┼───────────────┘                       │
│                         │                                       │
│         ┌───────────────┼───────────────┐                       │
│         │               │               │                       │
│  ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐                │
│  │ PostgreSQL  │ │   IPFS    │ │ Environment │                │
│  │ (5432)      │ │ (4001,    │ │ Validator   │                │
│  │             │ │  5001,    │ │             │                │
│  │ Database    │ │  8080)    │ │ Config      │                │
│  └─────────────┘ └───────────┘ └─────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Index Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Index Strategy (50+ Indexes)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Single-Column Indexes (Foreign Keys):                          │
│  ├── exporter_profiles: user_id, status, tin                   │
│  ├── coffee_laboratories: exporter_id, status                  │
│  ├── coffee_tasters: exporter_id, status                       │
│  ├── competence_certificates: exporter_id, status              │
│  ├── export_licenses: exporter_id, status                      │
│  ├── coffee_lots: ecx_lot_number, purchased_by, status         │
│  ├── quality_inspections: lot_id, exporter_id                  │
│  ├── sales_contracts: exporter_id, contract_number             │
│  ├── export_permits: exporter_id, permit_number, status        │
│  ├── certificates_of_origin: exporter_id, certificate_number   │
│  ├── preregistration_documents: entity_id, entity_type, etc    │
│  ├── preregistration_audit_log: timestamp, event_type, etc     │
│  ├── exports: exporter_id, status, created_at, destination     │
│  ├── export_status_history: export_id, created_at              │
│  ├── export_documents: export_id, document_type                │
│  ├── export_approvals: export_id, approval_type, status        │
│  ├── users: username, email, organization_id, is_active        │
│  ├── user_roles: user_id, role_name                            │
│  ├── user_sessions: user_id, token_hash, expires_at            │
│  └── user_audit_log: user_id, action, created_at               │
│                                                                 │
│  Composite Indexes (Common Queries):                            │
│  ├── preregistration_audit_log:                                 │
│  │   (compliance_relevant, timestamp DESC)                      │
│  │   (severity, timestamp DESC)                                 │
│  │   (entity_type, entity_id, timestamp DESC)                   │
│  │                                                              │
│  └── export_approvals:                                          │
│      (export_id, approval_type)                                 │
│                                                                 │
│  Partial Indexes (Filtered Queries):                            │
│  ├── preregistration_audit_log:                                 │
│  │   WHERE archived = FALSE                                     │
│  │   WHERE severity = 'CRITICAL'                                │
│  │   WHERE compliance_relevant = TRUE                           │
│  │                                                              │
│  └── competence_certificates:                                   │
│      UNIQUE (exporter_id, status)                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Authentication Layer:                                          │
│  ├── JWT Tokens (JWT_SECRET, JWT_EXPIRES_IN)                   │
│  ├── Refresh Tokens (JWT_REFRESH_EXPIRES_IN)                   │
│  ├── Password Hashing (bcrypt in users table)                   │
│  └── Session Management (user_sessions table)                   │
│                                                                 │
│  Authorization Layer:                                           │
│  ├── Role-Based Access Control (user_roles table)               │
│  ├── Organization Isolation (organization_id)                   │
│  └── Permission Checks (per endpoint)                           │
│                                                                 │
│  Encryption Layer:                                              │
│  ├── ENCRYPTION_KEY (AES-256)                                   │
│  ├── SSL/TLS Support (DB_SSL)                                   │
│  └── Password Fields (encrypted)                                │
│                                                                 │
│  Audit & Compliance Layer:                                      │
│  ├── Audit Logging (preregistration_audit_log)                  │
│  ├── User Activity Tracking (user_audit_log)                    │
│  ├── Immutable Audit Records (prevent modification)             │
│  ├── 7-Year Retention (2555 days)                               │
│  └── Compliance Reporting (views)                               │
│                                                                 │
│  Rate Limiting:                                                 │
│  ├── RATE_LIMIT_WINDOW_MS (15 minutes)                          │
│  ├── RATE_LIMIT_MAX_REQUESTS (100 per window)                   │
│  └── AUTH_RATE_LIMIT_MAX (5 login attempts)                     │
│                                                                 │
│  CORS & Network:                                                │
│  ├── CORS_ORIGIN (allowed origins)                              │
│  ├── Docker Network Isolation                                   │
│  └── Firewall Rules (production)                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Compliance & Audit Architecture

```
┌──────────────���──────────────────────────────────────────────────┐
│              Compliance & Audit Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Audit Trail:                                                   │
│  ├── Event Logging (event_type, entity_type, entity_id)         │
│  ├── User Tracking (user_id, user_role, organization_id)        │
│  ├── Action Details (action, description, old/new values)       │
│  ├── Session Tracking (ip_address, user_agent, session_id)      │
│  ├── Timestamp Recording (timestamp, created_at, updated_at)    │
│  └── Immutable Records (prevent modification/deletion)          │
│                                                                 │
│  Compliance Features:                                           │
│  ├── Severity Levels (LOW, MEDIUM, HIGH, CRITICAL)              │
│  ├── Compliance Flagging (compliance_relevant)                  │
│  ├── 7-Year Retention (2555 days)                               │
│  ├── Automatic Archival (archive_old_audit_records)             │
│  └── Compliance Reporting (compliance_audit_summary view)       │
│                                                                 │
│  Security Monitoring:                                           │
│  ├── Critical Events Tracking                                   │
│  ├── Unauthorized Access Detection                              │
│  ├── Data Export Monitoring                                     │
│  ├── Security Audit Summary (security_audit_summary view)       │
│  └── Hourly Activity Aggregation                                │
│                                                                 │
│  Activity Tracking:                                             │
│  ├── Exporter Activity (exporter_audit_activity view)           │
│  ├── User Activity (user_audit_log table)                       │
│  ├── Approval Events (export_status_history)                    │
│  └── Rejection Events (tracked in audit log)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│            Performance Optimization Strategy                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Connection Pooling:                                            │
│  ├── Max Connections: 20 (configurable)                         │
│  ├── Idle Timeout: 30 seconds                                   │
│  ├── Connection Timeout: 2 seconds                              │
│  └── Pool Statistics Monitoring                                 │
│                                                                 │
│  Query Optimization:                                            │
│  ├── 50+ Strategic Indexes                                      │
│  ├── Composite Indexes for Common Queries                       │
│  ├── Partial Indexes for Filtered Queries                       │
│  ├── Foreign Key Indexes                                        │
│  └── Timestamp Indexes for Range Queries                        │
│                                                                 │
│  Database Maintenance:                                          │
│  ├── Automatic VACUUM (PostgreSQL)                              │
│  ├── Automatic ANALYZE (PostgreSQL)                             │
│  ├── Index Maintenance (periodic REINDEX)                       │
│  └── Statistics Updates (ANALYZE)                               │
│                                                                 │
│  Query Performance:                                             │
│  ├── EXPLAIN ANALYZE for slow queries                           │
│  ├── Query Plan Optimization                                    │
│  ├── Index Usage Verification                                   │
│  └── Slow Query Logging                                         │
│                                                                 │
│  Monitoring:                                                    │
│  ├── Connection Pool Stats                                      │
│  ├── Query Performance Metrics                                  │
│  ├── Disk Space Usage                                           │
│  ├── Memory Usage                                               │
│  └── CPU Usage                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Deployment Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Development Environment:                                       │
│  ├─�� Local PostgreSQL (localhost:5432)                          │
│  ├── Local IPFS (localhost:5001)                                │
│  ├── Local API Services (localhost:3001-3005)                   │
│  └── Local Frontend (localhost:5173)                            │
│                                                                 │
│  Docker Environment:                                            │
│  ├── Docker Compose (docker-compose.postgres.yml)               │
│  ├── PostgreSQL Container (postgres:15-alpine)                  │
│  ├── IPFS Container (ipfs/kubo:latest)                          │
│  ├── API Service Containers (5 services)                        │
│  ├── Frontend Container (nginx)                                 │
│  ├── Shared Network (coffee-export-network)                     │
│  └── Persistent Volumes (postgres-data, ipfs-data)              │
│                                                                 │
│  Production Environment:                                        │
│  ├── Managed PostgreSQL (RDS, Cloud SQL, etc)                   │
│  ├── Kubernetes Deployment (optional)                           │
│  ├── Load Balancer (nginx, HAProxy, etc)                        │
│  ├── SSL/TLS Certificates                                       │
│  ├── Backup & Recovery System                                   │
│  ├── Monitoring & Alerting                                      │
│  └── Disaster Recovery Plan                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

The CBC database architecture is:
- ✅ **Comprehensive** - 20 tables covering all business requirements
- ✅ **Performant** - 50+ indexes for optimal query performance
- ✅ **Secure** - Multiple security layers and audit logging
- ✅ **Compliant** - 7-year audit retention and compliance reporting
- ✅ **Scalable** - Connection pooling and Docker containerization
- ✅ **Maintainable** - Clear schema design and comprehensive documentation

**Status:** ✅ PRODUCTION READY

