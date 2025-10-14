# CouchDB Setup Required for Dashboard Status Queries

## Current Situation

The Dashboard is getting 500 errors on `/exports/status/{status}` endpoints because:

1. **Chaincode uses CouchDB queries**: `GetExportsByStatus` uses `GetQueryResult` with rich queries
2. **Network uses LevelDB**: No CouchDB containers are running
3. **LevelDB doesn't support rich queries**: Only supports simple key-based queries

## Error Message
```
ExecuteQuery not supported for leveldb
```

## Current Network State

✅ **Running**:
- Orderer: `orderer.coffee-export.com`
- 4 Peers (all using LevelDB):
  - `peer0.exporterbank.coffee-export.com`
  - `peer0.nationalbank.coffee-export.com`
  - `peer0.ncat.coffee-export.com`
  - `peer0.shippingline.coffee-export.com`
- Chaincode containers (user-management and coffee-export)

❌ **Missing**:
- CouchDB containers (couchdb0, couchdb1, couchdb2, couchdb3)

## Solutions

### Option 1: Add CouchDB to Network (Recommended)

Add CouchDB containers to `network/docker/docker-compose.yaml` and configure peers to use them.

**Steps**:
1. Stop the network
2. Add CouchDB service definitions to docker-compose
3. Configure peer environment variables to use CouchDB
4. Restart network
5. Redeploy chaincode

**Pros**:
- ✅ Supports rich queries (status filtering, complex searches)
- ✅ Better for production use
- ✅ Enables advanced features

**Cons**:
- ⚠️ Requires network restart
- ⚠️ More resource intensive

### Option 2: Modify Chaincode to Use Range Queries (Quick Fix)

Change `GetExportsByStatus` to use `GetStateByRange` and filter in code.

**Pros**:
- ✅ Works with current LevelDB setup
- ✅ No network restart needed
- ✅ Quick to implement

**Cons**:
- ⚠️ Less efficient (filters in chaincode, not database)
- ⚠️ Limited query capabilities
- ⚠️ Not scalable for large datasets

### Option 3: Temporary Workaround (Immediate)

Make the Dashboard handle the error gracefully and only use `/exports` (which works).

**Pros**:
- ✅ Immediate fix
- ✅ No infrastructure changes

**Cons**:
- ⚠️ Limited dashboard functionality
- ⚠️ Can't filter by status efficiently

## Recommended Approach

**For Development**: Use **Option 3** (workaround) now, then implement **Option 1** (CouchDB) later.

**For Production**: Implement **Option 1** (CouchDB) for full functionality.

## Immediate Fix (Option 3)

I can update the Dashboard to:
1. Only call `/exports` (which works)
2. Filter by status on the frontend
3. Show appropriate message if status queries fail

This will make the Dashboard work immediately without infrastructure changes.

## Current Status

- ✅ `/api/exports` - **WORKING** (returns all exports)
- ❌ `/api/exports/status/PENDING` - **500 ERROR** (needs CouchDB)
- ❌ `/api/exports/status/COMPLETED` - **500 ERROR** (needs CouchDB)
- ❌ `/api/exports/status/SHIPMENT_SCHEDULED` - **500 ERROR** (needs CouchDB)

## What Would You Like to Do?

1. **Quick fix**: Update Dashboard to filter on frontend (5 minutes)
2. **Proper fix**: Add CouchDB to network (30-60 minutes, requires network restart)
3. **Alternative**: Modify chaincode for LevelDB compatibility (15 minutes, requires chaincode redeploy)

Let me know which approach you prefer!
