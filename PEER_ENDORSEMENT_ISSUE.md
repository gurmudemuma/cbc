# Peer Endorsement Mismatch - Issue Analysis

## Error

```
Error: No valid responses from any peers. Errors:
peer=undefined, status=grpc, message=Peer endorsements do not match
```

## Root Cause

After migrating from LevelDB to CouchDB, the peers have inconsistent state:
- Some peers may have old LevelDB data
- CouchDB databases are empty/new
- Peers are returning different endorsement results
- This causes transaction validation to fail

## Why This Happens

When we switched from LevelDB to CouchDB:
1. Network was restarted with new CouchDB containers
2. Old LevelDB data still exists in peer volumes
3. Peers are confused about which state database to use
4. Endorsements don't match because peers see different data

## Solution Options

### Option 1: Clean Restart (Recommended)
**Pros**: Fresh start, guaranteed to work  
**Cons**: Loses all existing data  

Steps:
1. Stop network
2. Remove all volumes (peers, orderer, CouchDB)
3. Start network fresh
4. Recreate channel
5. Deploy chaincode
6. Recreate test user

### Option 2: Redeploy Chaincode Only
**Pros**: Faster, keeps network running  
**Cons**: May not fix if state is corrupted  

Steps:
1. Package new chaincode version
2. Install on all peers
3. Approve and commit
4. Test

### Option 3: Reset Peer Ledgers
**Pros**: Keeps network configuration  
**Cons**: Complex, may miss issues  

Steps:
1. Stop peers
2. Clear peer ledger data
3. Restart peers
4. Rejoin channel

## Recommended Action

**Clean restart** is the safest option since we just migrated to CouchDB and don't have production data yet.

## Current State

- ✅ CouchDB containers running
- ✅ Peers running
- ❌ Peer state inconsistent
- ❌ Endorsements failing
- ❌ Cannot create or query exports

## Impact

- Cannot create new exports
- Cannot query existing exports
- Dashboard shows errors
- All blockchain operations fail

## Quick Fix Commands

```bash
# Option 1: Clean Restart
cd /home/gu-da/cbc/network/docker
docker-compose down -v  # Remove volumes
docker-compose up -d
# Then recreate channel and deploy chaincode

# Option 2: Just restart (may not fix)
cd /home/gu-da/cbc/network/docker
docker-compose restart
```

## Prevention

After CouchDB migration, always:
1. Clean all volumes before starting
2. Ensure all peers use same state database
3. Deploy chaincode fresh
4. Verify endorsements work before using

---

**Status**: Needs immediate action  
**Severity**: High - System unusable  
**Recommended**: Clean restart with volume removal
