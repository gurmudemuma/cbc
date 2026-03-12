# ECTA Two Exporter Categories - Final Implementation

## Overview

ECTA has TWO exporter categories based on business structure, with different minimum capital requirements:

| Category | Minimum Capital (ETB) | Qualification |
|----------|----------------------|---------------|
| **Individual/Private** | 15,000,000 | FULL (all certificates + license) |
| **Company (Union/Cooperative)** | 20,000,000 | FULL (all certificates + license) |

## Business Type Mapping

### Individual/Private Category (15M ETB minimum):
- `PRIVATE_EXPORTER` → individual
- `INDIVIDUAL` → individual

### Company Category (20M ETB minimum):
- `UNION` → company
- `FARMER_COOPERATIVE` → company

## Implementation

### 1. Chaincode (chaincode/ecta/index.js)

```javascript
// Determine capital type from business type
const capitalType = (type === 'UNION' || type === 'FARMER_COOPERATIVE') ? 'company' : 'individual';
const minimumCapital = capitalType === 'individual' ? 15000000 : 20000000;

// Validation
if (!capitalETB || capitalETB < minimumCapital) {
    rejectionReasons.push(`Insufficient capital: ${capitalETB} ETB (minimum: ${minimumCapital} ETB for ${capitalType})`);
}

// If approved → FULL qualification (no partial)
if (autoApprovalStatus === 'approved') {
    // Auto-approve ALL stages:
    // - Profile
    // - Laboratory Certificate
    // - Taster Certificate
    // - Competence Certificate
    // - Export License (issued immediately)
    
    exporterStatus = 'active'; // Fully qualified
    licenseNumber = `LIC-${year}-${random}`;
}
```

### 2. Gateway (coffee-export-gateway/src/routes/auth.routes.js)

```javascript
const capitalType = (type === 'UNION' || type === 'FARMER_COOPERATIVE') ? 'company' : 'individual';
const minimumCapital = capitalType === 'individual' ? 15000000 : 20000000;

if (capitalETB < minimumCapital) {
    return res.status(400).json({ 
        error: `Minimum capital requirement for ${capitalType} exporters is ${minimumCapital.toLocaleString()} ETB`,
        capitalType: capitalType
    });
}
```

## Registration Flow

### Example 1: Individual Exporter (15M ETB)
```json
{
  "username": "individual1",
  "businessType": "PRIVATE_EXPORTER",
  "capitalETB": 15000000
}
```

**Result:**
- ✅ Meets individual minimum (15M)
- ✅ Status: `active` (fully qualified)
- ✅ License issued: `LIC-2026-12345`
- ✅ All certificates approved
- ✅ Can export immediately

### Example 2: Company Exporter (20M ETB)
```json
{
  "username": "union1",
  "businessType": "UNION",
  "capitalETB": 20000000
}
```

**Result:**
- ✅ Meets company minimum (20M)
- ✅ Status: `active` (fully qualified)
- ✅ License issued: `LIC-2026-67890`
- ✅ All certificates approved
- ✅ Can export immediately

### Example 3: Individual with Insufficient Capital
```json
{
  "username": "individual2",
  "businessType": "PRIVATE_EXPORTER",
  "capitalETB": 10000000
}
```

**Result:**
- ❌ Below individual minimum (15M)
- ❌ Status: `rejected`
- ❌ Reason: "Insufficient capital: 10000000 ETB (minimum: 15000000 ETB for individual)"

### Example 4: Company with Insufficient Capital
```json
{
  "username": "union2",
  "businessType": "UNION",
  "capitalETB": 18000000
}
```

**Result:**
- ❌ Below company minimum (20M)
- ❌ Status: `rejected`
- ❌ Reason: "Insufficient capital: 18000000 ETB (minimum: 20000000 ETB for company)"

## Key Points

1. **No Partial Qualification**: If you meet the minimum, you get EVERYTHING
2. **Two Categories Only**: Individual (15M) or Company (20M)
3. **Automatic License Issuance**: License issued immediately upon approval
4. **All Certificates Auto-Approved**: Laboratory, Taster, Competence all approved
5. **Status = 'active'**: Fully qualified exporters can start exporting immediately

## Files Updated

1. ✅ `chaincode/ecta/index.js` - RegisterUser() function
2. ✅ `coffee-export-gateway/src/routes/auth.routes.js` - Registration validation
3. ✅ `scripts/upgrade-chaincode-v1.2.bat` - Deployment script ready

## Next Steps

1. Deploy updated chaincode:
   ```bash
   scripts\upgrade-chaincode-v1.2.bat
   ```

2. Restart gateway:
   ```bash
   docker restart coffee-gateway
   ```

3. Test both categories:
   - Individual with 15M ETB → Should get full qualification
   - Company with 20M ETB → Should get full qualification
   - Individual with 14M ETB → Should be rejected
   - Company with 19M ETB → Should be rejected

## Testing

```powershell
# Test individual exporter (15M)
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "username": "test_individual",
    "password": "password123",
    "email": "test@individual.com",
    "companyName": "Individual Coffee Trader",
    "tin": "TIN1234567890",
    "capitalETB": 15000000,
    "businessType": "PRIVATE_EXPORTER"
  }'

# Test company exporter (20M)
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "username": "test_union",
    "password": "password123",
    "email": "test@union.com",
    "companyName": "Coffee Union",
    "tin": "TIN0987654321",
    "capitalETB": 20000000,
    "businessType": "UNION"
  }'
```

---

**Implementation Complete - Ready for Deployment**
