# Coffee Export Payment Workflow - Complete Guide

## Overview
This document describes the complete workflow from exporter registration to payment transactions being stored in the ledger (PostgreSQL + Blockchain).

## System Architecture

### Dual-Write Mode
The system operates in **hybrid mode** with dual-write capability:
- **PostgreSQL**: Primary data store for all transactions (immediate consistency)
- **Blockchain (Hyperledger Fabric)**: Immutable ledger for audit trail and verification
- **Sync Service**: Ensures data consistency between PostgreSQL and blockchain

### Data Flow
```
User Action → Gateway API → PostgreSQL (Write) → Kafka Event → Blockchain Bridge → Fabric Chaincode → Ledger
                                ↓
                          Response to User
```

## Complete Workflow Steps

### Phase 1: Exporter Registration & Qualification

#### Step 1.1: User Registration
```bash
POST /api/auth/register
{
  "username": "exporter1",
  "password": "password123",
  "email": "exporter@example.com",
  "role": "exporter"
}
```
**Storage**: 
- PostgreSQL: `users` table
- Blockchain: Not stored (authentication data)

#### Step 1.2: Create Exporter Profile
```bash
POST /api/exporter/profile
{
  "businessName": "Ethiopian Coffee Exports Ltd",
  "tin": "TIN0000000002",
  "businessAddress": "Addis Ababa, Ethiopia",
  "contactPerson": "John Doe",
  "phoneNumber": "+251911234567",
  "email": "contact@ethiopiancoffee.com"
}
```
**Storage**:
- PostgreSQL: `exporter_profiles` table
- Blockchain: `ExporterProfile` asset via `createExporterProfile` chaincode

#### Step 1.3: Submit Pre-Registration Documents
```bash
POST /api/ecta/pre-registration
{
  "businessLicense": "...",
  "taxClearance": "...",
  "bankReference": "..."
}
```
**Storage**:
- PostgreSQL: `pre_registration_applications` table
- Blockchain: `PreRegistration` asset

#### Step 1.4: ECTA Approval Process
- ECTA reviews documents
- Approves/rejects application
- Issues qualifications (lab, taster, competence certificate, license)

**Storage**:
- PostgreSQL: `exporter_qualifications` table
- Blockchain: `ExporterQualification` asset

### Phase 2: Export Declaration

#### Step 2.1: Create Export Declaration
```bash
POST /api/exports
{
  "coffeeType": "Arabica Yirgacheffe",
  "quantity": 10000,
  "destinationCountry": "United States",
  "buyerId": "buyer-uuid",
  "contractId": "contract-uuid"
}
```
**Storage**:
- PostgreSQL: `exports` table
- Blockchain: `Export` asset via `createExport` chaincode

#### Step 2.2: ECX Verification
- ECX verifies coffee quality
- Issues quality certificate

**Storage**:
- PostgreSQL: `exports` table (status updated)
- Blockchain: `Export` asset updated

#### Step 2.3: Customs Clearance
- Customs reviews export documents
- Approves for shipment

**Storage**:
- PostgreSQL: `exports` table (status updated)
- Blockchain: `Export` asset updated

### Phase 3: Payment Initiation & Processing

#### Step 3.1: Initiate Payment
```bash
POST /api/payments/initiate
{
  "exportId": "export-uuid",
  "paymentMethod": "LC",
  "amount": 50000.00,
  "currency": "USD",
  "paymentTerms": "Net 30",
  "lcDetails": {
    "lcNumber": "LC-2024-001",
    "issuingBank": "Commercial Bank of Ethiopia",
    "expiryDate": "2024-12-31"
  }
}
```
**Storage**:
- PostgreSQL: `payments` table (status: INITIATED)
- PostgreSQL: `payment_audit_log` table (action: PAYMENT_INITIATED)
- Blockchain: `Payment` asset via `initiatePayment` chaincode
- Kafka: `payment.initiated` event published

**Response**:
```json
{
  "success": true,
  "payment": {
    "paymentId": "uuid",
    "exportId": "export-uuid",
    "amount": 50000.00,
    "currency": "USD",
    "paymentMethod": "LC",
    "status": "INITIATED",
    "initiatedAt": "2024-04-23T12:00:00Z"
  }
}
```

#### Step 3.2: Submit Payment Documents
```bash
POST /api/payments/{paymentId}/documents
{
  "documents": [
    {
      "documentType": "COMMERCIAL_INVOICE",
      "documentName": "Invoice-2024-001.pdf",
      "documentUrl": "https://storage.example.com/invoices/...",
      "documentHash": "sha256hash"
    },
    {
      "documentType": "BILL_OF_LADING",
      "documentName": "BOL-2024-001.pdf",
      "documentUrl": "https://storage.example.com/bol/...",
      "documentHash": "sha256hash"
    },
    {
      "documentType": "CERTIFICATE_OF_ORIGIN",
      "documentName": "COO-2024-001.pdf",
      "documentUrl": "https://storage.example.com/coo/...",
      "documentHash": "sha256hash"
    }
  ]
}
```
**Storage**:
- PostgreSQL: `payment_documents` table
- PostgreSQL: `payments` table (status: DOCUMENTS_SUBMITTED)
- PostgreSQL: `payment_audit_log` table (action: DOCUMENTS_SUBMITTED)
- Blockchain: `PaymentDocument` assets via `submitPaymentDocuments` chaincode
- Kafka: `payment.documents.submitted` event published

#### Step 3.3: Bank Review & Approval
```bash
# Bank reviews documents
POST /api/payments/bank/{paymentId}/documents/review
{
  "documentId": "doc-uuid",
  "reviewStatus": "APPROVED",
  "reviewNotes": "All documents verified"
}

# Bank approves payment
POST /api/payments/bank/{paymentId}/approve
{
  "approvalNotes": "Payment approved for processing"
}
```
**Storage**:
- PostgreSQL: `payment_documents` table (review_status: APPROVED)
- PostgreSQL: `payments` table (status: APPROVED)
- PostgreSQL: `payment_audit_log` table (action: PAYMENT_APPROVED)
- Blockchain: `Payment` asset updated via `approvePayment` chaincode
- Kafka: `payment.approved` event published

#### Step 3.4: NBE Foreign Exchange Approval
```bash
POST /api/payments/nbe/{paymentId}/fx/approve
{
  "exchangeRate": 57.50,
  "amountEtb": 2875000.00,
  "approvalNotes": "FX approved at current rate"
}
```
**Storage**:
- PostgreSQL: `payments` table (exchange_rate, amount_etb, fx_approved_at)
- PostgreSQL: `payment_audit_log` table (action: FX_APPROVED)
- Blockchain: `Payment` asset updated via `approveFX` chaincode
- Kafka: `payment.fx.approved` event published

#### Step 3.5: Payment Processing
```bash
POST /api/payments/bank/{paymentId}/process
{
  "transactionReference": "TXN-2024-001",
  "processingNotes": "Payment processed via SWIFT"
}
```
**Storage**:
- PostgreSQL: `payments` table (status: PROCESSING)
- PostgreSQL: `payment_transactions` table
- PostgreSQL: `payment_audit_log` table (action: PAYMENT_PROCESSING)
- Blockchain: `PaymentTransaction` asset via `processPayment` chaincode
- Kafka: `payment.processing` event published

#### Step 3.6: Payment Completion
```bash
POST /api/payments/bank/{paymentId}/complete
{
  "completionReference": "COMP-2024-001",
  "completionNotes": "Payment received and confirmed"
}
```
**Storage**:
- PostgreSQL: `payments` table (status: COMPLETED, completed_at)
- PostgreSQL: `payment_transactions` table (status: COMPLETED)
- PostgreSQL: `payment_audit_log` table (action: PAYMENT_COMPLETED)
- Blockchain: `Payment` asset updated via `completePayment` chaincode
- Kafka: `payment.completed` event published

### Phase 4: Ledger Storage & Verification

#### Blockchain Ledger Structure

**Payment Asset on Blockchain**:
```json
{
  "docType": "Payment",
  "paymentId": "uuid",
  "exportId": "export-uuid",
  "exporterId": "exporter-uuid",
  "buyerId": "buyer-uuid",
  "paymentMethod": "LC",
  "amount": 50000.00,
  "currency": "USD",
  "exchangeRate": 57.50,
  "amountEtb": 2875000.00,
  "status": "COMPLETED",
  "lcNumber": "LC-2024-001",
  "lcIssuingBank": "Commercial Bank of Ethiopia",
  "initiatedAt": "2024-04-23T12:00:00Z",
  "completedAt": "2024-04-30T15:30:00Z",
  "documents": [
    {
      "documentId": "doc-uuid-1",
      "documentType": "COMMERCIAL_INVOICE",
      "documentHash": "sha256hash",
      "reviewStatus": "APPROVED"
    }
  ],
  "transactions": [
    {
      "transactionId": "txn-uuid-1",
      "transactionType": "PAYMENT_PROCESSING",
      "transactionReference": "TXN-2024-001",
      "timestamp": "2024-04-28T10:00:00Z"
    }
  ],
  "auditTrail": [
    {
      "action": "PAYMENT_INITIATED",
      "performedBy": "exporter1",
      "timestamp": "2024-04-23T12:00:00Z"
    },
    {
      "action": "DOCUMENTS_SUBMITTED",
      "performedBy": "exporter1",
      "timestamp": "2024-04-24T09:00:00Z"
    },
    {
      "action": "PAYMENT_APPROVED",
      "performedBy": "banker1",
      "timestamp": "2024-04-26T14:00:00Z"
    },
    {
      "action": "FX_APPROVED",
      "performedBy": "nbe1",
      "timestamp": "2024-04-27T11:00:00Z"
    },
    {
      "action": "PAYMENT_PROCESSING",
      "performedBy": "banker1",
      "timestamp": "2024-04-28T10:00:00Z"
    },
    {
      "action": "PAYMENT_COMPLETED",
      "performedBy": "banker1",
      "timestamp": "2024-04-30T15:30:00Z"
    }
  ],
  "createdAt": "2024-04-23T12:00:00Z",
  "updatedAt": "2024-04-30T15:30:00Z"
}
```

#### Query Payment from Blockchain
```bash
# Via Gateway API (reads from blockchain)
GET /api/payments/{paymentId}?source=blockchain

# Via Fabric CLI
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n ecta \
  -c '{"function":"getPayment","Args":["payment-uuid"]}'
```

#### Query Payment History from Blockchain
```bash
# Get complete audit trail
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n ecta \
  -c '{"function":"getPaymentHistory","Args":["payment-uuid"]}'
```

## Data Consistency & Synchronization

### Blockchain Bridge Service
The `coffee-blockchain-bridge` service ensures data consistency:

1. **Listens to Kafka Events**: Subscribes to payment-related topics
2. **Invokes Chaincode**: Calls appropriate Fabric chaincode functions
3. **Handles Failures**: Retries failed blockchain writes
4. **Maintains Sync Status**: Tracks which records are synced to blockchain

### Sync Status Table
```sql
SELECT * FROM sync_status WHERE entity_type = 'payment';
```

**Columns**:
- `entity_id`: Payment UUID
- `entity_type`: 'payment'
- `sync_status`: 'PENDING', 'SYNCED', 'FAILED'
- `blockchain_tx_id`: Fabric transaction ID
- `last_sync_attempt`: Timestamp
- `error_message`: If sync failed

## Verification & Audit

### Verify Payment in PostgreSQL
```sql
SELECT 
  p.payment_id,
  p.amount,
  p.currency,
  p.status,
  p.initiated_at,
  p.completed_at,
  COUNT(pd.document_id) as document_count,
  COUNT(pt.transaction_id) as transaction_count
FROM payments p
LEFT JOIN payment_documents pd ON p.payment_id = pd.payment_id
LEFT JOIN payment_transactions pt ON p.payment_id = pt.payment_id
WHERE p.payment_id = 'payment-uuid'
GROUP BY p.payment_id;
```

### Verify Payment in Blockchain
```bash
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n ecta \
  -c '{"function":"getPayment","Args":["payment-uuid"]}' \
  | jq .
```

### Compare PostgreSQL vs Blockchain
```bash
# Get from PostgreSQL
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/payments/payment-uuid?source=postgres

# Get from Blockchain
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/payments/payment-uuid?source=blockchain

# Compare hashes
```

## Payment Statistics & Reporting

### Exporter Statistics
```bash
GET /api/payments/statistics
```
**Returns**:
- Total payments
- Completed payments
- Pending payments
- Failed payments
- Total amount received
- Pending amount
- Average processing time

### Bank Statistics
```bash
GET /api/payments/bank/statistics
```
**Returns**:
- Payments pending review
- Payments approved
- Total payment volume
- Average approval time

### NBE Statistics
```bash
GET /api/payments/nbe/statistics
```
**Returns**:
- FX approvals pending
- FX approvals completed
- Total foreign exchange approved
- Average exchange rate

## Testing the Complete Workflow

### Prerequisites
1. System running: `docker-compose -f docker-compose-hybrid.yml up -d`
2. Exporter registered and qualified
3. Export declaration created and approved

### Test Script
```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"exporter1","password":"password123"}' \
  | jq -r '.token')

# 2. Create export (if needed)
EXPORT_ID=$(curl -X POST http://localhost:3000/api/exports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coffeeType": "Arabica Yirgacheffe",
    "quantity": 10000,
    "destinationCountry": "United States"
  }' | jq -r '.export.exportId')

# 3. Initiate payment
PAYMENT_ID=$(curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"exportId\": \"$EXPORT_ID\",
    \"paymentMethod\": \"LC\",
    \"amount\": 50000.00,
    \"currency\": \"USD\"
  }" | jq -r '.payment.paymentId')

# 4. Submit documents
curl -X POST http://localhost:3000/api/payments/$PAYMENT_ID/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "documentType": "COMMERCIAL_INVOICE",
        "documentName": "Invoice-2024-001.pdf"
      }
    ]
  }'

# 5. Verify in PostgreSQL
docker exec coffee-postgres psql -U postgres -d coffee_export_db \
  -c "SELECT * FROM payments WHERE payment_id = '$PAYMENT_ID';"

# 6. Verify in Blockchain (after sync)
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n ecta \
  -c "{\"function\":\"getPayment\",\"Args\":[\"$PAYMENT_ID\"]}"
```

## Troubleshooting

### Payment not appearing in blockchain
1. Check sync status: `SELECT * FROM sync_status WHERE entity_id = 'payment-uuid';`
2. Check bridge logs: `docker logs coffee-bridge`
3. Check Kafka messages: `docker exec coffee-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic payment.initiated --from-beginning`

### Payment stuck in INITIATED status
1. Check if documents were submitted
2. Check bank user has reviewed documents
3. Check payment_audit_log for status changes

### FX approval not working
1. Verify NBE user is logged in
2. Check payment status is APPROVED before FX approval
3. Check NBE service logs

## API Endpoints Summary

### Exporter Endpoints
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/{id}/documents` - Submit documents
- `GET /api/payments` - List payments
- `GET /api/payments/{id}` - Get payment details
- `GET /api/payments/statistics` - Get statistics

### Bank Endpoints
- `GET /api/payments/bank/pending-review` - Pending payments
- `POST /api/payments/bank/{id}/documents/review` - Review document
- `POST /api/payments/bank/{id}/approve` - Approve payment
- `POST /api/payments/bank/{id}/process` - Process payment
- `POST /api/payments/bank/{id}/complete` - Complete payment

### NBE Endpoints
- `GET /api/payments/nbe/pending-fx-approval` - Pending FX approvals
- `POST /api/payments/nbe/{id}/fx/approve` - Approve FX
- `POST /api/payments/nbe/{id}/fx/reject` - Reject FX
- `GET /api/payments/nbe/statistics` - Get FX statistics

## Conclusion

The payment workflow is fully integrated with both PostgreSQL and Blockchain:
- **PostgreSQL** provides immediate consistency and fast queries
- **Blockchain** provides immutable audit trail and verification
- **Kafka** ensures asynchronous synchronization
- **Bridge Service** maintains data consistency

All payment transactions are stored in the ledger with complete audit trails, ensuring transparency and traceability throughout the coffee export process.
