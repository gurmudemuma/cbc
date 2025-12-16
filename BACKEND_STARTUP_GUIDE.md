# 🚀 Backend Startup Guide - Complete Instructions

## Overview

The Coffee Blockchain Consortium has **7 microservices** (APIs) that need to be started:

1. **Commercial Bank** (Port 3001)
2. **National Bank** (Port 3002)
3. **ECTA** (Port 3003)
4. **Shipping Line** (Port 3004)
5. **Customs** (Port 3005)
6. **ECX** (Port 3006)
7. **Exporter Portal** (Port 3007)

---

## 📋 Prerequisites

### 1. Check Node.js Installation
```bash
node --version  # Should be v16+
npm --version   # Should be v8+
```

### 2. Check PostgreSQL Running
```bash
psql -U postgres -d coffee_export_db -c "SELECT version();"
```

### 3. Check Blockchain Network Running
```bash
docker ps | grep fabric
```

### 4. Check Redis Running (Optional but recommended)
```bash
redis-cli ping
# Should return: PONG
```

---

## 🚀 Quick Start (All Services)

### Option 1: Start All Services at Once
```bash
cd /home/gu-da/cbc/apis
npm run dev:all
```

**Output**:
```
> cbc-apis@1.0.0 dev:all
> npm run dev --workspaces

commercial-bank@1.0.0 dev
  ✅ Commercial Bank API running on port 3001

national-bank@1.0.0 dev
  ✅ National Bank API running on port 3002

ecta@1.0.0 dev
  ✅ ECTA API running on port 3003

shipping-line@1.0.0 dev
  ✅ Shipping Line API running on port 3004

custom-authorities@1.0.0 dev
  ✅ Customs API running on port 3005

ecx@1.0.0 dev
  ✅ ECX API running on port 3006

exporter-portal@1.0.0 dev
  ✅ Exporter Portal API running on port 3007
```

---

## 🔧 Individual Service Startup

### Start Commercial Bank API
```bash
cd /home/gu-da/cbc/apis/commercial-bank
npm run dev
# Runs on http://localhost:3001
```

### Start National Bank API
```bash
cd /home/gu-da/cbc/apis/national-bank
npm run dev
# Runs on http://localhost:3002
```

### Start ECTA API
```bash
cd /home/gu-da/cbc/apis/ecta
npm run dev
# Runs on http://localhost:3003
```

### Start Shipping Line API
```bash
cd /home/gu-da/cbc/apis/shipping-line
npm run dev
# Runs on http://localhost:3004
```

### Start Customs API
```bash
cd /home/gu-da/cbc/apis/custom-authorities
npm run dev
# Runs on http://localhost:3005
```

### Start ECX API
```bash
cd /home/gu-da/cbc/apis/ecx
npm run dev
# Runs on http://localhost:3006
```

### Start Exporter Portal API
```bash
cd /home/gu-da/cbc/apis/exporter-portal
npm run dev
# Runs on http://localhost:3007
```

---

## 📊 Available NPM Scripts

### Build Commands
```bash
# Build all services
npm run build:all

# Build specific service
cd /home/gu-da/cbc/apis/commercial-bank
npm run build
```

### Start Commands
```bash
# Start all services (production)
npm run start:all

# Start all services (development with hot reload)
npm run dev:all

# Start specific service
cd /home/gu-da/cbc/apis/commercial-bank
npm run start      # Production
npm run dev        # Development
```

### Testing Commands
```bash
# Run all tests
npm run test:all

# Run specific test suite
npm run test:banker
npm run test:nb-regulatory
npm run test:exporter

# Watch mode
npm run test:watch
```

### Linting Commands
```bash
# Lint all services
npm run lint:all

# Lint specific service
cd /home/gu-da/cbc/apis/commercial-bank
npm run lint
```

---

## 🔍 Verify Services Are Running

### Check All Services
```bash
# Check Commercial Bank
curl http://localhost:3001/health

# Check National Bank
curl http://localhost:3002/health

# Check ECTA
curl http://localhost:3003/health

# Check Shipping Line
curl http://localhost:3004/health

# Check Customs
curl http://localhost:3005/health

# Check ECX
curl http://localhost:3006/health

# Check Exporter Portal
curl http://localhost:3007/health
```

### Expected Response
```json
{
  "status": "ok",
  "uptime": 123.456,
  "fabric": "connected",
  "database": "connected",
  "memory": {
    "heapUsed": "45.2 MB",
    "heapTotal": "256 MB"
  }
}
```

---

## 🔗 API Endpoints

### Commercial Bank (3001)
```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/banking/documents
POST   /api/banking/documents/{id}/verify
GET    /api/banking/financing
POST   /api/banking/financing/{id}/approve
GET    /api/banking/exports
```

### National Bank (3002)
```
GET    /api/fx/approvals
POST   /api/fx/approvals/{id}/approve
GET    /api/fx/rates
POST   /api/fx/rates
GET    /api/monetary/policies
```

### ECTA (3003)
```
GET    /api/lots
POST   /api/lots
GET    /api/lots/{id}/verify
POST   /api/preregistration/exporters
GET    /api/preregistration/laboratories
```

### Shipping Line (3004)
```
GET    /api/shipments
POST   /api/shipments
GET    /api/shipments/{id}
POST   /api/shipments/{id}/confirm
```

### Customs (3005)
```
GET    /api/clearance
POST   /api/clearance/{id}/approve
GET    /api/compliance
```

### ECX (3006)
```
GET    /api/trading/active
GET    /api/trading/prices
POST   /api/trading/verify
```

### Exporter Portal (3007)
```
POST   /api/auth/register
GET    /api/exporter/profile
POST   /api/exporter/exports
GET    /api/exporter/exports/{id}
```

---

## 🐳 Docker Startup (Alternative)

### Build Docker Images
```bash
cd /home/gu-da/cbc
docker-compose build
```

### Start All Services with Docker
```bash
docker-compose up -d
```

### Check Running Containers
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f commercial-bank
```

### Stop Services
```bash
docker-compose down
```

---

## 📝 Environment Configuration

### Check Environment Variables
```bash
cat /home/gu-da/cbc/apis/commercial-bank/.env
```

### Required Environment Variables
```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres

# Blockchain
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management
CONNECTION_PROFILE_PATH=/path/to/connection.json

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# API
API_PORT=3001
NODE_ENV=development

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🔧 Troubleshooting

### Issue: Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Issue: Database Connection Failed
```bash
# Check PostgreSQL
psql -U postgres -d coffee_export_db -c "SELECT 1;"

# Check connection string
echo $DATABASE_URL
```

### Issue: Blockchain Connection Failed
```bash
# Check Fabric network
docker ps | grep fabric

# Check channel
docker exec cli peer channel list

# Check chaincode
docker exec cli peer lifecycle chaincode queryinstalled
```

### Issue: Redis Connection Failed
```bash
# Start Redis
redis-server --daemonize yes

# Check Redis
redis-cli ping
```

### Issue: Module Not Found
```bash
# Reinstall dependencies
cd /home/gu-da/cbc/apis
npm install

# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Monitoring

### View Service Logs
```bash
# All services
npm run dev:all 2>&1 | tee api.log

# Specific service
cd /home/gu-da/cbc/apis/commercial-bank
npm run dev 2>&1 | tee commercial-bank.log
```

### Monitor Performance
```bash
# Check memory usage
ps aux | grep node

# Check open ports
netstat -tlnp | grep node

# Check database connections
psql -U postgres -d coffee_export_db -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🚀 Production Deployment

### Build for Production
```bash
cd /home/gu-da/cbc/apis
npm run build:all
```

### Start in Production
```bash
npm run start:all
```

### Use Process Manager (PM2)
```bash
# Install PM2
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs
```

---

## ✅ Startup Checklist

- [ ] Node.js v16+ installed
- [ ] PostgreSQL running and accessible
- [ ] Blockchain network running
- [ ] Redis running (optional)
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Database migrations applied
- [ ] Test users created
- [ ] All services started
- [ ] Health checks passing

---

## 🎯 Quick Reference

### Start Everything
```bash
cd /home/gu-da/cbc/apis
npm run dev:all
```

### Check All Services
```bash
for port in 3001 3002 3003 3004 3005 3006 3007; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq .
done
```

### Stop All Services
```bash
# Press Ctrl+C in terminal running npm run dev:all
# Or kill all node processes
pkill -f "node"
```

---

## 📚 Documentation

- **API Documentation**: http://localhost:3001/api-docs (Swagger)
- **Health Check**: http://localhost:3001/health
- **Ready Check**: http://localhost:3001/ready

---

## 🎉 Success Indicators

✅ All 7 services running on ports 3001-3007
✅ Health checks returning 200 OK
✅ Database connections active
✅ Blockchain connected
✅ Ready for frontend login

---

**Status**: Ready to Start Backend

**Next**: Run `npm run dev:all` in `/home/gu-da/cbc/apis`
