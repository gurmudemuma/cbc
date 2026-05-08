# Auto-Qualification Logic by Exporter Type

## Overview
The system automatically qualifies exporters based on their business type and capital requirements. When all business rules are met, the system acts as ECTA and auto-approves the necessary certificates.

## Qualification Requirements by Type

### 1. FARMER Type Exporters
**Simplified Requirements** (Small-scale producers)
- ✅ Competence Certificate (required)
- ✅ Export License (required)
- ⊘ Laboratory Certificate (NOT required)
- ⊘ Taster Certificate (NOT required)

**Rationale**: Farmers typically don't have their own laboratories or certified tasters. They rely on cooperative facilities or third-party services.

**Capital Threshold**: Minimum as per business rules validation

### 2. PRIVATE/COMPANY/UNION Type Exporters
**Full Requirements** (Commercial exporters)
- ✅ Laboratory Certificate (required)
- ✅ Taster Certificate (required)
- ✅ Competence Certificate (required)
- ✅ Export License (required)

**Rationale**: Commercial exporters must have proper facilities and qualified personnel to ensure coffee quality.

**Capital Threshold**: Minimum as per business rules validation

## Auto-Qualification Flow

### Step 1: Registration Validation
```
User submits registration
  ↓
System validates business rules:
  - Valid TIN format
  - Valid email
  - Minimum capital for type
  - Valid company name
  ↓
If ALL rules pass:
  - Status = 'approved'
  - User can login
  - Proceed to auto-qualification
  ↓
If ANY rule fails:
  - Status = 'rejected'
  - User cannot login
  - Must contact ECTA
```

### Step 2: Auto-Qualification (Immediate)
```
If status = 'approved':
  ↓
Check exporter type:
  ↓
If FARMER:
  - Create Competence Certificate (AUTO)
  - Issue Export License (AUTO)
  - Status: Fully Qualified ✓
  ↓
If PRIVATE/COMPANY/UNION:
  - Create Laboratory Certificate (AUTO)
  - Create Taster Certificate (AUTO)
  - Create Competence Certificate (AUTO)
  - Issue Export License (AUTO)
  - Status: Fully Qualified ✓
```

## Implementation Details

### Database Tables Used
1. `exporter_profiles` - Main exporter record
2. `coffee_laboratories` - Laboratory certificates (if required)
3. `coffee_tasters` - Taster certificates (if required)
4. `competence_certificates` - Competence certificates (always required)
5. `export_licenses` - Export licenses (always required)

### Auto-Generated Certificate Numbers
- Laboratory: `LAB-{timestamp}`
- Taster: `TASTER-{timestamp}`
- Competence: `COMP-{timestamp}`
- License: `LIC-{year}-{6-digit-sequence}`

### Certificate Validity
- All certificates: Valid for 1 year from issue date
- Renewal required before expiry

## Example Scenarios

### Scenario 1: Farmer Registration
```json
{
  "username": "farmer1",
  "businessType": "FARMER",
  "capitalETB": 5000000,
  "companyName": "Small Coffee Farm",
  "tin": "1234567890"
}
```

**Result**:
- ✅ Registration approved (meets capital threshold)
- ✅ Competence certificate auto-created
- ✅ Export license auto-issued: `LIC-2026-123456`
- ⊘ No laboratory certificate (not required)
- ⊘ No taster certificate (not required)
- **Status**: Fully qualified, can export immediately

### Scenario 2: Private Exporter Registration
```json
{
  "username": "exporter1",
  "businessType": "PRIVATE",
  "capitalETB": 50000000,
  "companyName": "Ethiopian Coffee Exports Ltd",
  "tin": "9876543210"
}
```

**Result**:
- ✅ Registration approved (meets capital threshold)
- ✅ Laboratory certificate auto-created: `LAB-1234567890`
- ✅ Taster certificate auto-created: `TASTER-1234567890`
- ✅ Competence certificate auto-created: `COMP-1234567890`
- ✅ Export license auto-issued: `LIC-2026-234567`
- **Status**: Fully qualified, can export immediately

### Scenario 3: Insufficient Capital
```json
{
  "username": "poor_exporter",
  "businessType": "PRIVATE",
  "capitalETB": 1000000,
  "companyName": "Small Trader",
  "tin": "5555555555"
}
```

**Result**:
- ❌ Registration rejected (below capital threshold)
- ⊘ No certificates created
- ⊘ No license issued
- **Status**: Rejected, cannot login
- **Action**: Must contact ECTA for manual review

## Business Rules Summary

### Capital Requirements (from business rules)
- **Individual/Private**: 15M ETB minimum
- **Company/Union/Cooperative**: 20M ETB minimum
- **Farmer**: Lower threshold (as per regulations)

### Validation Rules
1. TIN must be exactly 10 digits
2. Email must be valid format
3. Phone must be Ethiopian format (+251 or 0 + 9 digits)
4. Company name must be 3-255 characters
5. Capital must meet minimum for type

### Auto-Approval Criteria
**ALL of the following must be true:**
- ✅ Valid TIN format
- ✅ Valid email format
- ✅ Valid phone format (if provided)
- ✅ Valid company name
- ✅ Capital >= minimum for type
- ✅ No duplicate TIN/email/username

**If ALL criteria met:**
- System acts as ECTA
- Auto-creates required certificates
- Auto-issues export license
- Exporter can start exporting immediately

## Benefits

### For Farmers
- Simplified process (no lab/taster requirements)
- Faster qualification
- Lower barriers to entry
- Can export immediately if capital sufficient

### For Commercial Exporters
- Instant qualification if rules met
- No waiting for manual ECTA approval
- All certificates issued automatically
- Can start business operations immediately

### For ECTA
- Reduced manual workload
- Focus on edge cases and appeals
- Consistent application of rules
- Full audit trail maintained

## Manual Override

ECTA staff can still:
- Manually approve rejected applications
- Revoke auto-approved licenses
- Update certificate details
- Handle appeals and special cases

## Testing

### Test Auto-Qualification for Farmer
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_farmer",
    "password": "Test@1234",
    "email": "farmer@test.com",
    "businessType": "FARMER",
    "companyName": "Test Farm",
    "tin": "1111111111",
    "capitalETB": 5000000,
    "phone": "+251911111111",
    "address": "Rural Area"
  }'
```

Expected: Approved with competence + license only (no lab/taster)

### Test Auto-Qualification for Private Exporter
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_private",
    "password": "Test@1234",
    "email": "private@test.com",
    "businessType": "PRIVATE",
    "companyName": "Test Exports Ltd",
    "tin": "2222222222",
    "capitalETB": 50000000,
    "phone": "+251922222222",
    "address": "Addis Ababa"
  }'
```

Expected: Approved with all 4 certificates (lab + taster + competence + license)

## Status
✅ Implemented
✅ Type-based qualification logic
✅ Auto-approval when rules met
✅ Proper certificate generation
✅ Database integration complete

**Last Updated**: March 26, 2026
