# Quick Fabric Network Recovery Guide

## Problem
```
Error: can't read the block: &{NOT_FOUND}
Client TLS handshake failed
error getting endorser client for channel
```

## Quick Fix (5 minutes)

### Option 1: Automated Recovery (Recommended)

```bash
cd network
chmod +x recover-network.sh
./recover-network.sh coffeechannel
```

This script will:
- ✓ Start network if not running
- ✓ Wait for orderer initialization
- ✓ Clean old artifacts
- ✓ Create channel
- ✓ Join all peers
- ✓ Verify setup

### Option 2: Manual Recovery

```bash
cd network

# 1. Ensure network is running
./network.sh up

# 2. Wait 30 seconds for orderer
sleep 30

# 3. Create channel
./network.sh createChannel

# 4. Deploy chaincode
./network.sh deployCC
```

### Option 3: Complete Reset

```bash
cd network

# Stop everything
./network.sh down

# Wait
sleep 10

# Start fresh
./network.sh up

# Wait for orderer
sleep 30

# Create channel
./network.sh createChannel

# Deploy chaincode
./network.sh deployCC
```

---

## Verification

### Check Network Status
```bash
docker ps | grep hyperledger
# Should show 7 containers running
```

### Check Channel Exists
```bash
cd network
docker exec cli osnadmin channel list \
  -o orderer.coffee-export.com:7053 \
  --ca-file organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem \
  --client-cert organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.crt \
  --client-key organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.key

# Should show: Channel ID: coffeechannel
```

### Check Peers Joined
```bash
cd network
export CORE_PEER_LOCALMSPID=commercialbankMSP
export CORE_PEER_TLS_ROOTCERT_FILE=organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer channel list
# Should show: coffeechannel
```

---

## If Still Failing

### Check Orderer Logs
```bash
docker logs orderer.coffee-export.com -f
# Look for errors or "Starting orderer"
```

### Check Peer Logs
```bash
docker logs peer0.commercialbank.coffee-export.com -f
# Look for connection errors
```

### Restart Orderer
```bash
docker restart orderer.coffee-export.com
sleep 10
cd network
./recover-network.sh
```

### Full Network Restart
```bash
cd network
./network.sh down
sleep 10
./network.sh up
sleep 30
./recover-network.sh
```

---

## Next Steps

After successful recovery:

```bash
# 1. Deploy chaincode
cd network
./network.sh deployCC

# 2. Start API server
cd ../api
npm install
npm start

# 3. Start frontend (in new terminal)
cd ../frontend
npm install
npm run dev

# 4. Access application
# Open browser to http://localhost:5173
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "NOT_FOUND" error | Run `recover-network.sh` |
| TLS handshake failed | Restart orderer: `docker restart orderer.coffee-export.com` |
| Connection refused | Wait 30 seconds for orderer, then retry |
| Peer not joining | Check peer logs: `docker logs peer0.commercialbank.coffee-export.com` |
| Channel already exists | This is OK, continue with chaincode deployment |

---

## Detailed Troubleshooting

See `FABRIC_CHANNEL_CREATION_FIX.md` for comprehensive troubleshooting guide.

---

## Support

If issues persist:

1. Check logs: `docker logs <container-name>`
2. Verify network: `docker network inspect coffee-export-network`
3. Check certificates: `ls -la network/organizations/`
4. Review docker-compose: `cat network/docker/docker-compose.yaml`
