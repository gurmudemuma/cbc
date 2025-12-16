# Remaining Work - Detailed Breakdown (20%)

**Current Progress:** 80%  
**Remaining:** 20%  
**Estimated Time:** 3-4 weeks  
**Priority:** Complete for production deployment

---

## 1. Update Exporter Portal (5%)

### Status: NOT STARTED ⏳
**Estimated Time:** 1 week  
**Priority:** HIGH

### What Needs to Be Done

#### A. Update Export Submission Endpoint
**Current:** Submits to NBE (Port 3002)  
**Required:** Submit to ECX (Port 3006)

**Files to Modify:**
```
/home/gu-da/cbc/frontend/src/services/export.service.ts
/home/gu-da/cbc/frontend/src/components/ExportForm.tsx
/home/gu-da/cbc/frontend/src/config/api.config.ts
```

**Changes:**
```typescript
// OLD
const API_URL = 'http://localhost:3002/api/exports';

// NEW
const ECX_API_URL = 'http://localhost:3006/api/ecx/create-export';
```

#### B. Add ECX Required Fields
**New Fields to Add:**
- `ecxLotNumber` (required)
- `warehouseReceiptNumber` (required)
- `warehouseLocation` (optional)
- `exporterTIN` (required)

**Form Updates:**
```typescript
interface ExportFormData {
  // Existing fields...
  exportId: string;
  exporterName: string;
  coffeeType: string;
  quantity: number;
  
  // NEW REQUIRED FIELDS
  ecxLotNumber: string;
  warehouseReceiptNumber: string;
  warehouseLocation?: string;
  exporterTIN: string;
}
```

#### C. Update Workflow UI
**Update Status Display:**
```typescript
const workflowSteps = [
  { id: 1, name: 'Draft', status: 'DRAFT' },
  { id: 2, name: 'ECX Verification', status: 'ECX_VERIFIED' },  // NEW
  { id: 3, name: 'ECTA License', status: 'ECTA_LICENSE_APPROVED' },  // NEW
  { id: 4, name: 'ECTA Quality', status: 'ECTA_QUALITY_APPROVED' },  // NEW
  { id: 5, name: 'ECTA Contract', status: 'ECTA_CONTRACT_APPROVED' },  // NEW
  { id: 6, name: 'Bank Verified', status: 'BANK_DOCUMENT_VERIFIED' },
  { id: 7, name: 'FX Approved', status: 'FX_APPROVED' },
  { id: 8, name: 'Customs Cleared', status: 'CUSTOMS_CLEARED' },
  { id: 9, name: 'Shipped', status: 'SHIPPED' },
  { id: 10, name: 'Delivered', status: 'DELIVERED' },
  { id: 11, name: 'Payment', status: 'PAYMENT_RECEIVED' },
  { id: 12, name: 'Completed', status: 'COMPLETED' }
];
```

#### Testing Checklist
- [ ] Form validation works for new fields
- [ ] Submission goes to ECX API
- [ ] Success/error handling works
- [ ] Workflow tracker displays correctly
- [ ] Status updates in real-time

---

## 2. Add ECX to Fabric Network (5%)

### Status: NOT STARTED ⏳
**Estimated Time:** 1 week  
**Priority:** HIGH

### What Needs to Be Done

#### A. Generate Crypto Materials
```bash
cd /home/gu-da/cbc/network

# Generate ECX crypto materials
./scripts/generateCryptoMaterials.sh ecx

# Expected output:
# - organizations/peerOrganizations/ecx.coffee-export.com/
#   - ca/
#   - msp/
#   - peers/peer0.ecx.coffee-export.com/
#   - users/Admin@ecx.coffee-export.com/
```

#### B. Create ECX Peer Configuration
**File:** `network/docker/docker-compose-ecx.yaml`

```yaml
version: '3.7'

services:
  peer0.ecx.coffee-export.com:
    container_name: peer0.ecx.coffee-export.com
    image: hyperledger/fabric-peer:2.5
    environment:
      - CORE_PEER_ID=peer0.ecx.coffee-export.com
      - CORE_PEER_ADDRESS=peer0.ecx.coffee-export.com:12051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:12051
      - CORE_PEER_CHAINCODEADDRESS=peer0.ecx.coffee-export.com:12052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:12052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.ecx.coffee-export.com:12051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.ecx.coffee-export.com:12051
      - CORE_PEER_LOCALMSPID=ECXMSP
      - CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp
    volumes:
      - ../organizations/peerOrganizations/ecx.coffee-export.com/peers/peer0.ecx.coffee-export.com:/etc/hyperledger/fabric
    ports:
      - 12051:12051
    networks:
      - coffee-export
```

#### C. Update Channel Configuration
```bash
# Add ECX to channel
./scripts/addOrgToChannel.sh ecx coffeechannel

# Update channel with new organization
peer channel update -o orderer.coffee-export.com:7050 \
  -c coffeechannel \
  -f ./channel-artifacts/ecx-update.pb
```

#### D. Create Connection Profile
**File:** `network/organizations/peerOrganizations/ecx.coffee-export.com/connection-ecx.json`

```json
{
  "name": "coffee-export-network",
  "version": "1.0.0",
  "client": {
    "organization": "ECX",
    "connection": {
      "timeout": {
        "peer": { "endorser": "300" },
        "orderer": "300"
      }
    }
  },
  "organizations": {
    "ECX": {
      "mspid": "ECXMSP",
      "peers": ["peer0.ecx.coffee-export.com"],
      "certificateAuthorities": ["ca.ecx.coffee-export.com"]
    }
  },
  "peers": {
    "peer0.ecx.coffee-export.com": {
      "url": "grpcs://localhost:12051",
      "tlsCACerts": {
        "path": "organizations/peerOrganizations/ecx.coffee-export.com/peers/peer0.ecx.coffee-export.com/tls/ca.crt"
      }
    }
  }
}
```

#### Testing Checklist
- [ ] ECX peer starts successfully
- [ ] ECX joins channel
- [ ] Chaincode installed on ECX peer
- [ ] ECX can query/invoke chaincode
- [ ] Connection profile works

---

## 3. Integration Testing (5%)

### Status: NOT STARTED ⏳
**Estimated Time:** 1 week  
**Priority:** HIGH

### What Needs to Be Done

#### A. End-to-End Workflow Test
**Test Complete Flow:**

```bash
# 1. Portal submits to ECX
curl -X POST http://localhost:3003/api/exports \
  -d '{
    "exportId": "EXP-TEST-001",
    "ecxLotNumber": "LOT-2024-001",
    "warehouseReceiptNumber": "WR-2024-001",
    ...
  }'
# Expected: Export created with ECX_VERIFIED status

# 2. ECTA validates license
curl -X POST http://localhost:3004/api/quality/validate-license/EXP-TEST-001
# Expected: Status → ECTA_LICENSE_APPROVED

# 3. ECTA certifies quality
curl -X POST http://localhost:3004/api/quality/certify/EXP-TEST-001 \
  -d '{"grade": "Grade 2", "cuppingScore": 85}'
# Expected: Status → ECTA_QUALITY_APPROVED

# 4. ECTA approves contract
curl -X POST http://localhost:3004/api/quality/approve-contract/EXP-TEST-001
# Expected: Status → ECTA_CONTRACT_APPROVED

# 5. Commercial Bank submits FX
curl -X POST http://localhost:3001/api/exports/EXP-TEST-001/fx/submit
# Expected: Status → FX_APPLICATION_PENDING

# 6. NBE approves FX
curl -X POST http://localhost:3002/api/fx/approve/EXP-TEST-001 \
  -d '{"fxAmount": 75000, "fxApprovalCID": "test"}'
# Expected: Status → FX_APPROVED

# 7. Customs clears
curl -X POST http://localhost:3005/api/customs/clear/EXP-TEST-001
# Expected: Status → CUSTOMS_CLEARED

# 8. Shipping schedules
curl -X POST http://localhost:3007/api/shipments/schedule/EXP-TEST-001
# Expected: Status → SHIPMENT_SCHEDULED
```

#### B. Create Automated Test Suite
**File:** `tests/integration/complete-workflow.test.ts`

```typescript
describe('Complete Export Workflow', () => {
  it('should process export from Portal to Shipping', async () => {
    // 1. Create via ECX
    const createRes = await createExport(testData);
    expect(createRes.status).toBe('ECX_VERIFIED');
    
    // 2. ECTA approvals
    await ectaValidateLicense(exportId);
    await ectaCertifyQuality(exportId);
    await ectaApproveContract(exportId);
    
    // 3. Bank and NBE
    await bankSubmitFX(exportId);
    await nbeApproveFX(exportId);
    
    // 4. Customs and Shipping
    await customsClear(exportId);
    await shippingSchedule(exportId);
    
    // Verify final status
    const finalExport = await getExport(exportId);
    expect(finalExport.status).toBe('SHIPMENT_SCHEDULED');
  });
});
```

#### C. Performance Testing
```bash
# Load test with 100 concurrent exports
npm run test:load -- --exports=100 --concurrent=10

# Expected:
# - All exports processed successfully
# - Average response time < 2s
# - No errors or timeouts
```

#### Testing Checklist
- [ ] E2E workflow completes successfully
- [ ] All status transitions work
- [ ] Prerequisites are enforced
- [ ] Error handling works
- [ ] Performance is acceptable
- [ ] Concurrent requests handled

---

## 4. Frontend Updates (3%)

### Status: NOT STARTED ⏳
**Estimated Time:** 1 week  
**Priority:** MEDIUM

### What Needs to Be Done

#### A. Update Dashboard
**Show New Workflow:**
```typescript
// Update dashboard to show ECX and ECTA steps
const DashboardStats = () => {
  return (
    <div>
      <StatCard title="Pending ECX Verification" count={ecxPending} />
      <StatCard title="At ECTA" count={ectaPending} />
      <StatCard title="Awaiting FX" count={fxPending} />
      <StatCard title="In Transit" count={shipped} />
    </div>
  );
};
```

#### B. Update Export Detail Page
**Show Complete History:**
```typescript
const ExportTimeline = ({ export }) => {
  return (
    <Timeline>
      <Step status="completed" date={export.createdAt}>
        Created by Portal
      </Step>
      <Step status="completed" date={export.ecxVerifiedAt}>
        ECX Verified - Lot {export.ecxLotNumber}
      </Step>
      <Step status="completed" date={export.ectaLicenseValidatedAt}>
        ECTA License Validated
      </Step>
      <Step status="completed" date={export.qualityCertifiedAt}>
        ECTA Quality Certified - {export.qualityGrade}
      </Step>
      {/* ... more steps */}
    </Timeline>
  );
};
```

#### C. Update Navigation
**Add New Menu Items:**
```typescript
const navigation = [
  { name: 'Dashboard', path: '/' },
  { name: 'Create Export', path: '/exports/new' },  // Updated form
  { name: 'ECX Status', path: '/ecx' },  // NEW
  { name: 'ECTA Status', path: '/ecta' },  // NEW
  { name: 'FX Applications', path: '/fx' },
  { name: 'Shipments', path: '/shipments' },
];
```

#### Testing Checklist
- [ ] Dashboard shows correct stats
- [ ] Export detail shows full timeline
- [ ] Navigation works
- [ ] UI is responsive
- [ ] No console errors

---

## 5. Production Deployment (2%)

### Status: NOT STARTED ⏳
**Estimated Time:** 1 week  
**Priority:** MEDIUM

### What Needs to Be Done

#### A. Deploy Chaincode
```bash
# Package chaincode
peer lifecycle chaincode package coffee-export.tar.gz \
  --path /home/gu-da/cbc/chaincode/coffee-export \
  --lang golang \
  --label coffee-export_2.0

# Install on all peers (ECX, ECTA, NBE, Bank, Customs, Shipping)
# Approve for all organizations
# Commit to channel
```

#### B. Deploy APIs
```bash
# Build all APIs
cd /home/gu-da/cbc/api
npm run build:all

# Deploy to servers
# ECX API → Server 1 (Port 3006)
# ECTA API → Server 2 (Port 3004)
# NBE API → Server 3 (Port 3002)
# Commercial Bank → Server 4 (Port 3001)
# Customs → Server 5 (Port 3005)
# Shipping → Server 6 (Port 3007)
```

#### C. Configure Production Environment
**Update .env files:**
```env
NODE_ENV=production
FABRIC_NETWORK_URL=production-network.com
DATABASE_URL=production-db.com
REDIS_URL=production-redis.com
LOG_LEVEL=info
```

#### D. Setup Monitoring
```bash
# Install monitoring tools
npm install -g pm2

# Start APIs with PM2
pm2 start ecosystem.config.js

# Setup logging
pm2 install pm2-logrotate

# Setup alerts
pm2 install pm2-slack
```

#### E. Security Hardening
- [ ] Enable HTTPS/TLS
- [ ] Configure firewalls
- [ ] Setup rate limiting
- [ ] Enable audit logging
- [ ] Configure backup systems

#### Deployment Checklist
- [ ] All APIs deployed
- [ ] Chaincode deployed
- [ ] Network configured
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Security hardened
- [ ] Documentation updated

---

## Summary Timeline

### Week 1: Exporter Portal & ECX Network
- Days 1-3: Update Exporter Portal
- Days 4-5: Add ECX to Fabric network
- **Milestone:** Portal submits to ECX, ECX in network

### Week 2: Integration Testing
- Days 1-3: E2E workflow testing
- Days 4-5: Performance testing & bug fixes
- **Milestone:** Complete workflow tested

### Week 3: Frontend & Deployment Prep
- Days 1-3: Frontend updates
- Days 4-5: Production preparation
- **Milestone:** UI updated, ready to deploy

### Week 4: Production Deployment
- Days 1-2: Deploy chaincode
- Days 3-4: Deploy APIs
- Day 5: Final testing & go-live
- **Milestone:** 100% COMPLETE! 🎉

---

## Risk Assessment

### High Risk
- **ECX Network Integration** - Complex, could take longer
- **Chaincode Deployment** - Requires all orgs to approve

### Medium Risk
- **Integration Testing** - May reveal unexpected issues
- **Frontend Updates** - UI/UX changes need approval

### Low Risk
- **Exporter Portal** - Straightforward code changes
- **Production Deployment** - Standard process

---

## Resource Requirements

### Development
- 1 Backend Developer (Exporter Portal, APIs)
- 1 Blockchain Developer (ECX network, chaincode)
- 1 Frontend Developer (UI updates)
- 1 QA Engineer (Testing)

### Infrastructure
- 7 Servers (one per API)
- Fabric network nodes
- Database servers
- Monitoring tools

### Time
- **Development:** 2-3 weeks
- **Testing:** 1 week
- **Deployment:** 1 week
- **Total:** 4-5 weeks

---

## Success Criteria

### Technical
- [ ] All APIs deployed and running
- [ ] Chaincode deployed to network
- [ ] E2E workflow completes successfully
- [ ] Performance meets requirements
- [ ] No critical bugs

### Business
- [ ] System matches Ethiopian regulations 100%
- [ ] All stakeholders can use the system
- [ ] Audit trail is complete
- [ ] Training completed
- [ ] Documentation finalized

---

**Current Status:** 80% Complete  
**Remaining Work:** 20%  
**Estimated Completion:** 4-5 weeks  
**Confidence Level:** HIGH 🎯

**All remaining work is clearly defined and achievable!**
