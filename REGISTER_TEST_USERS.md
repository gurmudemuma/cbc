# ✅ Registering Test Users - Complete Guide

## 🎯 Issue Fixed

The PEER_ENDPOINT ports in `.env` files were incorrect. Now fixed:

| Organization | Port Before | Port After | Status |
|--------------|-------------|------------|--------|
| commercialbank | 7051 ✅ | 7051 ✅ | Already correct |
| National Bank | 7051 ❌ | 8051 ✅ | **FIXED** |
| ECTA | 7051 ❌ | 9051 ✅ | **FIXED** |
| Shipping Line | 7051 ❌ | 10051 ✅ | **FIXED** |
| Custom Authorities | 11051 ✅ | 11051 ✅ | Already correct |

---

## 👥 Test User Credentials

### commercialbank:
```
Username: exporter1
Password: Exporter123!@#
API: http://localhost:3001
```

### National Bank:
```
Username: banker1
Password: Banker123!@#
API: http://localhost:3002
```

### ECTA:
```
Username: inspector1
Password: Inspector123!@#
API: http://localhost:3003
```

### Shipping Line:
```
Username: shipper1
Password: Shipper123!@#
API: http://localhost:3004
```

### Custom Authorities:
```
Username: custom1
Password: Custom123!@#
API: http://localhost:3005
```

---

## 🚀 Quick Registration Script

Save this as `/home/gu-da/cbc/scripts/register-test-users.sh`:

```bash
#!/bin/bash

echo "🔐 Registering Test Users for Coffee Export Blockchain"
echo "========================================================"
echo ""

# commercialbank
echo "1️⃣  Registering exporter1 in commercialbank..."
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter1",
    "password": "Exporter123!@#",
    "email": "exporter1@commercialbank.com",
    "organizationId": "commercialbank",
    "role": "exporter"
  }' | jq -r 'if .success then "✅ exporter1 registered" else "❌ Failed: " + .message end'

sleep 1

# National Bank
echo "2️⃣  Registering banker1 in National Bank..."
curl -s -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "banker1",
    "password": "Banker123!@#",
    "email": "banker1@nationalbank.com",
    "organizationId": "nationalbank",
    "role": "banker"
  }' | jq -r 'if .success then "✅ banker1 registered" else "❌ Failed: " + .message end'

sleep 1

# ECTA
echo "3️⃣  Registering inspector1 in ECTA..."
curl -s -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "inspector1",
    "password": "Inspector123!@#",
    "email": "inspector1@ncat.go.tz",
    "organizationId": "ncat",
    "role": "inspector"
  }' | jq -r 'if .success then "✅ inspector1 registered" else "❌ Failed: " + .message end'

sleep 1

# Shipping Line
echo "4️⃣  Registering shipper1 in Shipping Line..."
curl -s -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "shipper1",
    "password": "Shipper123!@#",
    "email": "shipper1@shippingline.com",
    "organizationId": "shippingline",
    "role": "shipper"
  }' | jq -r 'if .success then "✅ shipper1 registered" else "❌ Failed: " + .message end'

sleep 1

# Custom Authorities
echo "5️⃣  Registering custom1 in Custom Authorities..."
curl -s -X POST http://localhost:3005/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "custom1",
    "password": "Custom123!@#",
    "email": "custom1@customs.go.tz",
    "organizationId": "customauthorities",
    "role": "customs_officer"
  }' | jq -r 'if .success then "✅ custom1 registered" else "❌ Failed: " + .message end'

echo ""
echo "✅ Test user registration completed!"
echo ""
echo "You can now login with these credentials at http://localhost:5173"
```

---

## 📝 Manual Registration Commands

If you prefer to register manually:

### commercialbank (exporter1)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter1",
    "password": "Exporter123!@#",
    "email": "exporter1@commercialbank.com",
    "organizationId": "commercialbank",
    "role": "exporter"
  }'
```

### National Bank (banker1)
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "banker1",
    "password": "Banker123!@#",
    "email": "banker1@nationalbank.com",
    "organizationId": "nationalbank",
    "role": "banker"
  }'
```

### ECTA (inspector1)
```bash
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "inspector1",
    "password": "Inspector123!@#",
    "email": "inspector1@ncat.go.tz",
    "organizationId": "ncat",
    "role": "inspector"
  }'
```

### Shipping Line (shipper1)
```bash
curl -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "shipper1",
    "password": "Shipper123!@#",
    "email": "shipper1@shippingline.com",
    "organizationId": "shippingline",
    "role": "shipper"
  }'
```

### Custom Authorities (custom1)
```bash
curl -X POST http://localhost:3005/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "custom1",
    "password": "Custom123!@#",
    "email": "custom1@customs.go.tz",
    "organizationId": "customauthorities",
    "role": "customs_officer"
  }'
```

---

## ✅ Verification

After registration, verify each user can login:

```bash
# Login as exporter1
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"exporter1","password":"Exporter123!@#"}'

# Should return: {"success":true,"token":"...","user":{...}}
```

---

## 🎉 System is Ready!

After registering these test users, you can:

1. **Start the Frontend**
   ```bash
   cd /home/gu-da/cbc/frontend
   npm run dev
   ```

2. **Access the application** at http://localhost:5173

3. **Login with any test user** using the credentials above

4. **Create export requests, upload documents, track shipments!**

---

**All systems operational!** ✅
