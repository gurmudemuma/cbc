# ECTA Automatic Contract Registration System

## Overview
Implemented an automatic system that submits all finalized sales contracts to ECTA for registration, streamlining the contract approval workflow.

## Implementation Date
April 30, 2026

## Features Implemented

### 1. Automatic Submission to ECTA
When a sales contract is accepted and finalized, the system automatically:
- ✅ Creates a finalization record in PostgreSQL
- ✅ Writes the contract to the blockchain
- ✅ **Submits the contract to ECTA for registration** (NEW)
- ✅ Logs all activities in the negotiation history

### 2. ECTA Submissions Tracking Table
Created a new database table `ecta_contract_submissions` to track:
- Submission ID (UUID)
- Draft ID (reference to contract_drafts)
- ECTA Reference Number
- Exporter and Buyer IDs
- Submission Status (PENDING_REGISTRATION, REGISTERED, REJECTED, CANCELLED)
- Submission and Registration timestamps
- LC Number (assigned by ECTA upon registration)
- Registration notes
- Contract data (JSONB for flexibility)

**Table Schema:**
```sql
CREATE TABLE ecta_contract_submissions (
  submission_id UUID PRIMARY KEY,
  draft_id UUID NOT NULL REFERENCES contract_drafts(draft_id),
  ecta_reference_number VARCHAR(50),
  exporter_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  submission_status VARCHAR(50) DEFAULT 'PENDING_REGISTRATION',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  registered_at TIMESTAMP,
  registered_by VARCHAR(255),
  lc_number VARCHAR(100),
  registration_notes TEXT,
  contract_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. ECTA Dashboard Endpoint
**New API Endpoint:** `GET /api/ecta/contracts/pending-registration`

Returns all contracts awaiting ECTA registration with:
- Submission details
- Exporter information (name, TIN)
- Buyer information (name, country)
- Contract terms (coffee type, quantity, value, delivery date)
- Submission timestamp

**Response Format:**
```json
{
  "success": true,
  "count": 5,
  "pendingRegistrations": [
    {
      "submissionId": "uuid",
      "draftId": "uuid",
      "ectaReferenceNumber": "ECTA-SC-20260430-12345",
      "contractNumber": "DRAFT-1234567890",
      "submittedAt": "2026-04-30T10:00:00Z",
      "exporter": {
        "name": "Ethiopian Coffee Exports Ltd",
        "tin": "TIN0000000002"
      },
      "buyer": {
        "name": "Starbucks Corporation",
        "country": "United States"
      },
      "contract": {
        "coffeeType": "Arabica",
        "quantity": 1000,
        "totalValue": 250000,
        "currency": "USD",
        "deliveryDate": "2026-06-30"
      }
    }
  ]
}
```

### 4. Updated ECTA Registration Endpoint
**Endpoint:** `POST /api/ecta/contracts/:draftId/register`

Now updates both:
1. `contract_drafts` table (sets LC number and registration details)
2. `ecta_contract_submissions` table (updates status to REGISTERED)

### 5. Frontend Integration
Updated `ECTASalesContractRegistration.tsx` to:
- Fetch pending registrations from the new endpoint
- Display contracts awaiting registration in a clean table
- Show submission timestamps
- Allow ECTA officers to register contracts with LC numbers

## Workflow

### Step 1: Contract Finalization (Automatic)
```
Buyer accepts draft
    ↓
System finalizes contract
    ↓
Generates ECTA reference number (ECTA-SC-YYYYMMDD-XXXXX)
    ↓
Writes to PostgreSQL ✓
    ↓
Writes to Blockchain ✓
    ↓
**Submits to ECTA for registration** ✓ (NEW)
    ↓
Creates record in ecta_contract_submissions table
```

### Step 2: ECTA Registration (Manual)
```
ECTA officer logs in
    ↓
Views pending registrations dashboard
    ↓
Reviews contract details
    ↓
Clicks "Register" button
    ↓
System generates LC Number
    ↓
Registers on blockchain
    ↓
Updates submission status to REGISTERED
    ↓
Contract ready for payment processing
```

## Benefits

### 1. **Automation**
- No manual submission required from exporters
- Contracts automatically queued for ECTA review
- Reduces processing time

### 2. **Transparency**
- Complete audit trail of submissions
- Timestamps for all actions
- Status tracking (PENDING → REGISTERED)

### 3. **Efficiency**
- ECTA officers see all pending contracts in one dashboard
- Batch processing capability
- Reduced back-and-forth communication

### 4. **Compliance**
- All contracts must go through ECTA registration
- No contracts can bypass the system
- Regulatory requirements enforced automatically

## Database Changes

### New Table
- `ecta_contract_submissions` - Tracks all submissions to ECTA

### Modified Endpoints
- `POST /api/contracts/drafts/:draftId/accept` - Now submits to ECTA
- `POST /api/ecta/contracts/:draftId/register` - Now updates submission status

### New Endpoints
- `GET /api/ecta/contracts/pending-registration` - Lists pending registrations

## Files Modified

### Backend
1. `coffee-export-gateway/src/routes/contract-drafts.routes.js`
   - Added ECTA submission logic to `/accept` endpoint
   - Creates submission record after finalization

2. `coffee-export-gateway/src/routes/sales-contract-network.routes.js`
   - Added `GET /ecta/contracts/pending-registration` endpoint
   - Updated `POST /ecta/contracts/:draftId/register` to update submission status

3. `coffee-export-gateway/src/migrations/create_ecta_submissions_table.sql`
   - New migration file for submissions table

### Frontend
1. `cbc/frontend/src/pages/ECTASalesContractRegistration.tsx`
   - Updated to fetch from new pending registrations endpoint
   - Displays submission information

## Testing

### Test Scenario 1: Contract Finalization
1. Log in as exporter
2. Create a draft contract with a buyer
3. Buyer accepts the contract
4. **Verify:** Contract appears in ECTA pending registrations dashboard
5. **Verify:** Submission record created in database

### Test Scenario 2: ECTA Registration
1. Log in as ECTA officer
2. Navigate to Sales Contract Registration page
3. View pending registrations
4. Click "Register" on a contract
5. **Verify:** LC number generated
6. **Verify:** Submission status updated to REGISTERED
7. **Verify:** Contract ready for payment processing

## API Response Examples

### Successful Finalization with ECTA Submission
```json
{
  "success": true,
  "message": "Contract accepted, finalized, and submitted to ECTA for registration",
  "draft": {
    "draft_id": "uuid",
    "status": "FINALIZED",
    "ecta_reference_number": "ECTA-SC-20260430-12345"
  },
  "syncStatus": {
    "postgres": true,
    "blockchain": true,
    "ectaSubmission": "submitted"
  },
  "note": "Contract finalized and submitted to ECTA for registration. Synced to blockchain."
}
```

### ECTA Pending Registrations List
```json
{
  "success": true,
  "count": 3,
  "pendingRegistrations": [...]
}
```

## Security Considerations

1. **Authentication Required:** All endpoints require valid JWT token
2. **Role-Based Access:** Only ECTA officers can register contracts
3. **Audit Trail:** All actions logged in negotiation history
4. **Data Validation:** Contract data validated before submission
5. **Non-Blocking:** ECTA submission failures don't block finalization

## Future Enhancements

1. **Email Notifications:** Notify ECTA officers of new submissions
2. **Batch Registration:** Allow registering multiple contracts at once
3. **Auto-Registration:** Implement automatic registration for pre-approved exporters
4. **SLA Tracking:** Monitor time from submission to registration
5. **Rejection Workflow:** Handle rejected contracts with feedback loop

## Deployment Status

✅ **Database Migration:** Completed
✅ **Backend Implementation:** Deployed to coffee-gateway container
✅ **Frontend Updates:** Deployed to coffee-frontend container
✅ **Testing:** Ready for user acceptance testing

## Conclusion

The ECTA automatic registration system ensures that all finalized sales contracts are immediately submitted to ECTA for official registration, creating a seamless workflow from contract negotiation to payment processing. This automation reduces manual work, improves transparency, and ensures regulatory compliance.
