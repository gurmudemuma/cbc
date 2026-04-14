# Chaincode Implementation Status - Sales Contract Workflow

## Current Status Assessment

### ✅ What EXISTS in Chaincode (chaincode/ecta/index.js)

#### 1. User & Exporter Management
- ✅ `RegisterUser` - User registration with validation
- ✅ `GetUser` - Get user details
- ✅ `UpdateUserStatus` - Approve/reject users
- ✅ `GetUsersByRole` - Query users by role
- ✅ `SubmitPreRegistration` - Exporter pre-registration
- ✅ `GetExporterProfile` - Get exporter details
- ✅ `UpdateExporterProfile` - Update exporter info
- ✅ `ApprovePreRegistration` - ECTA approval of stages

#### 2. Export Request Management
- ✅ `CreateExportRequest` - Create export with contract details
- ✅ `GetExportRequest` - Get export details
- ✅ `UpdateExportWorkflow` - Update workflow stages
- ✅ `UpdateExportContract` - Update contract details
- ✅ `UpdateBankingDetails` - Update LC and payment info
- ✅ `UpdateCustomsDetails` - Update SAD and clearance
- ✅ `UpdateShippingDetails` - Update B/L and vessel info

#### 3. Shipment Management
- ✅ `CreateShipment` - Create shipment with sales contract
- ✅ `RegisterSalesContract` - Register contract with ECTA (basic)
- ✅ `ValidateMinimumPrice` - Price validation

#### 4. Network Submission System
- ✅ `SubmitToNetworkRequest` - Submit Network request
- ✅ `AddNetworkAgencyApproval` - Add agency approval
- ✅ `GetNetworkRequest` - Get ESW details

#### 5. Certificates
- ✅ `IssueQualityCertificate` - Issue quality certificate
- ✅ `VerifyCertificate` - Verify certificate

---

### ❌ What's MISSING (Needs to be Added)

#### 1. Sales Contract Draft Management
```javascript
// NOT IMPLEMENTED - Need to add:
async CreateContractDraft(ctx, draftJSON) { }
async GetContractDraft(ctx, draftId) { }
async UpdateContractDraft(ctx, draftId, updatesJSON) { }
async AcceptContractDraft(ctx, draftId, acceptorJSON) { }
async RejectContractDraft(ctx, draftId, rejectionJSON) { }
async CounterOfferContract(ctx, draftId, counterJSON) { }
```

#### 2. ECTA Contract Registration with Reference Number
```javascript
// PARTIALLY IMPLEMENTED - Need to enhance:
async RegisterSalesContractWithReference(ctx, contractJSON) {
    // Generate ECTA reference number: ECTA-SC-2026-00001
    // Register complete contract details
    // Create blockchain record with reference
    // Return reference number
}
```

#### 3. Reference-Based Network Submission
```javascript
// NOT IMPLEMENTED - Need to add:
async SubmitToNetworkWithReference(ctx, referenceNumber, submissionJSON) {
    // Link to registered contract via reference number
    // Track all 5 organization approvals
    // Update approval status per organization
}
```

#### 4. Organization-Specific Approvals
```javascript
// NOT IMPLEMENTED - Need to add:
async ApproveByBank(ctx, referenceNumber, approvalJSON) { }
async ApproveByNBE(ctx, referenceNumber, approvalJSON) { }
async ApproveByCustoms(ctx, referenceNumber, approvalJSON) { }
async ApproveByShipping(ctx, referenceNumber, approvalJSON) { }
```

#### 5. Query by Reference Number
```javascript
// NOT IMPLEMENTED - Need to add:
async GetExportByReference(ctx, referenceNumber) { }
async GetApprovalStatus(ctx, referenceNumber) { }
async GetApprovalHistory(ctx, referenceNumber) { }
```

---

## Recommended Implementation Approach

### Option 1: Use Existing Functions (Quick Solution)

**Use what exists and adapt the workflow:**

1. **Contract Negotiation** → PostgreSQL only (no chaincode needed)
2. **ECTA Registration** → Use `CreateExportRequest` + add reference number
3. **Network Submission** → Use `SubmitToNetworkRequest` + link to export
4. **Approvals** → Use `UpdateExportWorkflow` for each organization
5. **Tracking** → Query by exportId, add reference number in metadata

**Pros**:
- ✅ No chaincode changes needed
- ✅ Works with existing deployment
- ✅ Quick to implement

**Cons**:
- ❌ Reference number not native to chaincode
- ❌ Less structured approval tracking
- ❌ Need workarounds for queries

---

### Option 2: Add New Functions (Complete Solution)

**Add missing functions to chaincode:**

1. Add contract draft functions
2. Enhance registration with reference numbers
3. Add organization-specific approval functions
4. Add reference-based queries
5. Upgrade chaincode to v2.2

**Pros**:
- ✅ Clean, purpose-built functions
- ✅ Native reference number support
- ✅ Structured approval tracking
- ✅ Better queries and reporting

**Cons**:
- ❌ Requires chaincode upgrade
- ❌ Need to redeploy to all 5 peers
- ❌ More development time

---

## Recommended Hybrid Approach

### Phase 1: Use Existing + PostgreSQL (Immediate)

**Contract Workflow**:
```
1. Contract Negotiation → PostgreSQL (contract_drafts table)
2. Both parties accept → Status: ACCEPTED
3. Exporter requests finalization → ECTA reviews
4. ECTA approves → Generate reference in PostgreSQL
5. Call CreateExportRequest with reference in metadata
6. Call SubmitToNetworkRequest with exportId
7. Organizations call UpdateExportWorkflow for approvals
```

**Implementation**:
```javascript
// In gateway API
async function finalizeContract(draftId) {
  // 1. Generate reference number in PostgreSQL
  const referenceNumber = await generateReferenceNumber();
  
  // 2. Update contract in PostgreSQL
  await db.query(
    'UPDATE contract_drafts SET ecta_reference_number = $1, status = $2',
    [referenceNumber, 'REGISTERED']
  );
  
  // 3. Create export request on blockchain
  const exportData = {
    exportId: generateUUID(),
    exporterId,
    referenceNumber, // Store in metadata
    coffeeType,
    quantity,
    // ... other details
  };
  
  await fabricService.invokeChaincode('CreateExportRequest', JSON.stringify(exportData));
  
  // 4. Return reference number
  return { referenceNumber, exportId };
}
```

**Network Submission**:
```javascript
// In gateway API
async function submitToNetwork(referenceNumber) {
  // 1. Get contract from PostgreSQL
  const contract = await db.query(
    'SELECT * FROM contract_drafts WHERE ecta_reference_number = $1',
    [referenceNumber]
  );
  
  // 2. Get export from blockchain
  const exportData = await fabricService.queryChaincode('GetExportRequest', contract.export_id);
  
  // 3. Submit ESW
  const eswData = {
    requestId: generateUUID(),
    exportId: contract.export_id,
    exporterId: contract.exporter_id,
    referenceNumber, // Store in metadata
    documents: uploadedDocuments
  };
  
  await fabricService.invokeChaincode('SubmitToNetworkRequest', JSON.stringify(eswData));
}
```

**Organization Approvals**:
```javascript
// In gateway API - Bank approval
async function bankApproval(referenceNumber, approvalData) {
  // 1. Get ESW from blockchain
  const esw = await getESWByReference(referenceNumber);
  
  // 2. Add approval
  const approval = {
    agency: 'COMMERCIAL_BANK',
    status: 'approved',
    lcNumber: approvalData.lcNumber,
    lcAmount: approvalData.lcAmount,
    approvedBy: userId,
    approvedAt: new Date().toISOString()
  };
  
  await fabricService.invokeChaincode('AddNetworkAgencyApproval', esw.requestId, JSON.stringify(approval));
  
  // 3. Update PostgreSQL
  await db.query(
    'UPDATE network_submissions SET bank_status = $1, bank_lc_number = $2 WHERE reference_number = $3',
    ['APPROVED', approvalData.lcNumber, referenceNumber]
  );
}
```

---

### Phase 2: Enhance Chaincode (Future)

When ready, add these functions to chaincode v2.2:

```javascript
// chaincode/ecta/index.js

/**
 * Register sales contract with ECTA reference number
 */
async RegisterSalesContractWithReference(ctx, contractJSON) {
    const contract = JSON.parse(contractJSON);
    const { draftId, exporterId, buyerId, coffeeType, quantity, totalValue } = contract;
    
    // Generate reference number
    const year = new Date().getFullYear();
    const sequence = await this._getNextSequence(ctx, 'sales_contract', year);
    const referenceNumber = `ECTA-SC-${year}-${sequence.toString().padStart(5, '0')}`;
    
    const registeredContract = {
        docType: 'registered_sales_contract',
        referenceNumber,
        draftId,
        exporterId,
        buyerId,
        coffeeType,
        quantity,
        totalValue,
        registeredAt: this._getTxTimestamp(ctx),
        registeredBy: 'ECTA',
        approvalStatus: {
            ecta: { status: 'APPROVED', approvedAt: this._getTxTimestamp(ctx) },
            bank: { status: 'PENDING' },
            nbe: { status: 'PENDING' },
            customs: { status: 'PENDING' },
            shipping: { status: 'PENDING' }
        },
        status: 'REGISTERED'
    };
    
    await ctx.stub.putState(referenceNumber, Buffer.from(JSON.stringify(registeredContract)));
    
    ctx.stub.setEvent('ContractRegisteredWithReference', Buffer.from(JSON.stringify({
        referenceNumber,
        draftId,
        timestamp: this._getTxTimestamp(ctx)
    })));
    
    return JSON.stringify({ success: true, referenceNumber });
}

/**
 * Get export by reference number
 */
async GetExportByReference(ctx, referenceNumber) {
    const contractData = await ctx.stub.getState(referenceNumber);
    
    if (!contractData || contractData.length === 0) {
        throw new Error(`Contract with reference ${referenceNumber} does not exist`);
    }
    
    return contractData.toString();
}

/**
 * Update organization approval
 */
async UpdateOrganizationApproval(ctx, referenceNumber, organization, approvalJSON) {
    const approval = JSON.parse(approvalJSON);
    const contractData = await ctx.stub.getState(referenceNumber);
    
    if (!contractData || contractData.length === 0) {
        throw new Error(`Contract with reference ${referenceNumber} does not exist`);
    }
    
    const contract = JSON.parse(contractData.toString());
    
    // Update approval status
    contract.approvalStatus[organization.toLowerCase()] = {
        status: approval.status,
        approvedAt: this._getTxTimestamp(ctx),
        approvedBy: approval.approvedBy,
        ...approval.data
    };
    
    // Check if all approved
    const allApproved = Object.values(contract.approvalStatus)
        .every(a => a.status === 'APPROVED');
    
    if (allApproved) {
        contract.status = 'EXPORT_APPROVED';
        contract.completedAt = this._getTxTimestamp(ctx);
    }
    
    contract.updatedAt = this._getTxTimestamp(ctx);
    
    await ctx.stub.putState(referenceNumber, Buffer.from(JSON.stringify(contract)));
    
    ctx.stub.setEvent('ApprovalUpdated', Buffer.from(JSON.stringify({
        referenceNumber,
        organization,
        status: approval.status,
        timestamp: this._getTxTimestamp(ctx)
    })));
    
    return JSON.stringify({ success: true, referenceNumber });
}
```

---

## Current Reality vs Documentation

### What I Documented
- ✅ Complete workflow design
- ✅ Database schema
- ✅ API endpoints
- ✅ Frontend flow
- ❌ **Assumed chaincode had all functions** (my mistake!)

### What Actually Exists
- ✅ Basic export request functions
- ✅ Basic ESW functions
- ✅ Workflow update functions
- ❌ No reference number system in chaincode
- ❌ No contract draft functions in chaincode
- ❌ No organization-specific approval functions

---

## Recommendation

**Use Hybrid Approach (Phase 1)**:

1. ✅ Contract negotiation → PostgreSQL
2. ✅ ECTA registration → PostgreSQL (generate reference)
3. ✅ Blockchain sync → Use `CreateExportRequest` (store reference in metadata)
4. ✅ Network Submission → Use `SubmitToNetworkRequest`
5. ✅ Approvals → Use `AddNetworkAgencyApproval`
6. ✅ Tracking → PostgreSQL + blockchain queries

**Benefits**:
- Works with current chaincode (no upgrade needed)
- Reference number in PostgreSQL (fast queries)
- Blockchain for immutability and audit
- Can enhance chaincode later (Phase 2)

**Trade-offs**:
- Reference number not native to blockchain
- Need PostgreSQL for reference lookups
- Less elegant than pure blockchain solution

---

## Action Items

1. ✅ Use existing chaincode functions
2. ✅ Implement reference number in PostgreSQL
3. ✅ Link PostgreSQL ↔ Blockchain via exportId
4. ✅ Build API layer to bridge both systems
5. ⏳ Plan chaincode v2.2 with native reference support (future)

---

**Status**: ✅ CLARIFIED  
**Approach**: Hybrid (PostgreSQL + Existing Chaincode)  
**Future**: Enhance chaincode with native reference system  
**Date**: March 27, 2026
