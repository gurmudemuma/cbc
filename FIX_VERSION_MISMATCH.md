# Fix Fabric Version Mismatch

## Problem

You're seeing this warning:

```
=================== WARNING ===================
  Local fabric binaries and docker images are  
  out of  sync. This may cause problems.       
===============================================
LOCAL_VERSION=v2.5.4
DOCKER_IMAGE_VERSION=v2.5.14
```

**Why this matters**: Version mismatches can cause:
- Chaincode deployment failures
- Network startup issues  
- Incompatibility errors
- Unexpected behavior

---

## Quick Fix (Recommended)

Run the automated fix script:

```bash
cd /home/gu-da/cbc
./scripts/fix-fabric-versions.sh
```

### What It Does

The script detects the mismatch and offers 3 options:

#### **Option 1: Update Docker Images to v2.5.4** ⭐ RECOMMENDED
- **Fastest** solution (5-10 minutes)
- Downloads Docker images matching your binaries
- No binary reinstallation needed
- Updates docker-compose.yml files

```bash
# After choosing Option 1:
# - Pulls hyperledger/fabric-peer:2.5.4
# - Pulls hyperledger/fabric-orderer:2.5.4
# - Pulls hyperledger/fabric-tools:2.5.4
# - Updates all compose files
```

#### **Option 2: Update Binaries to v2.5.14**
- Downloads new binaries
- Backs up old binaries
- Takes longer (download + extraction)

#### **Option 3: Update Both to Latest (v2.5.14)**
- Most thorough
- Updates everything to latest stable
- Takes longest but ensures latest features

---

## Step-by-Step (Option 1 - Recommended)

```bash
# 1. Stop any running services
cd /home/gu-da/cbc
./network/network.sh down
pkill -f "npm run dev" 2>/dev/null || true

# 2. Run fix script
./scripts/fix-fabric-versions.sh

# When prompted, choose: 1
# Enter choice [1-4]: 1

# 3. Wait for Docker images to download (5-10 minutes)
# Progress will be shown for each image

# 4. Script automatically verifies the fix

# 5. Restart system
./start-system.sh --clean
```

---

## Manual Fix (If Script Fails)

### Option A: Update Docker Images Manually

```bash
# Stop services
cd /home/gu-da/cbc
./network/network.sh down

# Pull v2.5.4 images
docker pull hyperledger/fabric-peer:2.5.4
docker pull hyperledger/fabric-orderer:2.5.4
docker pull hyperledger/fabric-ccenv:2.5.4
docker pull hyperledger/fabric-tools:2.5.4
docker pull hyperledger/fabric-baseos:2.5.4

# Tag as latest
docker tag hyperledger/fabric-tools:2.5.4 hyperledger/fabric-tools:latest

# Update docker-compose.yml
sed -i 's/hyperledger\/fabric-peer:.*/hyperledger\/fabric-peer:2.5.4/g' docker-compose.yml
sed -i 's/hyperledger\/fabric-orderer:.*/hyperledger\/fabric-orderer:2.5.4/g' docker-compose.yml
sed -i 's/hyperledger\/fabric-tools:.*/hyperledger\/fabric-tools:2.5.4/g' docker-compose.yml

# Verify
docker run --rm hyperledger/fabric-tools:2.5.4 peer version
```

### Option B: Update Binaries Manually

```bash
# Backup existing binaries
cd /home/gu-da/cbc
mv bin bin.backup.$(date +%Y%m%d)

# Download v2.5.14
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary 2.5.14 1.5.7

# Verify
./bin/peer version
```

---

## Verification

After fixing, verify versions match:

```bash
# Check local binaries
peer version | grep Version

# Check Docker images
docker run --rm hyperledger/fabric-tools:latest peer version | grep Version

# Should show same version (e.g., v2.5.4 or v2.5.14)
```

**Expected output**:
```
✅ Local binaries: v2.5.4
✅ Docker images:  v2.5.4
```

---

## Troubleshooting

### "peer: command not found"

Add binaries to PATH:

```bash
export PATH=/home/gu-da/cbc/bin:$PATH

# Make permanent
echo 'export PATH=/home/gu-da/cbc/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Docker pull fails

Check internet connection and try:

```bash
# Test Docker Hub connectivity
docker pull hello-world

# If behind proxy, configure Docker proxy settings
```

### Script exits with error

Run with verbose mode to see details:

```bash
bash -x ./scripts/fix-fabric-versions.sh
```

---

## After Fixing

1. **Restart the system**:
   ```bash
   ./start-system.sh --clean
   ```

2. **Verify no warnings appear**:
   - Check output for the WARNING message
   - Should see: "LOCAL_VERSION=v2.5.X" and "DOCKER_IMAGE_VERSION=v2.5.X" (same)

3. **Test deployment**:
   ```bash
   # Should complete without errors
   cd network
   ./network.sh createChannel
   ./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang
   ```

---

## Why Version Mismatch Happens

- **Scenario 1**: Binaries installed long ago, Docker images updated recently
- **Scenario 2**: Pulled latest Docker images but using old binaries
- **Scenario 3**: Different installation methods used at different times

**Prevention**: Always update binaries and images together when upgrading.

---

## Summary

| Method | Time | Recommended |
|--------|------|-------------|
| Automated script (Option 1) | 5-10 min | ✅ Yes |
| Automated script (Option 2) | 10-15 min | ⚠️ OK |
| Automated script (Option 3) | 15-20 min | ⚠️ OK |
| Manual fix | 10-30 min | ❌ If script fails |

**Best choice**: Run `./scripts/fix-fabric-versions.sh` and choose **Option 1**.

---

For more help, see:
- `TROUBLESHOOTING.md` - Section 11
- `scripts/fix-fabric-versions.sh` - The fix script
- [Hyperledger Fabric Docs](https://hyperledger-fabric.readthedocs.io/)
