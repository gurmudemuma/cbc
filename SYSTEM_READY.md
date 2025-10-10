# ✅ Coffee Export System - Ready to Start

## 🎉 System Status

The blockchain network has been successfully configured and is ready to use!

### ✅ Completed:
- ✅ Blockchain network is running
- ✅ Channel "coffeechannel" created
- ✅ Chaincode `coffee-export` deployed
- ✅ Chaincode `user-management` deployed
- ✅ Connection profiles generated
- ✅ Admin users enrolled

### 🔄 Next Steps - Start Services:

## 1️⃣ Start API Services

**Open 4 separate terminal windows** and run these commands:

### Terminal 1 - Exporter Bank API
```bash
cd /home/gu-da/CBC/api/exporter-bank
npm run dev
```
**Expected:** `🚀 Exporter Bank API server running on port 3001`

### Terminal 2 - National Bank API
```bash
cd /home/gu-da/CBC/api/national-bank
npm run dev
```
**Expected:** `🚀 National Bank API server running on port 3002`

### Terminal 3 - NCAT API
```bash
cd /home/gu-da/CBC/api/ncat
npm run dev
```
**Expected:** `🚀 NCAT API server running on port 3003`

### Terminal 4 - Shipping Line API
```bash
cd /home/gu-da/CBC/api/shipping-line
npm run dev
```
**Expected:** `🚀 Shipping Line API server running on port 3004`

---

## 2️⃣ Start Frontend

**Open a 5th terminal window:**

```bash
cd /home/gu-da/CBC/frontend
npm run dev
```

**Expected:** Frontend will be available at **http://localhost:5173**

---

## 3️⃣ Register Test Users

After all APIs are running, register users with these commands:

```bash
# Exporter Bank User
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"exporter1","password":"Password123","email":"exporter1@bank.com"}'

# National Bank User
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"banker1","password":"Password123","email":"banker1@nationalbank.com"}'

# NCAT User
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"inspector1","password":"Password123","email":"inspector1@ncat.gov"}'

# Shipping Line User
curl -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"shipper1","password":"Password123","email":"shipper1@shipping.com"}'
```

---

## 🔐 Login Credentials

After registration, use these credentials to login:

| Organization | Username | Password | Email |
|-------------|----------|----------|-------|
| **Exporter Bank** | `exporter1` | `Password123` | exporter1@bank.com |
| **National Bank** | `banker1` | `Password123` | banker1@nationalbank.com |
| **NCAT** | `inspector1` | `Password123` | inspector1@ncat.gov |
| **Shipping Line** | `shipper1` | `Password123` | shipper1@shipping.com |

---

## 🌐 Access Points

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Exporter Bank API** | http://localhost:3001 |
| **National Bank API** | http://localhost:3002 |
| **NCAT API** | http://localhost:3003 |
| **Shipping Line API** | http://localhost:3004 |

---

## ✅ Verify System

### Check Blockchain Network:
```bash
docker ps
```
**Expected:** 6 containers running (orderer, 4 peers, cli)

### Check API Health:
```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

### Check Frontend:
Open browser: **http://localhost:5173**

---

## 🎯 Quick Test Workflow

1. **Open Frontend:** http://localhost:5173
2. **Select Organization:** Exporter Bank
3. **Login:** Username: `exporter1`, Password: `Password123`
4. **Create Export:** Go to Export Management → Create New Export
5. **Switch Organizations:** Logout and login as different users to approve/certify/ship

---

## 🛑 Stop System

### Stop API Services:
Press `Ctrl+C` in each terminal running an API

### Stop Frontend:
Press `Ctrl+C` in the frontend terminal

### Stop Blockchain:
```bash
cd /home/gu-da/CBC/network
./network.sh down
```

---

## 🔄 Restart System (After First Setup)

If you need to restart after stopping:

```bash
# 1. Start blockchain network
cd /home/gu-da/CBC/network
./network.sh up

# 2. Start APIs (in separate terminals)
cd /home/gu-da/CBC/api/exporter-bank && npm run dev
cd /home/gu-da/CBC/api/national-bank && npm run dev
cd /home/gu-da/CBC/api/ncat && npm run dev
cd /home/gu-da/CBC/api/shipping-line && npm run dev

# 3. Start frontend
cd /home/gu-da/CBC/frontend && npm run dev
```

**Note:** Users are stored on the blockchain, so you don't need to re-register them after restart.

---

## 📝 Important Notes

### Password Requirements:
- Must contain at least one **uppercase** letter
- Must contain at least one **lowercase** letter
- Must contain at least one **number**
- Example: `Password123` ✅

### Cross-Service Authentication:
- Users registered in one service can login to **any** service
- User data is stored on the blockchain
- All services share the same user database

### Blockchain Features:
- **Immutable:** All transactions are permanent
- **Transparent:** All organizations can view transactions
- **Secure:** Cryptographically signed and verified
- **Distributed:** No single point of failure

---

## 🎉 System is Ready!

Everything is configured and ready to use. Just start the API services and frontend, register users, and you're good to go!

**Happy Exporting! ☕️**

---

**Last Updated:** October 8, 2025
**Status:** ✅ Ready for Use
