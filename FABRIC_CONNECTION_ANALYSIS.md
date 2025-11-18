# Fabric Network Connection Analysis

## ✅ What's Working

1. **All services are running**
   - 5 API containers: national-bank-api, commercialbank-api, ncat-api, shipping-line-api, custom-authorities-api
   - All 5 peer nodes are up and healthy
   - Orderer is running
   - Channel `coffeechannel` exists
   - Chaincodes are deployed

2. **Configuration is correct**
   - Connection profiles use Docker network hostnames ✅
   - Admin certificates and keys are readable ✅
   - JWT secrets are properly configured (88 chars) ✅
   - Discovery set to `asLocalhost: false` ✅
   - Admin identities enrolled in wallets ✅

3. **Peers joined to channel**
   ```bash
   $ docker exec peer0.nationalbank.coffee-export.com peer channel list
   Channels peers has joined: coffeechannel
   ```

## ❌ The Problem

**Channel Access Control Policy Error:**
```
Error: access denied for [GetChainInfo][coffeechannel]: 
[Failed evaluating policy on signed data during check policy on channel [coffeechannel] 
with policy [/Channel/Application/Readers]: 
[implicit policy evaluation failed - 0 sub-policies were satisfied, 
but this policy requires 1 of the 'Readers' sub-policies to be satisfied]]
```

### What This Means:

The channel's **Reader policy** requires at least 1 organization to satisfy the policy, but currently **0 organizations satisfy it**. This indicates:

1. The channel configuration doesn't properly include these organizations in the Readers policy
2. The MSP definitions might be missing or incorrect in the channel configuration
3. The channel was created before all organizations were properly set up

## 🔧 Solution Options

### Option 1: Update Channel Configuration (Recommended)
Update the channel config to include all organizations in the Readers policy:

```bash
# 1. Fetch current channel config
peer channel fetch config config_block.pb -c coffeechannel -o orderer.coffee-export.com:7050

# 2. Decode to JSON
configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config > config.json

# 3. Modify config to add organizations to Readers policy

# 4. Update channel with new config
peer channel update -c coffeechannel -f config_update_in_envelope.pb -o orderer.coffee-export.com:7050
```

### Option 2: Recreate Channel (Clean Slate)
If the channel was improperly created, recreate it:

```bash
cd /home/gu-da/cbc/network

# 1. Generate new channel artifacts with correct policies
./scripts/generate-channel-artifacts.sh

# 2. Create channel
./scripts/create-channel.sh

# 3. Join all peers
./scripts/join-channel.sh

# 4. Update anchor peers
./scripts/update-anchor-peers.sh

# 5. Redeploy chaincode
./scripts/deploy-chaincode.sh
```

### Option 3: Check Existing Channel Scripts
Review the channel creation scripts that were already run:

```bash
ls -la /home/gu-da/cbc/network/*.sh
ls -la /home/gu-da/cbc/network/scripts/*.sh
```

Look for files like:
- `create-channel.sh` or `create-channel-docker.sh`
- Channel artifacts in `/network/channel-artifacts/`

## 📋 Verification Steps

After fixing channel policies, verify:

```bash
# 1. Check peer can access channel
docker exec peer0.nationalbank.coffee-export.com peer channel getinfo -c coffeechannel

# 2. Check API can connect
docker logs national-bank-api 2>&1 | tail -20

# 3. Test user registration
cd /home/gu-da/cbc/scripts
./register-working-users.sh
```

## 🎯 Current Status Summary

| Component | Status |
|-----------|--------|
| Peer Nodes | ✅ Running & Joined to Channel |
| Orderer | ✅ Running |
| Chaincodes | ✅ Deployed |
| API Services | ✅ Running |
| Docker Config | ✅ Correct |
| Connection Profiles | ✅ Correct |
| Admin Enrollment | ✅ Complete |
| Discovery Config | ✅ Fixed (`asLocalhost: false`) |
| **Channel ACL** | ❌ **Organizations not in Readers policy** |

## Next Action Required

**The channel configuration needs to be updated or the channel needs to be recreated with proper ACL policies that include all 5 organizations in the Readers/Writers policies.**

This is a Fabric network administration task that requires:
1. Access to channel configuration tools
2. Admin signatures from existing channel members
3. Understanding of Fabric channel policies

The application code is correct - this is purely a Fabric network configuration issue.
