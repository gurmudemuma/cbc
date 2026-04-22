# Payment System Implementation Plan

## Overview
Implement a comprehensive payment tracking and management system for coffee export transactions, integrated with the existing sales contract and export workflows.

## Payment Workflow

### 1. Payment Initiation
- Triggered when sales contract is finalized
- Buyer initiates payment through their bank
- Payment linked to specific export/contract

### 2. Payment Methods Supported
- **LC (Letter of Credit)** - Most common for international trade
- **TT (Telegraphic Transfer)** - Wire transfer
- **CAD (Cash Against Documents)** - Payment on document presentation
- **DP (Documents Against Payment)** - Payment before document release
- **DA (Documents Against Acceptance)** - Payment after acceptance
- **OA (Open Account)** - Payment after delivery

### 3. Payment Stages
1. **INITIATED** - Payment process started
2. **LC_OPENED** - Letter of Credit opened (for LC payments)
3. **DOCUMENTS_SUBMITTED** - Export documents submitted to bank
4. **UNDER_REVIEW** - Bank reviewing documents
5. **APPROVED** - Payment approved by bank
6. **PROCESSING** - Payment being processed
7. **COMPLETED** - Payment received by exporter
8. **FAILED** - Payment failed
9. **DISPUTED** - Payment under dispute
10. **REFUNDED** - Payment refunded

### 4. Key Actors
- **Exporter**: Receives payment, submits documents
- **Buyer**: Initiates payment
- **Commercial Bank**: Processes LC, verifies documents
- **NBE (National Bank of Ethiopia)**: Approves foreign exchange
- **ECTA**: Monitors compliance

## Database Schema

### payments Table
```sql
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID REFERENCES exports(export_id),
    contract_id UUID REFERENCES sales_contracts(contract_id),
    exporter_id UUID REFERENCES exporter_profiles(exporter_id),
    buyer_id UUID REFERENCES buyer_registry(buyer_id),
    
    -- Payment Details
    payment_method VARCHAR(50) NOT NULL, -- LC, TT, CAD, DP, DA, OA
    payment_terms VARCHAR(100), -- Net 30, Net 60, etc.
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10, 4),
    amount_etb DECIMAL(15, 2), -- Amount in Ethiopian Birr
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'INITIATED',
    stage VARCHAR(50) DEFAULT 'INITIATED',
    
    -- LC Specific
    lc_number VARCHAR(100),
    lc_issuing_bank VARCHAR(255),
    lc_advising_bank VARCHAR(255),
    lc_opening_date TIMESTAMP,
    lc_expiry_date TIMESTAMP,
    lc_amount DECIMAL(15, 2),
    
    -- Document Submission
    documents_submitted_at TIMESTAMP,
    documents_approved_at TIMESTAMP,
    documents_rejected_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Payment Processing
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    
    -- Bank Details
    processing_bank VARCHAR(255),
    bank_reference VARCHAR(100),
    swift_code VARCHAR(20),
    
    -- Compliance
    nbe_approval_status VARCHAR(50),
    nbe_approval_date TIMESTAMP,
    nbe_reference VARCHAR(100),
    
    -- Audit
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Blockchain
    blockchain_tx_id VARCHAR(255),
    blockchain_synced BOOLEAN DEFAULT FALSE
);
```

### payment_milestones Table
```sql
CREATE TABLE payment_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    milestone_type VARCHAR(50) NOT NULL, -- ADVANCE, SHIPMENT, DELIVERY, FINAL
    amount DECIMAL(15, 2) NOT NULL,
    percentage DECIMAL(5, 2),
    due_date TIMESTAMP,
    
    status VARCHAR(50) DEFAULT 'PENDING',
    paid_at TIMESTAMP,
    paid_amount DECIMAL(15, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### payment_documents Table
```sql
CREATE TABLE payment_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT,
    document_hash VARCHAR(255),
    
    submitted_by VARCHAR(255),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    review_status VARCHAR(50), -- PENDING, APPROVED, REJECTED
    review_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### payment_transactions Table
```sql
CREATE TABLE payment_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    transaction_type VARCHAR(50) NOT NULL, -- DEBIT, CREDIT, FEE, REFUND
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    from_account VARCHAR(255),
    to_account VARCHAR(255),
    
    bank_reference VARCHAR(100),
    swift_reference VARCHAR(100),
    
    status VARCHAR(50) DEFAULT 'PENDING',
    processed_at TIMESTAMP,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### payment_audit_log Table
```sql
CREATE TABLE payment_audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(payment_id) ON DELETE CASCADE,
    
    action VARCHAR(100) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    
    performed_by VARCHAR(255) NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT
);
```

## API Endpoints

### Exporter Endpoints
- `POST /api/payments/initiate` - Initiate payment for export
- `GET /api/payments` - List all payments for exporter
- `GET /api/payments/:paymentId` - Get payment details
- `POST /api/payments/:paymentId/documents` - Submit payment documents
- `GET /api/payments/:paymentId/status` - Get payment status
- `GET /api/payments/statistics` - Get payment statistics

### Bank Endpoints
- `GET /api/payments/pending-review` - Get payments pending bank review
- `POST /api/payments/:paymentId/lc/open` - Open Letter of Credit
- `POST /api/payments/:paymentId/documents/review` - Review submitted documents
- `POST /api/payments/:paymentId/approve` - Approve payment
- `POST /api/payments/:paymentId/reject` - Reject payment
- `POST /api/payments/:paymentId/process` - Process payment
- `POST /api/payments/:paymentId/complete` - Mark payment as completed

### NBE Endpoints
- `GET /api/payments/pending-fx-approval` - Get payments pending FX approval
- `POST /api/payments/:paymentId/fx/approve` - Approve foreign exchange
- `POST /api/payments/:paymentId/fx/reject` - Reject foreign exchange

### Admin/ECTA Endpoints
- `GET /api/payments/all` - Get all payments (admin view)
- `GET /api/payments/statistics/global` - Global payment statistics
- `GET /api/payments/:paymentId/audit-log` - Get payment audit log

## Blockchain Integration

### Smart Contract Functions
```javascript
// Record payment initiation
async InitiatePayment(paymentId, exportId, amount, currency, method)

// Update payment status
async UpdatePaymentStatus(paymentId, status, updatedBy)

// Record LC opening
async OpenLetterOfCredit(paymentId, lcNumber, amount, expiryDate)

// Record document submission
async SubmitPaymentDocuments(paymentId, documentHashes)

// Approve payment
async ApprovePayment(paymentId, approvedBy, bankReference)

// Complete payment
async CompletePayment(paymentId, completedAt, transactionReference)

// Query payment
async GetPayment(paymentId)

// Query exporter payments
async GetExporterPayments(exporterId)
```

## Frontend Components

### Exporter Views
1. **Payment Dashboard** - Overview of all payments
2. **Payment Details** - Detailed payment information
3. **Document Submission** - Upload payment documents
4. **Payment Timeline** - Visual timeline of payment stages

### Bank Views
1. **Payment Review Dashboard** - Pending payments for review
2. **LC Management** - Letter of Credit management
3. **Document Verification** - Verify submitted documents
4. **Payment Processing** - Process approved payments

### NBE Views
1. **FX Approval Dashboard** - Foreign exchange approvals
2. **Payment Monitoring** - Monitor all payments

## Implementation Phases

### Phase 1: Database & Core API (Priority: HIGH)
- ✅ Create database migrations
- ✅ Implement payment initiation endpoint
- ✅ Implement payment listing endpoints
- ✅ Implement payment status tracking

### Phase 2: Bank Integration (Priority: HIGH)
- ✅ Implement LC management
- ✅ Implement document review workflow
- ✅ Implement payment approval workflow
- ✅ Implement payment processing

### Phase 3: Blockchain Integration (Priority: MEDIUM)
- ✅ Add payment functions to chaincode
- ✅ Implement blockchain sync
- ✅ Add payment queries

### Phase 4: Frontend (Priority: MEDIUM)
- ✅ Build payment dashboard
- ✅ Build payment details view
- ✅ Build document submission interface
- ✅ Build bank review interface

### Phase 5: Advanced Features (Priority: LOW)
- Payment milestones
- Automated notifications
- Payment analytics
- Integration with external payment gateways

## Security Considerations

1. **Authentication**: All payment endpoints require authentication
2. **Authorization**: Role-based access control (exporter, bank, NBE, admin)
3. **Audit Trail**: All payment actions logged
4. **Document Security**: Encrypted document storage
5. **Blockchain Verification**: Critical payment events recorded on blockchain
6. **Compliance**: NBE approval required for foreign exchange

## Testing Strategy

1. **Unit Tests**: Test individual payment functions
2. **Integration Tests**: Test payment workflow end-to-end
3. **Role-Based Tests**: Test with different user roles
4. **Blockchain Tests**: Verify blockchain sync
5. **Performance Tests**: Test with multiple concurrent payments

## Success Metrics

- Payment initiation success rate > 95%
- Average payment processing time < 5 days
- Document approval rate > 90%
- Zero payment fraud incidents
- 100% audit trail coverage
