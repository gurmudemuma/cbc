# Quick Start Guide (5 Minutes)

Get CBC up and running in 5 minutes.

## Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for frontend)
- Git

## Step 1: Start Infrastructure (1 min)

```bash
cd /home/gu-da/cbc
docker-compose -f docker-compose.postgres.yml up -d
```

**What starts:**
- PostgreSQL (port 5432)
- Redis (port 6379)
- IPFS (port 5001, 8080)

## Step 2: Start API Services (2 min)

```bash
docker-compose -f docker-compose.apis.yml up -d
```

**Services started:**
- Commercial Bank (3001)
- Custom Authorities (3002)
- ECTA (3003)
- Exporter Portal (3004)
- National Bank (3005)
- ECX (3006)
- Shipping Line (3007)

## Step 3: Verify Setup (1 min)

```bash
./scripts/verify-all.sh
```

Or manually check:
```bash
# Check containers
docker ps

# Test PostgreSQL
docker exec postgres pg_isready -U postgres

# Test Redis
docker exec redis redis-cli ping

# Test API
curl http://localhost:3001/health | jq .
```

## Step 4: Start Frontend (1 min)

```bash
cd frontend
npm install
npm start
```

Frontend runs on: http://localhost:3000

## ✓ You're Done!

All services are running. Access:
- **Frontend**: http://localhost:3000
- **APIs**: http://localhost:3001-3007
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Common Commands

```bash
# View logs
docker-compose -f docker-compose.postgres.yml logs -f
docker-compose -f docker-compose.apis.yml logs -f

# Stop everything
./scripts/stop-all.sh

# Restart a service
docker-compose -f docker-compose.apis.yml restart cbc-commercial-bank

# View service status
docker ps
```

## Troubleshooting

**Port already in use?**
```bash
./scripts/stop-all.sh
```

**Database connection error?**
```bash
./scripts/verify-all.sh
```

**Need more help?**
See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**Next**: Read [SETUP.md](./SETUP.md) for detailed configuration
