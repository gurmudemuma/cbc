# 🔄 Final Clean Restart Instructions

## ✅ All Fixes Applied

All issues have been identified and fixed:

1. ✅ **Docker Compose V2 syntax** - Fixed in `network.sh`
2. ✅ **Crypto generation** - Fixed in `start-system.sh`  
3. ✅ **Chaincode verification** - Fixed in `start-system.sh`
4. ✅ **Peer endpoint ports** - Fixed in API `.env` files
5. ✅ **JSON escaping in registration** - Fixed in `register-test-users.sh`

## 🎯 Recommended: Complete Clean Restart

To ensure a completely fresh and working system:

```bash
cd ~/cbc

# Stop everything
pkill -f "npm run dev"
pkill -f "ipfs daemon"  
cd network
docker compose -f docker/docker-compose.yaml down -v

# Clean restart with all fixes
cd ~/cbc
./start-system.sh --clean
```

This will:
- ✅ Generate fresh crypto material  
- ✅ Start network with correct docker compose syntax
- ✅ Deploy chaincodes to all peers properly
- ✅ Start APIs with correct peer endpoints
- ✅ Register test users automatically

## 📋 Test User Credentials

After the clean restart, use these credentials:

**commercialbank:**
- Username: `exporter1`
- Password: `Exporter123!@#`
- API: http://localhost:3001

**National Bank:**
- Username: `banker1`
- Password: `Banker123!@#`
- API: http://localhost:3002

**ECTA:**
- Username: `inspector1`
- Password: `Inspector123!@#`
- API: http://localhost:3003

**Shipping Line:**
- Username: `shipper1`  
- Password: `Shipper123!@#`
- API: http://localhost:3004

**Custom Authorities:**
- Username: `custom1`
- Password: `Custom123!@#`
- API: http://localhost:3005

## 🚀 After Successful Startup

```bash
# Start the frontend
cd ~/cbc/frontend
npm run dev
```

Access at: **http://localhost:5173**

---

**All fixes are in place. A clean restart will give you a fully operational system!** ✅
