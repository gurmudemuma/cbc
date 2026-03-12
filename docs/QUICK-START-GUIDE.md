# Quick Start Guide - Coffee Export Blockchain

## Current Status: ✅ BLOCKCHAIN READY

Your Hyperledger Fabric network is fully deployed and operational!

---

## What's Already Done ✅

- ✅ Channel created (coffeechannel)
- ✅ 3 orderers running (Raft consensus)
- ✅ 6 peers joined to channel
- ✅ Chaincode deployed (ecta v1.0)
- ✅ Chaincode initialized
- ✅ CouchDB state databases ready

---

## What You Need to Do

### Step 1: Install Node.js

**Download**: https://nodejs.org/ (LTS version recommended)

After installation, verify:
```bash
node --version
npm --version
```

### Step 2: Start the Gateway Service

```bash
# Navigate to gateway directory
cd coffee-export-gateway

# Install dependencies
npm install

# Enroll admin identity
npm run enroll-admin

# Start the service
npm start
```

The gateway will start on http://localhost:3000

### Step 3: Test the System

```bash
# Health check
curl http://localhost:3000/api/health

# Get all applications
curl http://localhost:3000/api/applications
```

---

## Quick Commands

### Check Blockchain Status
```bash
# List channels
docker exec cli peer channel list

# Get channel info
docker exec cli peer channel getinfo -c coffeechannel

# Check chaincode
docker exec cli peer lifecycle chaincode querycommitted --channelID coffeechannel --name ecta
```

### Check Containers
```bash
# View all running containers
docker ps

# Check specific container logs
docker logs peer0.ecta.example.com
docker logs orderer1.orderer.example.com
```

### CouchDB Access
- URL: http://localhost:5984/_utils
- Username: admin
- Password: adminpw

---

## Troubleshooting

### If Gateway Can't Connect
1. Check containers are running: `docker ps`
2. Verify crypto materials exist: `dir crypto-config`
3. Check connection profile paths in `coffee-export-gateway/src/config/connection-profile.json`

### If Chaincode Fails
1. Check peer logs: `docker logs peer0.ecta.example.com`
2. Verify chaincode is committed: `docker exec cli peer lifecycle chaincode querycommitted --channelID coffeechannel --name ecta`

### If Orderers Not Responding
1. Check orderer logs: `docker logs orderer1.orderer.example.com`
2. Verify Raft cluster: Check all 3 orderers are running

---

## Important Files

### Configuration
- `config/configtx.yaml` - Channel configuration
- `coffee-export-gateway/src/config/connection-profile.json` - Gateway connection settings
- `docker-compose-fabric.yml` - Fabric network definition

### Scripts
- `scripts/create-channel-corrected.bat` - Channel creation
- `scripts/deploy-chaincode-corrected.bat` - Chaincode deployment

### Documentation
- `DEPLOYMENT-COMPLETE.md` - Full deployment details
- `HYPERLEDGER-EXPERT-ANALYSIS.md` - Expert analysis
- `CHANNEL-CREATION-SUCCESS.md` - Channel creation results

---

## Network Endpoints

### Orderers
- orderer1: localhost:7050 (admin: 7053)
- orderer2: localhost:8050 (admin: 8053)
- orderer3: localhost:9050 (admin: 9053)

### Peers
- peer0.ecta: localhost:7051
- peer1.ecta: localhost:8051
- peer0.bank: localhost:9051
- peer0.nbe: localhost:10051
- peer0.customs: localhost:11051
- peer0.shipping: localhost:12051

### CouchDB
- ecta peer0: localhost:5984
- ecta peer1: localhost:6984
- bank: localhost:7984
- nbe: localhost:8984
- customs: localhost:9984
- shipping: localhost:10984

---

## Support

For issues or questions:
1. Check logs: `docker logs <container-name>`
2. Review documentation in this directory
3. Verify all containers are running: `docker ps`

---

**Status**: Blockchain operational, waiting for Node.js installation to complete gateway setup.
