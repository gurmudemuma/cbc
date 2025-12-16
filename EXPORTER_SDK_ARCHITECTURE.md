# Exporter Portal - SDK Architecture Clarification

## Important Distinction

### **Exporter Portal is NOT an MSP Member**

The Exporter Portal is an **external client application** that uses the **Fabric SDK** to interact with the blockchain network. It does NOT have its own MSP (Membership Service Provider) or peer nodes.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXPORTER PORTAL                              │
│                   (External Web Application)                     │
│                                                                   │
│  - Node.js/Express API                                           │
│  - React Frontend                                                │
│  - Uses Fabric SDK (fabric-network)                             │
│  - NO peer node                                                  │
│  - NO MSP membership                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [Fabric SDK Connection]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   COMMERCIAL BANK PEER                           │
│                    (Gateway Peer Node)                           │
│                                                                   │
│  - MSP ID: CommercialBankMSP                                     │
│  - Runs peer node                                                │
│  - Acts as gateway for Exporter Portal                          │
│  - Submits transactions on behalf of exporters                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [Blockchain Network]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    HYPERLEDGER FABRIC                            │
│                                                                   │
│  - Channel: coffeechannel                                        │
│  - Chaincode: coffee-export                                      │
│  - Validates: clientMSPID == "CommercialBankMSP"                │
└─────────────────────────────────────────────────────────────────┘
```

---

## How It Works

### **1. Exporter Portal Setup**

**File**: `/api/exporter-portal/src/fabric/sdk-gateway.ts`

```typescript
// Exporter Portal connects via SDK
const gateway = new Gateway();
await gateway.connect(connectionProfile, {
  wallet,
  identity: 'exporterClient',  // NOT an MSP, just a client identity
  discovery: { enabled: true }
});

// Get contract through Commercial Bank's peer
const network = await gateway.getNetwork('coffeechannel');
const contract = network.getContract('coffee-export');
```

### **2. Connection Profile**

The Exporter Portal uses the **Commercial Bank's connection profile**:

```
/network/organizations/peerOrganizations/commercialbank.coffee-export.com/
  connection-commercialbank.json
```

This connection profile points to the Commercial Bank's peer as the gateway.

### **3. Identity Enrollment**

The exporter's identity (`exporterClient`) is enrolled through the Commercial Bank's Certificate Authority (CA):

```bash
# Enrollment happens via Commercial Bank's CA
fabric-ca-client enroll \
  -u https://exporterClient:password@ca.commercialbank.coffee-export.com:7054
```

### **4. Transaction Submission**

When the Exporter Portal submits a transaction:

```typescript
// Exporter Portal code
await contract.submitTransaction('CreateExportRequest', exportId, ...);
```

**What happens on the blockchain**:

```go
// Chaincode validation (contract.go line 248-254)
clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
if clientMSPID != "ECXMSP" && clientMSPID != "CommercialBankMSP" {
    return fmt.Errorf("only Commercial Bank or ECX can create export requests")
}
// ✅ Passes because clientMSPID = "CommercialBankMSP"
```

The transaction is submitted with **CommercialBankMSP** identity, not an "ExporterPortalMSP".

---

## Key Points

### ✅ **What Exporter Portal IS**
- External web application
- Uses Fabric SDK for connectivity
- Client identity enrolled via Commercial Bank's CA
- Submits transactions through Commercial Bank's peer
- Read-only queries for own exports

### ❌ **What Exporter Portal is NOT**
- NOT a blockchain peer organization
- NOT an MSP member
- Does NOT run a peer node
- Does NOT have direct blockchain access
- Does NOT have its own MSP ID

---

## Blockchain MSP Members

Only these organizations are actual MSP members with peer nodes:

1. **CommercialBankMSP** - Commercial Bank (also gateway for Exporter Portal)
2. **ECXMSP** - Ethiopian Commodity Exchange
3. **ECTAMSP** - Ethiopian Coffee & Tea Authority
4. **NBEMSP** - National Bank of Ethiopia
5. **CustomAuthoritiesMSP** - Customs Authorities
6. **ShippingLineMSP** - Shipping Line
7. **OrdererMSP** - Orderer nodes

---

## Why This Architecture?

### **Benefits**
1. **Scalability**: Exporters don't need to run blockchain nodes
2. **Simplicity**: Exporters use simple web interface
3. **Cost-effective**: No infrastructure required for exporters
4. **Security**: Commercial Bank controls access and validates exporters
5. **Standard Practice**: This is the recommended Fabric architecture for external clients

### **How Commercial Bank Manages This**
- Enrolls exporter identities via their CA
- Validates exporter credentials before submission
- Acts as trusted gateway
- Maintains exporter wallet identities
- Provides connection profile to Exporter Portal

---

## Transaction Flow Example

### **Exporter Creates Export Request**

```
1. Exporter fills form in web UI
   ↓
2. Frontend sends HTTP POST to Exporter Portal API
   POST /api/exports
   ↓
3. Exporter Portal API uses Fabric SDK
   contract.submitTransaction('CreateExportRequest', ...)
   ↓
4. SDK sends to Commercial Bank's peer (gateway)
   Identity: exporterClient
   ↓
5. Commercial Bank's peer endorses transaction
   MSP ID: CommercialBankMSP
   ↓
6. Chaincode validates MSP
   if clientMSPID == "CommercialBankMSP" ✅
   ↓
7. Transaction committed to blockchain
   Creator: CommercialBankMSP
   ↓
8. Response returned to Exporter Portal
   ↓
9. Exporter sees confirmation in UI
```

---

## Configuration Files

### **Exporter Portal Config**
```typescript
// /api/exporter-portal/src/config/index.ts
{
  ORGANIZATION_ID: 'exporter-portal',
  ORGANIZATION_NAME: 'ExporterPortal',
  TARGET_PEER_MSP: 'CommercialBankMSP',  // ← Gateway MSP
  CHANNEL_NAME: 'coffeechannel',
  CHAINCODE_NAME_EXPORT: 'coffee-export'
}
```

### **Connection Profile**
```json
{
  "name": "coffee-export-network",
  "version": "1.0.0",
  "client": {
    "organization": "commercialbank",  // ← Commercial Bank
    "connection": {
      "timeout": {
        "peer": { "endorser": "300" }
      }
    }
  },
  "organizations": {
    "commercialbank": {
      "mspid": "CommercialBankMSP",  // ← Actual MSP
      "peers": ["peer0.commercialbank.coffee-export.com"]
    }
  }
}
```

---

## Summary

| Aspect | Exporter Portal | Commercial Bank |
|--------|----------------|-----------------|
| **Type** | External Client | MSP Member |
| **Connectivity** | Fabric SDK | Peer Node |
| **MSP ID** | None (uses CommercialBankMSP) | CommercialBankMSP |
| **Peer Node** | No | Yes |
| **CA** | Uses Commercial Bank's CA | Runs own CA |
| **Blockchain Access** | Via SDK through gateway | Direct peer access |
| **Transaction Creator** | Submits via SDK | CommercialBankMSP |

**Bottom Line**: The Exporter Portal is an external application that uses the Fabric SDK to connect through the Commercial Bank's peer. All blockchain transactions appear to come from `CommercialBankMSP`, not from a separate "ExporterPortalMSP" (which doesn't exist).
