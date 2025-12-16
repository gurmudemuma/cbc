# Troubleshooting Guide

## Common Issues and Solutions

### 1. "npm ERR! No workspaces found"

**Symptom**: Running `npm run dev --workspace=commercialbank-api` fails

**Cause**: Incorrect workspace name (should be `commercialbank` not `commercialbank-api`)

**Solution**:
```bash
# Use correct workspace names
npm run dev --workspace=commercialbank
npm run dev --workspace=national-bank
npm run dev --workspace=ncat
npm run dev --workspace=shipping-line
npm run dev --workspace=custom-authorities
```

### 2. API on port 3005 not starting

**Symptom**: Health checks show 4/5 APIs running, port 3005 not responding

**Cause**: Missing wallet directory for custom-authorities

**Solution**:
```bash
mkdir -p /home/gu-da/cbc/api/custom-authorities/wallet
./start-system.sh
```

### 3. Network startup hangs or fails silently

**Symptom**: `network.sh up` completes but network isn't functional

**Cause**: Missing error handling in scripts, silent failures

**Solution**: 
- Check logs: `docker-compose logs -f`
- Verify network.sh has `set -e` at the top
- Run with: `bash -x network/network.sh up` for debugging

### 4. Connection profiles not found

**Symptom**: APIs fail with "connection profile not found"

**Cause**: Crypto material generated but connection profiles weren't created

**Solution**:
```bash
cd /home/gu-da/cbc/network
./organizations/ccp-generate.sh
```

### 5. "Port already in use" errors

**Symptom**: API fails to start, "EADDRINUSE" error

**Solution**:
```bash
# Find and kill processes on ports
for port in 3001 3002 3003 3004 3005; do
  lsof -ti:$port | xargs kill -9
done

# Or use the system script
./start-system.sh  # It will auto-cleanup ports
```

### 6. Docker containers unhealthy

**Symptom**: `docker ps` shows unhealthy containers

**Cause**: Services starting too quickly, healthchecks timing out

**Solution**:
```bash
# Check specific container logs
docker logs peer0.commercialbank.coffee-export.com

# Restart with clean state
docker-compose down -v
./start-system.sh --clean
```

### 7. IPFS daemon not starting

**Symptom**: APIs fail with IPFS connection errors

**Solution**:
```bash
# Check if IPFS is running
lsof -i:5001

# Initialize and start IPFS manually
ipfs init
ipfs daemon &

# Or start via Docker
docker-compose up -d ipfs
```

### 8. Chaincode deployment fails

**Symptom**: `deployCC` fails with "chaincode already exists" or approval errors

**Solution**:
```bash
# For updates, increment the sequence number
cd /home/gu-da/cbc/network
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang -ccv 2.0 -ccs 2

# For complete reset
./network.sh down
rm -rf organizations/peerOrganizations organizations/ordererOrganizations
./start-system.sh --clean
```

### 9. Workspace install fails

**Symptom**: `npm install` in api/ directory fails with dependency conflicts

**Solution**:
```bash
cd /home/gu-da/cbc/api
rm -rf node_modules */node_modules
rm package-lock.json */package-lock.json
npm install
```

### 10. Health checks always show warnings

**Symptom**: System reports warnings even when all services are running

**Cause**: Health check might be running too early

**Solution**:
```bash
# Wait a bit longer after startup
sleep 30

# Manual health check
for port in 3001 3002 3003 3004 3005; do
  curl -f http://localhost:$port/health && echo " - Port $port OK"
done
```

### 11. Fabric version mismatch warning

**Symptom**: Warning during network startup:

```
=================== WARNING ===================
  Local fabric binaries and docker images are  
  out of  sync. This may cause problems.       
===============================================
LOCAL_VERSION=v2.5.4
DOCKER_IMAGE_VERSION=v2.5.14
```

**Cause**: Local binaries (v2.5.4) don't match Docker images (v2.5.14)

**Impact**: May cause compatibility issues, deployment failures, or unexpected behavior

**Solution**: Run the version fix script:
```bash
cd /home/gu-da/cbc
./scripts/fix-fabric-versions.sh
```

**Choose from 3 options**:
1. **Update Docker images to v2.5.4** (RECOMMENDED - fastest)
2. Update binaries to v2.5.14
3. Update both to latest stable (v2.5.14)

The script will:
- Detect version mismatch
- Download/update required components
- Update docker-compose.yml files
- Verify the fix

**After fixing**:
```bash
./start-system.sh --clean
```

### 12. "gzip: unexpected end of file" during install

**Symptom**: Download errors during `install-fabric.sh` but verification shows binaries are installed

```
gzip: stdin: unexpected end of file
tar: Unexpected EOF in archive
==> There was an error downloading the binary file.
```

**Cause**: Corrupted download or network issue, but binaries are already present

**Solution**: Safe to ignore if verification shows:
```
✅ peer:  Version: v2.5.4
✅ orderer:  Version: v2.5.4
✅ configtxgen: ...
```

The binaries are working correctly. The download error is non-critical.

**To verify**:
```bash
ls -la /home/gu-da/cbc/bin/ | grep -E "(peer|orderer)"
# Should show peer and orderer binaries
```

## Validation

Run the validation script before starting the system:

```bash
./scripts/validate-all.sh
```

This checks for:
- Correct workspace configurations
- All required .env.example files
- Wallet directory configurations
- Port configurations
- Docker healthchecks
- Shell script error handling
- TypeScript configurations

## Clean Reset

For a complete clean reset:

```bash
# Stop everything
cd /home/gu-da/cbc
tmux kill-session -t cbc-apis 2>/dev/null || true
pkill -f "ipfs daemon"
cd network && ./network.sh down

# Clean all artifacts
rm -rf network/organizations/peerOrganizations
rm -rf network/organizations/ordererOrganizations
rm -rf network/channel-artifacts
rm -rf api/*/wallet/*
rm -rf api/*/node_modules
docker volume prune -f

# Fresh start
./start-system.sh --clean
```

## Useful Commands

```bash
# Check all service logs
docker-compose logs -f

# Check specific API logs
tail -f logs/commercialbank.log

# Check network status
docker ps | grep coffee-export

# Check API ports
lsof -Pi :3001-3005 -sTCP:LISTEN

# Test API connectivity
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health

# IPFS status
ipfs id
curl http://localhost:5001/api/v0/id

# Blockchain peer status
docker exec peer0.commercialbank.coffee-export.com peer node status
```

## Getting Help

If issues persist:
1. Review `/home/gu-da/cbc/FIXES_APPLIED.md` for recent fixes
2. Check logs in `/home/gu-da/cbc/logs/`
3. Verify Docker resources: `docker system df`
4. Ensure sufficient disk space and memory
