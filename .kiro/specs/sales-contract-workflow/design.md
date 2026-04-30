# Sales Contract Workflow - Technical Design Document

## Overview

The Sales Contract Workflow system enables coffee exporters to create, negotiate, and finalize sales contracts with international buyers through a structured digital process. The system integrates with blockchain technology for contract finalization and ECTA (Ethiopian Coffee and Tea Authority) for regulatory registration.

### Key Features
- Draft contract creation with detailed coffee specifications
- Buyer negotiation workflow with counter-offers
- Blockchain-based contract finalization
- ECTA registration and reference number generation
- Certificate generation and download
- Comprehensive audit trail and version control
- Email notifications for all parties
- Buyer portal for contract review and response

---

## Architecture

### System Components

\\\
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer (React)                       │
├─────────────────────────────────────────────────────────────────┤
│  SalesContractDashboard │ DraftForm │ NegotiationForm │ Timeline │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway / Backend                         │
├─────────────────────────────────────────────────────────────────┤
│  Contract Service │ Notification Service │ ECTA Service         │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┬──────────────┐
        ▼                 ▼              ▼
   ┌─────────┐      ┌──────────┐   ┌──────────┐
   │ Database│      │Blockchain│   │ECTA API  │
   │(PostgreSQL)    │(Hyperledger)  │Registry  │
   └─────────┘      └──────────┘   └──────────┘
\\\

### Data Flow

1. **Contract Creation**: Exporter creates draft → Stored in contract_drafts table
2. **Contract Sending**: Exporter sends to buyer → Status changes to COUNTERED → Email notification sent
3. **Buyer Response**: Buyer accepts/rejects/counters → Status updated → Exporter notified
4. **Negotiation Loop**: Parties exchange counter-offers → History tracked → Versions maintained
5. **Finalization**: Exporter finalizes accepted contract → Submitted to blockchain → ECTA registration triggered
6. **Registration**: ECTA generates reference number → Certificate generated → Exporter notified

---

## Components and Interfaces

### Frontend Components

#### 1. SalesContractDashboard (Enhanced)
- **Purpose**: Main dashboard for contract management
- **Tabs**: Drafts, Negotiation, Finalized
- **Features**:
  - Display contracts by status
  - Quick actions (Edit, Send, Finalize, Download Certificate)
  - Contract count badges
  - New Draft button
  - Search and filter capabilities

#### 2. SalesContractDraftForm (Enhanced)
- **Purpose**: Create and edit draft contracts
- **Fields**:
  - Buyer name, email
  - Coffee type (dropdown)
  - Quantity (bags)
  - Unit price
  - Currency (ISO 4217)
  - Payment terms (dropdown)
  - Delivery location
  - Delivery date
- **Validation**: Real-time field validation
- **Actions**: Save, Cancel, Send to Buyer

#### 3. SalesContractNegotiationForm (Enhanced)
- **Purpose**: Handle counter-offer responses
- **Features**:
  - Side-by-side comparison of original vs proposed terms
  - Modification form for counter-proposals
  - Accept/Reject/Counter buttons
  - Change highlighting

#### 4. ContractHistoryTimeline (New)
- **Purpose**: Display contract version history
- **Features**:
  - Timeline view of all versions
  - Status changes with timestamps
  - Actor information (exporter/buyer)
  - Changes made in each version
  - Ability to view previous versions

#### 5. BuyerPortalContracts (New)
- **Purpose**: Buyer interface for contract review
- **Features**:
  - List of contracts sent to buyer
  - Contract details view
  - Accept/Reject/Counter-Offer buttons
  - Rejection reason form
  - Counter-offer modification form

#### 6. ContractComparisonView (New)
- **Purpose**: Compare contract versions
- **Features**:
  - Side-by-side comparison
  - Highlighted differences
  - Version selector
  - Change history

#### 7. ContractCertificateDownload (New)
- **Purpose**: Download ECTA certificate
- **Features**:
  - PDF generation
  - Certificate details display
  - Download button
  - QR code for verification

### Backend Services

#### Contract Service
- **Endpoints**:
  - POST /api/contracts/drafts - Create draft
  - GET /api/contracts/drafts/:draftId - Get draft
  - PUT /api/contracts/drafts/:draftId - Update draft
  - DELETE /api/contracts/drafts/:draftId - Delete draft
  - POST /api/contracts/drafts/:draftId/send - Send to buyer
  - POST /api/contracts/drafts/:draftId/accept - Accept counter-offer
  - POST /api/contracts/drafts/:draftId/reject - Reject contract
  - POST /api/contracts/drafts/:draftId/counter - Submit counter-offer
  - POST /api/contracts/drafts/:draftId/finalize - Finalize to blockchain
  - GET /api/contracts/drafts/exporter/:exporterId - Get exporter's contracts
  - GET /api/contracts/:referenceNumber - Get by ECTA reference
  - POST /api/contracts/:draftId/certificate - Generate certificate
  - GET /api/buyer/contracts - Buyer portal contracts
  - POST /api/buyer/contracts/:draftId/respond - Buyer response

#### Notification Service
- **Endpoints**:
  - POST /api/notifications/send - Send notification
  - GET /api/notifications/:userId - Get user notifications
  - PUT /api/notifications/:notificationId/read - Mark as read

#### ECTA Service
- **Endpoints**:
  - POST /api/ecta/register - Register contract
  - GET /api/ecta/reference/:referenceNumber - Get reference details
  - POST /api/ecta/certificate/:contractId - Generate certificate

---

## Data Models

### Database Schema

#### contract_drafts Table
\\\sql
CREATE TABLE contract_drafts (
  draft_id UUID PRIMARY KEY,
  exporter_id UUID NOT NULL,
  buyer_id UUID,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(255) NOT NULL,
  coffee_type VARCHAR(100) NOT NULL,
  quantity_bags INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_terms VARCHAR(50) NOT NULL,
  delivery_location VARCHAR(255) NOT NULL,
  delivery_date DATE NOT NULL,
  lc_number VARCHAR(50),
  ecta_reference_number VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  blockchain_tx_hash VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  last_modified_at TIMESTAMP NOT NULL,
  finalized_at TIMESTAMP,
  FOREIGN KEY (exporter_id) REFERENCES exporter_profiles(exporter_id),
  FOREIGN KEY (buyer_id) REFERENCES buyer_registry(buyer_id)
);
\\\

#### contract_history Table
\\\sql
CREATE TABLE contract_history (
  history_id UUID PRIMARY KEY,
  draft_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  actor_type VARCHAR(20) NOT NULL,
  actor_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  rejection_reason TEXT,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (draft_id) REFERENCES contract_drafts(draft_id),
  UNIQUE(draft_id, version_number)
);
\\\

#### contract_notifications Table
\\\sql
CREATE TABLE contract_notifications (
  notification_id UUID PRIMARY KEY,
  draft_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP NOT NULL,
  read_at TIMESTAMP,
  FOREIGN KEY (draft_id) REFERENCES contract_drafts(draft_id)
);
\\\

#### contract_permissions Table
\\\sql
CREATE TABLE contract_permissions (
  permission_id UUID PRIMARY KEY,
  draft_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_email VARCHAR(255),
  permission_type VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  FOREIGN KEY (draft_id) REFERENCES contract_drafts(draft_id)
);
\\\

### Data Relationships

\\\
exporter_profiles
    ├─── contract_drafts (1:N)
    │        ├─── contract_history (1:N)
    │        ├─── contract_notifications (1:N)
    │        ├─── contract_permissions (1:N)
    │        └─── exports (1:N)
    └─── users (1:1)

buyer_registry
    └─── contract_drafts (1:N)
\\\

---

## Error Handling

### Validation Errors
- **Delivery Date**: Must be in future
- **Quantity**: Must be >= 1 bag
- **Unit Price**: Must be > 0
- **Payment Terms**: Must be from approved list
- **Currency**: Must be valid ISO 4217 code
- **Coffee Type**: Must be from supported varieties
- **Delivery Location**: Must be valid port/city

### Blockchain Errors
- **Submission Failure**: Retry up to 3 times with exponential backoff
- **Transaction Timeout**: Notify exporter, allow manual retry
- **Network Error**: Queue for retry, notify on recovery

### ECTA Registration Errors
- **Registration Failure**: Retry up to 3 times
- **Reference Generation Failure**: Notify exporter with manual registration instructions
- **Timeout**: Provide manual registration link

### Access Control Errors
- **Unauthorized Access**: Return 403 Forbidden
- **Invalid Buyer Email**: Return 400 Bad Request
- **Contract Locked**: Return 409 Conflict

---

## Testing Strategy

### Unit Tests
- Contract creation validation
- Status transition logic
- Permission checks
- Notification generation
- Certificate generation

### Integration Tests
- End-to-end contract workflow
- Blockchain submission
- ECTA registration
- Email notification delivery
- Database transactions

### Property-Based Testing
- Contract data round-trip (serialization/deserialization)
- Status transition invariants
- History immutability
- Permission enforcement

---

## Security Considerations

1. **Authentication**: JWT tokens for all API endpoints
2. **Authorization**: Role-based access control (RBAC)
3. **Data Encryption**: TLS for transit, encryption at rest for sensitive fields
4. **Audit Logging**: All contract modifications logged with user ID and timestamp
5. **Buyer Email Verification**: Verify buyer email before allowing responses
6. **Contract Locking**: Prevent modifications after finalization

---

## Deployment Considerations

1. **Database Migrations**: Schema creation and versioning
2. **Blockchain Network**: Hyperledger Fabric setup and configuration
3. **ECTA Integration**: API credentials and endpoint configuration
4. **Email Service**: SMTP configuration for notifications
5. **File Storage**: PDF certificate storage and retrieval

---

## API Endpoint Specifications

### Contract Management Endpoints

#### POST /api/contracts/drafts
**Create a new draft contract**
- **Request Body**:
  \\\json
  {
    "buyer_name": "string",
    "buyer_email": "string",
    "coffee_type": "string",
    "quantity_bags": "integer",
    "unit_price": "decimal",
    "currency": "string",
    "payment_terms": "string",
    "delivery_location": "string",
    "delivery_date": "date"
  }
  \\\
- **Response**: 201 Created with draft_id
- **Validation**: All fields required, delivery_date must be future, quantity >= 1, price > 0

#### GET /api/contracts/drafts/:draftId
**Retrieve draft contract details**
- **Response**: 200 OK with full contract object
- **Authorization**: Exporter must own contract or buyer email must match

#### PUT /api/contracts/drafts/:draftId
**Update draft contract**
- **Request Body**: Same as POST
- **Response**: 200 OK with updated contract
- **Constraints**: Only allowed if status is DRAFT

#### DELETE /api/contracts/drafts/:draftId
**Delete draft contract**
- **Response**: 204 No Content
- **Constraints**: Only allowed if status is DRAFT

#### POST /api/contracts/drafts/:draftId/send
**Send contract to buyer**
- **Request Body**: \{ "confirmation": true }\
- **Response**: 200 OK
- **Side Effects**: 
  - Status changes to COUNTERED
  - Email sent to buyer
  - Notification created
  - History entry created

#### POST /api/contracts/drafts/:draftId/accept
**Accept counter-offer**
- **Request Body**: \{ "confirmation": true }\
- **Response**: 200 OK
- **Side Effects**:
  - Status changes to ACCEPTED
  - Buyer notified
  - History entry created

#### POST /api/contracts/drafts/:draftId/reject
**Reject contract**
- **Request Body**: \{ "reason": "string" }\
- **Response**: 200 OK
- **Side Effects**:
  - Status changes to REJECTED
  - Reason stored in history
  - Buyer notified

#### POST /api/contracts/drafts/:draftId/counter
**Submit counter-offer**
- **Request Body**: Modified contract fields
- **Response**: 200 OK
- **Side Effects**:
  - Status remains COUNTERED
  - New version created in history
  - Buyer notified

#### POST /api/contracts/drafts/:draftId/finalize
**Finalize contract to blockchain**
- **Request Body**: \{ "confirmation": true }\
- **Response**: 200 OK with blockchain_tx_hash
- **Constraints**: Status must be ACCEPTED
- **Side Effects**:
  - Submitted to blockchain
  - ECTA registration triggered
  - Status changes to FINALIZED
  - History entry created

#### GET /api/contracts/drafts/exporter/:exporterId
**Get all contracts for exporter**
- **Query Parameters**: 
  - status (optional): DRAFT, COUNTERED, ACCEPTED, REJECTED, FINALIZED
  - page (optional): pagination
  - limit (optional): items per page
- **Response**: 200 OK with array of contracts

#### GET /api/contracts/:referenceNumber
**Get contract by ECTA reference number**
- **Response**: 200 OK with contract details
- **Authorization**: Public endpoint (reference number is public)

#### POST /api/contracts/:draftId/certificate
**Generate and download certificate**
- **Response**: 200 OK with PDF file
- **Constraints**: Contract must be FINALIZED
- **Side Effects**: Download timestamp recorded

### Buyer Portal Endpoints

#### GET /api/buyer/contracts
**Get contracts for buyer**
- **Query Parameters**: buyer_email (required)
- **Response**: 200 OK with array of contracts sent to buyer
- **Authorization**: Buyer email must match authenticated user

#### POST /api/buyer/contracts/:draftId/respond
**Buyer response to contract**
- **Request Body**:
  \\\json
  {
    "action": "ACCEPT|REJECT|COUNTER",
    "reason": "string (if REJECT)",
    "modifications": { ... } (if COUNTER)
  }
  \\\
- **Response**: 200 OK
- **Authorization**: Buyer email must match contract buyer_email
- **Side Effects**: Status updated, exporter notified

### Notification Endpoints

#### POST /api/notifications/send
**Send notification**
- **Request Body**:
  \\\json
  {
    "recipient_id": "uuid",
    "recipient_email": "string",
    "notification_type": "string",
    "subject": "string",
    "message": "string",
    "action_link": "string"
  }
  \\\
- **Response**: 201 Created

#### GET /api/notifications/:userId
**Get user notifications**
- **Query Parameters**: unread_only (optional boolean)
- **Response**: 200 OK with array of notifications

#### PUT /api/notifications/:notificationId/read
**Mark notification as read**
- **Response**: 200 OK

---

## Blockchain Integration

### Contract Finalization Process

1. **Validation Phase**:
   - Verify contract status is ACCEPTED
   - Verify all required fields populated
   - Verify both parties have agreed

2. **Blockchain Submission**:
   - Serialize contract to JSON
   - Create blockchain transaction
   - Submit to Hyperledger Fabric network
   - Receive transaction hash

3. **Transaction Recording**:
   - Store blockchain_tx_hash in contract_drafts
   - Create history entry with tx_hash
   - Update status to FINALIZED

4. **Error Handling**:
   - Retry up to 3 times on failure
   - Exponential backoff (1s, 2s, 4s)
   - Notify exporter on final failure
   - Provide manual submission option

### Smart Contract Interaction

The blockchain stores:
- Contract ID (draft_id)
- Exporter ID
- Buyer email
- Coffee specifications
- Pricing and payment terms
- Delivery terms
- Timestamp of finalization
- Digital signatures of both parties

---

## ECTA Registration Process

### Reference Number Generation Algorithm

\\\
Format: ECTA-YYYY-NNNNNN
- ECTA: Fixed prefix
- YYYY: Current year
- NNNNNN: Sequential 6-digit number (zero-padded)

Example: ECTA-2024-000001
\\\

### Registration Workflow

1. **Trigger**: Contract finalized to blockchain
2. **Request**: Send contract details to ECTA API
3. **Validation**: ECTA validates contract compliance
4. **Generation**: ECTA generates unique reference number
5. **Response**: ECTA returns reference number and registration timestamp
6. **Recording**: Store reference number in contract_drafts
7. **Notification**: Send reference number to exporter
8. **Certificate**: Generate downloadable certificate

### Retry Logic

- **Attempt 1**: Immediate submission
- **Attempt 2**: After 5 minutes (if failed)
- **Attempt 3**: After 15 minutes (if failed)
- **Final Failure**: Notify exporter with manual registration link

---

## Notification System

### Notification Types

1. **CONTRACT_SENT**: Exporter sends contract to buyer
2. **CONTRACT_ACCEPTED**: Buyer accepts contract
3. **CONTRACT_REJECTED**: Buyer rejects contract
4. **CONTRACT_COUNTERED**: Buyer submits counter-offer
5. **COUNTER_ACCEPTED**: Exporter accepts counter-offer
6. **CONTRACT_FINALIZED**: Contract finalized to blockchain
7. **ECTA_REGISTERED**: ECTA registration complete
8. **CERTIFICATE_READY**: Certificate generated and ready

### Email Templates

Each notification type has corresponding email template with:
- Subject line
- Body text with contract details
- Action link (for buyer portal access)
- Footer with system information

### Delivery Tracking

- Record sent_at timestamp
- Track delivery status (sent, bounced, opened)
- Retry failed deliveries
- Log all delivery attempts

---

## Access Control & Security

### Role-Based Access Control

**Exporter Role**:
- Create draft contracts
- Edit own DRAFT contracts
- Send contracts to buyers
- View own contracts
- Accept/reject buyer responses
- Finalize contracts
- Download certificates

**Buyer Role**:
- View contracts sent to them
- Accept/reject/counter contracts
- Cannot edit contracts
- Cannot finalize contracts

**ECTA Role**:
- Register contracts
- Generate reference numbers
- Issue certificates
- View all contracts (read-only)

**Admin Role**:
- Full access to all contracts
- Manual registration override
- System configuration

### Contract Ownership Verification

- Exporter ID must match authenticated user for edit operations
- Buyer email must match contract buyer_email for buyer operations
- All access attempts logged with user ID and timestamp

### Buyer Email Verification

- Buyer email verified before allowing responses
- Verification link sent to buyer email
- Verification token expires after 24 hours
- Unverified buyers cannot submit responses

### Contract Locking

- Contracts locked after finalization
- No modifications allowed on FINALIZED contracts
- History remains immutable
- Audit trail preserved

---

## Implementation Considerations

### Frontend Implementation

1. **State Management**: Use React Context or Redux for contract state
2. **Form Validation**: Real-time validation with error messages
3. **Optimistic Updates**: Update UI before server confirmation
4. **Error Boundaries**: Graceful error handling and recovery
5. **Loading States**: Show loading indicators during async operations
6. **Accessibility**: WCAG 2.1 AA compliance

### Backend Implementation

1. **Database Transactions**: Ensure atomicity of multi-step operations
2. **Idempotency**: Handle duplicate requests gracefully
3. **Rate Limiting**: Prevent abuse of API endpoints
4. **Logging**: Comprehensive logging for debugging and audit
5. **Monitoring**: Track API performance and error rates
6. **Caching**: Cache frequently accessed data (coffee types, payment terms)

### Testing Coverage

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: End-to-end workflows
- **Property-Based Tests**: Data invariants and round-trips
- **Performance Tests**: Load testing for concurrent users
- **Security Tests**: SQL injection, XSS, CSRF prevention

---

## Future Enhancements

1. **Multi-language Support**: Support for Amharic, Arabic, French
2. **Mobile App**: Native mobile application for exporters and buyers
3. **Advanced Analytics**: Dashboard with contract metrics and trends
4. **Automated Compliance**: Automatic compliance checking against regulations
5. **Integration with Banks**: Direct LC verification and payment processing
6. **Blockchain Explorer**: Public view of finalized contracts
7. **Smart Contracts**: Automated contract execution on blockchain
8. **API Webhooks**: Real-time notifications for external systems

