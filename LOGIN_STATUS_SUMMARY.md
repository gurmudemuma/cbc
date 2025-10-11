# Login Status Summary

**Date:** October 11, 2025  
**Status:** ⚠️ In Progress - Rate Limit Issue

---

## ✅ Completed Steps

1. **Blockchain Network** - Fully operational
   - 6 core containers running
   - Channel `coffeechannel` created
   - All peers joined

2. **Chaincode Deployment**
   - ✅ `coffee-export` chaincode (v1.0) - Deployed
   - ✅ `user-management` chaincode (v1.0) - Deployed
   - 8 chaincode containers running (4 per chaincode)

3. **API Services**
   - ✅ Exporter Bank API (port 3001) - Running
   - ✅ National Bank API (port 3002) - Running
   - ✅ NCAT API (port 3003) - Running
   - ✅ Shipping Line API (port 3004) - Running

4. **Frontend**
   - ✅ Configured with Vite proxy
   - ✅ Environment variables set
   - Ready to start on port 5173

---

## ⚠️ Current Issue: Rate Limiting

**Problem:**
The authentication endpoints have a rate limit of **5 requests per 15 minutes**. During testing, we hit this limit.

**Impact:**
- Cannot register new users until rate limit resets (resets in ~12 minutes from 11:55 AM)
- Cannot test login until users are registered

**Rate Limit Settings:**
- Limit: 5 requests per 900 seconds (15 minutes)
- Endpoint: `/api/auth/login` and `/api/auth/register`
- Current remaining: 0
- Reset time: ~741 seconds from last request

---

## 🔧 Solutions

### Option 1: Wait for Rate Limit Reset
Wait 12-15 minutes, then run:
```bash
./register-test-users.sh
```

### Option 2: Temporarily Disable Rate Limiting (Development Only)

Edit each API's `index.ts` file and comment out the auth limiter:

```typescript
// Temporarily disable for development
// app.use("/api/auth/login", authLimiter);
// app.use("/api/auth/register", authLimiter);
```

Then restart the API services.

### Option 3: Restart API Services
Restarting the APIs will reset the rate limit counters:
```bash
# In each API terminal, press Ctrl+C, then:
npm run dev
```

---

## ✅ Test Credentials (Once Registered)

After successful registration, use these credentials:

| Organization | Username | Password |
|-------------|----------|----------|
| **Exporter Bank** | exporter_admin | ExporterPass@2024! |
| **National Bank** | bank_admin | BankPass@2024! |
| **NCAT** | ncat_officer | NcatPass@2024! |
| **Shipping Line** | shipping_admin | ShipPass@2024! |

---

## 📊 System Architecture

```
Frontend (Port 5173)
    ↓ (Vite Proxy)
    ├── /api/exporter → Exporter Bank API (3001)
    ├── /api/nationalbank → National Bank API (3002)
    ├── /api/ncat → NCAT API (3003)
    └── /api/shipping → Shipping Line API (3004)
            ↓
    Fabric Gateway (Node SDK)
            ↓
    Blockchain Network
        ├── user-management chaincode
        └── coffee-export chaincode
```

---

## 🧪 Manual Test Steps (After Rate Limit Resets)

### Step 1: Register a Test User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter_admin",
    "password": "ExporterPass@2024!",
    "email": "admin@exporterbank.com",
    "organizationId": "EXPORTER-BANK-001",
    "role": "exporter"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ...user data... },
    "token": "jwt_token_here"
  }
}
```

### Step 2: Verify User in Blockchain
```bash
docker exec cli bash -c 'export CORE_PEER_LOCALMSPID="ExporterBankMSP" && \
  export CORE_PEER_ADDRESS=peer0.exporterbank.coffee-export.com:7051 && \
  export CORE_PEER_TLS_ENABLED=true && \
  export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/exporterbank.coffee-export.com/peers/peer0.exporterbank.coffee-export.com/tls/ca.crt && \
  export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/exporterbank.coffee-export.com/users/Admin@exporterbank.coffee-export.com/msp && \
  peer chaincode query -C coffeechannel -n user-management -c "{\"function\":\"GetUserByUsername\",\"Args\":[\"exporter_admin\"]}"'
```

### Step 3: Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter_admin",
    "password": "ExporterPass@2024!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ...user data... },
    "token": "jwt_token_here"
  }
}
```

### Step 4: Open Frontend
1. Navigate to http://localhost:5173
2. Select "Exporter Bank"
3. Enter credentials
4. Click "Sign In"
5. Should redirect to dashboard

---

## 📝 Password Requirements

Passwords **must not** contain:
- ❌ Sequential characters (abc, 123, 456, etc.)
- ❌ Repeated characters (aaa, 111, etc.)

Passwords **must** contain:
- ✅ At least 8 characters
- ✅ Uppercase letter
- ✅ Lowercase letter
- ✅ Number
- ✅ Special character (!@#$%^&*)

**Valid Examples:**
- `ExporterPass@2024!`
- `SecureBank#2024`
- `NcatOfficer$2024`

**Invalid Examples:**
- ❌ `ExporterPass123!` (contains "123")
- ❌ `BankPassword111!` (contains "111")
- ❌ `TestPass!234` (contains "234")

---

## 🐛 Known Issues & Workarounds

### Issue 1: Rate Limiting Too Strict
**Problem:** 5 requests per 15 minutes is too restrictive for development.

**Workaround:** 
- Temporarily comment out rate limiters in development
- Or restart API services to reset counters

### Issue 2: Password Validation Very Strict
**Problem:** Password validator rejects common patterns.

**Workaround:** Use passwords with non-sequential numbers like `@2024!`

---

## 🎯 Next Actions

**Wait 12-15 minutes for rate limit reset, then:**

1. Run `./register-test-users.sh` to create all 4 test users
2. Test login for each organization via curl
3. Test frontend login at http://localhost:5173
4. Verify dashboard loads correctly

---

## 📚 Related Documentation

- `FRONTEND_LOGIN_GUIDE.md` - Detailed login guide
- `WINDOWS_STARTUP.md` - System startup instructions
- `register-test-users.sh` - User registration script
- `API_SERVICES_STATUS.md` - API service details

---

**Status Updated:** 11:56 AM EAT  
**Next Check:** 12:10 PM EAT (after rate limit reset)
