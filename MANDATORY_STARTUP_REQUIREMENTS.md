# 🚀 Mandatory Startup Requirements - Coffee Export Consortium

## Overview
The system requires **3 mandatory infrastructure services** and **7 API services** to run properly.

---

## 🔴 MANDATORY INFRASTRUCTURE SERVICES (Must Run First)

These services are **REQUIRED** for the entire system to function:

### 1. **PostgreSQL Database** (Port 5432)
- **Status:** MANDATORY ✅
- **Purpose:** Central database for all services
- **Database Name:** `coffee_export_db`
- **Credentials:** 
  - User: `postgres`
  - Password: `postgres`
- **Start Command (Docker):**
  ```bash
  docker-compose -f docker-compose.postgres.yml up postgres
  ```
- **Start Command (Native):**
  ```bash
  sudo systemctl start postgresql
  ```
- **Verify:**
  ```bash
  psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"
  ```

### 2. **Redis Cache** (Port 6379)
- **Status:** MANDATORY ✅
- **Purpose:** Caching and session management
- **Start Command (Docker):**
  ```bash
  docker-compose -f docker-compose.postgres.yml up redis
  ```
- **Start Command (Native):**
  ```bash
  sudo systemctl start redis-server
  ```
- **Verify:**
  ```bash
  redis-cli ping
  # Should return: PONG
  ```

### 3. **IPFS Node** (Port 5001)
- **Status:** OPTIONAL (for document storage)
- **Purpose:** Distributed document storage
- **Start Command (Docker):**
  ```bash
  docker-compose -f docker-compose.postgres.yml up ipfs
  ```
- **Verify:**
  ```bash
  curl http://localhost:5001/api/v0/id
  ```

---

## 🟢 MANDATORY API SERVICES (7 Total)

All 7 API services must be running for the system to work properly:

| # | Service | Port | MSP ID | Status |
|---|---------|------|--------|--------|
| 1 | Commercial Bank | 3001 | CommercialBankMSP | ✅ REQUIRED |
| 2 | National Bank | 3002 | NationalBankMSP | ✅ REQUIRED |
| 3 | ECTA | 3003 | ECTAMSP | ✅ REQUIRED |
| 4 | Shipping Line | 3004 | ShippingLineMSP | ✅ REQUIRED |
| 5 | Custom Authorities | 3005 | CustomAuthoritiesMSP | ✅ REQUIRED |
| 6 | ECX | 3006 | ECXMSP | ✅ REQUIRED |
| 7 | Exporter Portal | 3007 | CommercialBankMSP | ✅ REQUIRED |

---

## 📋 STARTUP SEQUENCE

### Step 1: Start Infrastructure Services (5 minutes)

**Option A: Using Docker (Recommended)**
```bash
# Start all infrastructure services
docker-compose -f docker-compose.postgres.yml up -d

# Verify all are running
docker-compose -f docker-compose.postgres.yml ps
```

**Option B: Using Native Services**
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Start Redis
sudo systemctl start redis-server

# Verify
sudo systemctl status postgresql
sudo systemctl status redis-server
```

### Step 2: Verify Infrastructure (2 minutes)

```bash
# Check PostgreSQL
psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"

# Check Redis
redis-cli ping

# Check IPFS (optional)
curl http://localhost:5001/api/v0/id
```

### Step 3: Start All 7 API Services (10 minutes)

**Option A: Using Docker (Recommended)**
```bash
# Start all API services
docker-compose -f docker-compose.apis.yml up -d

# View logs
docker-compose -f docker-compose.apis.yml logs -f

# Verify all running
docker-compose -f docker-compose.apis.yml ps
```

**Option B: Using 7 Separate Terminals**

Terminal 1 - Commercial Bank (3001):
```bash
cd /home/gu-da/cbc/api/commercial-bank && npm run dev
```

Terminal 2 - National Bank (3002):
```bash
cd /home/gu-da/cbc/api/national-bank && npm run dev
```

Terminal 3 - ECTA (3003):
```bash
cd /home/gu-da/cbc/api/ecta && npm run dev
```

Terminal 4 - Shipping Line (3004):
```bash
cd /home/gu-da/cbc/api/shipping-line && npm run dev
```

Terminal 5 - Custom Authorities (3005):
```bash
cd /home/gu-da/cbc/api/custom-authorities && npm run dev
```

Terminal 6 - ECX (3006):
```bash
cd /home/gu-da/cbc/api/ecx && npm run dev
```

Terminal 7 - Exporter Portal (3007):
```bash
cd /home/gu-da/cbc/api/exporter-portal && npm run dev
```

### Step 4: Verify All Services Running (2 minutes)

```bash
# Check all ports are listening
netstat -tuln | grep -E '300[1-7]|5432|6379'

# Or test each service
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
curl http://localhost:3006/health
curl http://localhost:3007/health
```

---

## 🎯 QUICK START COMMANDS

### Start Everything (Docker - Recommended)
```bash
# Start infrastructure
docker-compose -f docker-compose.postgres.yml up -d

# Wait 30 seconds for services to initialize
sleep 30

# Start all APIs
docker-compose -f docker-compose.apis.yml up -d

# Verify
docker-compose -f docker-compose.apis.yml ps
```

### Stop Everything
```bash
# Stop APIs
docker-compose -f docker-compose.apis.yml down

# Stop infrastructure
docker-compose -f docker-compose.postgres.yml down
```

### View Logs
```bash
# View all API logs
docker-compose -f docker-compose.apis.yml logs -f

# View specific service logs
docker-compose -f docker-compose.apis.yml logs -f commercial-bank

# View infrastructure logs
docker-compose -f docker-compose.postgres.yml logs -f
```

---

## ✅ VERIFICATION CHECKLIST

### Infrastructure Services
- [ ] PostgreSQL running on port 5432
- [ ] Redis running on port 6379
- [ ] IPFS running on port 5001 (optional)
- [ ] Database `coffee_export_db` exists
- [ ] Can connect to database: `psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"`
- [ ] Redis responds to ping: `redis-cli ping`

### API Services
- [ ] Commercial Bank (3001) responding: `curl http://localhost:3001/health`
- [ ] National Bank (3002) responding: `curl http://localhost:3002/health`
- [ ] ECTA (3003) responding: `curl http://localhost:3003/health`
- [ ] Shipping Line (3004) responding: `curl http://localhost:3004/health`
- [ ] Custom Authorities (3005) responding: `curl http://localhost:3005/health`
- [ ] ECX (3006) responding: `curl http://localhost:3006/health`
- [ ] Exporter Portal (3007) responding: `curl http://localhost:3007/health`

### System Status
- [ ] All 7 API services running
- [ ] All services connected to database
- [ ] All services connected to Redis
- [ ] No port conflicts
- [ ] No database connection errors

---

## 🔧 TROUBLESHOOTING

### PostgreSQL Won't Start
```bash
# Check if already running
sudo systemctl status postgresql

# Start it
sudo systemctl start postgresql

# Check logs
sudo journalctl -u postgresql -f

# Or with Docker
docker-compose -f docker-compose.postgres.yml up postgres
```

### Redis Won't Start
```bash
# Check if already running
sudo systemctl status redis-server

# Start it
sudo systemctl start redis-server

# Check logs
sudo journalctl -u redis-server -f

# Or with Docker
docker-compose -f docker-compose.postgres.yml up redis
```

### API Service Won't Start
```bash
# Check dependencies installed
cd /home/gu-da/cbc/api/[service-name]
npm install --legacy-peer-deps

# Check .env file exists
ls -la .env

# Check port is not in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>

# Try starting again
npm run dev
```

### Port Already in Use
```bash
# Find what's using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3008
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -h localhost -U postgres -l | grep coffee_export_db

# Create if missing
psql -h localhost -U postgres -c "CREATE DATABASE coffee_export_db;"

# Check connection
psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"
```

---

## 📊 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Port 5173)                      │
│                   (React/Vite Application)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Commercial   │  │  National    │  │    ECTA      │
│ Bank API     │  │  Bank API    │  │    API       │
│ (3001)       │  │  (3002)      │  │  (3003)      │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        ├──���─────────────┼────────────────┤
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Shipping    │  │   Custom     │  │     ECX      │
│  Line API    │  │ Authorities  │  │     API      │
│  (3004)      │  │   API (3005) │  │   (3006)     │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │    IPFS      │
│  Database    │  │    Cache     │  │   Storage    │
│  (5432)      │  │  (6379)      │  │  (5001)      │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📝 CONFIGURATION FILES

| Service | .env File | Port |
|---------|-----------|------|
| Commercial Bank | `/api/commercial-bank/.env` | 3001 |
| National Bank | `/api/national-bank/.env` | 3002 |
| ECTA | `/api/ecta/.env` | 3003 |
| Shipping Line | `/api/shipping-line/.env` | 3004 |
| Custom Authorities | `/api/custom-authorities/.env` | 3005 |
| ECX | `/api/ecx/.env` | 3006 |
| Exporter Portal | `/api/exporter-portal/.env` | 3007 |

---

## 🎓 WHAT EACH SERVICE DOES

### 1. **Commercial Bank API** (3001)
- Manages export financing
- Handles LC (Letter of Credit) issuance
- Manages payment approvals

### 2. **National Bank API** (3002)
- Manages foreign exchange (FX) approvals
- Handles currency conversion
- Manages national banking regulations

### 3. **ECTA API** (3003)
- Manages exporter pre-registration
- Handles document verification
- Manages export licenses

### 4. **Shipping Line API** (3004)
- Manages shipping arrangements
- Handles bill of lading
- Manages cargo tracking

### 5. **Custom Authorities API** (3005)
- Manages customs clearance
- Handles export permits
- Manages duty calculations

### 6. **ECX API** (3006)
- Manages Ethiopian Commodity Exchange lot verification
- Handles warehouse receipts
- Manages coffee lot verification

### 7. **Exporter Portal API** (3007)
- Provides exporter-facing interface
- Manages export requests
- Handles document uploads

---

## 🚀 NEXT STEPS

1. **Start Infrastructure Services**
   ```bash
   docker-compose -f docker-compose.postgres.yml up -d
   ```

2. **Verify Infrastructure**
   ```bash
   docker-compose -f docker-compose.postgres.yml ps
   ```

3. **Start API Services**
   ```bash
   docker-compose -f docker-compose.apis.yml up -d
   ```

4. **Verify All Services**
   ```bash
   docker-compose -f docker-compose.apis.yml ps
   ```

5. **Access Frontend** (if running)
   ```
   http://localhost:5173
   ```

6. **View API Documentation**
   ```
   http://localhost:3001/api-docs
   http://localhost:3002/api-docs
   http://localhost:3003/api-docs
   http://localhost:3004/api-docs
   http://localhost:3005/api-docs
   http://localhost:3006/api-docs
   http://localhost:3007/api-docs
   ```

---

## 📞 SUPPORT

For issues or questions:
1. Check logs: `docker-compose -f docker-compose.apis.yml logs -f`
2. Verify database: `psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1;"`
3. Check Redis: `redis-cli ping`
4. Review configuration files in `/api/*/`

---

**Status:** ✅ System Ready to Start
**Last Updated:** 2025-12-17
**Version:** 1.0.0
