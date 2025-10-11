# Starting the Coffee Export Consortium Services

## ✅ Prerequisites Complete

- ✅ All dependencies installed
- ✅ Environment files created (.env)
- ✅ Missing dependencies (isomorphic-dompurify, multer) added
- ✅ Services ready to start

---

## 🚀 Starting Services

### Method 1: Start All Services (Separate Terminals)

Open **4 separate terminal windows** in VSCode or your terminal app:

**Terminal 1 - Exporter Bank (Port 3001):**
```bash
cd /c/cbc/api/exporter-bank
npm run dev
```

**Terminal 2 - National Bank (Port 3002):**
```bash
cd /c/cbc/api/national-bank
npm run dev
```

**Terminal 3 - NCAT (Port 3003):**
```bash
cd /c/cbc/api/ncat
npm run dev
```

**Terminal 4 - Shipping Line (Port 3004):**
```bash
cd /c/cbc/api/shipping-line
npm run dev
```

---

### Method 2: Start One at a Time (Testing)

Start with exporter-bank to verify everything works:

```bash
cd /c/cbc/api/exporter-bank
npm run dev
```

**Expected Output:**
```
[INFO] ts-node-dev ver. 2.0.0 (using ts-node ver. 10.9.2, typescript ver. 5.9.3)

Environment Configuration Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Environment: development
  Port: 3001
  Organization: ExporterBank (exporterbank)
  MSP ID: ExporterBankMSP
  Channel: coffeechannel
  Chaincode Export: coffee-export
  Chaincode User: user-management
  WebSocket: Enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Environment validation successful

============================================================
  Exporter Bank API server running
============================================================
   Port: 3001
   Environment: development
   Organization: ExporterBank
   WebSocket: Enabled
============================================================

  Connecting to Hyperledger Fabric network...
```

---

## ⚠️ Important: Fabric Network Required

The services will try to connect to Hyperledger Fabric. If you see:

```
❌ Failed to connect to Fabric network
   Connection profile not found at ../../network/...
```

**This means the Fabric network is not running or not set up yet.**

### Options:

#### Option A: Start Without Fabric (API Only Mode)
If you just want to test the API server without blockchain:
1. Services will start but show connection errors
2. Some endpoints will work, others won't
3. Health endpoint will show `fabric: "disconnected"`

#### Option B: Set Up Fabric Network First
You need to:
1. Navigate to `/c/cbc/network` directory
2. Run the Fabric network startup script
3. Ensure peer containers are running (`docker ps`)

---

## 🧪 Verify Services are Running

### Check Health Endpoints

Once a service starts, verify it's healthy:

```bash
# Exporter Bank
curl http://localhost:3001/health

# National Bank
curl http://localhost:3002/health

# NCAT
curl http://localhost:3003/health

# Shipping Line
curl http://localhost:3004/health
```

**Expected Response (if Fabric is not running):**
```json
{
  "status": "ok",
  "service": "Exporter Bank API",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2025-10-11T07:04:00.000Z",
  "uptime": 15.234,
  "fabric": "disconnected",  ← Shows Fabric is not connected
  "memory": {
    "used": 42,
    "total": 128,
    "unit": "MB"
  }
}
```

**Expected Response (with Fabric running):**
```json
{
  "status": "ok",
  "service": "Exporter Bank API",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2025-10-11T07:04:00.000Z",
  "uptime": 15.234,
  "fabric": "connected",  ← Fabric is connected!
  "memory": {
    "used": 48,
    "total": 128,
    "unit": "MB"
  }
}
```

---

## 📊 Service Ports Summary

| Service | Port | Dev URL | Health Check |
|---------|------|---------|--------------|
| Exporter Bank | 3001 | http://localhost:3001 | http://localhost:3001/health |
| National Bank | 3002 | http://localhost:3002 | http://localhost:3002/health |
| NCAT | 3003 | http://localhost:3003 | http://localhost:3003/health |
| Shipping Line | 3004 | http://localhost:3004 | http://localhost:3004/health |

---

## 🛑 Stopping Services

To stop a service:
- Press `Ctrl+C` in the terminal running the service

To restart after changes:
- The services run with `ts-node-dev` which auto-reloads on file changes
- No need to manually restart during development

---

## 🐛 Troubleshooting

### Service won't start - "Port already in use"
**Solution:** Kill the process using that port or change PORT in .env

```bash
# Find process on port
netstat -ano | findstr :3001

# Kill it (replace PID)
taskkill /PID <pid> /F
```

### Service starts but crashes immediately
**Solution:** Check the console output for errors. Common issues:
- Missing environment variables
- Invalid paths in .env
- Typos in configuration

### "Cannot find module X"
**Solution:** Run `npm install` in that service directory

### Fabric connection fails
**Solution:** This is expected if Fabric network isn't running. The service will still start but some features won't work.

---

## ✅ Success Indicators

Your services are ready when you see:

1. ✅ **Environment validation successful** message
2. ✅ **Server running** banner with port number  
3. ✅ **No crash** - service stays running
4. ✅ **Health endpoint** responds with 200 OK

---

## 🎯 Next Steps

After services are running:

1. **Test API endpoints** with Postman or curl
2. **Start the frontend** (if available)
3. **Set up Fabric network** (for full functionality)
4. **Register test users** via API
5. **Create test export requests**

---

## 📝 Notes

- Services use environment variables from `.env` files
- Development mode has auto-reload enabled
- Console logs show all requests in development
- JWT secrets in .env are for development only
- Change them in production!

---

**Ready to start?** Open your first terminal and run the exporter-bank service!
