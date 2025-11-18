# ⚠️ IMMEDIATE ACTION REQUIRED

## Current Status

Your system startup is failing because **ECTA (ECTA) crypto material is not being generated** due to permission issues.

## What's Broken

- ❌ ECTA crypto material missing
- ❌ Channel creation failing
- ❌ ECTA API cannot start
- ❌ User registration failing

## Quick Fix (2 minutes)

### Step 1: Stop Current System
```bash
cd /home/gu-da/cbc
pkill -f 'npm run dev'
pkill -f 'ipfs daemon'
cd network && ./network.sh down
```

### Step 2: Fix ECTA Crypto
```bash
cd /home/gu-da/cbc/network
./fix-ncat-crypto.sh
```

### Step 3: Restart System
```bash
cd /home/gu-da/cbc
npm start --clean
```

## What This Does

The `fix-ncat-crypto.sh` script:
1. ✅ Removes problematic ECTA directories
2. ✅ Fixes directory permissions
3. ✅ Regenerates ECTA crypto material
4. ✅ Fixes file permissions
5. ✅ Regenerates connection profiles

## Expected Result

After running the fix:
- ✅ All 5 peer containers running
- ✅ Channel created successfully
- ✅ All 5 API services healthy
- ✅ Test users registered
- ✅ System fully operational

## If Fix Doesn't Work

See detailed troubleshooting in: `ECTA_CRYPTO_PERMISSION_FIX.md`

## Timeline

- **Fix script:** 2 minutes
- **System restart:** 3-5 minutes
- **Total:** ~7 minutes

---

**Run this now:**
```bash
cd /home/gu-da/cbc/network && ./fix-ncat-crypto.sh
```
