# Coffee Blockchain Consortium - Component Startup Order

This document defines the correct order for starting all system components to ensure proper initialization and dependencies.

---

## Overview

The Coffee Blockchain Consortium system has multiple interdependent components that must be started in a specific order. This document provides the definitive startup sequence.

---

## Startup Sequence

### Phase 1: Prerequisites & Environment Setup

**Order:** Must be completed before any services start

1. **Docker Daemon**
   - Must be running before any blockchain components
   - Verify: `docker info`

2. **Environment Files**
   - Create `.env` files from `.env.example` templates
   - Locations:
     - `/api/commercialbank/.env`
     - `/api/national-bank/.env`
     - `/api/ncat/.env`
     - `/api/shipping-line/.env`
     - `/frontend/.env`

3. **Dependencies Installation**
   - Install Go modules for chaincode
   - Install npm packages for APIs
   - Install npm packages for frontend

4. **Fabric Binaries**
   - Ensure Fabric binaries are installed and in PATH
   - Required: `peer`, `orderer`, `configtxgen`, `cryptogen`, `osnadmin`

---

### Phase 2: Blockchain Network Initialization

**Order:** Sequential - each step depends on the previous

#### Step 1: Generate Cryptographic Material
```bash
cd network
cryptogen generate --config=./organizations/cryptogen/crypto-config-commercialbank.yaml
cryptogen generate --config=./organizations/cryptogen/crypto-config-nationalbank.yaml
cryptogen generate --config=./organizations/cryptogen/crypto-config-ncat.yaml
cryptogen generate --config=./organizations/cryptogen/crypto-config-shippingline.yaml
cryptogen generate --config=./organizations/cryptogen/crypto-config-orderer.yaml
```

**Purpose:** Creates certificates and keys for all organizations
**Dependencies:** None
**Output:** `organizations/peerOrganizations/` and `organizations/ordererOrganizations/`

#### Step 2: Generate Connection Profiles
```bash
./organizations/ccp-generate.sh
```

**Purpose:** Creates connection profiles for API services
**Dependencies:** Cryptographic material from Step 1
**Output:** `connection-*.json` and `connection-*.yaml` files

#### Step 3: Start Docker Containers
```bash
docker-compose -f docker/docker-compose.yaml up -d
```

**Purpose:** Starts orderer, peers, and CouchDB containers
**Dependencies:** Cryptographic material
**Containers Started:**
- `orderer.coffee-export.com`
- `peer0.commercialbank.coffee-export.com`
- `peer0.nationalbank.coffee-export.com`
- `peer0.ncat.coffee-export.com`
- `peer0.shippingline.coffee-export.com`
- `couchdb0`, `couchdb1`, `couchdb2`, `couchdb3`
- `cli` (optional, for debugging)

**Wait Time:** 10-15 seconds for containers to initialize

#### Step 4: Create Channel Genesis Block
```bash
configtxgen -profile CoffeeExportGenesis \
  -outputBlock ./channel-artifacts/coffeechannel.block \
  -channelID coffeechannel
```

**Purpose:** Creates the genesis block for the channel
**Dependencies:** Docker containers running
**Output:** `channel-artifacts/coffeechannel.block`

#### Step 5: Create Channel (Orderer)
```bash
osnadmin channel join \
  --channelID coffeechannel \
  --config-block ./channel-artifacts/coffeechannel.block \
  -o orderer.coffee-export.com:7053 \
  --ca-file "$ORDERER_CA" \
  --client-cert "$ORDERER_ADMIN_TLS_SIGN_CERT" \
  --client-key "$ORDERER_ADMIN_TLS_PRIVATE_KEY"
```

**Purpose:** Joins orderer to the channel
**Dependencies:** Genesis block created
**Wait Time:** 2-3 seconds

#### Step 6: Join Peers to Channel
```bash
# For each peer (commercialbank, NationalBank, ECTA, ShippingLine)
peer channel join -b ./channel-artifacts/coffeechannel.block
```

**Purpose:** Joins all peer nodes to the channel
**Dependencies:** Channel created on orderer
**Order:** Can be done in parallel, but typically sequential
**Wait Time:** 2-3 seconds per peer

#### Step 7: Set Anchor Peers
```bash
# For each organization
peer channel update -o orderer.coffee-export.com:7050 \
  -c coffeechannel \
  -f ./channel-artifacts/${ORG}MSPanchors.tx
```

**Purpose:** Configures anchor peers for cross-organization communication
**Dependencies:** Peers joined to channel
**Order:** Sequential for each organization

---

### Phase 3: Chaincode Deployment

**Order:** Sequential for each chaincode, but chaincodes can be deployed in any order

#### Chaincode 1: user-management

##### Step 1: Package Chaincode
```bash
peer lifecycle chaincode package user-management.tar.gz \
  --path ../chaincode/user-management \
  --lang golang \
  --label user-management_1.0
```

##### Step 2: Install on All Peers
```bash
# Install on each peer (commercialbank, NationalBank, ECTA, ShippingLine)
peer lifecycle chaincode install user-management.tar.gz
```
**Order:** Can be parallel, typically sequential

##### Step 3: Approve for Each Organization
```bash
# For each organization
peer lifecycle chaincode approveformyorg \
  --channelID coffeechannel \
  --name user-management \
  --version 1.0 \
  --package-id $PACKAGE_ID \
  --sequence 1
```
**Order:** Must be sequential, one org at a time

##### Step 4: Commit Chaincode Definition
```bash
peer lifecycle chaincode commit \
  --channelID coffeechannel \
  --name user-management \
  --version 1.0 \
  --sequence 1 \
  --peerAddresses peer0.commercialbank.coffee-export.com:7051 \
  --peerAddresses peer0.nationalbank.coffee-export.com:8051 \
  --peerAddresses peer0.ncat.coffee-export.com:9051 \
  --peerAddresses peer0.shippingline.coffee-export.com:10051
```
**Dependencies:** All organizations approved
**Wait Time:** 5-10 seconds

#### Chaincode 2: coffee-export

Repeat the same 4 steps as user-management chaincode.

**Total Time for Chaincode Deployment:** 2-5 minutes per chaincode

---

### Phase 4: Identity Management

**Order:** Sequential

#### Step 1: Enroll Admin Users
```bash
./scripts/enroll-admins.sh
```

**Purpose:** Creates admin identities in wallet for each API service
**Dependencies:** 
- Blockchain network running
- Cryptographic material available
- Connection profiles generated

**Creates:**
- `api/commercialbank/wallet/admin.id`
- `api/national-bank/wallet/admin.id`
- `api/ncat/wallet/admin.id`
- `api/shipping-line/wallet/admin.id`

**Wait Time:** 5-10 seconds

---

### Phase 5: Application Services

**Order:** Can be started in parallel, but typically sequential for monitoring

#### Step 1: Start IPFS (Optional)
```bash
ipfs daemon &
```

**Purpose:** Provides decentralized file storage
**Dependencies:** None (independent service)
**Port:** 5001 (API), 8080 (Gateway)
**Wait Time:** 5-10 seconds
**Note:** Optional - system works without IPFS

#### Step 2: Start API Services

**Recommended Order:** Start in sequence to monitor logs

1. **commercialbank API** (Port 3001)
   ```bash
   cd api/commercialbank
   npm run dev
   ```
   **Dependencies:** 
   - Blockchain network running
   - Admin enrolled
   - Connection profile available
   
   **Wait Time:** 10-15 seconds for initialization

2. **National Bank API** (Port 3002)
   ```bash
   cd api/national-bank
   npm run dev
   ```
   **Dependencies:** Same as commercialbank API
   **Wait Time:** 10-15 seconds

3. **ECTA API** (Port 3003)
   ```bash
   cd api/ncat
   npm run dev
   ```
   **Dependencies:** Same as commercialbank API
   **Wait Time:** 10-15 seconds

4. **Shipping Line API** (Port 3004)
   ```bash
   cd api/shipping-line
   npm run dev
   ```
   **Dependencies:** Same as commercialbank API
   **Wait Time:** 10-15 seconds

**Alternative:** Use `scripts/dev-apis.sh` to start all APIs in tmux session

#### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

**Purpose:** Provides user interface
**Dependencies:** At least one API service running
**Port:** 5173
**Wait Time:** 5-10 seconds

---

### Phase 6: User Registration (Optional)

**Order:** After all APIs are running

```bash
./scripts/register-test-users.sh
```

**Purpose:** Creates test users for each organization
**Dependencies:** All API services running and healthy
**Wait Time:** 15-20 seconds

---

## Complete Startup Timeline

| Phase | Component | Time | Cumulative |
|-------|-----------|------|------------|
| 1 | Prerequisites Check | 10s | 10s |
| 2.1 | Generate Crypto Material | 15s | 25s |
| 2.2 | Generate Connection Profiles | 5s | 30s |
| 2.3 | Start Docker Containers | 15s | 45s |
| 2.4 | Create Channel Genesis Block | 5s | 50s |
| 2.5 | Create Channel | 5s | 55s |
| 2.6 | Join Peers to Channel | 10s | 65s |
| 2.7 | Set Anchor Peers | 10s | 75s |
| 3.1 | Deploy user-management Chaincode | 120s | 195s |
| 3.2 | Deploy coffee-export Chaincode | 120s | 315s |
| 4 | Enroll Admin Users | 10s | 325s |
| 5.1 | Start IPFS | 10s | 335s |
| 5.2 | Start API Services | 60s | 395s |
| 5.3 | Start Frontend | 10s | 405s |
| 6 | Register Test Users | 20s | 425s |

**Total Startup Time:** ~7 minutes (first time with chaincode deployment)
**Restart Time:** ~2 minutes (if chaincode already deployed)

---

## Dependency Graph

```
Docker Daemon
    ↓
Crypto Material Generation
    ↓
Connection Profiles
    ↓
Docker Containers (Orderer + Peers)
    ↓
Channel Creation
    ↓
Peers Join Channel
    ↓
Anchor Peers Configuration
    ↓
Chaincode Deployment
    ├─→ user-management
    └─→ coffee-export
    ↓
Admin Enrollment
    ↓
API Services (parallel)
    ├─→ commercialbank API (3001)
    ├─→ National Bank API (3002)
    ├─→ ECTA API (3003)
    └─→ Shipping Line API (3004)
    ↓
Frontend (5173)
    ↓
User Registration (optional)
```

---

## Critical Dependencies

### APIs Cannot Start Without:
1. ✅ Blockchain network running
2. ✅ Channel created and peers joined
3. ✅ Chaincode deployed (at least one)
4. ✅ Admin user enrolled
5. ✅ Connection profiles available

### Frontend Cannot Function Without:
1. ✅ At least one API service running
2. ✅ API service can connect to blockchain

### Chaincode Cannot Deploy Without:
1. ✅ Channel created
2. ✅ All peers joined to channel

---

## Automated Startup Script

The `start-system.sh` script follows this exact order:

```bash
./start-system.sh [OPTIONS]

Options:
  --clean       Clean start (removes all existing data)
  --skip-deps   Skip dependency installation
```

**Script Phases:**
1. ✅ Prerequisites validation
2. ✅ Environment cleanup (if --clean)
3. ✅ Fabric binaries check
4. ✅ Setup verification
5. ✅ Dependencies installation
6. ✅ Environment files creation
7. ✅ Configuration validation
8. ✅ Security validation
9. ✅ Directory creation
10. ✅ Blockchain network startup
11. ✅ Channel creation
12. ✅ Chaincode deployment
13. ✅ Admin enrollment
14. ✅ API services startup
15. ✅ IPFS startup
16. ✅ Frontend startup
17. ✅ User registration

---

## Manual Startup (Step-by-Step)

For debugging or learning purposes:

### 1. Start Blockchain Network
```bash
cd network
./network.sh up
```

### 2. Create Channel
```bash
./network.sh createChannel
```

### 3. Deploy Chaincodes
```bash
./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl go
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go
```

### 4. Enroll Admins
```bash
cd ..
./scripts/enroll-admins.sh
```

### 5. Start APIs
```bash
./scripts/dev-apis.sh
# OR start individually in separate terminals
```

### 6. Start Frontend
```bash
cd frontend
npm run dev
```

### 7. Register Users
```bash
./scripts/register-test-users.sh
```

---

## Restart Scenarios

### Quick Restart (Network Already Running)
```bash
# Just restart APIs and frontend
./scripts/dev-apis.sh
cd frontend && npm run dev
```

### Full Restart (Clean State)
```bash
./start-system.sh --clean
```

### Restart After Chaincode Changes
```bash
cd network
./network.sh down
./network.sh up createChannel
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go
cd ..
./scripts/enroll-admins.sh
./scripts/dev-apis.sh
```

---

## Verification Checklist

After startup, verify each component:

- [ ] Docker containers running: `docker ps | grep hyperledger`
- [ ] Channel exists: `docker exec peer0.commercialbank.coffee-export.com peer channel list`
- [ ] Chaincode installed: `docker exec peer0.commercialbank.coffee-export.com peer lifecycle chaincode queryinstalled`
- [ ] APIs responding: `curl http://localhost:3001/health`
- [ ] Frontend accessible: Open http://localhost:5173
- [ ] Can login with test user

---

## Troubleshooting Startup Issues

### Network Won't Start
- Check Docker is running
- Check ports 7050, 7051, 8051, 9051, 10051 are free
- Review logs: `docker logs orderer.coffee-export.com`

### Channel Creation Fails
- Ensure crypto material exists
- Check configtx.yaml is valid
- Verify orderer is running

### Chaincode Deployment Fails
- Ensure channel is created
- Check Go dependencies: `cd chaincode/coffee-export && go mod tidy`
- Verify all peers joined channel

### APIs Won't Start
- Check admin is enrolled: `ls api/commercialbank/wallet/`
- Verify connection profiles exist
- Check blockchain network is running
- Review API logs

### Frontend Can't Connect
- Verify at least one API is running
- Check CORS settings in API
- Verify frontend .env has correct API URLs

---

## Best Practices

1. **Always start in order** - Don't skip steps
2. **Wait for initialization** - Each component needs time to start
3. **Check logs** - Monitor output for errors
4. **Use automated script** - `start-system.sh` handles the order correctly
5. **Clean start for issues** - Use `--clean` flag when troubleshooting
6. **Verify each phase** - Don't proceed if a step fails

---

## Related Documentation

- [QUICK_START.md](QUICK_START.md) - Quick start guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing procedures
- [README.md](README.md) - Project overview

---

**Last Updated:** 2024
**Maintained By:** Coffee Blockchain Consortium Team
