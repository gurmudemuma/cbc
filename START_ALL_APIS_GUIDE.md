# Start All APIs Guide

This guide explains how to start all 7 API services for the CBC (Coffee Export Blockchain) project.

---

## Quick Start

### Option 1: Bash Script (Linux/macOS)
```bash
chmod +x start-all-apis.sh
./start-all-apis.sh
```

### Option 2: Batch Script (Windows)
```cmd
start-all-apis.bat
```

### Option 3: Docker Compose
```bash
docker-compose -f docker-compose.apis.yml up
```

### Option 4: Manual (npm)
```bash
# Terminal 1
cd api/commercial-bank && npm run dev

# Terminal 2
cd api/custom-authorities && npm run dev

# Terminal 3
cd api/ecta && npm run dev

# Terminal 4
cd api/exporter-portal && npm run dev

# Terminal 5
cd api/national-bank && npm run dev

# Terminal 6
cd api/ecx && npm run dev

# Terminal 7
cd api/shipping-line && npm run dev
```

---

## API Services

| Service | Port | URL |
|---------|------|-----|
| Commercial Bank | 3001 | http://localhost:3001 |
| Custom Authorities | 3002 | http://localhost:3002 |
| ECTA | 3003 | http://localhost:3003 |
| Exporter Portal | 3004 | http://localhost:3004 |
| National Bank | 3005 | http://localhost:3005 |
| ECX | 3006 | http://localhost:3006 |
| Shipping Line | 3007 | http://localhost:3007 |

---

## Method 1: Bash Script (Recommended for Linux/macOS)

### Prerequisites
- Node.js 14+
- npm 6+
- PostgreSQL 12+
- Bash shell

### Installation
```bash
# Make script executable
chmod +x start-all-apis.sh

# Verify prerequisites
./start-all-apis.sh --check
```

### Usage

#### Start all services
```bash
./start-all-apis.sh
```

#### Check prerequisites
```bash
./start-all-apis.sh --check
```

#### View service status
```bash
./start-all-apis.sh --status
```

#### View logs
```bash
# Show recent logs
./start-all-apis.sh --logs

# Tail logs in real-time
./start-all-apis.sh --tail
```

#### Stop all services
```bash
./start-all-apis.sh --stop
```

#### Restart all services
```bash
./start-all-apis.sh --restart
```

#### Check service health
```bash
./start-all-apis.sh --health
```

### Output Example
```
================================
CBC API Services Startup
================================
[INFO] Starting all API services...

================================
Checking Prerequisites
================================
✓ Node.js v16.13.0
✓ npm 8.1.0
✓ API directory found
✓ node_modules found
✓ PostgreSQL database is accessible
✓ All prerequisites met

================================
Checking Port Availability
================================
✓ Port 3001 available for commercial-bank
✓ Port 3002 available for custom-authorities
✓ Port 3003 available for ecta
✓ Port 3004 available for exporter-portal
✓ Port 3005 available for national-bank
✓ Port 3006 available for ecx
✓ Port 3007 available for shipping-line

================================
Setting Up Environment
================================
✓ Logs directory: /path/to/logs
✓ PID file created: /path/to/.api-pids

================================
Starting All API Services
================================
[INFO] Starting commercial-bank on port 3001...
✓ Started commercial-bank (PID: 12345)
[INFO] Starting custom-authorities on port 3002...
✓ Started custom-authorities (PID: 12346)
...

================================
Checking Service Health
================================
✓ commercial-bank is healthy (DB: connected)
✓ custom-authorities is healthy (DB: connected)
...

================================
All Services Started Successfully
================================
Services are running on the following ports:
  commercial-bank: http://localhost:3001
  custom-authorities: http://localhost:3002
  ecta: http://localhost:3003
  exporter-portal: http://localhost:3004
  national-bank: http://localhost:3005
  ecx: http://localhost:3006
  shipping-line: http://localhost:3007

[INFO] View logs: ./start-all-apis.sh --logs
[INFO] Check status: ./start-all-apis.sh --status
[INFO] Stop services: ./start-all-apis.sh --stop

✓ Ready to accept requests!
```

---

## Method 2: Batch Script (Windows)

### Prerequisites
- Node.js 14+
- npm 6+
- PostgreSQL 12+
- Windows Command Prompt or PowerShell

### Usage

#### Start all services
```cmd
start-all-apis.bat
```

#### Check prerequisites
```cmd
start-all-apis.bat check
```

#### View logs
```cmd
start-all-apis.bat logs
```

#### Stop all services
```cmd
start-all-apis.bat stop
```

#### Restart all services
```cmd
start-all-apis.bat restart
```

#### Check service health
```cmd
start-all-apis.bat health
```

#### Show help
```cmd
start-all-apis.bat help
```

---

## Method 3: Docker Compose (Recommended for Production)

### Prerequisites
- Docker 20.10+
- Docker Compose 1.29+

### Installation

#### Build images
```bash
docker-compose -f docker-compose.apis.yml build
```

### Usage

#### Start all services
```bash
docker-compose -f docker-compose.apis.yml up
```

#### Start in background
```bash
docker-compose -f docker-compose.apis.yml up -d
```

#### View logs
```bash
# View all logs
docker-compose -f docker-compose.apis.yml logs

# Tail logs in real-time
docker-compose -f docker-compose.apis.yml logs -f

# View specific service logs
docker-compose -f docker-compose.apis.yml logs commercial-bank
```

#### Check service status
```bash
docker-compose -f docker-compose.apis.yml ps
```

#### Stop all services
```bash
docker-compose -f docker-compose.apis.yml down
```

#### Stop and remove volumes
```bash
docker-compose -f docker-compose.apis.yml down -v
```

#### Restart services
```bash
docker-compose -f docker-compose.apis.yml restart
```

#### View service logs
```bash
docker-compose -f docker-compose.apis.yml logs -f commercial-bank
```

### Docker Compose Features
- Automatic PostgreSQL database setup
- Redis cache service
- Health checks for all services
- Automatic restart on failure
- Network isolation
- Volume persistence

---

## Method 4: Manual Startup (npm)

### Prerequisites
- Node.js 14+
- npm 6+
- PostgreSQL 12+
- Multiple terminal windows

### Installation
```bash
# Install dependencies
cd api
npm install
```

### Usage

Open 7 terminal windows and run:

**Terminal 1 - Commercial Bank API**
```bash
cd api/commercial-bank
PORT=3001 npm run dev
```

**Terminal 2 - Custom Authorities API**
```bash
cd api/custom-authorities
PORT=3002 npm run dev
```

**Terminal 3 - ECTA API**
```bash
cd api/ecta
PORT=3003 npm run dev
```

**Terminal 4 - Exporter Portal API**
```bash
cd api/exporter-portal
PORT=3004 npm run dev
```

**Terminal 5 - National Bank API**
```bash
cd api/national-bank
PORT=3005 npm run dev
```

**Terminal 6 - ECX API**
```bash
cd api/ecx
PORT=3006 npm run dev
```

**Terminal 7 - Shipping Line API**
```bash
cd api/shipping-line
PORT=3007 npm run dev
```

---

## Environment Configuration

### Environment Variables

Create `.env` files in each API directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# API Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info

# Optional
WEBSOCKET_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Using DATABASE_URL

Alternatively, use a single connection string:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coffee_export_db
```

---

## Health Checks

### Test All Services
```bash
for port in 3001 3002 3003 3004 3005 3006 3007; do
  echo "Testing port $port..."
  curl http://localhost:$port/health
done
```

### Test Specific Service
```bash
# Health check
curl http://localhost:3001/health

# Readiness probe
curl http://localhost:3001/ready

# Liveness probe
curl http://localhost:3001/live
```

### Expected Response
```json
{
  "status": "ok",
  "service": "Commercial Bank API",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "database": "connected",
  "memory": {
    "used": 100,
    "total": 512,
    "unit": "MB"
  }
}
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1"

# Check connection parameters
echo $DATABASE_URL
```

### Services Won't Start
```bash
# Check logs
./start-all-apis.sh --logs

# Check prerequisites
./start-all-apis.sh --check

# Check ports
./start-all-apis.sh --health
```

### Node Modules Missing
```bash
# Install dependencies
cd api
npm install
```

### Permission Denied (Linux/macOS)
```bash
# Make script executable
chmod +x start-all-apis.sh
```

---

## Stopping Services

### Using Bash Script
```bash
./start-all-apis.sh --stop
```

### Using Batch Script
```cmd
start-all-apis.bat stop
```

### Using Docker Compose
```bash
docker-compose -f docker-compose.apis.yml down
```

### Manual Cleanup
```bash
# Kill all node processes
pkill -f "npm run dev"

# Or kill specific process
kill -9 <PID>
```

---

## Logs

### Log Locations

**Bash Script:**
```
logs/commercial-bank.log
logs/custom-authorities.log
logs/ecta.log
logs/exporter-portal.log
logs/national-bank.log
logs/ecx.log
logs/shipping-line.log
```

**Docker Compose:**
```bash
docker-compose -f docker-compose.apis.yml logs -f
```

### View Logs

**Bash Script:**
```bash
# Show recent logs
./start-all-apis.sh --logs

# Tail logs in real-time
./start-all-apis.sh --tail
```

**Docker Compose:**
```bash
# View all logs
docker-compose -f docker-compose.apis.yml logs

# Tail specific service
docker-compose -f docker-compose.apis.yml logs -f commercial-bank
```

---

## Performance Tips

1. **Use Docker Compose** for production deployments
2. **Monitor resource usage** with `docker stats`
3. **Enable caching** with Redis
4. **Use connection pooling** (already configured)
5. **Monitor logs** for errors and warnings

---

## Common Commands

```bash
# Start all services
./start-all-apis.sh

# Check status
./start-all-apis.sh --status

# View logs
./start-all-apis.sh --logs

# Check health
./start-all-apis.sh --health

# Stop all services
./start-all-apis.sh --stop

# Restart all services
./start-all-apis.sh --restart

# Test specific endpoint
curl http://localhost:3001/api/exports

# Test database
psql -h localhost -U postgres -d coffee_export_db -c "SELECT NOW()"
```

---

## Next Steps

1. Start all services using your preferred method
2. Verify all services are running with health checks
3. Test API endpoints
4. Monitor logs for any errors
5. Configure monitoring and alerting

---

## Support

For issues or questions:

1. Check the logs: `./start-all-apis.sh --logs`
2. Verify prerequisites: `./start-all-apis.sh --check`
3. Check service health: `./start-all-apis.sh --health`
4. Review the troubleshooting section above

---

**Document Version:** 1.0
**Last Updated:** 2024
**Status:** ✅ COMPLETE
