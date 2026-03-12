# Smart Contract Updates Required

## Overview
The chaincode needs 10 new functions to support the sales contract enhancement features.

## Current Chaincode
**File**: `chaincode/ecta/index.js`

## Required Updates

### 1. Extended Incoterms Support
**Current**: Only FOB, CIF, CFR (3 terms)
**Required**: All 11 Incoterms 2020 terms

```javascript
const INCOTERMS_2020 = {
  // Any mode of transport
  'EXW': 'Ex Works',
  'FCA': 'Free Carrier',
  'CPT': 'Carriage Paid To',
  'CIP': 'Carriage and Insurance Paid To',
  'DAP': 'Delivered At Place',
  'DPU': 'Delivered at Place Unloaded',
  'DDP': 'Delivered Duty Paid',
  
  // Sea and inland waterway only
  'FAS': 'Free Alongside Ship',
  'FOB': 'Free On Board',
  'CFR': 'Cost and Freight',
  'CIF': 'Cost, Insurance and Freight'
};

async ValidateIncoterms(ctx, incoterm) {
  if (!INCOTERMS_2020[incoterm]) {
    throw new Error(`Invalid Incoterm. Must be one of: ${Object.keys(INCOTERMS_2020).join(', ')}`);
  }
  return { valid: true, description: INCOTERMS_2020[incoterm] };
}
```

### 2. Legal Framework Support

```javascript
async RecordLegalFramework(ctx, contractId, legalFrameworkData) {
  const contract = await this.GetContract(ctx, contractId);
  
  contract.legalFramework = {
    governingLaw: legalFrameworkData.governingLaw, // CISG, ETHIOPIAN_LAW, etc.
    arbitrationLocation: legalFrameworkData.arbitrationLocation,
    arbitrationRules: legalFrameworkData.arbitrationRules, // ICC, UNCITRAL, etc.
    contractLanguage: legalFrameworkData.contractLanguage || 'English',
    recordedAt: new Date().toISOString()
  };
  
  await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
  return { success: true };
}
```

### 3. Force Majeure Handling

```javascript
async RegisterForceMajeureEvent(ctx, contractId, eventData) {
  const contract = await this.GetContract(ctx, contractId);
  
  contract.forceMajeure = {
    eventType: eventData.eventType, // PANDEMIC, WAR, NATURAL_DISASTER, etc.
    description: eventData.description,
    declaredBy: eventData.declaredBy,
    declaredAt: new Date().toISOString(),
    notificationDate: eventData.notificationDate,
    expectedDuration: eventData.expectedDuration,
    status: 'ACTIVE'
  };
  
  await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
  
  ctx.stub.setEvent('ForceMajeureRegistered', Buffer.from(JSON.stringify({
    contractId,
    eventType: eventData.eventType,
    timestamp: new Date().toISOString()
  })));
  
  return { success: true };
}

async SuspendContract(ctx, contractId, suspensionData) {
  const contract = await this.GetContract(ctx, contractId);
  
  if (!contract.forceMajeure || contract.forceMajeure.status !== 'ACTIVE') {
    throw new Error('Cannot suspend: No active force majeure event');
  }
  
  contract.status = 'SUSPENDED';
  contract.suspendedAt = new Date().toISOString();
  contract.suspensionReason = suspensionData.reason;
  
  await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
  return { success: true };
}

async ResumeContract(ctx, contractId, resumptionData) {
  const contract = await this.GetContract(ctx, contractId);
  
  if (contract.status !== 'SUSPENDED') {
    throw new Error('Contract is not suspended');
  }
  
  contract.status = 'ACTIVE';
  contract.resumedAt = new Date().toISOString();
  contract.forceMajeure.status = 'RESOLVED';
  contract.forceMajeure.resolvedAt = new Date().toISOString();
  
  await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
  return { success: true };
}
```

### 4. Dispute Recording

```javascript
async RecordDispute(ctx, contractId, disputeData) {
  const disputeId = `DISPUTE-${Date.now()}`;
  
  const dispute = {
    docType: 'dispute',
    disputeId,
    contractId,
    raisedBy: disputeData.raisedBy,
    raisedByType: disputeData.raisedByType, // EXPORTER, BUYER
    raisedAgainst: disputeData.raisedAgainst,
    disputeType: disputeData.disputeType, // QUALITY, PAYMENT, DELIVERY, etc.
    severity: disputeData.severity, // LOW, MEDIUM, HIGH, CRITICAL
    description: disputeData.description,
    claimedAmount: disputeData.claimedAmount,
    currency: disputeData.currency,
    evidenceDocuments: disputeData.evidenceDocuments || [],
    status: 'OPEN',
    createdAt: new Date().toISOString()
  };
  
  await ctx.stub.putState(disputeId, Buffer.from(JSON.stringify(dispute)));
  
  ctx.stub.setEvent('DisputeRecorded', Buffer.from(JSON.stringify({
    disputeId,
    contractId,
    disputeType: disputeData.disputeType,
    timestamp: new Date().toISOString()
  })));
  
  return { success: true, disputeId };
}

async ResolveDispute(ctx, disputeId, resolutionData) {
  const disputeData = await ctx.stub.getState(disputeId);
  
  if (!disputeData || disputeData.length === 0) {
    throw new Error(`Dispute ${disputeId} not found`);
  }
  
  const dispute = JSON.parse(disputeData.toString());
  
  dispute.status = 'RESOLVED';
  dispute.resolutionMethod = resolutionData.resolutionMethod; // NEGOTIATION, MEDIATION, ARBITRATION
  dispute.resolutionNotes = resolutionData.resolutionNotes;
  dispute.awardedAmount = resolutionData.awardedAmount;
  dispute.awardedTo = resolutionData.awardedTo;
  dispute.resolvedAt = new Date().toISOString();
  
  await ctx.stub.putState(disputeId, Buffer.from(JSON.stringify(dispute)));
  
  return { success: true };
}
```

### 5. Multi-Currency Support

```javascript
async RecordExchangeRate(ctx, fromCurrency, toCurrency, rate, effectiveDate) {
  const rateId = `RATE-${fromCurrency}-${toCurrency}-${Date.now()}`;
  
  const exchangeRate = {
    docType: 'exchangeRate',
    rateId,
    fromCurrency,
    toCurrency,
    rate: parseFloat(rate),
    effectiveDate: effectiveDate || new Date().toISOString(),
    recordedAt: new Date().toISOString()
  };
  
  await ctx.stub.putState(rateId, Buffer.from(JSON.stringify(exchangeRate)));
  return { success: true, rateId };
}

async GetExchangeRate(ctx, fromCurrency, toCurrency) {
  const query = {
    selector: {
      docType: 'exchangeRate',
      fromCurrency,
      toCurrency
    },
    sort: [{ effectiveDate: 'desc' }],
    limit: 1
  };
  
  const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
  const result = await this._getAllResults(iterator);
  
  if (result.length === 0) {
    throw new Error(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
  }
  
  return result[0];
}
```

### 6. Contract Amendment

```javascript
async AmendContract(ctx, contractId, amendmentData) {
  const contract = await this.GetContract(ctx, contractId);
  
  if (contract.status !== 'ACTIVE') {
    throw new Error('Can only amend active contracts');
  }
  
  const amendmentId = `AMENDMENT-${Date.now()}`;
  
  const amendment = {
    amendmentId,
    contractId,
    amendmentType: amendmentData.amendmentType, // PRICE, QUANTITY, DELIVERY, etc.
    previousValues: amendmentData.previousValues,
    newValues: amendmentData.newValues,
    reason: amendmentData.reason,
    approvedBy: amendmentData.approvedBy,
    approvedAt: new Date().toISOString()
  };
  
  // Store amendment history
  if (!contract.amendments) {
    contract.amendments = [];
  }
  contract.amendments.push(amendment);
  
  // Apply changes
  Object.assign(contract, amendmentData.newValues);
  contract.updatedAt = new Date().toISOString();
  
  await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
  
  return { success: true, amendmentId };
}
```

### 7. Finalize Contract from Draft

```javascript
async FinalizeContractFromDraft(ctx, draftId, finalContractData) {
  // This function creates a blockchain contract from an accepted draft
  const contractId = `CONTRACT-${Date.now()}`;
  
  const contract = {
    docType: 'finalizedContract',
    contractId,
    draftId, // Reference to off-chain draft
    
    // Parties
    exporterId: finalContractData.exporterId,
    buyerId: finalContractData.buyerId,
    
    // Contract terms from draft
    coffeeType: finalContractData.coffeeType,
    quantity: finalContractData.quantity,
    unitPrice: finalContractData.unitPrice,
    totalValue: finalContractData.totalValue,
    currency: finalContractData.currency,
    
    // Payment & Delivery
    paymentTerms: finalContractData.paymentTerms,
    paymentMethod: finalContractData.paymentMethod,
    incoterms: finalContractData.incoterms,
    deliveryDate: finalContractData.deliveryDate,
    
    // Legal framework
    governingLaw: finalContractData.governingLaw,
    arbitrationLocation: finalContractData.arbitrationLocation,
    arbitrationRules: finalContractData.arbitrationRules,
    forceMajeureClause: finalContractData.forceMajeureClause,
    
    // Status
    status: 'ACTIVE',
    finalizedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
  
  ctx.stub.setEvent('ContractFinalized', Buffer.from(JSON.stringify({
    contractId,
    draftId,
    timestamp: new Date().toISOString()
  })));
  
  return { success: true, contractId };
}
```

## Implementation Priority

1. ✅ **Extended Incoterms** - Critical for international trade
2. ✅ **Legal Framework** - Required for compliance
3. ✅ **Force Majeure** - Risk management
4. ✅ **Finalize from Draft** - Connects off-chain to on-chain
5. ⚠️ **Dispute Recording** - Important but can be added later
6. ⚠️ **Multi-Currency** - Nice to have
7. ⚠️ **Contract Amendment** - Advanced feature

## Testing Requirements

After adding these functions, test:
1. All 11 Incoterms validation
2. Legal framework recording
3. Force majeure event flow
4. Draft to blockchain finalization
5. Dispute creation and resolution

## Deployment

```bash
# Package chaincode
cd chaincode/ecta
tar -czf ecta-v1.8.tar.gz .

# Install on all peers
# Approve and commit
# Test new functions
```
