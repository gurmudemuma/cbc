# Business Rules and Auto-Approval System

## Overview

The system uses **business rules** to automatically approve or reject exporter registrations. This is NOT a smart contract - it's application-level validation logic that runs in the gateway before data reaches the blockchain.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXPORTER REGISTRATION FLOW                    │
└─────────────────────────────────────────────────────────────────┘

1. GATEWAY VALIDATION (Application Level)
   ├─ Validate TIN format (10 digits)
   ├─ Validate email format
   ├─ Validate phone number
   ├─ Validate company name
   ├─ Check minimum capital requirements
   │  ├─ Individual/Private: 15M ETB minimum
   │  └─ Company/Union/Cooperative: 20M ETB minimum
   ├─ Validate address (if provided)
   └─ Validate contact person (if provided)
   
   Result: APPROVED or REJECTED
   ↓
   
2. BLOCKCHAIN REGISTRATION (Smart Contract)
   ├─ Receives status from gateway
   ├─ Stores user record with status
   ├─ If APPROVED: Creates exporter profile
   └─ Emits events for audit trail
   
   Result: User stored on blockchain
   ↓
   
3. DATABASE SYNC (PostgreSQL)
   ├─ Replicates user data
   ├─ Stores approval status
   └─ Enables fast queries
   
   Result: User can login if APPROVED
```

## Business Rules

### Rule 1: TIN Format Validation
- **What**: Tax Identification Number must be exactly 10 digits
- **Why**: Ethiopian TIN format requirement
- **Example**: `1234567890` ✓, `TIN-1234567890` ✗

### Rule 2: Email Format Validation
- **What**: Email must be valid format
- **Why**: Communication with exporter
- **Example**: `exporter@company.com` ✓, `invalid-email` ✗

### Rule 3: Phone Number Validation
- **What**: Phone must start with +251 or 0, followed by 9 digits
- **Why**: Ethiopian phone number format
- **Example**: `+251911234567` ✓, `0911234567` ✓, `911234567` ✗

### Rule 4: Company Name Validation
- **What**: Company name must be 3-255 characters
- **Why**: Reasonable business name requirement
- **Example**: `Ethiopian Coffee Exports Ltd` ✓, `ABC` ✓, `AB` ✗

### Rule 5: Minimum Capital Requirement
- **What**: 
  - Individual/Private exporters: 15M ETB minimum
  - Company/Union/Cooperative: 20M ETB minimum
- **Why**: ECTA regulatory requirement for financial stability
- **Example**: 
  - Individual with 15M ETB ✓
  - Individual with 14M ETB ✗
  - Company with 20M ETB ✓
  - Company with 19M ETB ✗

### Rule 6: Address Validation (Optional)
- **What**: If provided, address must be at least 5 characters
- **Why**: Valid business address requirement
- **Example**: `123 Main Street, Addis Ababa` ✓, `123 St` ✗

### Rule 7: Contact Person Validation (Optional)
- **What**: If provided, contact person name must be at least 3 characters
- **Why**: Valid contact person requirement
- **Example**: `John Doe` ✓, `Jo` ✗

## Auto-Approval Logic

### When Does Auto-Approval Happen?

An exporter is **AUTO-APPROVED** when:
1. All required fields are provided
2. All business rules pass validation
3. No rejection reasons exist

### When Does Auto-Rejection Happen?

An exporter is **AUTO-REJECTED** when:
1. Any business rule fails
2. Rejection reason is recorded
3. User cannot login until manually approved by ECTA

### Example Scenarios

#### Scenario 1: Auto-Approved ✓
```json
{
  "username": "exporter1",
  "email": "exporter@company.com",
  "phone": "+251911234567",
  "companyName": "Ethiopian Coffee Exports Ltd",
  "tin": "1234567890",
  "capitalETB": 20000000,
  "businessType": "PRIVATE_EXPORTER"
}
```
**Result**: APPROVED - All rules pass, user can login immediately

#### Scenario 2: Auto-Rejected (Insufficient Capital) ✗
```json
{
  "username": "exporter2",
  "email": "exporter@company.com",
  "phone": "+251911234567",
  "companyName": "Small Coffee Traders",
  "tin": "9876543210",
  "capitalETB": 10000000,
  "businessType": "PRIVATE_EXPORTER"
}
```
**Result**: REJECTED - Capital (10M ETB) < minimum (15M ETB)

#### Scenario 3: Auto-Rejected (Invalid TIN) ✗
```json
{
  "username": "exporter3",
  "email": "exporter@company.com",
  "phone": "+251911234567",
  "companyName": "Coffee Trading Co",
  "tin": "123456789",
  "capitalETB": 15000000,
  "businessType": "PRIVATE_EXPORTER"
}
```
**Result**: REJECTED - TIN must be 10 digits (provided: 9 digits)

## Implementation Details

### Gateway Validation Function
**File**: `coffee-export-gateway/src/routes/auth.routes.js`
**Function**: `validateExporterBusinessRules(data)`

```javascript
function validateExporterBusinessRules(data) {
  // Returns: { valid: boolean, status: 'approved'|'rejected', reason: string }
  
  // Validates all rules
  // Returns APPROVED if all pass
  // Returns REJECTED with reason if any fail
}
```

### Smart Contract Integration
**File**: `chaincode/ecta/index.js`
**Function**: `RegisterUser(ctx, userDataJSON)`

```javascript
async RegisterUser(ctx, userDataJSON) {
  // Receives status from gateway
  // If status provided: uses gateway validation result
  // If no status: performs smart contract validation
  // Stores user with approval status
  // Creates exporter profile if approved
}
```

### Database Sync
**File**: `coffee-export-gateway/sync-users-to-blockchain.js`

Syncs existing PostgreSQL users to blockchain:
```bash
npm run sync-users
```

## Login Flow After Auto-Approval

```
1. Exporter submits registration
   ↓
2. Gateway validates business rules
   ├─ If REJECTED: Return error, user cannot login
   └─ If APPROVED: Continue
   ↓
3. User registered on blockchain with status='approved'
   ↓
4. User registered in PostgreSQL with status='ACTIVE'
   ↓
5. Exporter can login immediately
   ├─ Username: exporter1
   ├─ Password: (their password)
   └─ Status: APPROVED
```

## Testing Auto-Approval

### Test Case 1: Valid Registration (Should Auto-Approve)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_exporter",
    "password": "password123",
    "email": "test@company.com",
    "phone": "+251911234567",
    "companyName": "Test Coffee Exports",
    "tin": "1234567890",
    "capitalETB": 20000000,
    "businessType": "PRIVATE_EXPORTER"
  }'
```

Expected Response:
```json
{
  "success": true,
  "status": "approved",
  "message": "Registration successful - auto-approved"
}
```

### Test Case 2: Insufficient Capital (Should Auto-Reject)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "poor_exporter",
    "password": "password123",
    "email": "poor@company.com",
    "phone": "+251911234567",
    "companyName": "Poor Coffee Traders",
    "tin": "9876543210",
    "capitalETB": 5000000,
    "businessType": "PRIVATE_EXPORTER"
  }'
```

Expected Response:
```json
{
  "error": "Registration rejected",
  "reason": "Minimum capital requirement for individual exporters is 15,000,000 ETB. Provided: 5000000",
  "status": "rejected"
}
```

## Dual System Verification

Both systems must work together:

1. **Gateway validates** business rules
2. **Smart contract stores** the decision
3. **Database replicates** the data
4. **Login endpoint** checks both systems

If user exists in database but not on blockchain (or vice versa), login fails.

## Future Enhancements

1. **Manual Override**: ECTA admin can manually approve rejected users
2. **Appeal Process**: Rejected users can appeal with additional documentation
3. **Dynamic Rules**: Business rules can be updated without code changes
4. **Audit Trail**: All validation decisions are recorded on blockchain
5. **Notifications**: Exporters notified of approval/rejection status

## Summary

- **Business Rules** = Application-level validation logic (gateway)
- **Smart Contract** = Blockchain storage and consensus (chaincode)
- **Auto-Approval** = Automatic approval when all rules pass
- **Dual System** = Both database and blockchain must have user data
- **Professional** = No demo mode, proper validation for all exporters
