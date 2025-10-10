# ⚡ Quick Start Guide

## Coffee Export Consortium Blockchain

**Get the system running in 5 minutes!**

---

## 🚀 One-Command Startup (Recommended)

### Prerequisites
- Docker, Node.js 16+, Go 1.19+, Fabric binaries installed

### Start Everything

```bash
# Terminal 1: Start Blockchain
cd /home/gu-da/CBC/network
./network.sh up && ./network.sh createChannel && ./network.sh deployCC

# Terminal 2: Start Exporter Bank API
cd /home/gu-da/CBC/api/exporter-bank && npm install && npm run dev

# Terminal 3: Start National Bank API
cd /home/gu-da/CBC/api/national-bank && npm install && npm run dev

# Terminal 4: Start NCAT API
cd /home/gu-da/CBC/api/ncat && npm install && npm run dev

# Terminal 5: Start Shipping Line API
cd /home/gu-da/CBC/api/shipping-line && npm install && npm run dev

# Terminal 6: Start Frontend
cd /home/gu-da/CBC/frontend && npm install && npm run dev
```

---

## 🎯 Access the Application

Open browser: **http://localhost:5173**

---

## 👥 Test Users

Create users with these commands:

```bash
# Exporter Bank User
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"exporter1","password":"password123","email":"exporter1@bank.com"}'

# National Bank User
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"banker1","password":"password123","email":"banker1@nationalbank.com"}'

# NCAT User
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"inspector1","password":"password123","email":"inspector1@ncat.gov"}'

# Shipping Line User
curl -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"shipper1","password":"password123","email":"shipper1@shipping.com"}'
```

---

## 🧪 Test Workflow

### 1. Create Export (Exporter Bank)
- Login: Organization=**Exporter Bank**, User=`exporter1`, Pass=`password123`
- Go to **Export Management** → **Create Export**
- Fill form and submit

### 2. Approve FX (National Bank)
- Logout and login: Organization=**National Bank**, User=`banker1`
- Go to **FX Approval** → Find export → **Approve**

### 3. Certify Quality (NCAT)
- Logout and login: Organization=**NCAT**, User=`inspector1`
- Go to **Quality Certification** → Find export → **Certify**

### 4. Schedule Shipment (Shipping Line)
- Logout and login: Organization=**Shipping Line**, User=`shipper1`
- Go to **Shipment Tracking** → Find export → **Schedule**

### 5. Confirm Shipment (Shipping Line)
- Find scheduled export → **Confirm**

### 6. Complete Export (Exporter Bank)
- Logout and login: Organization=**Exporter Bank**, User=`exporter1`
- Go to **Export Management** → Click export → **Complete Export**

---

## 🛑 Stop Everything

```bash
# Stop Frontend & APIs: Press Ctrl+C in each terminal

# Stop Blockchain
cd /home/gu-da/CBC/network
./network.sh down
```

---

## 🔍 Verify System

```bash
# Check blockchain
docker ps

# Check APIs
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

---

## 📊 System Ports

| Service | Port |
|---------|------|
| Frontend | 5173 |
| Exporter Bank API | 3001 |
| National Bank API | 3002 |
| NCAT API | 3003 |
| Shipping Line API | 3004 |

---

## 🐛 Quick Troubleshooting

**Port in use?**
```bash
lsof -i :3001  # Find process
kill -9 <PID>  # Kill it
```

**Network issues?**
```bash
cd /home/gu-da/CBC/network
./network.sh down
./network.sh up
```

**Frontend not loading?**
```bash
cd /home/gu-da/CBC/frontend
rm -rf node_modules
npm install
npm run dev
```

---

## 📚 Full Documentation

- **COMPLETE_SYSTEM_GUIDE.md** - Detailed startup guide
- **FRONTEND_COMPLETE.md** - Frontend documentation
- **ARCHITECTURE.md** - System architecture
- **README.md** - Project overview

---

## ✅ Success Checklist

- [ ] 5 Docker containers running
- [ ] 4 API services responding
- [ ] Frontend loads at localhost:5173
- [ ] Can login with test users
- [ ] Can create an export
- [ ] Can complete full workflow

---

**🎉 You're ready to go! Happy exporting! ☕️**
