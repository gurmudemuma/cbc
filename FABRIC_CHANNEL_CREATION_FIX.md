# Hyperledger Fabric Channel Creation Fix

## Problem Summary

The error `Error: can't read the block: &{NOT_FOUND}` occurs when attempting to fetch the channel configuration block. This indicates:

1. **Channel doesn't exist** on the orderer
2. **TLS handshake failures** preventing peer-orderer communication
3. **Orderer not fully initialized** when channel creation is attempted

### Error Symptoms

```
Error: can't read the block: &{NOT_FOUND}
Client TLS handshake failed with error: EOF
Client TLS handshake failed with error: read: connection reset by peer
error getting endorser client for channel: endorser client failed to connect
```

---

## Root Causes

### 1. **Orderer Not Ready**
- Orderer container starts but system channel not initialized
- Channel creation attempted before orderer is fully ready

### 2. **TLS Certificate Issues**
- Peer/orderer TLS certificates not properly mounted
- Certificate paths incorrect in docker-compose
- TLS verification failing

### 3. **Network Connectivity**
- Containers not on same Docker network
- DNS resolution failing between containers
- Port mappings incorrect

### 4. **Channel Already Exists**
- Attempting to create channel that already exists
- Stale channel configuration in orderer

---

## Solution Steps

### Step 1: Verify Network Status

```bash
# Check all containers are running
docker ps -a | grep hyperledger

# Expected output: 7 containers
# - orderer.coffee-export.com
# - peer0.commercialbank.coffee-export.com
# - peer0.nationalbank.coffee-export.com
# - peer0.ncat.coffee-export.com
# - peer0.shippingline.coffee-export.com
# - peer0.customauthorities.coffee-export.com
# - cli
```

If containers are not running:
```bash
cd network
./network.sh up
```

### Step 2: Wait for Orderer Initialization

```bash
# Check orderer logs
docker logs orderer.coffee-export.com | tail -50

# Wait for message: "Starting orderer" or "Orderer started"
# This can take 30-60 seconds
```

### Step 3: Clean Previous Channel Artifacts

```bash
cd network

# Remove old channel blocks
rm -f channel-artifacts/*.block
rm -f channel-artifacts/*.tx
rm -f config_block.pb
rm -f config_update.pb
rm -f modified_config.pb
rm -f original_config.pb
```

### Step 4: Create Channel with Fix Script

```bash
cd network

# Make script executable
chmod +x fix-channel-creation.sh

# Run the fix script
./fix-channel-creation.sh coffeechannel 3 5
```

### Step 5: Verify Channel Creation

```bash
# Check if channel exists on orderer
docker exec cli osnadmin channel list \
  -o orderer.coffee-export.com:7053 \
  --ca-file organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem \
  --client-cert organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.crt \
  --client-key organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.key

# Expected output: Channel ID: coffeechannel
```

### Step 6: Verify Peers Joined Channel

```bash
# Set environment for commercialbank peer
export CORE_PEER_LOCALMSPID=commercialbankMSP
export CORE_PEER_TLS_ROOTCERT_FILE=organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

# List channels
peer channel list

# Expected output: coffeechannel
```

---

## Manual Channel Creation (If Script Fails)

### Option A: Using osnadmin (Recommended)

```bash
cd network

# 1. Generate channel block
export FABRIC_CFG_PATH=$PWD/configtx
../bin/configtxgen -profile CoffeeExportGenesis \
  -outputBlock ./channel-artifacts/coffeechannel.block \
  -channelID coffeechannel

# 2. Create channel
docker exec cli osnadmin channel join \
  --channelID coffeechannel \
  --config-block //opt//gopath//src//github.com//hyperledger//fabric//peer//channel-artifacts//coffeechannel.block \
  -o orderer.coffee-export.com:7053 \
  --ca-file //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//msp//tlscacerts//tlsca.coffee-export.com-cert.pem \
  --client-cert //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//tls//server.crt \
  --client-key //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//tls//server.key

# 3. Join peers
export FABRIC_CFG_PATH=$PWD/../config/
export BLOCKFILE=./channel-artifacts/coffeechannel.block

# For each peer (1-5), set globals and join
for ORG in 1 2 3 4 5; do
  setGlobals $ORG
  peer channel join -b $BLOCKFILE
done
```

### Option B: Complete Network Reset

If channel creation continues to fail:

```bash
cd network

# 1. Stop and remove all containers
./network.sh down

# 2. Wait 10 seconds
sleep 10

# 3. Start fresh
./network.sh up

# 4. Wait 30 seconds for orderer initialization
sleep 30

# 5. Create channel
./network.sh createChannel

# 6. Deploy chaincode
./network.sh deployCC
```

---

## Troubleshooting Specific Errors

### Error: "Client TLS handshake failed"

**Cause:** TLS certificates not properly mounted or paths incorrect

**Fix:**
```bash
# Verify certificate files exist
ls -la network/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/

# Should show: server.crt, server.key, ca.crt

# Check docker-compose volume mounts
docker inspect orderer.coffee-export.com | grep -A 20 "Mounts"
```

### Error: "connection reset by peer"

**Cause:** Orderer not listening or port not accessible

**Fix:**
```bash
# Check orderer is listening
docker exec orderer.coffee-export.com netstat -tlnp | grep 7053

# Check logs
docker logs orderer.coffee-export.com | grep -i "error\|failed"

# Restart orderer
docker restart orderer.coffee-export.com
sleep 10
```

### Error: "context deadline exceeded"

**Cause:** Peer cannot reach orderer (network/DNS issue)

**Fix:**
```bash
# Verify network connectivity
docker exec cli ping orderer.coffee-export.com

# Check DNS resolution
docker exec cli nslookup orderer.coffee-export.com

# Verify all containers on same network
docker network inspect coffee-export-network
```

### Error: "CustomAuthoritiesMSP already exists in channel"

**Cause:** Peer already joined channel

**Fix:**
```bash
# This is not an error - it means the peer is already in the channel
# Continue with chaincode deployment

./network.sh deployCC
```

---

## Verification Checklist

- [ ] All 7 containers running: `docker ps | grep hyperledger`
- [ ] Orderer initialized: `docker logs orderer.coffee-export.com | grep "Starting orderer"`
- [ ] Channel created: `docker exec cli osnadmin channel list -o orderer.coffee-export.com:7053 ...`
- [ ] All peers joined: `peer channel list` (for each peer)
- [ ] Chaincode deployed: `peer lifecycle chaincode queryinstalled`

---

## Prevention Tips

1. **Always wait for orderer** before creating channels (30-60 seconds)
2. **Use fix-channel-creation.sh** for reliable channel setup
3. **Check logs early** when errors occur
4. **Verify network connectivity** before troubleshooting TLS
5. **Keep channel artifacts clean** between network restarts

---

## Quick Reference Commands

```bash
# View orderer logs
docker logs orderer.coffee-export.com -f

# View peer logs
docker logs peer0.commercialbank.coffee-export.com -f

# Check channel status
docker exec cli peer channel list

# Fetch channel config
docker exec cli peer channel fetch config config_block.pb \
  -o orderer.coffee-export.com:7050 \
  -c coffeechannel \
  --tls --cafile organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

# List all channels on orderer
docker exec cli osnadmin channel list -o orderer.coffee-export.com:7053 \
  --ca-file organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem \
  --client-cert organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.crt \
  --client-key organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.key
```

---

## Next Steps

After successful channel creation:

1. **Deploy Chaincode:**
   ```bash
   cd network
   ./network.sh deployCC
   ```

2. **Test Chaincode:**
   ```bash
   peer chaincode invoke -C coffeechannel -n coffee-export \
     -c '{"function":"InitLedger","Args":[]}'
   ```

3. **Start API Server:**
   ```bash
   cd api
   npm start
   ```

4. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
