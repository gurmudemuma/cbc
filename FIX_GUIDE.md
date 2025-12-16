# Fix Guide: Resolving 404 and 500 Errors

## Quick Fix Summary

You have **two main issues**:

1. **404 Errors on `/api/exporter-portal/exports`** - Backend routes are registered at wrong path
2. **500 Error on `/api/nationalbank/auth/login`** - Server-side error in authentication

---

## Fix #1: Exporter Portal Routes (404 Errors)

### Problem
Frontend calls: `/api/exporter-portal/exports`
Backend serves: `/api/exports`

### Solution
Update the backend to serve routes at the correct path.

**File to modify:** `/home/gu-da/cbc/api/exporter-portal/src/index.ts`

**Change this line (around line 75):**
```javascript
app.use("/api/exports", exportRoutes);
```

**To this:**
```javascript
app.use("/api/exporter-portal/exports", exportRoutes);
```

**Why:** The frontend's API client prefixes `/api/exporter-portal` to all exporter portal requests. The backend needs to match this path structure.

---

## Fix #2: National Bank Login (500 Error)

### Problem
The login endpoint exists but returns 500 (Internal Server Error).

### Diagnosis Steps

**Step 1: Check if Fabric network is running**
```bash
docker ps | grep fabric
```

If no containers are running, start the Fabric network:
```bash
cd /home/gu-da/cbc/network
./network.sh up
```

**Step 2: Check National Bank API logs**
```bash
# If running in Docker
docker logs <national-bank-container-id>

# If running locally
# Check the terminal where you started the API
```

**Step 3: Verify environment variables**

Check `/home/gu-da/cbc/api/national-bank/.env`:
```
FABRIC_NETWORK_ENABLED=true
CHANNEL_NAME=coffee-channel
CHAINCODE_NAME_EXPORT=coffee-export
ORGANIZATION_NAME=NationalBank
ORGANIZATION_MSP_ID=NationalBankMSP
```

**Step 4: Add detailed error logging**

**File:** `/home/gu-da/cbc/api/national-bank/src/controllers/auth.controller.ts`

Find the `login` method and add logging:
```typescript
async login(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('🔐 Login attempt for user:', req.body.username);
    
    // ... existing validation code ...
    
    // Add logging before Fabric calls
    console.log('📋 Validating credentials against Fabric...');
    
    // ... rest of login logic ...
    
  } catch (error) {
    console.error('❌ Login error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error
    });
    next(error);
  }
}
```

---

## Fix #3: Verify API Client Configuration

### Check Frontend API Configuration

**File:** `/home/gu-da/cbc/frontend/src/config/api.config.js`

Verify these endpoints are correct:
```javascript
export const API_ENDPOINTS = {
  exporter: '/api/exporter',
  exporterportal: '/api/exporter-portal',  // ✓ Correct
  nationalbank: '/api/nationalbank',       // ✓ Correct
  ncat: '/api/ncat',
  shipping: '/api/shipping',
  customauthorities: '/api/customauthorities',
};
```

### Check API Service

**File:** `/home/gu-da/cbc/frontend/src/services/api.js`

Verify the base URL is being set correctly:
```javascript
export const setApiBaseUrl = (baseUrl) => {
  apiClient.defaults.baseURL = baseUrl;
  console.log('API Base URL set to:', baseUrl);
};
```

---

## Fix #4: Verify Backend Route Registration

### Exporter Portal Routes

**File:** `/home/gu-da/cbc/api/exporter-portal/src/index.ts`

Should have:
```javascript
// Mount routes
app.use("/api/exporter-portal/exports", exportRoutes);
```

### National Bank Routes

**File:** `/home/gu-da/cbc/api/national-bank/src/index.ts`

Should have:
```javascript
// Routes with rate limiting
app.use("/api/auth/login", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/portal/auth", portalAuthRoutes);
```

---

## Step-by-Step Fix Process

### Step 1: Fix Exporter Portal Routes
```bash
cd /home/gu-da/cbc/api/exporter-portal
# Edit src/index.ts
# Change: app.use("/api/exports", exportRoutes);
# To:     app.use("/api/exporter-portal/exports", exportRoutes);
```

### Step 2: Restart Exporter Portal API
```bash
# If running in Docker
docker restart exporter-portal-api

# If running locally
npm run dev
```

### Step 3: Check National Bank Logs
```bash
# Monitor logs for errors
docker logs -f national-bank-api
```

### Step 4: Test Login
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Check the request/response for `/api/nationalbank/auth/login`

### Step 5: Test Exports Endpoint
1. After successful login
2. Check Network tab for `/api/exporter-portal/exports`
3. Should return 200 with data (or empty array)

---

## Common Issues and Solutions

### Issue: Still getting 404 on `/api/exporter-portal/exports`

**Cause:** Backend not restarted after code change

**Solution:**
```bash
# Kill the process
pkill -f "exporter-portal"

# Rebuild and restart
cd /home/gu-da/cbc/api/exporter-portal
npm run build
npm start
```

### Issue: 500 error persists on login

**Cause:** Fabric network not running or credentials invalid

**Solution:**
```bash
# Check Fabric status
docker ps | grep fabric

# If not running, start it
cd /home/gu-da/cbc/network
./network.sh up

# Check if users exist
cd /home/gu-da/cbc/scripts
./check-existing-users.sh
```

### Issue: CORS errors in browser console

**Cause:** CORS not properly configured

**Solution:** Check backend CORS config:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
  credentials: true,
}));
```

---

## Verification Checklist

After applying fixes:

- [ ] Exporter Portal API is running on port 3006
- [ ] National Bank API is running on port 3002
- [ ] Fabric network is running
- [ ] Frontend can reach `/api/exporter-portal/exports` (200 response)
- [ ] Frontend can reach `/api/nationalbank/auth/login` (200 response)
- [ ] Login works without 500 error
- [ ] Export list loads without 404 errors
- [ ] No Axios errors in console

---

## Testing Commands

### Test Exporter Portal Exports Endpoint
```bash
curl -X GET http://localhost:3006/api/exporter-portal/exports \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test National Bank Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Check API Health
```bash
curl http://localhost:3006/health
curl http://localhost:3002/health
```

---

## If Issues Persist

### Enable Debug Logging

**National Bank API:**
```bash
export DEBUG=*
npm start
```

**Exporter Portal API:**
```bash
export DEBUG=*
npm start
```

### Check Docker Logs
```bash
# All containers
docker logs -f

# Specific container
docker logs -f <container-name>
```

### Verify Network Connectivity
```bash
# From frontend container
docker exec frontend-container curl http://exporter-portal-api:3006/health

# From exporter-portal container
docker exec exporter-portal-api curl http://national-bank-api:3002/health
```

---

## Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `/api/exporter-portal/src/index.ts` | Change route from `/api/exports` to `/api/exporter-portal/exports` | Match frontend expectations |
| `/api/national-bank/src/controllers/auth.controller.ts` | Add detailed error logging | Debug 500 error |
| Environment variables | Verify Fabric config | Ensure network connectivity |

