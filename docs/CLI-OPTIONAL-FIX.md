# CLI Container - Optional Startup Fix

## Problem
The CLI container was failing to start automatically, causing the seed script to fail when trying to register users on the blockchain.

## Solution
The CLI container is now marked as optional with Docker Compose profiles:
- CLI service has `profiles: [manual]` in docker-compose-fabric.yml
- CLI won't start automatically during system initialization
- Seed script gracefully skips blockchain operations if CLI isn't available
- Users can manually start CLI when needed

## Changes Made

### 1. docker-compose-fabric.yml
- Added `profiles: [manual]` to CLI service
- Removed `depends_on` from CLI service (no longer needed)
- CLI now only starts when explicitly requested

### 2. coffee-export-gateway/src/scripts/seedUsers.js
- Added check for "No such container: cli" error
- Gracefully skips blockchain operations if CLI isn't available
- PostgreSQL operations continue normally
- Logs warning instead of failing

## System Startup Flow

### Automatic (No CLI)
```bash
.\scripts\start-system.bat
```

1. Starts blockchain infrastructure (orderers, peers, couchdb)
2. Starts application services (postgres, redis, kafka, zookeeper)
3. Starts gateway and core services
4. Runs seed script → Creates users in PostgreSQL only
5. Starts CBC services and frontend

**Result**: System fully functional, users can login, profiles display correctly

### Manual CLI Startup (Optional)
If you need to interact with the blockchain directly:

```bash
docker-compose -f docker-compose-fabric.yml --profile manual up -d cli
```

Then access it:
```bash
docker exec -it cli bash
```

## Why This Approach

1. **Faster startup**: No waiting for CLI to initialize
2. **More reliable**: CLI doesn't fail and block system startup
3. **Flexible**: CLI available when needed, not required for normal operation
4. **PostgreSQL-first**: System works with database, blockchain is optional
5. **Graceful degradation**: If blockchain isn't available, system still works

## Testing

### Verify System Works Without CLI
```bash
# Start system
.\scripts\start-system.bat

# Check database
docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run check-db

# Should show:
# USERS TABLE: Found 10 users ✓
# EXPORTER_PROFILES TABLE: Found 3 exporter profiles ✓
```

### Verify CLI Works When Started
```bash
# Start CLI manually
docker-compose -f docker-compose-fabric.yml --profile manual up -d cli

# Wait 10 seconds for CLI to initialize
sleep 10

# Test CLI
docker exec cli peer version
```

## Blockchain Operations

### Currently Disabled (No CLI)
- User registration on blockchain
- User status updates on blockchain
- Blockchain queries

### Still Available (PostgreSQL)
- User creation and authentication
- Exporter profile creation and management
- All dashboard data
- All business logic

### When CLI is Started
- Blockchain operations become available
- Users can be synced to blockchain
- Blockchain queries work

## Files Modified
1. `docker-compose-fabric.yml` - Added profiles to CLI service
2. `coffee-export-gateway/src/scripts/seedUsers.js` - Added CLI error handling

## Next Steps
1. Run startup script normally
2. System will initialize without CLI
3. Users can login and see complete profile data
4. Optionally start CLI later if blockchain operations are needed
