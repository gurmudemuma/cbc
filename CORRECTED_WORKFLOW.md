# Coffee Export Workflow - CORRECTED ARCHITECTURE

## Overview
Exporters use the **Exporter Portal** (off-chain PostgreSQL) to create requests. National Bank receives the request and creates the blockchain record, which is **automatically broadcast to ALL consortium members**.

## Architecture

### Off-Chain (PostgreSQL)
- **Exporter Portal** - Exporters create and manage requests
- Users managed by National Bank
- NOT part of blockchain consortium

### On-Chain (Hyperledger Fabric Blockchain)
- **National Bank** - Creates blockchain records, validates FX/license (FIRST)
- **Exporter Bank** - Validates financial documents (SECOND)
- **NCAT** - Quality certification (THIRD)
- **Customs** - Export clearance (FOURTH)
- **Shipping Line** - Logistics (FIFTH)

---

## Corrected Sequential Workflow

```
EXPORTER PORTAL (PostgreSQL)
        ↓ HTTP API Call
NATIONAL BANK API → CreateExportRequest on Blockchain
        ↓
✅ ALL CONSORTIUM NODES RECEIVE THE TRANSACTION
   (National Bank, Exporter Bank, NCAT, Customs, Shipping Line)
        ↓
Status: FX_PENDING (visible to all nodes)
```

### Stage 1: National Bank FX & License Validation

**Actor:** National Bank  
**Status:** `FX_PENDING` → `FX_APPROVED` or `FX_REJECTED`  
**Actions:**
- Validates export license authenticity
- Checks FX compliance
- Reviews exporter business registration
- **Creates blockchain record (visible to ALL nodes)**

**Chaincode Functions:**
- `CreateExportRequest` (NationalBankMSP) - Creates record on blockchain
- `ApproveFX` (NationalBankMSP) - Approves FX
- `RejectFX` (NationalBankMSP) - Rejects with reason

---

### Stage 2: Exporter Bank Financial Document Validation

**Actor:** Exporter Bank  
**Status:** `BANKING_PENDING` → `BANKING_APPROVED` or `BANKING_REJECTED`  
**Actions:**
- Reviews commercial invoice
- Validates sales contract
- Checks payment terms
- Conducts credit checks

**Chaincode Functions:**
- `SubmitForBankingReview` (NationalBankMSP) - Moves to banking stage
- `ApproveBanking` (ExporterBankMSP) - Approves financial docs
- `RejectBanking` (ExporterBankMSP) - Rejects with reason

---

### Stage 3: NCAT Quality Certification

**Actor:** NCAT  
**Status:** `QUALITY_PENDING` → `QUALITY_CERTIFIED` or `QUALITY_REJECTED`  
**Actions:**
- Reviews coffee quality specifications
- Validates quality certificates
- Issues quality certification

**Chaincode Functions:**
- `SubmitForQuality` (ExporterBankMSP) - Submits for quality review
- `IssueQualityCertificate` (NCATMSP) - Approves quality
- `RejectQuality` (NCATMSP) - Rejects with reason

---

### Stage 4: Customs Export Clearance

**Actor:** Customs Authorities  
**Status:** `EXPORT_CUSTOMS_PENDING` → `EXPORT_CUSTOMS_CLEARED` or `REJECTED`  
**Actions:**
- Reviews all documentation
- Issues export clearance
- Final regulatory compliance

**Chaincode Functions:**
- `SubmitToExportCustoms` (ExporterBankMSP or NCATMSP)
- `ClearExportCustoms` (CustomAuthoritiesMSP)
- `RejectExportCustoms` (CustomAuthoritiesMSP)

---

### Stage 5: Shipping Line Logistics

**Actor:** Shipping Line  
**Status:** `SHIPMENT_SCHEDULED` → `SHIPPED` → `ARRIVED`  
**Actions:**
- Schedules transport
- Confirms departure
- Notifies arrival

**Chaincode Functions:**
- `ScheduleShipment` (ShippingLineMSP)
- `ConfirmShipment` (ShippingLineMSP)
- `NotifyArrival` (ShippingLineMSP)

---

## Data Flow

### 1. Exporter Creates Request (Portal)
```
Exporter Portal (PostgreSQL)
  ↓ POST request
National Bank API
  ↓ Fabric SDK
Hyperledger Fabric Network
  ↓ Broadcast to ALL peers
✅ ALL consortium members see the request
```

### 2. Each Member Processes Sequentially
```
Status Changes on Blockchain:
FX_PENDING
  → FX_APPROVED (National Bank)
  → BANKING_PENDING
  → BANKING_APPROVED (Exporter Bank)
  → QUALITY_PENDING
  → QUALITY_CERTIFIED (NCAT)
  → EXPORT_CUSTOMS_PENDING
  → EXPORT_CUSTOMS_CLEARED (Customs)
  → SHIPMENT_SCHEDULED
  → SHIPPED (Shipping Line)
```

### 3. ALL Nodes See Every Update
- Each status change creates a new block
- **All consortium members receive the update automatically**
- Hyperledger Fabric's consensus ensures synchronization

---

## Key Differences from Previous Design

### ❌ Old (Incorrect):
- Exporter Bank created blockchain records
- Quality came before FX approval
- No Exporter Bank financial validation stage

### ✅ New (Correct):
- **National Bank** creates blockchain records (portal submits through them)
- **FX validation** happens FIRST
- **Exporter Bank validates financial documents** (commercial invoice, sales contract)
- **Quality certification** comes AFTER banking approval
- Exporters are NOT on blockchain (PostgreSQL only)

---

## API Integration

### Exporter Portal → National Bank
```http
POST http://localhost:3002/api/consortium/export-requests
Content-Type: application/json
Authorization: Bearer {jwt-token}

{
  "portalRequestId": "uuid",
  "exporterName": "ABC Coffee Ltd",
  "exportLicenseNumber": "EXP-2024-001",
  "coffeeType": "Arabica Grade 1",
  "quantity": 5000,
  "destinationCountry": "Germany",
  "estimatedValue": 42500,
  "ecxLotNumber": "LOT-123",
  "warehouseLocation": "Addis Ababa"
}
```

### National Bank → Blockchain
```javascript
// National Bank API calls chaincode
await contract.submitTransaction(
  "CreateExportRequest",
  exportID,
  exporterBankID,
  exporterName,
  exportLicenseNumber,
  coffeeType,
  quantity,
  destinationCountry,
  estimatedValue,
  ecxLotNumber,
  warehouseLocation
);
// ✅ Transaction broadcasts to ALL consortium nodes
```

---

## Status Flow Diagram

```
Portal (PostgreSQL)
        ↓
┌───────────────────────────────────────────┐
│   BLOCKCHAIN (All Nodes See Everything)   │
├───────────────────────────────────────────┤
│                                           │
│  FX_PENDING                               │
│      ↓ National Bank validates            │
│  FX_APPROVED                              │
│      ↓ National Bank submits              │
│  BANKING_PENDING                          │
│      ↓ Exporter Bank validates            │
│  BANKING_APPROVED                         │
│      ↓ Exporter Bank submits              │
│  QUALITY_PENDING                          │
│      ↓ NCAT certifies                     │
│  QUALITY_CERTIFIED                        │
│      ↓ Submit to customs                  │
│  EXPORT_CUSTOMS_PENDING                   │
│      ↓ Customs clears                     │
│  EXPORT_CUSTOMS_CLEARED                   │
│      ↓ Shipping Line schedules            │
│  SHIPMENT_SCHEDULED                       │
│      ↓ Shipping Line confirms             │
│  SHIPPED                                  │
│      ↓ Arrives at destination             │
│  ARRIVED                                  │
│                                           │
└───────────────────────────────────────────┘
```

---

## Deployment Steps

### 1. Build Chaincode
```bash
cd /home/gu-da/cbc/chaincode/coffee-export
go mod tidy
go build ./...
```

### 2. Deploy Updated Chaincode
```bash
cd /home/gu-da/cbc/network
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang -ccv 2.0 -ccs 2
```

### 3. Update National Bank API
- Add endpoint to receive portal submissions
- Implement `CreateExportRequest` chaincode call
- Add FX approval/rejection endpoints

### 4. Update Exporter Bank API
- Add financial document validation endpoints
- Implement banking approval/rejection
- Remove export creation functionality

### 5. Update Exporter Portal
- Change submission endpoint to National Bank
- Update status displays for new banking stage
- Remove direct blockchain interaction

---

##Blockchain Guarantees

✅ **All nodes see all transactions** - Hyperledger Fabric broadcasts automatically  
✅ **Sequential validation** - Chaincode enforces correct order  
✅ **Immutable audit trail** - All approvals/rejections recorded  
✅ **No data loss** - Consensus ensures synchronization  
✅ **Role-based access** - MSP IDs validate who can perform actions

---

**Version:** 2.0  
**Last Updated:** 2025-10-21  
**Architecture:** Hybrid (PostgreSQL + Hyperledger Fabric)
