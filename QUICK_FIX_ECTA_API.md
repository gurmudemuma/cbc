# 🚀 Quick Fix - ECTA API Connection Issue

## Problem
ECTA API (port 3003) is not connecting to Fabric network due to incorrect admin enrollment path.

## Solution (3 Steps)

### Step 1: Re-enroll ECTA Admin
```bash
cd /home/gu-da/cbc
./scripts/enroll-admins.sh
```

Expected output:
```
✅ Admin enrolled for ECTA
```

### Step 2: Restart ECTA API
```bash
# Kill existing process
pkill -f "npm run dev.*ecta"

# Wait 2 seconds
sleep 2

# Restart
cd /home/gu-da/cbc/api/ecta
npm run dev
```

### Step 3: Verify
```bash
# Check ECTA API is running
curl http://localhost:3003/health

# Should return:
# {"status":"ok"}
```

## What Was Wrong

**File:** `scripts/enroll-admins.sh`

```bash
# WRONG
enroll_admin "ECTA" "ecta.coffee-export.com" "ECTAMSP" "$PROJECT_ROOT/api/ncat"

# FIXED
enroll_admin "ECTA" "ecta.coffee-export.com" "ECTAMSP" "$PROJECT_ROOT/api/ecta"
```

## Expected Result

After these 3 steps:
- ✅ ECTA API running on port 3003
- ✅ All 5 APIs healthy
- ✅ Frontend can communicate with all APIs
- ✅ No more connection errors

## Time Required
~2 minutes

---

**That's it! The system will be fully operational after these 3 steps.**
