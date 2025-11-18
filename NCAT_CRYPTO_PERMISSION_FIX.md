# ECTA Crypto Material Permission Fix

## Problem

The ECTA (ECTA) organization crypto material generation is failing with permission denied errors:

```
Error generating signCA for org ncat.coffee-export.com:
mkdir organizations/peerOrganizations/ncat.coffee-export.com/ca: permission denied
```

This causes:
- ❌ Channel creation fails (missing ECTA MSP)
- ❌ ECTA API cannot start
- ❌ Chaincode installation fails for ECTA peer
- ❌ User registration fails

## Root Cause

The issue occurs because:
1. Docker volumes create directories with root ownership
2. `cryptogen` tries to create subdirectories but lacks permissions
3. The permission fix in Step 9 runs too late (after crypto generation attempt)

## Solution

### Quick Fix (Recommended)

Run the dedicated ECTA crypto fix script:

```bash
cd /home/gu-da/cbc/network
./fix-ncat-crypto.sh
```

This script will:
1. Remove existing ECTA directories
2. Fix parent directory permissions
3. Regenerate ECTA crypto material
4. Fix permissions on generated files
5. Regenerate connection profiles

### What the Script Does

```bash
# 1. Remove old ECTA directories
sudo rm -rf organizations/peerOrganizations/ncat.coffee-export.com

# 2. Ensure parent directories exist with correct permissions
mkdir -p organizations/peerOrganizations
sudo chown -R $(whoami):$(whoami) organizations/peerOrganizations

# 3. Generate ECTA crypto material
cryptogen generate --config=./organizations/cryptogen/crypto-config-ncat.yaml --output="organizations"

# 4. Fix permissions on generated files
sudo chown -R $(whoami):$(whoami) organizations/peerOrganizations/ncat.coffee-export.com

# 5. Regenerate connection profiles
./organizations/ccp-generate.sh
```

## After Running the Fix

Once the ECTA crypto material is fixed, continue with:

```bash
# Create channel
./network.sh createChannel

# Deploy chaincodes
./network.sh deployCC

# Start APIs
cd ../api/commercialbank && npm run dev
cd ../api/national-bank && npm run dev
cd ../api/ecta && npm run dev
cd ../api/shipping-line && npm run dev
cd ../api/custom-authorities && npm run dev
```

## Manual Fix (If Script Fails)

If the script doesn't work, try these manual steps:

### Step 1: Stop the Network
```bash
cd /home/gu-da/cbc/network
./network.sh down
```

### Step 2: Remove ECTA Directories
```bash
sudo rm -rf organizations/peerOrganizations/ncat.coffee-export.com
sudo rm -rf organizations/ordererOrganizations/ncat.coffee-export.com
```

### Step 3: Fix Parent Directory Permissions
```bash
sudo chown -R $(whoami):$(whoami) organizations/peerOrganizations
sudo chown -R $(whoami):$(whoami) organizations/ordererOrganizations
```

### Step 4: Regenerate ECTA Crypto
```bash
cryptogen generate --config=./organizations/cryptogen/crypto-config-ncat.yaml --output="organizations"
```

### Step 5: Fix Generated File Permissions
```bash
sudo chown -R $(whoami):$(whoami) organizations/peerOrganizations/ncat.coffee-export.com
```

### Step 6: Regenerate Connection Profiles
```bash
./organizations/ccp-generate.sh
```

### Step 7: Restart Network
```bash
./network.sh up
```

## Verification

After running the fix, verify ECTA crypto material was generated:

```bash
# Check ECTA peer MSP exists
ls -la network/organizations/peerOrganizations/ncat.coffee-export.com/peers/peer0.ncat.coffee-export.com/msp/

# Should show:
# - cacerts/
# - keystore/
# - signcerts/
# - tlscacerts/

# Check ECTA CA exists
ls -la network/organizations/peerOrganizations/ncat.coffee-export.com/ca/

# Should show:
# - ca.ncat.coffee-export.com-cert.pem
# - (private key file)
```

## Prevention

To prevent this issue in future startups:

1. **Always run clean with sudo if needed:**
   ```bash
   sudo rm -rf network/organizations/peerOrganizations
   sudo rm -rf network/organizations/ordererOrganizations
   ```

2. **Fix permissions before generating crypto:**
   ```bash
   mkdir -p network/organizations/peerOrganizations
   mkdir -p network/organizations/ordererOrganizations
   sudo chown -R $(whoami):$(whoami) network/organizations
   ```

3. **Use the provided startup script:**
   ```bash
   npm start --clean
   ```

## Troubleshooting

### Issue: "Permission denied" still occurs

**Solution:** Use sudo for the fix script:
```bash
sudo /home/gu-da/cbc/network/fix-ncat-crypto.sh
```

### Issue: "cryptogen: command not found"

**Solution:** Add Fabric binaries to PATH:
```bash
export PATH="/home/gu-da/cbc/bin:$PATH"
cd /home/gu-da/cbc/network
./fix-ncat-crypto.sh
```

### Issue: Connection profiles still have errors

**Solution:** Manually regenerate them:
```bash
cd /home/gu-da/cbc/network
./organizations/ccp-generate.sh
```

## Next Steps

After fixing ECTA crypto material:

1. **Create Channel:**
   ```bash
   cd /home/gu-da/cbc/network
   ./network.sh createChannel
   ```

2. **Deploy Chaincodes:**
   ```bash
   ./network.sh deployCC
   ```

3. **Start All Services:**
   ```bash
   cd /home/gu-da/cbc
   npm start
   ```

4. **Verify All APIs are Running:**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3002/health
   curl http://localhost:3003/health
   curl http://localhost:3004/health
   curl http://localhost:3005/health
   ```

## Summary

The ECTA crypto permission issue is caused by Docker volume ownership conflicts. The provided `fix-ncat-crypto.sh` script handles all the necessary steps to:
- Remove problematic directories
- Fix permissions
- Regenerate crypto material
- Regenerate connection profiles

This ensures ECTA/ECTA organization is properly configured and all 5 API services can start successfully.
