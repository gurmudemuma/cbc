# ⚠️ User-Management Chaincode Issue

## Problem

The `user-management` chaincode is failing to start with the following error:

```
Error starting user-management chaincode: connection error: desc = "transport: error while dialing: dial tcp 127.0.0.1:7052: connect: connection refused"
```

## Root Cause

The chaincode container is trying to connect to `127.0.0.1:7052` instead of the peer's chaincode address. This is a Docker networking issue where the chaincode cannot resolve the peer address correctly.

## Current Status

- ✅ Blockchain network is running
- ✅ Channel created successfully
- ✅ `coffee-export` chaincode deployed and working
- ❌ `user-management` chaincode deployed but containers fail to start
- ✅ APIs are running but cannot register users

## Workaround Options

### Option 1: Use Coffee-Export Chaincode for User Management (Recommended)

Modify the coffee-export chaincode to include user management functions. This would consolidate all functionality into one working chaincode.

### Option 2: Fix Docker Networking

The issue is related to how Fabric launches chaincode containers. The chaincode needs to connect back to the peer using the peer's chaincode address, not localhost.

**Potential fixes:**
1. Set `CORE_PEER_ADDRESSAUTODETECT=true` in peer configuration
2. Use external chaincode builders
3. Run chaincode as a service instead of in Docker containers

### Option 3: Use External Chaincode

Deploy the chaincode as an external service that runs outside of Docker, which avoids the networking issue entirely.

## Temporary Solution

For now, you can:

1. **Use the system without user registration** - The blockchain and coffee-export chaincode work fine
2. **Manually create user records** in a local database for authentication
3. **Focus on the coffee export workflow** which is fully functional

## Commands to Test Coffee-Export Chaincode

```bash
# Test if coffee-export chaincode works
docker exec cli peer chaincode invoke \
  -o orderer.coffee-export.com:7050 \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem \
  -C coffeechannel \
  -n coffee-export \
  --peerAddresses peer0.exporterbank.coffee-export.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/exporterbank.coffee-export.com/peers/peer0.exporterbank.coffee-export.com/tls/ca.crt \
  -c '{"function":"InitLedger","Args":[]}'
```

## Next Steps

1. **Short-term:** Work with the coffee-export functionality which is operational
2. **Medium-term:** Implement external chaincode deployment for user-management
3. **Long-term:** Upgrade to newer Fabric version with better chaincode lifecycle management

## Files Created

- `/home/gu-da/CBC/scripts/register-test-users.sh` - Script to register users (won't work until chaincode is fixed)
- `/home/gu-da/CBC/scripts/register-users-direct.js` - Direct blockchain registration (needs dependencies)
- `/home/gu-da/CBC/SYSTEM_READY.md` - System startup guide

## Contact

This is a known issue with Hyperledger Fabric chaincode deployment in Docker environments. The system is otherwise fully functional for coffee export management.
