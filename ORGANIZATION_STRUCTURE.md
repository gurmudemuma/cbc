# Coffee Export Consortium - Organization Structure

## Active Organizations (5)

The system currently uses **5 active organizations**:

### 1. commercialbank (ORG 1)
- **Domain:** commercialbank.coffee-export.com
- **Peer Port:** 7051
- **API Port:** 3001
- **MSP ID:** commercialbankMSP
- **Role:** Coffee exporter, initiates export records
- **Crypto Config:** `crypto-config-commercialbank.yaml`

### 2. NationalBank (ORG 2)
- **Domain:** nationalbank.coffee-export.com
- **Peer Port:** 8051
- **API Port:** 3002
- **MSP ID:** NationalBankMSP
- **Role:** Financial institution, processes payments
- **Crypto Config:** `crypto-config-nationalbank.yaml`

### 3. ECTA (ORG 3) ✅ STANDARDIZED
- **Domain:** ecta.coffee-export.com
- **Peer Port:** 9051
- **API Port:** 3003
- **MSP ID:** ECTAMSP
- **Role:** Quality certification authority, inspects coffee
- **Crypto Config:** `crypto-config-ecta.yaml`
- **Previous Name:** NCAT (now standardized to ECTA)

### 4. ShippingLine (ORG 4)
- **Domain:** shippingline.coffee-export.com
- **Peer Port:** 10051
- **API Port:** 3004
- **MSP ID:** ShippingLineMSP
- **Role:** Logistics provider, manages shipments
- **Crypto Config:** `crypto-config-shippingline.yaml`

### 5. CustomAuthorities (ORG 5)
- **Domain:** customauthorities.coffee-export.com
- **Peer Port:** 11051
- **API Port:** 3005
- **MSP ID:** CustomAuthoritiesMSP
- **Role:** Customs clearance authority
- **Crypto Config:** `crypto-config-customauthorities.yaml`

## Inactive/Reserved Organizations

### ECX (ORG 6) - RESERVED
- **Domain:** ecx.coffee-export.com
- **Peer Port:** 12051
- **MSP ID:** ECXMSP
- **Status:** Defined in scripts but NOT ACTIVE
- **Crypto Config:** NOT CREATED
- **Note:** Reserved for future expansion

## System Architecture

```
Coffee Export Consortium Blockchain
├── 5 Active Organizations
│   ├── commercialbank (Port 7051) → API Port 3001
│   ├── NationalBank (Port 8051) → API Port 3002
│   ├── ECTA (Port 9051) → API Port 3003 ✅
│   ├── ShippingLine (Port 10051) → API Port 3004
│   └── CustomAuthorities (Port 11051) → API Port 3005
├── 1 Orderer
│   └── orderer.coffee-export.com (Port 7050)
├── 1 Channel
│   └── coffeechannel
├── 2 Chaincodes
│   ├── coffee-export (v2.0)
│   └── user-management (v1.0)
└── Supporting Services
    ├── IPFS (Port 5001)
    └── CouchDB (Ports 5984, 6984, 7984, 8984, 9984)
```

## Configuration Files

### Cryptogen Configurations
```
network/organizations/cryptogen/
├── crypto-config-commercialbank.yaml ✅
├── crypto-config-nationalbank.yaml ✅
├── crypto-config-ecta.yaml ✅ (STANDARDIZED)
├── crypto-config-shippingline.yaml ✅
├── crypto-config-customauthorities.yaml ✅
├── crypto-config-orderer.yaml ✅
└── (crypto-config-ecx.yaml - NOT CREATED)
```

### Environment Variables
**File:** `network/scripts/envVar.sh`

- ORG 1 = commercialbank
- ORG 2 = NationalBank
- ORG 3 = ECTA
- ORG 4 = ShippingLine
- ORG 5 = CustomAuthorities
- ORG 6 = ECX (reserved, not used)

## Workflow

### Coffee Export Process

1. **commercialbank** (ORG 1)
   - Creates export record
   - Submits coffee details to blockchain

2. **ECTA** (ORG 3) ✅
   - Inspects coffee quality
   - Issues quality certification
   - Updates blockchain record

3. **NationalBank** (ORG 2)
   - Processes payment
   - Issues letter of credit
   - Records transaction

4. **ShippingLine** (ORG 4)
   - Arranges logistics
   - Tracks shipment
   - Updates delivery status

5. **CustomAuthorities** (ORG 5)
   - Performs customs clearance
   - Issues export permit
   - Finalizes transaction

## Adding ECX (Future)

If ECX needs to be activated in the future:

1. Create crypto config: `crypto-config-ecx.yaml`
2. Generate crypto material: `cryptogen generate --config=./organizations/cryptogen/crypto-config-ecx.yaml`
3. Update configtx.yaml to include ECX organization
4. Update docker-compose.yaml to add ECX peer
5. Create ECX API service
6. Update all scripts to include ECX (ORG 6)

## Test Users

### Active Test Users (5 Organizations)

| Organization | Username | Password | Role |
|--------------|----------|----------|------|
| commercialbank | exporter1 | Exporter123!@# | exporter |
| NationalBank | banker1 | Banker123!@# | bank |
| ECTA | inspector1 | Inspector123!@# | user |
| ShippingLine | shipper1 | Shipper123!@# | shipper |
| CustomAuthorities | custom1 | Custom123!@# | customs |

## Summary

✅ **5 Active Organizations** - Fully operational
✅ **ECTA Standardization** - Complete (ORG 3)
⏸️ **ECX Reserved** - For future expansion (ORG 6)

The system is designed to be scalable. ECX is reserved for future use but not currently active.
