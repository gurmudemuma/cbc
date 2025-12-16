# Final 10% - Detailed Task List

**Current Progress:** 90%  
**Remaining:** 10%  
**Estimated Time:** 2-3 weeks  
**Status:** Ready to complete

---

## Overview

The remaining 10% consists of:
1. **Frontend UI Components** (5%) - Update React components
2. **ECX Network Integration** (5%) - Add ECX to Fabric network

Both are well-defined, straightforward tasks with clear implementation paths.

---

## Task 1: Frontend UI Components (5%)

### Estimated Time: 1 week
### Priority: MEDIUM
### Complexity: LOW

### 1.1 Update Export Form Components

**Files to Modify:**
- `frontend/src/pages/ExportManagement.jsx`
- `frontend/src/components/ExportDetailDialog.jsx`

**Changes Needed:**

#### A. Add ECX Fields to Export Form
```javascript
// Add these fields to the export creation form:
const [formData, setFormData] = useState({
  // Existing fields...
  exportId: '',
  exporterName: '',
  coffeeType: '',
  quantity: 0,
  
  // NEW REQUIRED FIELDS
  ecxLotNumber: '',              // ECX lot number
  warehouseReceiptNumber: '',    // Warehouse receipt
  warehouseLocation: '',         // Warehouse location
  exporterTIN: '',               // Tax ID number
});

// Add validation
const validateForm = () => {
  if (!formData.ecxLotNumber) {
    setError('ECX lot number is required');
    return false;
  }
  if (!formData.warehouseReceiptNumber) {
    setError('Warehouse receipt number is required');
    return false;
  }
  return true;
};
```

#### B. Update Form UI
```jsx
{/* Add ECX section to form */}
<Box sx={{ mt: 3 }}>
  <Typography variant="h6" gutterBottom>
    ECX Information (Required)
  </Typography>
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        required
        label="ECX Lot Number"
        name="ecxLotNumber"
        value={formData.ecxLotNumber}
        onChange={handleChange}
        helperText="Enter the ECX lot number from warehouse receipt"
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        required
        label="Warehouse Receipt Number"
        name="warehouseReceiptNumber"
        value={formData.warehouseReceiptNumber}
        onChange={handleChange}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Warehouse Location"
        name="warehouseLocation"
        value={formData.warehouseLocation}
        onChange={handleChange}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        required
        label="Exporter TIN"
        name="exporterTIN"
        value={formData.exporterTIN}
        onChange={handleChange}
        helperText="Tax Identification Number"
      />
    </Grid>
  </Grid>
</Box>
```

**Testing:**
- [ ] Form validation works
- [ ] Required fields are enforced
- [ ] Form submits to ECX API (Port 3006)
- [ ] Success/error messages display correctly

---

### 1.2 Update Export Detail Page

**File:** `frontend/src/pages/ExportDetails.jsx`

**Changes Needed:**

#### A. Add ECX Information Display
```jsx
{/* Add ECX section */}
<Card sx={{ mb: 2 }}>
  <CardContent>
    <Typography variant="h6" gutterBottom>
      ECX Verification
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">
          ECX Lot Number
        </Typography>
        <Typography variant="body1">
          {exportData.ecxLotNumber || 'N/A'}
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">
          Warehouse Receipt
        </Typography>
        <Typography variant="body1">
          {exportData.warehouseReceiptNumber || 'N/A'}
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">
          Verification Status
        </Typography>
        <Chip
          label={exportData.ecxVerified ? 'Verified' : 'Pending'}
          color={exportData.ecxVerified ? 'success' : 'warning'}
          size="small"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">
          Verified Date
        </Typography>
        <Typography variant="body1">
          {exportData.ecxVerifiedAt 
            ? new Date(exportData.ecxVerifiedAt).toLocaleString() 
            : 'N/A'}
        </Typography>
      </Grid>
    </Grid>
  </CardContent>
</Card>
```

#### B. Add ECTA Multi-Step Display
```jsx
{/* Add ECTA section with 3 sub-steps */}
<Card sx={{ mb: 2 }}>
  <CardContent>
    <Typography variant="h6" gutterBottom>
      ECTA Regulation
    </Typography>
    
    {/* License Validation */}
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        1. Export License Validation
      </Typography>
      <Chip
        label={exportData.ectaLicenseStatus || 'Pending'}
        color={exportData.ectaLicenseApproved ? 'success' : 'warning'}
        size="small"
      />
    </Box>
    
    {/* Quality Certification */}
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        2. Quality Certification
      </Typography>
      <Chip
        label={exportData.qualityGrade || 'Pending'}
        color={exportData.qualityCertified ? 'success' : 'warning'}
        size="small"
      />
    </Box>
    
    {/* Contract Approval */}
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        3. Contract Approval
      </Typography>
      <Chip
        label={exportData.contractStatus || 'Pending'}
        color={exportData.contractApproved ? 'success' : 'warning'}
        size="small"
      />
    </Box>
  </CardContent>
</Card>
```

**Testing:**
- [ ] All ECX fields display correctly
- [ ] ECTA 3-step process shows properly
- [ ] Status chips have correct colors
- [ ] Dates format correctly

---

### 1.3 Update Dashboard

**File:** `frontend/src/pages/Dashboard.jsx` (or similar)

**Changes Needed:**

#### A. Update Statistics Cards
```jsx
{/* Update stats to show new workflow */}
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={3}>
    <StatCard
      title="Pending ECX Verification"
      count={stats.ecxPending || 0}
      icon={<VerifiedIcon />}
      color="primary"
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <StatCard
      title="At ECTA"
      count={stats.ectaPending || 0}
      icon={<AssignmentIcon />}
      color="secondary"
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <StatCard
      title="Awaiting FX Approval"
      count={stats.fxPending || 0}
      icon={<AccountBalanceIcon />}
      color="warning"
    />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <StatCard
      title="In Transit"
      count={stats.shipped || 0}
      icon={<LocalShippingIcon />}
      color="success"
    />
  </Grid>
</Grid>
```

#### B. Update Recent Activity
```jsx
{/* Show activities from all organizations */}
const activities = [
  { org: 'ECX', action: 'Lot verified', exportId: 'EXP-001', time: '2 hours ago' },
  { org: 'ECTA', action: 'Quality certified', exportId: 'EXP-002', time: '4 hours ago' },
  { org: 'NBE', action: 'FX approved', exportId: 'EXP-003', time: '1 day ago' },
  // ...
];
```

**Testing:**
- [ ] Statistics show correct counts
- [ ] Activity feed displays all organizations
- [ ] Charts/graphs update correctly

---

### 1.4 Update Workflow Timeline Component

**File:** Create `frontend/src/components/WorkflowTimeline.jsx`

**Implementation:**
```jsx
import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { Typography, Box } from '@mui/material';
import { WORKFLOW_STATES } from '../utils/workflowManager';

export const WorkflowTimeline = ({ exportData }) => {
  const steps = [
    { 
      status: WORKFLOW_STATES.ECX_VERIFIED, 
      label: 'ECX Verified', 
      date: exportData.ecxVerifiedAt,
      completed: !!exportData.ecxVerifiedAt 
    },
    { 
      status: WORKFLOW_STATES.ECTA_LICENSE_APPROVED, 
      label: 'ECTA License Approved', 
      date: exportData.ectaLicenseApprovedAt,
      completed: !!exportData.ectaLicenseApprovedAt 
    },
    { 
      status: WORKFLOW_STATES.ECTA_QUALITY_APPROVED, 
      label: 'Quality Certified', 
      date: exportData.qualityCertifiedAt,
      completed: !!exportData.qualityCertifiedAt 
    },
    { 
      status: WORKFLOW_STATES.ECTA_CONTRACT_APPROVED, 
      label: 'Contract Approved', 
      date: exportData.contractApprovedAt,
      completed: !!exportData.contractApprovedAt 
    },
    { 
      status: WORKFLOW_STATES.FX_APPROVED, 
      label: 'FX Approved', 
      date: exportData.fxApprovedAt,
      completed: !!exportData.fxApprovedAt 
    },
    { 
      status: WORKFLOW_STATES.CUSTOMS_CLEARED, 
      label: 'Customs Cleared', 
      date: exportData.customsClearedAt,
      completed: !!exportData.customsClearedAt 
    },
    { 
      status: WORKFLOW_STATES.SHIPPED, 
      label: 'Shipped', 
      date: exportData.shippedAt,
      completed: !!exportData.shippedAt 
    },
  ];

  return (
    <Timeline position="alternate">
      {steps.map((step, index) => (
        <TimelineItem key={index}>
          <TimelineOppositeContent color="text.secondary">
            {step.date ? new Date(step.date).toLocaleDateString() : 'Pending'}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color={step.completed ? 'success' : 'grey'} />
            {index < steps.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="h6" component="span">
              {step.label}
            </Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};
```

**Testing:**
- [ ] Timeline displays all steps
- [ ] Completed steps show green
- [ ] Pending steps show grey
- [ ] Dates display correctly

---

## Task 2: ECX Network Integration (5%)

### Estimated Time: 1 week
### Priority: HIGH
### Complexity: MEDIUM

### 2.1 Generate ECX Crypto Materials

**Location:** `/home/gu-da/cbc/network/`

**Steps:**
```bash
# 1. Navigate to network directory
cd /home/gu-da/cbc/network

# 2. Generate crypto materials for ECX
./scripts/generateCryptoMaterials.sh ecx

# Expected output:
# - organizations/peerOrganizations/ecx.coffee-export.com/
#   - ca/
#   - msp/
#   - peers/peer0.ecx.coffee-export.com/
#   - users/Admin@ecx.coffee-export.com/
```

**Deliverables:**
- [ ] ECX CA certificates generated
- [ ] ECX MSP created
- [ ] ECX peer certificates generated
- [ ] ECX admin user created

---

### 2.2 Create ECX Peer Configuration

**File:** `network/docker/docker-compose-ecx.yaml`

**Implementation:**
```yaml
version: '3.7'

services:
  peer0.ecx.coffee-export.com:
    container_name: peer0.ecx.coffee-export.com
    image: hyperledger/fabric-peer:2.5
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_PEER_ID=peer0.ecx.coffee-export.com
      - CORE_PEER_ADDRESS=peer0.ecx.coffee-export.com:12051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:12051
      - CORE_PEER_CHAINCODEADDRESS=peer0.ecx.coffee-export.com:12052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:12052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.ecx.coffee-export.com:12051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.ecx.coffee-export.com:12051
      - CORE_PEER_LOCALMSPID=ECXMSP
      - CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
      - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
      - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb.ecx:5984
    volumes:
      - /var/run/:/host/var/run/
      - ../organizations/peerOrganizations/ecx.coffee-export.com/peers/peer0.ecx.coffee-export.com:/etc/hyperledger/fabric
      - peer0.ecx.coffee-export.com:/var/hyperledger/production
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - 12051:12051
    networks:
      - coffee-export

  couchdb.ecx:
    container_name: couchdb.ecx
    image: couchdb:3.1
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=adminpw
    ports:
      - 9984:5984
    networks:
      - coffee-export

volumes:
  peer0.ecx.coffee-export.com:

networks:
  coffee-export:
    external: true
```

**Deliverables:**
- [ ] Docker compose file created
- [ ] ECX peer configuration complete
- [ ] CouchDB configured for ECX

---

### 2.3 Add ECX to Channel

**Steps:**
```bash
# 1. Create ECX organization definition
./scripts/createOrgDefinition.sh ecx

# 2. Add ECX to channel
./scripts/addOrgToChannel.sh ecx coffeechannel

# 3. Join ECX peer to channel
docker exec peer0.ecx.coffee-export.com peer channel join \
  -b ./channel-artifacts/coffeechannel.block

# 4. Update anchor peers
./scripts/updateAnchorPeers.sh ecx coffeechannel
```

**Deliverables:**
- [ ] ECX organization added to channel
- [ ] ECX peer joined channel
- [ ] Anchor peers updated

---

### 2.4 Install Chaincode on ECX Peer

**Steps:**
```bash
# 1. Package chaincode (if not already done)
peer lifecycle chaincode package coffee-export.tar.gz \
  --path /home/gu-da/cbc/chaincode/coffee-export \
  --lang golang \
  --label coffee-export_2.0

# 2. Install on ECX peer
export CORE_PEER_LOCALMSPID="ECXMSP"
export CORE_PEER_ADDRESS=peer0.ecx.coffee-export.com:12051
export CORE_PEER_MSPCONFIGPATH=/home/gu-da/cbc/network/organizations/peerOrganizations/ecx.coffee-export.com/users/Admin@ecx.coffee-export.com/msp

peer lifecycle chaincode install coffee-export.tar.gz

# 3. Approve chaincode for ECX
peer lifecycle chaincode approveformyorg \
  -o orderer.coffee-export.com:7050 \
  --channelID coffeechannel \
  --name coffee-export \
  --version 2.0 \
  --package-id $CC_PACKAGE_ID \
  --sequence 2 \
  --tls \
  --cafile $ORDERER_CA

# 4. Commit chaincode (if all orgs approved)
peer lifecycle chaincode commit \
  -o orderer.coffee-export.com:7050 \
  --channelID coffeechannel \
  --name coffee-export \
  --version 2.0 \
  --sequence 2 \
  --tls \
  --cafile $ORDERER_CA \
  --peerAddresses peer0.ecx.coffee-export.com:12051 \
  --tlsRootCertFiles $ECX_TLS_CERT \
  --peerAddresses peer0.ecta.coffee-export.com:9051 \
  --tlsRootCertFiles $ECTA_TLS_CERT
```

**Deliverables:**
- [ ] Chaincode installed on ECX peer
- [ ] ECX approved chaincode
- [ ] Chaincode committed to channel

---

### 2.5 Test ECX Integration

**Test Script:**
```bash
# Test ECX can invoke chaincode
peer chaincode invoke \
  -o orderer.coffee-export.com:7050 \
  --tls \
  -C coffeechannel \
  -n coffee-export \
  --peerAddresses peer0.ecx.coffee-export.com:12051 \
  -c '{"function":"CreateExportRequest","Args":["EXP-TEST-001","BANK-001","Test Exporter","LIC-001","Arabica","5000","USA","75000","LOT-001","Addis Warehouse"]}'

# Query to verify
peer chaincode query \
  -C coffeechannel \
  -n coffee-export \
  -c '{"function":"GetExportRequest","Args":["EXP-TEST-001"]}'
```

**Deliverables:**
- [ ] ECX can create export requests
- [ ] ECX can query blockchain
- [ ] All functions work correctly

---

## Summary Checklist

### Frontend UI (5%)
- [ ] Export form updated with ECX fields
- [ ] Export detail page shows ECX info
- [ ] Export detail page shows ECTA 3-step process
- [ ] Dashboard updated with new stats
- [ ] Workflow timeline component created
- [ ] All UI components tested

### ECX Network (5%)
- [ ] Crypto materials generated
- [ ] Peer configuration created
- [ ] ECX added to channel
- [ ] Chaincode installed on ECX
- [ ] Integration tested
- [ ] Documentation updated

---

## Timeline

### Week 1: Frontend UI
- Days 1-2: Update export form
- Days 3-4: Update detail pages
- Day 5: Update dashboard and test

### Week 2: ECX Network
- Days 1-2: Generate crypto and configure peer
- Days 3-4: Add to channel and install chaincode
- Day 5: Testing and documentation

**Total:** 2 weeks to 100% completion

---

## Success Criteria

### Frontend
- [ ] All forms work with new fields
- [ ] All pages display new workflow
- [ ] No console errors
- [ ] UI is responsive
- [ ] User experience is smooth

### Network
- [ ] ECX peer runs successfully
- [ ] ECX can create blockchain records
- [ ] All organizations can interact
- [ ] Performance is acceptable
- [ ] No network errors

---

**Current:** 90% Complete  
**After Frontend:** 95% Complete  
**After Network:** 100% Complete  

**Estimated Completion:** 2-3 weeks from now
