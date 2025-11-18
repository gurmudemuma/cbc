# Error Analysis: 404 and 500 Errors in CBC Application

## Summary
Your application is experiencing multiple API endpoint failures. The errors fall into three categories:

1. **404 Errors (Not Found)** - Endpoints don't exist or are not properly registered
2. **500 Error (Internal Server Error)** - Server-side processing failure
3. **Axios Errors** - Client-side API communication issues

---

## Detailed Error Breakdown

### 1. **404 Errors: `/api/exporter-portal/exports` endpoints**

**Error Messages:**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
api/exporter-portal/exports:1
api/exporter-portal/exports/status/PENDING:1
api/exporter-portal/exports/status/SHIPMENT_SCHEDULED:1
api/exporter-portal/exports/status/COMPLETED:1
```

**Root Cause:**
The frontend is trying to call `/api/exporter-portal/exports` but this endpoint doesn't exist. The issue is a **URL path mismatch**:

- **Frontend expects:** `/api/exporter-portal/exports` (from `ExportManagement.jsx`)
- **Backend provides:** `/api/exports` (from `exporter-portal/src/index.ts`)

**Location in Code:**

Frontend (`ExportManagement.jsx`, line ~150):
```javascript
const endpoint = isExporterPortal || isExporterBank ? '/portal/exports' : '/exports';
```

Backend (`exporter-portal/src/index.ts`, line ~75):
```javascript
app.use("/api/exports", exportRoutes);
```

**The Problem:**
- Frontend is calling `/portal/exports` (which gets prefixed to `/api/exporter-portal/exports`)
- Backend is serving at `/api/exports`
- These don't match!

**Solution:**
The backend needs to serve the exports routes at `/api/exporter-portal/exports` instead of `/api/exports`.

---

### 2. **500 Error: `/api/nationalbank/auth/login`**

**Error Message:**
```
api/nationalbank/auth/login:1 Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

**Root Cause:**
The National Bank API is throwing an internal server error when processing login requests. This could be due to:

1. **Database/Fabric connection issues** - The Hyperledger Fabric network may not be connected
2. **Missing environment variables** - Required config not set
3. **Authentication middleware failure** - Validation or token generation failing
4. **Unhandled exception** - Bug in the auth controller

**Location in Code:**

Frontend (`Login.jsx`, line ~30):
```javascript
const authEndpoint = formData.organization === 'exporter-portal' 
  ? '/portal/auth/login' 
  : '/auth/login';
```

Backend (`national-bank/src/index.ts`, line ~60):
```javascript
app.use("/api/auth/login", authLimiter);
app.use("/api/auth", authRoutes);
```

Backend route (`national-bank/src/routes/auth.routes.ts`):
```javascript
router.post("/login", validateLogin, authController.login);
```

**Why it's 500 instead of 404:**
The endpoint EXISTS (so no 404), but something inside the login handler is crashing.

---

### 3. **Axios Errors: "Error fetching exports"**

**Error Message:**
```
hook.js:608 Error fetching exports: AxiosError
hook.js:608 Exports endpoint not found. This may be expected if no exports exist yet.
```

**Root Cause:**
This is a cascading error from the 404 errors above. When the frontend can't reach the exports endpoint, Axios throws an error, which is caught and logged.

**Location in Code:**

Frontend (`ExportManagement.jsx`, line ~150-170):
```javascript
const fetchExports = async () => {
  try {
    const endpoint = isExporterPortal || isExporterBank ? '/portal/exports' : '/exports';
    const response = await apiClient.get(endpoint);
    setExports(response.data.data || []);
  } catch (error) {
    console.error('Error fetching exports:', error);
    // ... error handling
  }
};
```

---

## API Endpoint Mapping Issues

### Current State (BROKEN):
```
Frontend                          Backend
─────────────────────────────────────────────────
/api/exporter-portal/exports  ✗  /api/exports
/api/nationalbank/auth/login  ✓  /api/auth/login (but 500 error)
/api/exporter-portal/exports/status/* ✗  Not registered
```

### Expected State (SHOULD BE):
```
Frontend                          Backend
─────────────────────────────────────────────────
/api/exporter-portal/exports  →  /api/exporter-portal/exports
/api/nationalbank/auth/login  →  /api/auth/login
/api/exporter-portal/exports/status/* → /api/exports/status/*
```

---

## How API Paths Are Constructed

The frontend uses a base URL system:

1. **API Config** (`api.config.js`):
   ```javascript
   exporterportal: '/api/exporter-portal'
   nationalbank: '/api/nationalbank'
   ```

2. **API Client** (`services/api.js`):
   - Sets base URL based on organization
   - Appends endpoint paths to base URL

3. **Frontend Calls**:
   - For exporter portal: `baseUrl + '/exports'` = `/api/exporter-portal/exports`
   - For national bank: `baseUrl + '/auth/login'` = `/api/nationalbank/auth/login`

---

## Issues Summary

| Issue | Type | Severity | Impact |
|-------|------|----------|--------|
| Exporter Portal routes not at `/api/exporter-portal/exports` | 404 | **CRITICAL** | Export management completely broken |
| National Bank login throwing 500 error | 500 | **CRITICAL** | Users cannot authenticate |
| Status filter endpoints not registered | 404 | **HIGH** | Status filtering doesn't work |
| Axios error handling cascading | Logic | **MEDIUM** | Confusing error messages |

---

## Recommended Fixes

### Fix 1: Update Exporter Portal Backend Routes
**File:** `/home/gu-da/cbc/api/exporter-portal/src/index.ts`

Change:
```javascript
app.use("/api/exports", exportRoutes);
```

To:
```javascript
app.use("/api/exporter-portal/exports", exportRoutes);
```

### Fix 2: Debug National Bank Login
**File:** `/home/gu-da/cbc/api/national-bank/src/controllers/auth.controller.ts`

Add detailed logging to identify the 500 error:
```javascript
async login(req: Request, res: Response) {
  try {
    console.log('Login attempt:', req.body.username);
    // ... existing code
  } catch (error) {
    console.error('Login error details:', error);
    // Log full error stack
  }
}
```

### Fix 3: Verify Environment Variables
Ensure all required env vars are set:
- `FABRIC_NETWORK_ENABLED`
- `CHANNEL_NAME`
- `CHAINCODE_NAME_EXPORT`
- Database connection strings
- JWT secrets

### Fix 4: Check Fabric Network Status
The 500 error might be because Hyperledger Fabric isn't running:
```bash
docker ps | grep fabric
```

---

## Testing Checklist

After fixes:

- [ ] Test exporter portal login
- [ ] Test national bank login
- [ ] Fetch exports list (should return empty array, not 404)
- [ ] Create new export
- [ ] Filter by status
- [ ] Upload documents
- [ ] Check browser console for errors

---

## Additional Notes

1. **Error Handling:** The frontend has good error handling for 404s, but the 500 error needs investigation
2. **CORS:** Make sure CORS is properly configured for cross-origin requests
3. **Rate Limiting:** Auth endpoints have rate limiting - check if you're hitting limits
4. **WebSocket:** National Bank uses WebSocket - ensure it's not interfering with HTTP requests

