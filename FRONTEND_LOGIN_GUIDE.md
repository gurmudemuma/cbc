# Frontend Login Guide

## 🚀 Starting the Frontend

The frontend uses **Vite + React** and connects to multiple API services via proxy.

### Quick Start

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

## 🔐 Login System

### How It Works

1. **Multi-Organization Login**: Users select their organization before logging in
2. **API Routing**: Frontend proxies requests to the appropriate API based on organization
3. **JWT Authentication**: Secure token-based authentication
4. **Persistent Sessions**: Auth state stored in localStorage

### Available Organizations

- **Exporter Bank** → API Port 3001
- **National Bank** → API Port 3002
- **NCAT** → API Port 3003
- **Shipping Line** → API Port 3004

---

## 👤 Creating Test Users

Since the system uses blockchain for user management, you need to **register users first**.

### Method 1: Via Frontend

1. Open http://localhost:5173/login
2. Select organization
3. Click "Register" (if registration UI exists)
4. Fill in credentials
5. Login with the new credentials

### Method 2: Via API (cURL)

**Register Exporter Bank User:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter_admin",
    "password": "ExporterPass123!",
    "email": "admin@exporterbank.com",
    "organizationId": "EXPORTER-BANK-001",
    "role": "exporter"
  }'
```

**Register National Bank User:**
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bank_admin",
    "password": "BankPass123!",
    "email": "admin@nationalbank.com",
    "organizationId": "NATIONAL-BANK-001",
    "role": "banker"
  }'
```

**Register NCAT User:**
```bash
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ncat_officer",
    "password": "NcatPass123!",
    "email": "officer@ncat.gov",
    "organizationId": "NCAT-001",
    "role": "inspector"
  }'
```

**Register Shipping Line User:**
```bash
curl -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "shipping_admin",
    "password": "ShipPass123!",
    "email": "admin@shipping.com",
    "organizationId": "SHIPPING-001",
    "role": "shipper"
  }'
```

### Method 3: Via Postman/Thunder Client

Import the Postman collection from `postman-collection.json` and use the registration endpoints.

---

## 🧪 Test Credentials (After Registration)

Once registered, use these credentials to login:

| Organization | Username | Password |
|-------------|----------|----------|
| Exporter Bank | exporter_admin | ExporterPass@2024! |
| National Bank | bank_admin | BankPass@2024! |
| NCAT | ncat_officer | NcatPass@2024! |
| Shipping Line | shipping_admin | ShipPass@2024! |

---

## 🔧 Password Requirements

Passwords must meet these criteria:
- ✅ At least 8 characters
- ✅ Contains uppercase letter
- ✅ Contains lowercase letter
- ✅ Contains number
- ✅ Contains special character (!@#$%^&*)

---

## 🐛 Troubleshooting Login

### "Cannot connect to API"
- Ensure all API services are running (ports 3001-3004)
- Check `npm run dev` output for errors

### "Invalid credentials"
- Verify user is registered for the selected organization
- Check password meets requirements
- Ensure API service for that organization is running

### "Network Error"
- Check Vite proxy configuration in `vite.config.js`
- Ensure APIs are accessible at localhost:300X

### Registration fails
- Check API logs for errors
- Ensure blockchain network is running
- Verify chaincode is deployed

---

## 📝 API Proxy Configuration

The frontend uses Vite's proxy to route API calls:

```javascript
// vite.config.js
proxy: {
  '/api/exporter': { target: 'http://localhost:3001' },
  '/api/nationalbank': { target: 'http://localhost:3002' },
  '/api/ncat': { target: 'http://localhost:3003' },
  '/api/shipping': { target: 'http://localhost:3004' }
}
```

This means frontend calls `/api/exporter/auth/login` which proxies to `http://localhost:3001/api/auth/login`.

---

## ✅ Verification Steps

1. **Start all services**:
   ```bash
   # Terminal 1-4: APIs
   cd api/exporter-bank && npm run dev
   cd api/national-bank && npm run dev
   cd api/ncat && npm run dev
   cd api/shipping-line && npm run dev
   
   # Terminal 5: Frontend
   cd frontend && npm run dev
   ```

2. **Register a user** (using cURL or Postman)

3. **Open browser**: http://localhost:5173

4. **Login** with registered credentials

5. **Verify dashboard loads** successfully

---

## 🎯 Next Steps After Login

Once logged in, you should see:
- Dashboard with organization-specific metrics
- Navigation menu with available features
- User profile in header

Available features vary by organization:
- **Exporter Bank**: Export management, documents
- **National Bank**: FX rates, payment processing
- **NCAT**: Quality certification, inspections
- **Shipping Line**: Shipment tracking, logistics

---

## 📚 Related Documentation

- `API_SERVICES_STATUS.md` - API service details
- `WINDOWS_STARTUP.md` - System startup guide
- `COMPLETE_STARTUP_GUIDE.md` - Full setup instructions
