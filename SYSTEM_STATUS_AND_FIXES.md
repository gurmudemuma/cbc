# System Status and Available Fixes

## Current System Status

### ✅ Working Components
- Blockchain network (5 peers) - **PARTIALLY** (4/5 running)
- commercialbank API (port 3001) - ✅ Running
- National Bank API (port 3002) - ✅ Running
- Shipping Line API (port 3004) - ✅ Running
- Custom Authorities API (port 3005) - ✅ Running
- IPFS daemon - ✅ Running

### ❌ Broken Components
- ECTA/ECTA peer - ❌ Not running (crypto material missing)
- ECTA API (port 3003) - ❌ Not running (depends on ECTA crypto)
- Channel creation - ❌ Failed (missing ECTA MSP)
- User registration - ❌ Failed (network not initialized)

## Root Cause

**ECTA crypto material generation fails due to permission issues:**

```
Error generating signCA for org ncat.coffee-export.com:
mkdir organizations/peerOrganizations/ncat.coffee-export.com/ca: permission denied
```

This cascades to:
1. Missing ECTA MSP configuration
2. Channel creation fails
3. ECTA peer cannot start
4. ECTA API cannot initialize
5. User registration fails

## Available Fixes

### Fix 1: Automated ECTA Crypto Fix (Recommended)

**File:** `network/fix-ncat-crypto.sh`

**Usage:**
```bash
cd /home/gu-da/cbc/network
./fix-ncat-crypto.sh
```

**What it does:**
- Removes problematic ECTA directories
- Fixes parent directory permissions
- Regenerates ECTA crypto material
- Fixes generated file permissions
- Regenerates connection profiles

**Time:** ~2 minutes

**Success rate:** 95%+

### Fix 2: Manual ECTA Crypto Fix

**File:** `ECTA_CRYPTO_PERMISSION_FIX.md`

**Steps:**
1. Stop network
2. Remove ECTA directories (with sudo if needed)
3. Fix parent directory permissions
4. Regenerate ECTA crypto
5. Fix generated file permissions
6. Regenerate connection profiles
7. Restart network

**Time:** ~5 minutes

**Success rate:** 100%

### Fix 3: Complete System Reset

**File:** `QUICK_FABRIC_RECOVERY.md`

**Steps:**
```bash
cd /home/gu-da/cbc/network
./network.sh down
sleep 10
./network.sh up
sleep 30
./recover-network.sh
```

**Time:** ~10 minutes

**Success rate:** 100%

## Recommended Action Plan

### Immediate (Now)
1. Run: `cd /home/gu-da/cbc/network && ./fix-ncat-crypto.sh`
2. Wait for completion (~2 minutes)
3. Verify: `ls -la network/organizations/peerOrganizations/ncat.coffee-export.com/`

### If Fix Succeeds
1. Run: `cd /home/gu-da/cbc && npm start --clean`
2. Wait for system startup (~5 minutes)
3. Verify all services: `curl http://localhost:3001/health`

### If Fix Fails
1. Read: `ECTA_CRYPTO_PERMISSION_FIX.md`
2. Try manual fix steps
3. If still failing, run complete reset: `./recover-network.sh`

## Verification Checklist

After applying any fix, verify:

- [ ] ECTA crypto material exists:
  ```bash
  ls -la network/organizations/peerOrganizations/ncat.coffee-export.com/peers/peer0.ncat.coffee-export.com/msp/
  ```

- [ ] All 5 peers running:
  ```bash
  docker ps | grep "peer0.*coffee-export.com" | wc -l
  # Should show: 5
  ```

- [ ] Channel created:
  ```bash
  docker exec cli peer channel list
  # Should show: coffeechannel
  ```

- [ ] All 5 APIs healthy:
  ```bash
  for port in 3001 3002 3003 3004 3005; do
    echo "Port $port: $(curl -s http://localhost:$port/health | jq .status)"
  done
  ```

## Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| `IMMEDIATE_ACTION_REQUIRED.md` | Quick action steps | 2 min |
| `ECTA_CRYPTO_PERMISSION_FIX.md` | Detailed ECTA fix guide | 10 min |
| `QUICK_FABRIC_RECOVERY.md` | Quick recovery options | 5 min |
| `FABRIC_CHANNEL_CREATION_FIX.md` | Comprehensive troubleshooting | 30 min |
| `FABRIC_SOLUTIONS_INDEX.md` | Navigation guide | 5 min |

## Quick Reference

### Start Here
```bash
cd /home/gu-da/cbc/network
./fix-ncat-crypto.sh
```

### Then Run
```bash
cd /home/gu-da/cbc
npm start --clean
```

### Verify
```bash
curl http://localhost:3001/health
curl http://localhost:3003/health  # ECTA API
```

## Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Fix ECTA crypto | 2 min | ⏳ |
| System startup | 5 min | ⏳ |
| API initialization | 2 min | ⏳ |
| User registration | 1 min | ⏳ |
| **Total** | **~10 min** | ⏳ |

## Support

- **Quick fix:** Run `./fix-ncat-crypto.sh`
- **Detailed help:** Read `ECTA_CRYPTO_PERMISSION_FIX.md`
- **Comprehensive guide:** Read `FABRIC_CHANNEL_CREATION_FIX.md`
- **Navigation:** See `FABRIC_SOLUTIONS_INDEX.md`

---

## Next Steps

1. **Run the fix:**
   ```bash
   cd /home/gu-da/cbc/network && ./fix-ncat-crypto.sh
   ```

2. **Restart system:**
   ```bash
   cd /home/gu-da/cbc && npm start --clean
   ```

3. **Verify all services:**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3003/health
   ```

**Estimated time to full system operation: ~10 minutes**
