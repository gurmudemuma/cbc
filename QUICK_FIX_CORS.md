# 🚀 Quick Fix - CORS Error

## Problem
Frontend on port 5174 can't communicate with APIs (CORS blocked)

## Solution (2 Steps)

### Step 1: Restart All APIs
```bash
# Kill all API processes
pkill -f "npm run dev"

# Wait 2 seconds
sleep 2

# Restart all APIs (run each in separate terminal or background)
cd /home/gu-da/cbc/api/commercialbank && npm run dev &
cd /home/gu-da/cbc/api/national-bank && npm run dev &
cd /home/gu-da/cbc/api/ecta && npm run dev &
cd /home/gu-da/cbc/api/shipping-line && npm run dev &
cd /home/gu-da/cbc/api/custom-authorities && npm run dev &
```

### Step 2: Refresh Frontend
- Go to `http://localhost:5174`
- Refresh the page (Ctrl+R or Cmd+R)
- Try logging in

## What Was Fixed

All 5 API `.env` files updated:
```
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

## Expected Result
- ✅ No more CORS errors
- ✅ Login works
- ✅ API calls succeed
- ✅ System fully operational

## Time Required
~2 minutes

---

**That's it! CORS errors will be gone after restarting the APIs.**
