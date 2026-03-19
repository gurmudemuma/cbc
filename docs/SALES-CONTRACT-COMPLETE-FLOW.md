# Sales Contract Complete Flow - End-to-End Guide

## Overview

The coffee export system implements a complete sales contract workflow that bridges PostgreSQL (for flexible contract management) and Hyperledger Fabric blockchain (for immutable finalized contracts). This document explains the entire flow from buyer registration to certificate generation.

## Architecture

### Hybrid System Design
- **PostgreSQL**: Stores contract drafts, negotiations, and all intermediate states
- **Hyperledger Fabric**: Records finalized contracts immutably on blockchain
- **PDF Generator**: Creates professional sales contract certificates

## Complete Workflow

### Phase 1: Buyer Registration & Opportunity Creation

#### 1.1 Register Buyer
```
POST /api/buyers/register
```

**Request:**
```json
{
  "companyName": "Global Coffee Imports Ltd",
  "country": "Germany",
  "registrationNumber": "HRB-123456",
  "taxId": "DE123456789",
  "email": "buyer@globalcoffee.de",
  "phone": "+49-30-123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Buyer registered successfully",
  "buyer": {
    "buyer_id": "uuid-1234",
    "company_name": "Global Coffee Imports Ltd",
    "country": "Germany",
    "verification_status": "PENDING",
    "created_at": "2026-03-12T10:00:00Z"
  }
}
```

**Database**: Inserted into `buyer_registry` table

#### 1.2 Create Buyer Opportunity
```
POST /api/marketplace/opportunities
```

**Request:**
```json
{
  "buyerId": "uuid-1234",
  "title": "Need 100 bags of Yirgacheffe Coffee",
  "coffeeType": "Yirgacheffe",
  "quantityMin": 100,
  "quantityMax": 200,
  "targetPriceMin": 3.50,
  "targetPriceMax": 4.50,
  "currency": "USD",
  "destinationCountry": "Germany"
}
```

**Database**: Inserted into `buyer_opportunities` table with status `OPEN`

### Phase 2: Contract Draft Creation & Negotiation

#### 2.1 Create Contract Draft
```
POST /api/contracts/drafts
```

**Request:**
```json
{
  "buyerId": "uuid-1234",
  "coffeeType": "Yirgacheffe",
  "originRegion": "Yirgacheffe Region",
  "quantity": 150,
  "unitPrice": 4.00,
  "currency": "USD",
  "paymentTerms": "Net 30",
  "paymentMethod": "LC",
  "incoterms": "FOB",
  "deliveryDate": "2026-04-15",
  "portOfLoading": "Port of Djibouti",
  "portOfDischarge": "Port of Hamburg",
  "governingLaw": "CISG",
  "arbitrationLocation": "Geneva",
  "arbitrationRules": "ICC",
  "qualityGrade": "Grade 1",
  "specialConditions": "Organic certified, Fair Trade compliant",
  "certificationsRequired": ["ORGANIC", "FAIR_TRADE"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract draft created",
  "draft": {
    "draft_id": "draft-uuid-5678",
    "contract_number": "DRAFT-1710238800000",
    "version": 1,
    "status": "DRAFT",
    "total_value": 600.00,
    "created_at": "2026-03-12T10:05:00Z"
  }
}
```

**Database**: 
- Inserted into `contract_drafts` table with status `DRAFT`
- Activity logged in `contract_negotiations` table

#### 2.2 Retrieve Draft Details
```
GET /api/contracts/drafts/{draftId}
```

**Response includes:**
- All contract terms
- Buyer name and country
- Exporter name
- Total value calculation

#### 2.3 Negotiation Options

**Option A: Counter Offer**
```
POST /api/contracts/drafts/{draftId}/counter
```

Creates a new version of the draft with updated terms. Status becomes `COUNTERED`.

**Option B: Accept Draft**
```
POST /api/contracts/drafts/{draftId}/accept
```

Updates draft status to `ACCEPTED`. This is required before finalization.

**Option C: Reject Draft**
```
POST /api/contracts/drafts/{draftId}/reject
```

Updates draft status to `REJECTED` with optional reason.

#### 2.4 View Negotiation History
```
GET /api/contracts/drafts/{draftId}/history
```

Returns all negotiation activities (CREATE, COUNTER, ACCEPT, REJECT) with timestamps and actors.

### Phase 3: Contract Finalization

#### 3.1 Finalize Contract to Blockchain
```
POST /api/contracts/drafts/{draftId}/finalize
```

**Prerequisites:**
- Draft status must be `ACCEPTED`
- Exporter must be authenticated

**Process:**
1. Validates draft status is `ACCEPTED`
2. Prepares contract data for blockchain
3. Calls Hyperledger Fabric chaincode function: `FinalizeContractFromDraft`
4. Receives blockchain contract ID
5. Updates draft status to `FINALIZED`
6. Stores blockchain contract ID in database

**Response:**
```json
{
  "success": true,
  "message": "Contract finalized and recorded on blockchain",
  "draft": {
    "draft_id": "draft-uuid-5678",
    "status": "FINALIZED",
    "finalized_contract_id": "CONTRACT-FABRIC-9999"
  },
  "blockchainContractId": "CONTRACT-FABRIC-9999"
}
```

**Database**: 
- Updated `contract_drafts` set status = `FINALIZED`
- Stored `finalized_contract_id` from blockchain
- Activity logged in `contract_negotiations`

**Blockchain**: 
- Contract recorded immutably on Hyperledger Fabric
- Chaincode: `FinalizeContractFromDraft`
- Channel: `coffee-export-channel`

### Phase 4: Certificate Generation

#### 4.1 Generate Sales Contract Certificate
```
GET /api/contracts/drafts/{draftId}/certificate
```

**Prerequisites:**
- Draft status must be `FINALIZED`
- Exporter must be authenticated

**Process:**
1. Fetches finalized draft with all related data
2. Validates status is `FINALIZED`
3. Prepares certificate data including:
   - Exporter information (name, TIN)
   - Buyer information (company, country, tax ID)
   - Contract terms (quantity, price, total value)
   - Payment & delivery terms
   - Legal framework details
   - Blockchain verification info
4. Generates professional PDF with:
   - Two-column layout for optimal space
   - QR code for verification
   - Blockchain contract ID
   - Issue date and certificate number
5. Returns PDF file for download

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="sales-contract-{draftId}.pdf"`
- Binary PDF data

**Certificate Contents:**
```
┌─────────────────────────────────────────────────────────┐
│         SALES CONTRACT CERTIFICATE                      │
│  Official Record of Coffee Export Sales Agreement       │
├─────────────────────────────────────────────────────────┤
│ Certificate Number: CERT-{contractId}                   │
│ Issue Date: March 12, 2026                              │
│ Status: FINALIZED & BINDING                             │
├──────────────────────┬──────────────────────────────────┤
│ EXPORTER INFO        │ BUYER INFO                       │
│ ID: {exporterId}     │ ID: {buyerId}                    │
│ Name: {name}         │ Company: {company}               │
│ TIN: {tin}           │ Country: {country}               │
│ Country: Ethiopia    │ Tax ID: {taxId}                  │
├──────────────────────┴──────────────────────────────────┤
│ CONTRACT TERMS                                           │
│ Coffee Type: Yirgacheffe                                │
│ Quantity: 150 bags (60kg each)                          │
│ Unit Price: USD 4.00                                    │
│ Total Value: USD 600.00                                 │
│ Quality Grade: Grade 1                                  │
├─────────────────────────────────────────────────────────┤
│ PAYMENT & DELIVERY TERMS                                │
│ Payment Terms: Net 30                                   │
│ Incoterms: FOB                                          │
│ Delivery Date: 2026-04-15                               │
│ Port of Loading: Port of Djibouti                       │
│ Port of Discharge: Port of Hamburg                      │
├─────────────────────────────────────────────────────────┤
│ LEGAL FRAMEWORK                                         │
│ Governing Law: CISG                                     │
│ Arbitration: ICC (Geneva)                               │
├─────────────────────────────────────────────────────────┤
│ BLOCKCHAIN VERIFICATION                                 │
│ Contract ID: CONTRACT-FABRIC-9999                       │
│ Blockchain: Hyperledger Fabric                          │
│ Network: Coffee Export Channel                          │
│ Immutable Record: Yes                                   │
│                                                    [QR]  │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### Key Tables

#### contract_drafts
```sql
- draft_id (UUID, PK)
- contract_number (VARCHAR)
- version (INT)
- status (ENUM: DRAFT, COUNTERED, ACCEPTED, REJECTED, FINALIZED)
- exporter_id (UUID, FK)
- buyer_id (UUID, FK)
- coffee_type (VARCHAR)
- quantity (INT)
- unit_price (DECIMAL)
- total_value (DECIMAL)
- payment_terms (VARCHAR)
- incoterms (VARCHAR)
- delivery_date (DATE)
- proposed_by (VARCHAR) - username
- proposed_by_type (ENUM: EXPORTER, BUYER)
- responded_by (VARCHAR) - username
- responded_by_type (ENUM: EXPORTER, BUYER)
- finalized_contract_id (VARCHAR) - blockchain contract ID
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### contract_negotiations
```sql
- negotiation_id (UUID, PK)
- draft_id (UUID, FK)
- actor_id (VARCHAR) - username
- actor_type (ENUM: EXPORTER, BUYER)
- action_type (ENUM: CREATE, COUNTER, ACCEPT, REJECT)
- message (TEXT)
- changes_made (JSONB)
- created_at (TIMESTAMP)
```

#### buyer_registry
```sql
- buyer_id (UUID, PK)
- company_name (VARCHAR)
- country (VARCHAR)
- registration_number (VARCHAR)
- tax_id (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- verification_status (ENUM: PENDING, VERIFIED, REJECTED)
- reputation_score (DECIMAL)
- created_at (TIMESTAMP)
```

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/buyers/register` | Register new buyer |
| GET | `/api/buyers/{buyerId}` | Get buyer details |
| POST | `/api/marketplace/opportunities` | Create buyer opportunity |
| POST | `/api/contracts/drafts` | Create contract draft |
| GET | `/api/contracts/drafts/{draftId}` | Get draft details |
| POST | `/api/contracts/drafts/{draftId}/counter` | Submit counter offer |
| POST | `/api/contracts/drafts/{draftId}/accept` | Accept draft |
| POST | `/api/contracts/drafts/{draftId}/reject` | Reject draft |
| GET | `/api/contracts/drafts/{draftId}/history` | View negotiation history |
| POST | `/api/contracts/drafts/{draftId}/finalize` | Finalize to blockchain |
| GET | `/api/contracts/drafts/{draftId}/certificate` | Download certificate |

## Testing

### Run Complete Flow Test
```bash
# Windows PowerShell
.\scripts\test-sales-contract-flow.ps1

# Linux/Mac
bash scripts/test-sales-contract-flow.sh
```

The test script:
1. Logs in as exporter
2. Registers a buyer
3. Creates a buyer opportunity
4. Creates a contract draft
5. Retrieves draft details
6. Retrieves legal frameworks
7. Retrieves contract clauses
8. Accepts the contract
9. Finalizes to blockchain
10. Generates certificate PDF

## Error Handling

### Common Errors

**Draft not found (404)**
```json
{ "error": "Draft not found" }
```

**Draft must be ACCEPTED before finalization (400)**
```json
{ "error": "Draft must be ACCEPTED before finalization" }
```

**Certificate can only be generated for finalized contracts (400)**
```json
{ "error": "Certificate can only be generated for finalized contracts" }
```

**Missing required fields (400)**
```json
{ "error": "Missing required fields: buyerId, coffeeType, quantity, unitPrice" }
```

## Security

- All endpoints require authentication (JWT token)
- Exporters can only access their own drafts
- Buyers can only respond to drafts sent to them
- Blockchain transactions are immutable
- Certificates are digitally signed with QR code verification

## Best Practices

1. **Always validate buyer information** before creating opportunities
2. **Use appropriate payment terms** (LC, TT, etc.) based on buyer reputation
3. **Include all certifications** required by destination country
4. **Review legal frameworks** before finalizing
5. **Keep negotiation history** for dispute resolution
6. **Archive certificates** for compliance and audit trails
7. **Verify blockchain contract ID** before sharing certificate

## Troubleshooting

### Certificate Generation Fails
- Ensure draft status is `FINALIZED`
- Check that all required fields are populated
- Verify pdfkit and qrcode packages are installed

### Blockchain Finalization Fails
- Ensure draft status is `ACCEPTED`
- Check blockchain network connectivity
- Verify chaincode is deployed and running
- Check endorsement policy requirements

### Buyer Not Found
- Verify buyer was registered successfully
- Check buyer_id is correct UUID format
- Ensure buyer registration completed without errors

## Future Enhancements

- Email notifications for contract status changes
- Digital signatures on certificates
- Multi-language certificate support
- Contract amendment workflow
- Automated compliance checks
- Integration with shipping providers
