# Start All APIs - Summary

## 🚀 Quick Start

You now have **3 ways** to start all 7 API services:

### 1️⃣ **Bash Script (Linux/macOS)** ⭐ RECOMMENDED
```bash
./start-all-apis.sh
```

### 2️⃣ **Batch Script (Windows)**
```cmd
start-all-apis.bat
```

### 3️⃣ **Docker Compose**
```bash
docker-compose -f docker-compose.apis.yml up
```

---

## 📋 What Gets Started

| Service | Port | Status |
|---------|------|--------|
| Commercial Bank API | 3001 | ✅ |
| Custom Authorities API | 3002 | ✅ |
| ECTA API | 3003 | ✅ |
| Exporter Portal API | 3004 | ✅ |
| National Bank API | 3005 | ✅ |
| ECX API | 3006 | ✅ |
| Shipping Line API | 3007 | ✅ |

---

## 📁 Files Created

### Scripts
- ✅ `start-all-apis.sh` - Bash script for Linux/macOS (16KB)
- ✅ `start-all-apis.bat` - Batch script for Windows
- ✅ `docker-compose.apis.yml` - Docker Compose configuration

### Documentation
- ✅ `START_ALL_APIS_GUIDE.md` - Comprehensive guide
- ✅ `START_ALL_APIS_SUMMARY.md` - This file

---

## 🎯 Bash Script Commands

```bash
# Start all services
./start-all-apis.sh

# Check prerequisites
./start-all-apis.sh --check

# View service status
./start-all-apis.sh --status

# View logs
./start-all-apis.sh --logs

# Tail logs in real-time
./start-all-apis.sh --tail

# Check service health
./start-all-apis.sh --health

# Stop all services
./start-all-apis.sh --stop

# Restart all services
./start-all-apis.sh --restart

# Show help
./start-all-apis.sh --help
```

---

## 🎯 Batch Script Commands (Windows)

```cmd
# Start all services
start-all-apis.bat

# Check prerequisites
start-all-apis.bat check

# View logs
start-all-apis.bat logs

# Stop all services
start-all-apis.bat stop

# Restart all services
start-all-apis.bat restart

# Check health
start-all-apis.bat health

# Show help
start-all-apis.bat help
```

---

## 🐳 Docker Compose Commands

```bash
# Start all services
docker-compose -f docker-compose.apis.yml up

# Start in background
docker-compose -f docker-compose.apis.yml up -d

# View logs
docker-compose -f docker-compose.apis.yml logs -f

# Check status
docker-compose -f docker-compose.apis.yml ps

# Stop all services
docker-compose -f docker-compose.apis.yml down

# Restart services
docker-compose -f docker-compose.apis.yml restart
```

---

## ✅ Prerequisites

### For Bash/Batch Scripts
- ✅ Node.js 14+
- ✅ npm 6+
- ✅ PostgreSQL 12+
- ✅ Bash (Linux/macOS) or Command Prompt (Windows)

### For Docker Compose
- ✅ Docker 20.10+
- ✅ Docker Compose 1.29+

---

## 🔍 Verify Services Are Running

### Test All Services
```bash
for port in 3001 3002 3003 3004 3005 3006 3007; do
  echo "Testing port $port..."
  curl http://localhost:$port/health
done
```

### Test Specific Service
```bash
curl http://localhost:3001/health
curl http://localhost:3001/ready
curl http://localhost:3001/live
```

### Expected Response
```json
{
  "status": "ok",
  "service": "Commercial Bank API",
  "database": "connected",
  "uptime": 123.456
}
```

---

## 📊 Script Features

### Bash Script (`start-all-apis.sh`)
- ✅ Prerequisite checking
- ✅ Port availability verification
- ✅ Automatic environment setup
- ✅ Parallel service startup
- ✅ Health check monitoring
- ✅ Comprehensive logging
- ✅ Graceful shutdown
- ✅ Service status tracking
- ✅ Real-time log tailing
- ✅ Error handling

### Batch Script (`start-all-apis.bat`)
- ✅ Windows compatibility
- ✅ Prerequisite checking
- ✅ Port availability verification
- ✅ Parallel service startup
- ✅ Health check monitoring
- ✅ Comprehensive logging
- ✅ Service management

### Docker Compose (`docker-compose.apis.yml`)
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ All 7 API services
- ✅ Health checks
- ✅ Automatic restart
- ✅ Network isolation
- ✅ Volume persistence
- ✅ Environment configuration

---

## 📝 Log Locations

### Bash Script
```
logs/commercial-bank.log
logs/custom-authorities.log
logs/ecta.log
logs/exporter-portal.log
logs/national-bank.log
logs/ecx.log
logs/shipping-line.log
```

### Docker Compose
```bash
docker-compose -f docker-compose.apis.yml logs -f
```

---

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check PostgreSQL
psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1"
```

### Services Won't Start
```bash
# Check prerequisites
./start-all-apis.sh --check

# View logs
./start-all-apis.sh --logs
```

### Node Modules Missing
```bash
cd api
npm install
```

---

## 🚀 Getting Started

### Step 1: Verify Prerequisites
```bash
./start-all-apis.sh --check
```

### Step 2: Start All Services
```bash
./start-all-apis.sh
```

### Step 3: Verify Services
```bash
./start-all-apis.sh --health
```

### Step 4: View Logs
```bash
./start-all-apis.sh --logs
```

### Step 5: Test Endpoints
```bash
curl http://localhost:3001/api/exports
curl http://localhost:3005/api/exports
curl http://localhost:3003/api/preregistration/exporters
```

---

## 📚 Documentation

For detailed information, see:
- `START_ALL_APIS_GUIDE.md` - Comprehensive guide with all options
- `API_DATABASE_CONNECTION_REPORT.md` - Database connection details
- `QUICK_REFERENCE_DATABASE.md` - Quick reference for common tasks

---

## 🎓 Examples

### Example 1: Start and Monitor
```bash
# Terminal 1: Start all services
./start-all-apis.sh

# Terminal 2: Monitor logs
./start-all-apis.sh --tail
```

### Example 2: Check Status
```bash
# Check if all services are running
./start-all-apis.sh --status

# Check health
./start-all-apis.sh --health
```

### Example 3: Restart Services
```bash
# Restart all services
./start-all-apis.sh --restart
```

### Example 4: Docker Compose
```bash
# Start with Docker
docker-compose -f docker-compose.apis.yml up -d

# View logs
docker-compose -f docker-compose.apis.yml logs -f

# Stop services
docker-compose -f docker-compose.apis.yml down
```

---

## 🔐 Environment Variables

### Database Configuration
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

### API Configuration
```bash
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

### Optional
```bash
WEBSOCKET_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 📊 Service Endpoints

### Commercial Bank API (3001)
```
GET  /health
GET  /ready
GET  /live
POST /api/auth/login
GET  /api/exports
GET  /api/exports/:id
GET  /api/quality/pending
```

### National Bank API (3005)
```
GET  /health
GET  /ready
GET  /live
POST /api/auth/login
GET  /api/exports
GET  /api/exports/:id
GET  /api/fx/pending
GET  /api/exports/status/:status
```

### ECTA API (3003)
```
GET  /health
GET  /ready
GET  /live
POST /api/auth/login
GET  /api/preregistration/exporters
GET  /api/preregistration/exporters/pending
GET  /api/quality/pending
GET  /api/licenses/pending
```

---

## ✨ Features

- ✅ **All-in-One Script** - Start all 7 services with one command
- ✅ **Automatic Checks** - Verify prerequisites and ports
- ✅ **Health Monitoring** - Check service health automatically
- ✅ **Comprehensive Logging** - Detailed logs for debugging
- ✅ **Graceful Shutdown** - Proper cleanup on exit
- ✅ **Cross-Platform** - Works on Linux, macOS, and Windows
- ✅ **Docker Support** - Docker Compose configuration included
- ✅ **Error Handling** - Proper error messages and recovery
- ✅ **Status Tracking** - Monitor running services
- ✅ **Log Management** - Easy log viewing and tailing

---

## 🎯 Next Steps

1. **Start Services**
   ```bash
   ./start-all-apis.sh
   ```

2. **Verify Running**
   ```bash
   ./start-all-apis.sh --health
   ```

3. **Test Endpoints**
   ```bash
   curl http://localhost:3001/health
   ```

4. **View Logs**
   ```bash
   ./start-all-apis.sh --logs
   ```

5. **Stop Services**
   ```bash
   ./start-all-apis.sh --stop
   ```

---

## 📞 Support

For issues:
1. Check logs: `./start-all-apis.sh --logs`
2. Verify prerequisites: `./start-all-apis.sh --check`
3. Check health: `./start-all-apis.sh --health`
4. Review `START_ALL_APIS_GUIDE.md` for detailed help

---

## 📋 Checklist

- ✅ Bash script created and executable
- ✅ Batch script created for Windows
- ✅ Docker Compose configuration created
- ✅ Comprehensive documentation provided
- ✅ All 7 APIs properly configured
- ✅ Database connections verified
- ✅ Health checks implemented
- ✅ Error handling included
- ✅ Logging configured
- ✅ Ready for production

---

**Status:** ✅ **COMPLETE AND READY TO USE**

**Created:** 2024
**Version:** 1.0
**Compatibility:** Linux, macOS, Windows, Docker
