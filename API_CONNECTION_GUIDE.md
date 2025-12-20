# API Connection Guide

## Overview

This guide documents all API connections, configurations, and how to verify they are working correctly.

---

## API Services Architecture

### Service Topology

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Port 5173)                     │
│                    React + Vite Application                  │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌────���─────────┐  ┌──────────────┐  ┌──────────────┐
│ Commercial   │  │   Custom     │  │    ECTA      │
│    Bank      │  │ Authorities  │  │     API      │
│  (3001)      │  │   (3002)     │  │   (3003)     │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        │                ▼                │
        │         ┌──────────────┐        │
        │         │    Redis     │        │
        │         │   (6379)     │        │
        │         └──────────────┘        │
        │                                 │
        ├─────────────────┬───────────────┤
        │                 │               │
        ▼                 ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Exporter    │  │  National    │  │     ECX      │
│   Portal     │  │    Bank      │  │     API      │
│  (3004)      │  │   (3005)     │  │   (3006)     │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                ┌──────────────────┐
                │   Shipping Line  │
                │      (3007)      │
                └──────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   PostgreSQL Database          │
        │   (Port 5432)                  │
        │   coffee_export_db             │
        └────────────────────────────────┘
```

---

## API Port Mapping

| Service | Port | Container Name | Status |
|---------|------|----------------|--------|
| Commercial Bank | 3001 | cbc-commercial-bank | ✅ Active |
| Custom Authorities | 3002 | cbc-custom-authorities | ✅ Active |
| ECTA | 3003 | cbc-ecta | ✅ Active |
| Exporter Portal | 3004 | cbc-exporter-portal | ✅ Active |
| National Bank | 3005 | cbc-national-bank | ✅ Active |
| ECX | 3006 | cbc-ecx | ✅ Active |
| Shipping Line | 3007 | cbc-shipping-line | ✅ Active |
| PostgreSQL | 5432 | cbc-postgres | ✅ Active |
| Redis | 6379 | cbc-redis | ✅ Active |
| Frontend | 5173 | N/A (Vite Dev Server) | ✅ Active |

---

## Frontend Environment Configuration

### Development (.env.template)

```env
# API Configuration - Development
VITE_API_COMMERCIAL_BANK=http://localhost:3001
VITE_API_CUSTOM_AUTHORITIES=http://localhost:3002
VITE_API_ECTA=http://localhost:3003
VITE_API_EXPORTER_PORTAL=http://localhost:3004
VITE_API_NATIONAL_BANK=http://localhost:3005
VITE_API_ECX=http://localhost:3006
VITE_API_SHIPPING_LINE=http://localhost:3007
```

### Staging (.env.staging.example)

```env
# API Configuration - Staging
VITE_API_COMMERCIAL_BANK=https://staging-api.coffeeexport.com/commercial-bank
VITE_API_CUSTOM_AUTHORITIES=https://staging-api.coffeeexport.com/custom-authorities
VITE_API_ECTA=https://staging-api.coffeeexport.com/ecta
VITE_API_EXPORTER_PORTAL=https://staging-api.coffeeexport.com/exporter-portal
VITE_API_NATIONAL_BANK=https://staging-api.coffeeexport.com/national-bank
VITE_API_ECX=https://staging-api.coffeeexport.com/ecx
VITE_API_SHIPPING_LINE=https://staging-api.coffeeexport.com/shipping-line
```

### Production (.env.production.example)

```env
# API Configuration - Production
VITE_API_COMMERCIAL_BANK=https://api.coffeeexport.com/commercial-bank
VITE_API_CUSTOM_AUTHORITIES=https://api.coffeeexport.com/custom-authorities
VITE_API_ECTA=https://api.coffeeexport.com/ecta
VITE_API_EXPORTER_PORTAL=https://api.coffeeexport.com/exporter-portal
VITE_API_NATIONAL_BANK=https://api.coffeeexport.com/national-bank
VITE_API_ECX=https://api.coffeeexport.com/ecx
VITE_API_SHIPPING_LINE=https://api.coffeeexport.com/shipping-line
```

---

## API Endpoints

### Commercial Bank API (Port 3001)

**Base URL**: `http://localhost:3001`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check with database status |
| `/ready` | GET | Readiness probe |
| `/live` | GET | Liveness probe |
| `/api/auth` | POST | Authentication endpoints |
| `/api/exports` | GET/POST | Export management |
| `/api/quality` | GET/POST | Quality checks |
| `/api/exporter` | GET/POST | Exporter information |
| `/api/users` | GET/POST | User management |

### Custom Authorities API (Port 3002)

**Base URL**: `http://localhost:3002`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check with database status |
| `/ready` | GET | Readiness probe |
| `/live` | GET | Liveness probe |
| `/api-docs` | GET | Swagger documentation |
| `/api/auth` | POST | Authentication endpoints |
| `/api/customs` | GET/POST | Customs clearance |
| `/api/exports` | GET/POST | Export management |

### ECTA API (Port 3003)

**Base URL**: `http://localhost:3003`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check with database status |
| `/ready` | GET | Readiness probe |
| `/live` | GET | Liveness probe |
| `/api/auth` | POST | Authentication endpoints |
| `/api/licenses` | GET/POST | License management |
| `/api/quality` | GET/POST | Quality checks |
| `/api/contracts` | GET/POST | Contract management |
| `/api/preregistration` | GET/POST | Pre-registration |
| `/api/exporter` | GET/POST | Exporter information |
| `/api/exports` | GET/POST | Export management |

### Exporter Portal API (Port 3004)

**Base URL**: `http://localhost:3004`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check with database status |
| `/ready` | GET | Readiness probe |
| `/live` | GET | Liveness probe |
| `/api/auth` | POST | Authentication endpoints |
| `/api/exporter` | GET/POST | Exporter information |
| `/api/exports` | GET/POST | Export management |

### National Bank API (Port 3005)

**Base URL**: `http://localhost:3005`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check with database status |
| `/ready` | GET | Readiness probe |
| `/live` | GET | Liveness probe |
| `/api/auth` | POST | Authentication endpoints |

### ECX API (Port 3006)

**Base URL**: `http://localhost:3006`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check with database status |
| `/ready` | GET | Readiness probe |
| `/live` | GET | Liveness probe |
| `/api-docs` | GET | Swagger documentation |
| `/api/ecx` | GET/POST | ECX operations |
| `/api/lot-verification` | GET/POST | Lot verification |

### Shipping Line API (Port 3007)

**Base URL**: `http://localhost:3007`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check with database status |
| `/ready` | GET | Readiness probe |
| `/live` | GET | Liveness probe |
| `/api/auth` | POST | Authentication endpoints |
| `/api/exports` | GET/POST | Export management |
| `/api/shipments` | GET/POST | Shipment management |

---

## Health Check Responses

### Successful Health Check

```json
{
  "status": "ok",
  "service": "Commercial Bank API",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {
    "used": 128,
    "total": 512,
    "unit": "MB"
  }
}
```

### Failed Health Check

```json
{
  "status": "error",
  "service": "Commercial Bank API",
  "database": "disconnected"
}
```

---

## Testing API Connections

### 1. Test All Health Endpoints

```bash
#!/bin/bash

echo "Testing API Health Endpoints..."
echo ""

apis=(
  "http://localhost:3001"
  "http://localhost:3002"
  "http://localhost:3003"
  "http://localhost:3004"
  "http://localhost:3005"
  "http://localhost:3006"
  "http://localhost:3007"
)

for api in "${apis[@]}"; do
  echo "Testing $api/health"
  curl -s "$api/health" | jq '.'
  echo ""
done
```

### 2. Test Database Connection

```bash
# Connect to PostgreSQL
docker exec -it cbc-postgres psql -U postgres -d coffee_export_db -c "SELECT NOW();"
```

### 3. Test Redis Connection

```bash
# Connect to Redis
docker exec -it cbc-redis redis-cli ping
```

### 4. Test Docker Network

```bash
# Check if all services are on the same network
docker network inspect cbc-network
```

### 5. Test Service-to-Service Communication

```bash
# From one container, test connection to another
docker exec cbc-commercial-bank curl http://cbc-custom-authorities:3002/health
```

---

## Docker Compose Commands

### Start All Services

```bash
docker-compose -f docker-compose.apis.yml up -d
```

### View Service Status

```bash
docker-compose -f docker-compose.apis.yml ps
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.apis.yml logs -f

# Specific service
docker-compose -f docker-compose.apis.yml logs -f commercial-bank

# Last 100 lines
docker-compose -f docker-compose.apis.yml logs --tail=100
```

### Stop All Services

```bash
docker-compose -f docker-compose.apis.yml down
```

### Restart a Service

```bash
docker-compose -f docker-compose.apis.yml restart commercial-bank
```

### Rebuild Services

```bash
docker-compose -f docker-compose.apis.yml up -d --build
```

---

## Environment Variables

### Database Configuration

All APIs use the same database configuration:

```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

### Redis Configuration

Custom Authorities API uses Redis:

```env
REDIS_HOST=redis
REDIS_PORT=6379
```

### Common Configuration

All APIs share:

```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
WEBSOCKET_ENABLED=true
LOG_LEVEL=info
MAX_FILE_SIZE_MB=50
```

---

## Troubleshooting

### Issue: API Not Responding

**Solution**:
1. Check if container is running: `docker ps`
2. Check logs: `docker logs cbc-commercial-bank`
3. Test health endpoint: `curl http://localhost:3001/health`
4. Verify port is not in use: `lsof -i :3001`

### Issue: Database Connection Failed

**Solution**:
1. Check PostgreSQL container: `docker ps | grep postgres`
2. Test database: `docker exec cbc-postgres psql -U postgres -c "SELECT 1"`
3. Check network: `docker network inspect cbc-network`
4. Verify credentials in docker-compose.apis.yml

### Issue: CORS Errors

**Solution**:
1. Verify CORS_ORIGIN in API environment variables
2. Check frontend .env file has correct API URLs
3. Ensure frontend is running on http://localhost:5173
4. Check browser console for specific CORS error

### Issue: Redis Connection Failed

**Solution**:
1. Check Redis container: `docker ps | grep redis`
2. Test Redis: `docker exec cbc-redis redis-cli ping`
3. Verify REDIS_HOST and REDIS_PORT in environment

### Issue: WebSocket Connection Failed

**Solution**:
1. Verify WEBSOCKET_ENABLED=true in environment
2. Check browser console for WebSocket errors
3. Ensure frontend is connecting to correct API URL
4. Check firewall rules for WebSocket ports

---

## Performance Monitoring

### Check Memory Usage

```bash
docker stats cbc-commercial-bank cbc-custom-authorities cbc-ecta
```

### Check Network Traffic

```bash
docker exec cbc-commercial-bank netstat -an | grep ESTABLISHED
```

### Check Database Connections

```bash
docker exec cbc-postgres psql -U postgres -d coffee_export_db -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Security Considerations

### CORS Configuration
- Frontend: `http://localhost:5173` (development)
- Production: Update to your domain

### Rate Limiting
- Auth endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per 15 minutes

### Database Security
- Change default PostgreSQL password in production
- Use SSL for database connections in production
- Implement database backups

### API Security
- All APIs use Helmet.js for security headers
- CORS is configured per environment
- Rate limiting is enabled
- Error messages don't expose sensitive information

---

## Deployment Checklist

- [ ] Update frontend .env files with production URLs
- [ ] Update API environment variables for production
- [ ] Configure SSL/TLS certificates
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Set up health check monitoring
- [ ] Configure auto-restart policies
- [ ] Test all API endpoints
- [ ] Verify database connectivity
- [ ] Test inter-service communication
- [ ] Load test the system
- [ ] Set up alerting

---

## Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Test health endpoints: `curl http://localhost:PORT/health`
3. Verify environment variables
4. Check Docker network: `docker network inspect cbc-network`
5. Review API documentation in Swagger: `http://localhost:3002/api-docs`

---

Generated: 2024
