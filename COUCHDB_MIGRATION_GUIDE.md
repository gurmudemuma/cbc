# CouchDB Migration Guide

## What Was Changed

The Fabric network has been updated to use **CouchDB** instead of LevelDB for state database.

### Changes Made

1. **Added CouchDB Containers** (`network/docker/docker-compose.yaml`):
   - `couchdb0` for peer0.commercialbank (port 5984)
   - `couchdb1` for peer0.nationalbank (port 6984)
   - `couchdb2` for peer0.ncat (port 7984)
   - `couchdb3` for peer0.shippingline (port 8984)

2. **Updated Peer Configurations**:
   - Added `CORE_LEDGER_STATE_STATEDATABASE=CouchDB`
   - Added CouchDB connection details for each peer
   - Added dependency on respective CouchDB containers

3. **Volumes Added**:
   - Persistent storage for each CouchDB instance

## Why CouchDB?

✅ **Supports rich queries** - Can filter by status, search complex fields  
✅ **Better for production** - More scalable and feature-rich  
✅ **Enables Dashboard features** - Status filtering works properly  
✅ **JSON-based** - Natural fit for JavaScript/TypeScript applications  

## Migration Steps

### Step 1: Stop Backend APIs

```bash
# Stop commercialbank API
lsof -ti:3001 | xargs kill -9

# Stop other APIs if running
lsof -ti:3002 | xargs kill -9
lsof -ti:3003 | xargs kill -9
lsof -ti:3004 | xargs kill -9
```

### Step 2: Restart Network with CouchDB

```bash
cd /home/gu-da/cbc/network
chmod +x restart-with-couchdb.sh
./restart-with-couchdb.sh
```

**This will**:
- Stop existing network
- Clean up old chaincode containers
- Start network with CouchDB
- Verify CouchDB is running

### Step 3: Wait for Network to Stabilize

```bash
# Wait 30 seconds
sleep 30

# Verify all containers are running
docker ps --format "table {{.Names}}\t{{.Status}}"
```

You should see:
- ✅ 4 CouchDB containers (couchdb0-3)
- ✅ 4 Peer containers
- ✅ 1 Orderer container
- ✅ 1 CLI container

### Step 4: Verify CouchDB

```bash
# Check CouchDB instances
curl http://localhost:5984/_up  # Should return: {"status":"ok"}
curl http://localhost:6984/_up
curl http://localhost:7984/_up
curl http://localhost:8984/_up
```

### Step 5: Redeploy Chaincode

**Note**: Since we're switching from LevelDB to CouchDB, the chaincode needs to be redeployed to create the CouchDB indexes.

```bash
cd /home/gu-da/cbc/network
# Run your chaincode deployment script
./scripts/deployCC.sh
```

### Step 6: Restart Backend APIs

```bash
# Restart commercialbank API
cd /home/gu-da/cbc/api/commercialbank
npm run dev &

# Restart other APIs as needed
```

### Step 7: Test the Dashboard

1. Open http://localhost:5173
2. Login with: `testexporter` / `T3stExp0rt3r!@#$`
3. Navigate to Dashboard
4. **Should now work without 500 errors!**

## Verification

### Check CouchDB Web UI

Access CouchDB Fauxton (web UI):
- **commercialbank**: http://localhost:5984/_utils
- **National Bank**: http://localhost:6984/_utils
- **ECTA**: http://localhost:7984/_utils
- **Shipping Line**: http://localhost:8984/_utils

**Credentials**: `admin` / `adminpw`

### Test Status Queries

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testexporter","password":"T3stExp0rt3r!@#$"}' | jq -r '.data.token')

# Test status query (should work now!)
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/exports/status/PENDING | jq '.'
```

**Expected**: `{"success": true, "data": [], "count": 0}` (not 500 error)

## CouchDB Configuration

### Ports
- **5984**: commercialbank CouchDB
- **6984**: National Bank CouchDB
- **7984**: ECTA CouchDB
- **8984**: Shipping Line CouchDB

### Credentials
- **Username**: `admin`
- **Password**: `adminpw`

### Data Persistence
- Data is stored in Docker volumes
- Survives container restarts
- Located at: `/var/lib/docker/volumes/`

## Troubleshooting

### CouchDB not starting
```bash
# Check logs
docker logs couchdb0
docker logs couchdb1
docker logs couchdb2
docker logs couchdb3
```

### Peer can't connect to CouchDB
```bash
# Check peer logs
docker logs peer0.commercialbank.coffee-export.com

# Look for CouchDB connection errors
```

### Old data from LevelDB
- CouchDB starts fresh
- Old LevelDB data is not migrated
- You'll need to recreate test data

## Rollback (if needed)

If you need to go back to LevelDB:

1. Restore the old docker-compose.yaml from git
2. Remove CouchDB environment variables from peers
3. Restart network
4. Redeploy chaincode

## Benefits After Migration

✅ Dashboard status queries work  
✅ Can filter exports by status  
✅ Rich query capabilities  
✅ Better performance for complex queries  
✅ Web UI for database inspection  
✅ Production-ready setup  

## Next Steps

After successful migration:
1. ✅ Test all Dashboard features
2. ✅ Create some test exports
3. ✅ Verify status filtering works
4. ✅ Check CouchDB web UI to see data
5. ✅ Update documentation if needed

---

**Status**: Ready to migrate  
**Estimated Time**: 10-15 minutes  
**Risk**: Low (can rollback if needed)
