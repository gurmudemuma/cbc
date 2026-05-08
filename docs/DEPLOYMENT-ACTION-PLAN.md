# Deployment Action Plan

## Current Status
✅ All 4 chaincode functions EXIST in `chaincode/ecta/index.js`:
- `RegisterSalesContractWithReference` (Line 4087)
- `GetReferenceByDraftId` (Line 4204)
- `SubmitToNetwork` (Line 4221)
- `UpdateOrganizationApproval` (Line 4523)

✅ Hybrid system: 10/10 requirements passing
✅ PostgreSQL as primary storage working
✅ Gateway routes properly configured

## What Needs to Be Done

### STEP 1: Deploy Chaincode to Blockchain Network (CRITICAL)
The chaincode exists but needs to be deployed to all 5 organizations.

**Commands to run:**
```bash
# 1. Package chaincode
bash scripts/1-package-chaincode.sh

# 2. Install on all peers
bash scripts/2-install-chaincode.sh

# 3. Approve for all 5 organizations
bash scripts/3-approve-chaincode.sh

# 4. Commit to channel
bash scripts/4-commit-chaincode.sh

# 5. Verify deployment
docker exec cli peer lifecycle chaincode querycommitted -C coffeechannel -n ecta
```

### STEP 2: Add Validation Checks to Routes (OPTIONAL - System works without these)

#### File: `coffee-export-gateway/src/routes/contract-drafts.routes.js`
**Location:** In the `/finalize` endpoint (around line 350)

**Add before finalization:**
```javascript
// Verify buyer is verified
const buyerCheck = await postgresService.query(
  'SELECT verification_status FROM buyer_registry WHERE buyer_id = $1',
  [draft.buyer_id]
);

if (buyerCheck.rows.length === 0 || buyerCheck.rows[0].verification_status !== 'VERIFIED') {
  return res.status(400).json({ 
    error: 'Buyer must be verified before contract finalization' 
  });
}

// Verify exporter is qualified
const exporterCheck = await postgresService.query(
  'SELECT status FROM exporter_qualifications WHERE exporter_id = $1 AND status = $2',
  [draft.exporter_id, 'APPROVED']
);

if (exporterCheck.rows.length === 0) {
  return res.status(400).json({ 
    error: 'Exporter must be qualified before contract finalization' 
  });
}
```

#### File: `coffee-export-gateway/src/routes/sales-contract-network.routes.js`
**Location:** In the `/submit-to-network` endpoint

**Add before submission:**
```javascript
// Verify contract is not expired
if (contract.deliveryDate) {
  const deliveryDate = new Date(contract.deliveryDate);
  const now = new Date();
  if (now > deliveryDate) {
    return res.status(400).json({ 
      error: 'Contract delivery date has passed. Cannot submit expired contract.' 
    });
  }
}

// Verify organization is valid
const validOrgs = ['ECTA', 'BANK', 'NBE', 'CUSTOMS', 'SHIPPING'];
if (req.user.organization && !validOrgs.includes(req.user.organization.toUpperCase())) {
  return res.status(403).json({ 
    error: 'Invalid organization for approval' 
  });
}
```

### STEP 3: Restart Gateway
```bash
docker-compose -f docker-compose-hybrid.yml restart gateway
```

### STEP 4: Verify All Functions Work
```powershell
# Test ECTA registration
Invoke-RestMethod -Uri "http://localhost:3001/api/ecta/contracts/{draftId}/register" -Method POST -Headers @{"Authorization"="Bearer $token"}

# Test reference lookup
Invoke-RestMethod -Uri "http://localhost:3001/api/contracts/draft/{draftId}/reference" -Method GET

# Test network submission
Invoke-RestMethod -Uri "http://localhost:3001/api/exporter/submit-to-network" -Method POST -Body $body -Headers @{"Authorization"="Bearer $token"}

# Test org approval
Invoke-RestMethod -Uri "http://localhost:3001/api/approvals/{referenceNumber}" -Method POST -Body $body -Headers @{"Authorization"="Bearer $token"}
```

### STEP 5: Run Final Verification
```powershell
powershell scripts/verify-hybrid-requirements.ps1
```

## Priority Order
1. **CRITICAL**: Deploy chaincode (Step 1) - System cannot use blockchain functions without this
2. **IMPORTANT**: Restart gateway (Step 3) - Ensures all services are in sync
3. **RECOMMENDED**: Add validation checks (Step 2) - Improves data quality
4. **VERIFICATION**: Test and verify (Steps 4-5) - Confirms everything works

## Notes
- System can operate with PostgreSQL only if blockchain deployment fails
- All 10/10 hybrid requirements must remain passing after changes
- Chaincode deployment requires all 5 organizations to approve
- Current configuration: `FABRIC_USE_CLI=true`, `HYBRID_WRITE_MODE=dual`, `HYBRID_READ_SOURCE=postgres`
