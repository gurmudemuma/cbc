# Chaincode Deployment Instructions

## Changes Made

### ✅ Completed Changes

1. **API Routes Added** - `/api/exporter-portal/src/routes/export.routes.ts`
   - ✅ `POST /:id/submit-to-ecx`
   - ✅ `POST /:id/submit-to-ecta`
   - ✅ `POST /:id/submit-to-bank`
   - ✅ `GET /:id/documents`

2. **Chaincode Functions Added** - `/chaincode/coffee-export/contract.go`
   - ✅ `SubmitToECX()` - Lines 295-323
   - ✅ `SubmitToECTA()` - Lines 325-353
   - ✅ `SubmitToBank()` - Lines 355-383

3. **Dashboard Fixed** - `/frontend/src/pages/Dashboard.jsx`
   - ✅ Correct workflow stages
   - ✅ Fixed status order mapping

4. **Document Tracking Service** - `/api/shared/documentTracking.service.ts`
   - ✅ Complete document tracking system

5. **Controller Methods** - `/api/exporter-portal/src/controllers/export.controller.ts`
   - ✅ Submission methods added

---

## 🚀 Deployment Steps

### Step 1: Redeploy Coffee Export Chaincode

Since we added new functions to the chaincode, we need to redeploy it with a new version.

#### Option A: Using the Existing Deployment Script

```bash
cd /home/gu-da/cbc/network

# Deploy with incremented version and sequence
./scripts/deployCC.sh \
  coffeechannel \
  coffee-export \
  chaincode/coffee-export \
  go \
  2.0 \
  2
```

**Parameters**:
- Channel: `coffeechannel`
- Chaincode name: `coffee-export`
- Source path: `chaincode/coffee-export`
- Language: `go`
- Version: `2.0` (incremented from 1.0)
- Sequence: `2` (incremented from 1)

#### Option B: Manual Deployment Steps

If the script doesn't work, deploy manually:

```bash
cd /home/gu-da/cbc/network

# 1. Package the chaincode
docker exec cli peer lifecycle chaincode package coffee-export-v2.tar.gz \
  --path chaincode/coffee-export \
  --lang golang \
  --label coffee-export_2.0

# 2. Install on all peers (run for each organization)
# Commercial Bank
docker exec cli peer lifecycle chaincode install coffee-export-v2.tar.gz

# Get package ID
docker exec cli peer lifecycle chaincode queryinstalled

# 3. Approve for each organization (use the package ID from step 2)
export PACKAGE_ID=<package-id-from-step-2>

# Approve for Commercial Bank
docker exec cli peer lifecycle chaincode approveformyorg \
  -o orderer.coffee-export.com:7050 \
  --channelID coffeechannel \
  --name coffee-export \
  --version 2.0 \
  --package-id $PACKAGE_ID \
  --sequence 2

# Repeat for ECX, ECTA, NBE, Customs, Shipping (if they're on the channel)

# 4. Commit the chaincode definition
docker exec cli peer lifecycle chaincode commit \
  -o orderer.coffee-export.com:7050 \
  --channelID coffeechannel \
  --name coffee-export \
  --version 2.0 \
  --sequence 2
```

---

### Step 2: Restart Exporter Portal API

After chaincode is deployed, restart the Exporter Portal API to pick up the new routes:

```bash
cd /home/gu-da/cbc/api/exporter-portal

# If using PM2
pm2 restart exporter-portal

# If using Docker
docker-compose restart exporter-portal

# If running directly
# Stop the current process (Ctrl+C) and restart:
npm run dev
```

---

### Step 3: Restart Frontend (Optional)

If you made any frontend changes:

```bash
cd /home/gu-da/cbc/frontend

# If using PM2
pm2 restart frontend

# If using Docker
docker-compose restart frontend

# If running directly
npm run dev
```

---

## 🧪 Testing the New Functionality

### Test 1: Check API Routes

```bash
# Test document status endpoint
curl -X GET http://localhost:3001/api/exports/EXP-123/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected: Document checklist with upload/verification status
```

### Test 2: Test Submit to ECX

```bash
# First create an export in DRAFT status
curl -X POST http://localhost:3001/api/exports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commercialbankId": "BANK-001",
    "exporterName": "Test Exporter",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000,
    "exportLicenseNumber": "LIC-001",
    "ecxLotNumber": "LOT-001",
    "warehouseLocation": "Addis Ababa"
  }'

# Then submit to ECX
curl -X POST http://localhost:3001/api/exports/EXP-123/submit-to-ecx \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected: { "success": true, "message": "Export submitted to ECX", "data": { "newStatus": "ECX_PENDING" } }
```

### Test 3: Test Submit to ECTA

```bash
# After ECX approves (status = ECX_VERIFIED)
curl -X POST http://localhost:3001/api/exports/EXP-123/submit-to-ecta \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected: { "success": true, "message": "Export submitted to ECTA", "data": { "newStatus": "ECTA_LICENSE_PENDING" } }
```

### Test 4: Test Submit to Bank

```bash
# After ECTA approves all stages (status = ECTA_CONTRACT_APPROVED)
curl -X POST http://localhost:3001/api/exports/EXP-123/submit-to-bank \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected: { "success": true, "message": "Export submitted to Bank", "data": { "newStatus": "BANK_DOCUMENT_PENDING" } }
```

### Test 5: Verify Chaincode Functions

```bash
# Test SubmitToECX chaincode function directly
docker exec cli peer chaincode invoke \
  -C coffeechannel \
  -n coffee-export \
  -c '{"function":"SubmitToECX","Args":["EXP-123"]}'

# Test SubmitToECTA
docker exec cli peer chaincode invoke \
  -C coffeechannel \
  -n coffee-export \
  -c '{"function":"SubmitToECTA","Args":["EXP-123"]}'

# Test SubmitToBank
docker exec cli peer chaincode invoke \
  -C coffeechannel \
  -n coffee-export \
  -c '{"function":"SubmitToBank","Args":["EXP-123"]}'
```

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Chaincode version 2.0 is deployed and committed
- [ ] All peers have the new chaincode installed
- [ ] Exporter Portal API is running
- [ ] New API routes respond correctly
- [ ] Dashboard shows correct workflow (10 stages)
- [ ] Document tracking endpoint works
- [ ] Submit to ECX works (DRAFT → ECX_PENDING)
- [ ] Submit to ECTA works (ECX_VERIFIED → ECTA_LICENSE_PENDING)
- [ ] Submit to Bank works (ECTA_CONTRACT_APPROVED → BANK_DOCUMENT_PENDING)
- [ ] Status transitions are logged in blockchain
- [ ] Audit trail is maintained

---

## 📊 Expected Workflow After Deployment

```
1. Exporter creates export (DRAFT)
   ↓
2. Exporter clicks "Submit to ECX" → ECX_PENDING
   ↓
3. ECX approves → ECX_VERIFIED
   ↓
4. Exporter clicks "Submit to ECTA" → ECTA_LICENSE_PENDING
   ↓
5. ECTA approves license → ECTA_LICENSE_APPROVED
   ↓
6. ECTA approves quality → ECTA_QUALITY_APPROVED
   ↓
7. ECTA approves contract → ECTA_CONTRACT_APPROVED
   ↓
8. Exporter clicks "Submit to Bank" → BANK_DOCUMENT_PENDING
   ↓
9. Bank approves → BANK_DOCUMENT_VERIFIED → FX_APPLICATION_PENDING
   ↓
10. NBE approves → FX_APPROVED
   ↓
11. Customs clears → CUSTOMS_CLEARED
   ↓
12. Shipping → SHIPPED → DELIVERED
   ↓
13. Payment → COMPLETED
```

---

## 🐛 Troubleshooting

### Issue: Chaincode deployment fails

**Solution**: Check if the chaincode compiles:
```bash
cd /home/gu-da/cbc/chaincode/coffee-export
go mod tidy
go build
```

### Issue: API routes return 404

**Solution**: Verify routes are registered:
```bash
# Check if routes file is imported in main app
grep -r "export.routes" /home/gu-da/cbc/api/exporter-portal/src/
```

### Issue: Chaincode functions not found

**Solution**: Verify chaincode is committed with new version:
```bash
docker exec cli peer lifecycle chaincode querycommitted \
  -C coffeechannel \
  -n coffee-export
```

### Issue: Status transition fails

**Solution**: Check current export status:
```bash
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n coffee-export \
  -c '{"function":"GetExport","Args":["EXP-123"]}'
```

---

## 📝 Summary

**What's Ready**:
- ✅ API routes for submission actions
- ✅ Chaincode functions for status transitions
- ✅ Dashboard showing correct workflow
- ✅ Document tracking service
- ✅ Controller methods for exporter actions

**What's Needed**:
- 🔴 Redeploy chaincode with version 2.0
- 🔴 Restart Exporter Portal API
- 🔴 Test all new endpoints

**Time Required**: ~15-20 minutes for deployment and testing

**Impact**: Complete exporter-initiated workflow with full tracking! 🎉
