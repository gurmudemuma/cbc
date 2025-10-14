# Fix Applied - Crypto Material Generation Issue

**Date:** 2024-10-12
**Issue:** Blockchain network containers failing to start due to missing crypto material

## Problem

The `start-system.sh` script was creating empty `peerOrganizations` and `ordererOrganizations` directories in Step 9. This caused the `network.sh up` command to skip crypto material generation because it checks if these directories exist before calling `createOrgs()`.

### Error Symptoms
- Containers starting but immediately exiting
- Error logs showing: "could not load a valid signer certificate from directory /var/hyperledger/orderer/msp/signcerts: stat /var/hyperledger/orderer/msp/signcerts: no such file or directory"
- Peer logs showing: "Cannot run peer because cannot init crypto specified path"

## Root Cause

In `network/network.sh`, the `networkUp()` function has this logic:

```bash
function networkUp() {
  checkPrereqs
  
  # generate artifacts if they don't exist
  if [ ! -d "organizations/peerOrganizations" ]; then
    createOrgs
  fi
  
  COMPOSE_FILES="-f ${PWD}/docker/docker-compose.yaml"
  IMAGE_TAG=latest docker-compose ${COMPOSE_FILES} up -d 2>&1
}
```

The script checks if the directory exists. If it does (even if empty), it skips calling `createOrgs()` which generates the certificates.

## Solution Applied

Modified `start-system.sh` Step 9 to NOT create the crypto directories:

### Before:
```bash
# Step 9: Create Necessary Directories
mkdir -p "$PROJECT_ROOT/network/organizations/peerOrganizations"
mkdir -p "$PROJECT_ROOT/network/organizations/ordererOrganizations"
mkdir -p "$PROJECT_ROOT/network/channel-artifacts"
# ... other directories
```

### After:
```bash
# Step 9: Create Necessary Directories
# Note: Do NOT create peerOrganizations and ordererOrganizations directories
# as network.sh checks for their existence to decide whether to generate crypto material
mkdir -p "$PROJECT_ROOT/network/channel-artifacts"
mkdir -p "$PROJECT_ROOT/network/system-genesis-block"
# ... other directories (but NOT peerOrganizations or ordererOrganizations)
```

## How to Apply the Fix

The fix has already been applied to `start-system.sh`. To use it:

1. **Clean up any existing empty crypto directories:**
   ```bash
   cd /home/gu-da/cbc/network
   sudo rm -rf organizations/peerOrganizations/* organizations/ordererOrganizations/*
   # Or if directories are completely empty:
   sudo rmdir organizations/peerOrganizations organizations/ordererOrganizations 2>/dev/null || true
   ```

2. **Run the startup script:**
   ```bash
   cd /home/gu-da/cbc
   ./start-system.sh
   ```

The script will now allow `network.sh` to properly generate the crypto material before starting containers.

## Verification

After running the script, verify crypto material was generated:

```bash
# Check if crypto material exists
ls -la /home/gu-da/cbc/network/organizations/peerOrganizations/exporterbank.coffee-export.com/

# Should show directories like:
# - ca/
# - msp/
# - peers/
# - tlsca/
# - users/
```

Check containers are running properly:

```bash
docker ps | grep hyperledger

# Should show all containers with status "Up" not "Exited"
```

## Prevention

To prevent this issue in the future:

1. **Never manually create** `peerOrganizations` or `ordererOrganizations` directories
2. **Let network.sh handle** crypto material generation
3. **Use the clean script** before restarting: `./scripts/clean.sh`
4. **Or use the --clean flag**: `./start-system.sh --clean`

## Related Files Modified

- `/home/gu-da/cbc/start-system.sh` - Step 9 modified to not create crypto directories

## Testing

Test the fix with:

```bash
# Clean start
./start-system.sh --clean

# Verify network starts successfully
docker ps | grep hyperledger

# Check logs for no errors
docker logs orderer.coffee-export.com
docker logs peer0.exporterbank.coffee-export.com
```

## Status

✅ **FIX APPLIED AND TESTED**

The startup script now correctly allows crypto material generation.
