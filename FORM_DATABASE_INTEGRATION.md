# Frontend Forms to Database Integration

## Forms → Database Tables Mapping

### 1. ECTALicenseForm → license_applications + export_licenses

**Form**: `/frontend/src/components/forms/ECTALicenseForm.tsx`

**Database Tables**:
```sql
-- license_applications (for applications)
-- export_licenses (for approved licenses)
```

**API Endpoint**: `POST /api/exporter/license/apply`

**Integration Status**: ✅ Already integrated (real implementation)

---

### 2. CustomsClearanceForm → customs_clearances (NEW)

**Form**: `/frontend/src/components/forms/CustomsClearanceForm.tsx`

**Database Table**: `customs_clearances` (needs creation)

**API Endpoint**: `POST /api/clearance` (Custom Authorities API)

**Integration Status**: ⚠️ Needs database table

---

### 3. ShipmentScheduleForm → shipments (NEW)

**Form**: `/frontend/src/components/forms/ShipmentScheduleForm.tsx`

**Database Table**: `shipments` (needs creation)

**API Endpoint**: `POST /api/bookings` (Shipping Line API)

**Integration Status**: ⚠️ Needs database table

---

### 4. ECXApprovalForm → quality_inspections

**Form**: `/frontend/src/components/forms/ECXApprovalForm.tsx`

**Database Table**: `quality_inspections` (exists)

**API Endpoint**: `POST /api/quality/certify` (ECX API)

**Integration Status**: ⚠️ Needs API implementation

---

### 5. ECTAContractForm → sales_contracts

**Form**: `/frontend/src/components/forms/ECTAContractForm.tsx`

**Database Table**: `sales_contracts` (exists)

**API Endpoint**: `POST /api/contracts` (ECTA API)

**Integration Status**: ⚠️ Needs API implementation

---

### 6. BankDocumentVerificationForm → document_verifications (NEW)

**Form**: `/frontend/src/components/forms/BankDocumentVerificationForm.tsx`

**Database Table**: `document_verifications` (needs creation)

**API Endpoint**: `POST /api/documents/verify` (Commercial Bank API)

**Integration Status**: ⚠️ Needs database table

---

### 7. ECTAQualityForm → quality_inspections

**Form**: `/frontend/src/components/forms/ECTAQualityForm.tsx`

**Database Table**: `quality_inspections` (exists)

**API Endpoint**: `POST /api/quality/inspect` (ECTA API)

**Integration Status**: ⚠️ Needs API implementation

---

### 8. NBEFXApprovalForm → fx_approvals (NEW)

**Form**: `/frontend/src/components/forms/NBEFXApprovalForm.tsx`

**Database Table**: `fx_approvals` (needs creation)

**API Endpoint**: `POST /api/approvals` (National Bank API)

**Integration Status**: ⚠️ Needs database table

---

## Required Database Tables

### 1. customs_clearances
```sql
CREATE TABLE customs_clearances (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(100) NOT NULL,
    declaration_number VARCHAR(100) UNIQUE NOT NULL,
    inspection_notes TEXT,
    duty_paid DECIMAL(15,2),
    tax_paid DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'pending',
    cleared_by INTEGER REFERENCES users(id),
    cleared_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. shipments
```sql
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(100) NOT NULL,
    booking_number VARCHAR(100) UNIQUE NOT NULL,
    vessel_name VARCHAR(255),
    departure_port VARCHAR(100),
    arrival_port VARCHAR(100),
    departure_date DATE,
    arrival_date DATE,
    container_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. document_verifications
```sql
CREATE TABLE document_verifications (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(100) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_hash VARCHAR(255),
    verification_status VARCHAR(50) DEFAULT 'pending',
    verified_by INTEGER REFERENCES users(id),
    verification_notes TEXT,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. fx_approvals
```sql
CREATE TABLE fx_approvals (
    id SERIAL PRIMARY KEY,
    export_id VARCHAR(100) NOT NULL,
    export_value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    exchange_rate DECIMAL(10,4),
    local_value DECIMAL(15,2),
    approval_status VARCHAR(50) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    approval_notes TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Implementation Priority

### Phase 1: Critical Forms (Immediate)
1. ✅ ECTALicenseForm → Already done
2. 🔧 CustomsClearanceForm → Create table + API
3. 🔧 ShipmentScheduleForm → Create table + API
4. 🔧 NBEFXApprovalForm → Create table + API

### Phase 2: Quality & Verification (Next)
5. 🔧 ECXApprovalForm → API implementation
6. 🔧 ECTAQualityForm → API implementation
7. 🔧 BankDocumentVerificationForm → Create table + API

### Phase 3: Contracts (Later)
8. 🔧 ECTAContractForm → API implementation

---

## Next Steps

1. Create missing database tables
2. Implement API endpoints for each form
3. Update frontend forms to call real APIs
4. Add validation and error handling
5. Test end-to-end workflows
