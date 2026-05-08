# Blockchain Deployment - Complete Step-by-Step Guide

## Overview
This guide covers the complete blockchain deployment process from initial setup to production-ready system.

## Prerequisites
- Docker and Docker Compose installed
- Crypto materials generated (in `crypto-config/` directory)
- Chaincode source code ready (in `chaincode/ecta/` directory)

---

## Step 1: Start Blockchain Network

**Script**: `scripts/start-system.bat`

**What it does**:
- Starts 3 orderers (Raft consensus)
- Starts 6 CouchDB databases
- Starts 6 peer nodes (across 5 organizations)
- Starts CLI tool

**Command**:
```bash
scripts\start-system.bat
```

**Verify**:
```bash
docker ps --filter "name=orderer" --filter "name=peer" --filter "name=couchdb"
```

Expected: 16 containers running (3 orderers + 6 CouchDB + 6 peers + 1 CLI)

---

## Step 2: Initialize Blockchain Channel

**Script**: `scripts/initialize-blockchain-channel.bat`

**What it does**:
1. Creates channel genesis block
2. Joins all 6 peers to the channel
3. Updates anchor peers for each organization
4. Verifies channel membership

**Command**:
```bash
scripts\initialize-blockchain-channel.bat
```

**Verify**:
```bash
docker exec cli peer channel list
```

Expected output: `coffeechannel`

---

## Step 3: Build Chaincode Package

**Script**: `scripts/build-chaincode-package.sh`

**What it does**:
- Installs chaincode dependencies (`npm install`)
- Packages chaincode as tar.gz file
- Creates versioned package (e.g., `ecta-v2.1.tar.gz`)

**Command**:
```bash
bash scripts/build-chaincode-package.sh
```

**Verify**:
```bash
ls -la /tmp/ecta-*.tar.gz
```

Expected: Package file exists

---

## Step 4: Deploy Chaincode (Initial Deployment)

**Script**: `scripts/deploy-chaincode-professional.sh`

**What it does**:
1. Packages chaincode v2.0
2. Installs on ECTA peer
3. Approves for ECTA organization
4. Commits chaincode definition (sequence 1)
5. Initializes chaincode

**Command**:
```bash
bash scripts/deploy-chaincode-professional.sh
```

**Verify**:
```bash
docker exec cli peer lifecycle chaincode querycommitted -C coffeechannel -n ecta
```

Expected: Version 2.0, Sequence 1, ECTA approved

---

## Step 5: Install Chaincode on All Peers

**Script**: `scripts/install-chaincode-all-peers.bat`

**What it does**:
- Installs chaincode package on all 6 peers
- Verifies installation on each peer
- Shows package IDs

**Command**:
```bash
scripts\install-chaincode-all-peers.bat
```

**Verify**:
```bash
docker exec cli peer lifecycle chaincode queryinstalled
```

Expected: Package installed on all peers

---

## Step 6: Approve Chaincode for All Organizations

**Script**: `scripts/approve-all-orgs.bat`

**What it does**:
- Approves chaincode for Bank organization
- Approves chaincode for NBE organization
- Approves chaincode for Customs organization
- Approves chaincode for Shipping organization
- Checks commit readiness

**Command**:
```bash
scripts\approve-all-orgs.bat
```

**Verify**:
```bash
docker exec cli peer lifecycle chaincode checkcommitreadiness -C coffeechannel -n ecta -v 2.0 --sequence 1
```

Expected: All 5 organizations show `true`

---

## Step 7: Upgrade to Chaincode v2.1 (Deterministic Timestamps)

**Script**: `scripts/upgrade-chaincode-v2.1.bat`

**What it does**:
1. Packages chaincode v2.1 with deterministic timestamps
2. Installs v2.1 on all 6 peers
3. Approves v2.1 for all 5 organizations (sequence 2)
4. Commits v2.1 to the channel
5. Verifies deployment

**Command**:
```bash
scripts\upgrade-chaincode-v2.1.bat
```

**Verify**:
```bash
docker exec cli peer lifecycle chaincode querycommitted -C coffeechannel -n ecta
```

Expected: Version 2.1, Sequence 2, All 5 orgs approved

---

## Step 8: Remove Old Chaincode Containers

**What it does**:
- Forces restart of chaincode containers with new v2.1 code
- Ensures deterministic timestamps are active

**Command**:
```bash
docker ps -a --filter "name=dev-peer" --format "{{.Names}}" | ForEach-Object { docker rm -f $_ }
```

**Verify**:
```bash
docker ps --filter "name=dev-peer"
```

Expected: No old containers, new ones will be created on first invoke

---

## Step 9: Restart Gateway

**What it does**:
- Restarts gateway to pick up new chaincode version
- Triggers creation of new chaincode containers

**Command**:
```bash
docker-compose -f docker-compose-hybrid.yml restart gateway
```

**Verify**:
```bash
docker logs coffee-gateway --tail 50
```

Expected: No "ProposalResponsePayloads do not match" errors

---

## Step 10: Test Deterministic Timestamps

**Script**: `scripts/test-deterministic-timestamps.bat`

**What it does**:
- Invokes chaincode with 3-peer endorsement
- Verifies timestamps match across all peers
- Confirms blockchain sync is working

**Command**:
```bash
scripts\test-deterministic-timestamps.bat
```

**Verify**:
Expected output: `Chaincode invoke successful`

---

## Step 11: Verify Complete System

**Script**: `scripts/verify-hybrid-system-docker.bat`

**What it does**:
- Checks all Docker containers
- Verifies PostgreSQL connection
- Tests blockchain queries
- Confirms 3-peer endorsement
- Validates chaincode version

**Command**:
```bash
scripts\verify-hybrid-system-docker.bat
```

**Verify**:
Expected: All checks pass ✅

---

## Complete Deployment Sequence (From Scratch)

For a fresh deployment, run these scripts in order:

```bash
# 1. Start blockchain network
scripts\start-system.bat

# 2. Initialize channel
scripts\initialize-blockchain-channel.bat

# 3. Build chaincode package
bash scripts/build-chaincode-package.sh

# 4. Deploy initial chaincode (v2.0)
bash scripts/deploy-chaincode-professional.sh

# 5. Install on all peers
scripts\install-chaincode-all-peers.bat

# 6. Approve for all organizations
scripts\approve-all-orgs.bat

# 7. Upgrade to v2.1 (deterministic timestamps)
scripts\upgrade-chaincode-v2.1.bat

# 8. Remove old chaincode containers
docker ps -a --filter "name=dev-peer" -q | ForEach-Object { docker rm -f $_ }

# 9. Restart gateway
docker-compose -f docker-compose-hybrid.yml restart gateway

# 10. Test blockchain sync
scripts\test-deterministic-timestamps.bat

# 11. Verify complete system
scripts\verify-hybrid-system-docker.bat
```

---

## Quick Deployment (If Already Set Up)

If blockchain is already initialized and you just need to restart:

```bash
# Start everything
scripts\start-system.bat

# Verify
scripts\verify-hybrid-system-docker.bat
```

---

## Troubleshooting

### If Channel Initialization Fails
```bash
# Check orderers are running
docker ps --filter "name=orderer"

# Check CLI can connect
docker exec cli peer channel list
```

### If Chaincode Deployment Fails
```bash
# Check peer logs
docker logs peer0.ecta.example.com --tail 100

# Verify package exists
docker exec cli ls -la /tmp/

# Check chaincode dependencies
docker exec cli ls -la /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta/node_modules
```

### If Endorsement Fails
```bash
# Check which peers have chaincode installed
docker exec cli peer lifecycle chaincode queryinstalled

# Check approval status
docker exec cli peer lifecycle chaincode checkcommitreadiness -C coffeechannel -n ecta -v 2.1 --sequence 2

# Verify all orgs approved
docker exec cli peer lifecycle chaincode querycommitted -C coffeechannel -n ecta
```

### If Blockchain Sync Fails
```bash
# Test deterministic timestamps
scripts\test-deterministic-timestamps.bat

# Check chaincode containers are v2.1
docker ps --filter "name=dev-peer"

# Verify 3-peer endorsement in gateway
docker logs coffee-gateway | grep "peerAddresses"
```

---

## Script Dependencies

```
start-system.bat
    ↓
initialize-blockchain-channel.bat
    ↓
build-chaincode-package.sh
    ↓
deploy-chaincode-professional.sh
    ↓
install-chaincode-all-peers.bat
    ↓
approve-all-orgs.bat
    ↓
upgrade-chaincode-v2.1.bat
    ↓
(manual: remove old containers)
    ↓
(manual: restart gateway)
    ↓
test-deterministic-timestamps.bat
    ↓
verify-hybrid-system-docker.bat
```

---

## Expected Timeline

- **Step 1** (Start network): 2-3 minutes
- **Step 2** (Initialize channel): 1-2 minutes
- **Step 3** (Build package): 30 seconds
- **Step 4** (Deploy chaincode): 2-3 minutes
- **Step 5** (Install on all peers): 1 minute
- **Step 6** (Approve all orgs): 2 minutes
- **Step 7** (Upgrade to v2.1): 3-4 minutes
- **Step 8** (Remove containers): 10 seconds
- **Step 9** (Restart gateway): 30 seconds
- **Step 10** (Test): 10 seconds
- **Step 11** (Verify): 30 seconds

**Total Time**: ~15-20 minutes for complete deployment

---

## Current System State

✅ **Blockchain Network**: Running (3 orderers, 6 peers)
✅ **Channel**: coffeechannel (initialized)
✅ **Chaincode**: ecta v2.1 sequence 2 (deployed)
✅ **Organizations**: 5 orgs approved
✅ **Endorsement**: 3-peer (ECTA + Bank + NBE)
✅ **Timestamps**: Deterministic (fixed)
✅ **System**: Production ready

---

**Last Updated**: March 27, 2026
**Chaincode Version**: v2.1
**Channel**: coffeechannel
**Status**: ✅ OPERATIONAL
