# Smart Contract Auto-Approval System

## Overview

The Coffee Export System uses **smart contract-based automatic validation** to approve or reject exporter registrations based on Ethiopian Coffee Export regulations. This eliminates manual approval delays and ensures consistent rule enforcement.

## Business Rules (Encoded in Smart Contract)

The smart contract validates the following rules automatically:

### 1. Minimum Capital Requirements
Based on ECTA regulations:
- **Individual/Private Exporters**: 15,000,000 ETB minimum
- **Company/Union/Cooperative**: 20,000,000 ETB minimum

### 2. TIN Validation
- Format: `TIN` followed by 10+ digits (e.g., `TIN1234567890`)
- Must be unique (no duplicate TINs allowed)

### 3. Email Validation
- Must be valid email format
- Used for notifications

### 4. Company Name
- Minimum 3 characters
- Required for all exporters

### 5. Business Type
Valid types:
- `PRIVATE_EXPORTER` (individual, 15M ETB minimum)
- `UNION` (company, 20M ETB minimum)
- `FARMER_COOPERATIVE` (company, 20M ETB minimum)

## Registration Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Exporter Submits Registration                            │
│    POST /api/auth/register                                   │
│    {                                                         │
│      username, password, email, companyName,                 │
│      tin, capitalETB, businessType, ...                      │
│    }                                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Gateway Validates Required Fields                        │
│    - All required fields present?                            │
│    - Capital meets minimum for business type?                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Smart Contract Validates Business Rules                  │
│    RegisterUser() function checks:                           │
│    ✓ Capital >= minimum for type                            │
│    ✓ TIN format valid                                       │
│    ✓ TIN not duplicate                                      │
│    ✓ Email format valid                                     │
│    ✓ Company name >= 3 chars                                │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ ALL RULES PASS   │  │ ANY RULE FAILS   │
│ Status: APPROVED │  │ Status: REJECTED │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ Can Login        │  │ Cannot Login     │
│ Profile Approved │  │ See Rejection    │
│ Continue Stages  │  │ Reasons          │
└──────────────────┘  └──────────────────┘
```

## Auto-Approval Logic (in Smart Contract)

```javascript
// From chaincode/ecta/index.js - RegisterUser()

let autoApprovalStatus = 'approved';
let rejectionReasons = [];

if (role === 'exporter') {
    // 1. Capital validation
    const type = businessType || 'PRIVATE_EXPORTER';
    const capitalType = (type === 'UNION' || type === 'FARMER_COOPERATIVE') 
        ? 'company' : 'individual';
    const minimumCapital = capitalType === 'individual' ? 15000000 : 20000000;
    
    if (!capitalETB || capitalETB < minimumCapital) {
        rejectionReasons.push(`Insufficient capital: ${capitalETB} ETB (minimum: ${minimumCapital} ETB)`);
    }
    
    // 2. TIN validation
    if (!tin || !/^TIN-?\d{10,}$/.test(tin)) {
        rejectionReasons.push('Invalid TIN format');
    }
    
    // 3. Duplicate TIN check
    // ... query blockchain for existing TIN ...
    
    // 4. Email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        rejectionReasons.push('Invalid email format');
    }
    
    // 5. Company name validation
    if (!companyName || companyName.length < 3) {
        rejectionReasons.push('Company name must be at least 3 characters');
    }
    
    // Determine final status
    if (rejectionReasons.length > 0) {
        autoApprovalStatus = 'rejected';
    }
}

// Set user status based on validation
user.status = autoApprovalStatus; // 'approved' or 'rejected'
user.approvedBy = autoApprovalStatus === 'approved' ? 'SMART_CONTRACT' : null;
user.rejectedBy = autoApprovalStatus === 'rejected' ? 'SMART_CONTRACT' : null;
user.rejectionReason = rejectionReasons.join('; ');
```

## Multi-Stage Qualification

After profile approval, exporters must complete additional stages:

1. **Profile** (auto-validated by smart contract)
   - Status: `approved` after passing business rules
   - Exporter can now login

2. **Laboratory Registration**
   - Submit laboratory details
   - ECTA verifies laboratory meets standards

3. **Taster Registration**
   - Submit taster credentials
   - ECTA verifies taster qualifications

4. **Competence Certificate**
   - Upload competence certificate
   - ECTA validates certificate

5. **Export License**
   - Final license issuance
   - Status becomes `active` with license number

## Hawa's Issue

### Problem
Hawa registered but exporter_profile data is incomplete:
```sql
username | email          | status  | business_name | tin | minimum_capital
---------|----------------|---------|---------------|-----|----------------
hawa     | hawa@gmail.com | pending |               |     |
```

### Root Cause
- Registration data didn't include required fields (companyName, tin, capitalETB)
- Smart contract couldn't validate incomplete data
- Status stuck in 'pending' instead of auto-approved/rejected

### Solution
Hawa must re-register with complete data:

```bash
POST /api/auth/register
{
  "username": "hawa",  # Use different username if hawa exists
  "password": "password123",
  "email": "hawa@gmail.com",
  "companyName": "Hawa Coffee Export PLC",
  "businessType": "PRIVATE_EXPORTER",
  "tin": "TIN1234567890",
  "capitalETB": 15000000,  # Must be >= 15M for individual
  "contactPerson": "Hawa Mohammed",
  "phone": "+251911234567",
  "address": "Addis Ababa, Ethiopia"
}
```

## Testing the Workflow

Run the test script:
```powershell
./test-hawa-registration.ps1
```

This will:
1. Register a test user with valid data (should auto-approve)
2. Try to register with insufficient capital (should reject)
3. Demonstrate the smart contract validation

## API Endpoints

### Register
```
POST /api/auth/register
Body: { username, password, email, companyName, tin, capitalETB, businessType, ... }
Response: { success, status: 'approved' | 'rejected', rejectionReasons }
```

### Check Status
```
GET /api/auth/registration-status/:username
Response: { username, status, approvedAt, rejectedAt, rejectionReason }
```

### Login
```
POST /api/auth/login
Body: { username, password }
Response: { token, user: { username, role, status } }
Note: Only works if status === 'approved'
```

## Benefits of Smart Contract Auto-Approval

1. **Instant Decisions**: No waiting for manual ECTA review
2. **Consistent Rules**: Same validation logic for all exporters
3. **Transparent**: Rejection reasons clearly stated
4. **Auditable**: All decisions recorded on blockchain
5. **Scalable**: Handles unlimited registrations without bottleneck

## Next Steps for Hawa

1. Delete incomplete registration (if possible) or use new username
2. Re-register with complete data including:
   - Company name
   - Valid TIN (TIN + 10 digits)
   - Capital >= 15M ETB
3. Smart contract will auto-approve if rules pass
4. Login and continue with remaining stages
