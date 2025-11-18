# Full Containerization Guide

## Overview

This guide covers the **complete containerized deployment** of the Coffee Export Consortium Blockchain, where every component runs in Docker containers including:

- ✅ Hyperledger Fabric network (5 peers + orderer)
- ✅ CouchDB state databases (5 instances)
- ✅ IPFS daemon (required)
- ✅ All 5 API services
- ✅ Frontend application

**Total containers: 18**

## Quick Start

### One-Command Deployment

```bash
# Build images and start everything
./start-docker-full.sh --build

# Or start with existing images
./start-docker-full.sh

# Clean start (removes all volumes)
./start-docker-full.sh --clean --build
```

### Manual Deployment

```bash
# 1. Generate crypto material
cd network
./network.sh up createChannel

# 2. Build all images
docker-compose -f docker-compose-full.yml build

# 3. Start all services
docker-compose -f docker-compose-full.yml up -d

# 4. Check status
docker-compose -f docker-compose-full.yml ps
```

## Architecture

### Container Stack

```
┌─────────────────────────────────────────────────────────────┐
│                  Docker Compose Full Stack                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: IPFS (Required)                                    │
│  ┌──────────────┐                                            │
│  │     IPFS     │  Port 5001 (API), 8080 (Gateway)          │
│  └──────────────┘                                            │
│                                                               │
│  Layer 2: Fabric Network                                     │
│  ┌──────────────┐  ┌──────────────┬──────────────┐          │
│  │   Orderer    │  │  CouchDB 0-4 │ 5 Instances  │          │
│  │  Port 7050   │  │  Ports 5984+ │              │          │
│  └──────────────┘  └──────────────┴──────────────┘          │
│                                                               │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ commercialbank │ NationalBank │     ECTA     │             │
│  │  Peer 7051   │  Peer 8051   │  Peer 9051   │             │
│  └──────────────┴──────────────┴──────────────┘             │
│                                                               │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ ShippingLine │CustomAuthori │     CLI      │             │
│  │ Peer 10051   │ Peer 11051   │    Tools     │             │
│  └──────────────┴──────────────┴──────────────┘             │
│                                                               │
│  Layer 3: Application Services                               │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ Exporter API │  National    │   ECTA API   │             │
│  │  Port 3001   │  Bank API    │  Port 3003   │             │
│  │              │  Port 3002   │              │             │
│  └──────────────┴──────────────┴──────────────┘             │
│                                                               │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ Shipping API │  Custom API  │   Frontend   │             │
│  │  Port 3004   │  Port 3005   │   Port 80    │             │
│  └──────────────┴──────────────┴──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Files Structure

```
cbc/
├── docker-compose-full.yml       # Complete stack definition
├── start-docker-full.sh          # Automated startup script
├── api/
│   ├── .dockerignore             # Shared ignore file
│   ├── commercialbank/
│   │   └── Dockerfile            # API image definition
│   ├── national-bank/
│   │   └── Dockerfile
│   ├── ncat/
│   │   └── Dockerfile
│   ├── shipping-line/
│   │   └── Dockerfile
│   └── custom-authorities/
│       └── Dockerfile
└── frontend/
    ├── .dockerignore             # Frontend ignore file
    └── Dockerfile                # Frontend image definition
```

## Configuration

### Environment Variables

All services are configured via environment variables in `docker-compose-full.yml`:

#### API Services

```yaml
environment:
  - PORT=3001                    # Service port
  - NODE_ENV=production
  - IPFS_HOST=ipfs               # Container name (not localhost!)
  - IPFS_PORT=5001
  - IPFS_PROTOCOL=http
  - ORGANIZATION_ID=commercialbank
  - MSP_ID=ExporterBankMSP
  - PEER_ENDPOINT=peer0.commercialbank.coffee-export.com:7051
  - CHANNEL_NAME=coffeechannel
  - CHAINCODE_NAME_EXPORT=coffee-export
  - CHAINCODE_NAME_USER=user-management
  - CONNECTION_PROFILE_PATH=/crypto/connection-commercialbank.json
  - WALLET_PATH=/app/wallet
  - JWT_SECRET=change-in-production
```

#### Frontend

```yaml
environment:
  - VITE_EXPORTER_BANK_API_URL=http://localhost:3001
  - VITE_NATIONAL_BANK_API_URL=http://localhost:3002
  - VITE_ECTA_API_URL=http://localhost:3003
  - VITE_SHIPPING_LINE_API_URL=http://localhost:3004
```

### Volumes

**Named Volumes** (persistent data):
- `ipfs-data` - IPFS repository
- `*-wallet` - API Fabric wallets (5 volumes)
- `peer0.*` - Peer ledger data (5 volumes)
- `couchdb0-4` - State databases (5 volumes)
- `orderer.coffee-export.com` - Orderer data

**Bind Mounts** (read-only):
- `./network/organizations` - Crypto material
- `./config/core.yaml` - Peer configuration

## Build Process

### Building Images

```bash
# Build all images at once
docker-compose -f docker-compose-full.yml build

# Build specific services
docker-compose -f docker-compose-full.yml build commercialbank-api
docker-compose -f docker-compose-full.yml build frontend

# Build with no cache
docker-compose -f docker-compose-full.yml build --no-cache

# Build in parallel
docker-compose -f docker-compose-full.yml build --parallel
```

### Image Optimization

All images use **multi-stage builds**:

1. **Builder stage**: Compiles TypeScript, installs dependencies
2. **Production stage**: Only production dependencies, minimal footprint

**Image sizes** (approximate):
- API services: ~150-200 MB each
- Frontend: ~50 MB (nginx + static files)
- Total: ~1 GB for all custom images

## Deployment

### Starting Services

```bash
# Start all services (detached)
docker-compose -f docker-compose-full.yml up -d

# Start with logs visible
docker-compose -f docker-compose-full.yml up

# Start specific services
docker-compose -f docker-compose-full.yml up -d ipfs commercialbank-api

# Scale services (if applicable)
docker-compose -f docker-compose-full.yml up -d --scale commercialbank-api=2
```

### Stopping Services

```bash
# Stop all services
docker-compose -f docker-compose-full.yml down

# Stop and remove volumes (DATA LOSS!)
docker-compose -f docker-compose-full.yml down -v

# Stop specific service
docker-compose -f docker-compose-full.yml stop commercialbank-api
```

### Restarting Services

```bash
# Restart all
docker-compose -f docker-compose-full.yml restart

# Restart specific service
docker-compose -f docker-compose-full.yml restart commercialbank-api

# Recreate containers (useful after config changes)
docker-compose -f docker-compose-full.yml up -d --force-recreate
```

## Monitoring

### Status Check

```bash
# View all containers
docker-compose -f docker-compose-full.yml ps

# View only running containers
docker-compose -f docker-compose-full.yml ps --services --filter "status=running"

# Check health status
docker-compose -f docker-compose-full.yml ps | grep healthy
```

### Logs

```bash
# View all logs
docker-compose -f docker-compose-full.yml logs

# Follow logs (real-time)
docker-compose -f docker-compose-full.yml logs -f

# Logs for specific service
docker-compose -f docker-compose-full.yml logs -f commercialbank-api

# Logs for multiple services
docker-compose -f docker-compose-full.yml logs -f commercialbank-api national-bank-api

# Tail last 100 lines
docker-compose -f docker-compose-full.yml logs --tail=100 commercialbank-api
```

### Resource Usage

```bash
# Monitor resource usage
docker stats

# Monitor specific containers
docker stats commercialbank-api national-bank-api ncat-api

# Container resource limits (check compose file)
docker inspect commercialbank-api | grep -A 10 Resources
```

## Networking

### Container Communication

All services use the `coffee-export-network`:

```bash
# Inspect network
docker network inspect coffee-export-network

# Test connectivity between containers
docker exec commercialbank-api ping ipfs
docker exec commercialbank-api curl http://ipfs:5001/api/v0/id

# Check if service can reach peer
docker exec commercialbank-api nc -zv peer0.commercialbank.coffee-export.com 7051
```

### Port Mappings

| Service | Container Port | Host Port | Protocol |
|---------|----------------|-----------|----------|
| IPFS | 5001 | 5001 | HTTP |
| IPFS | 8080 | 8080 | HTTP |
| Orderer | 7050 | 7050 | gRPC |
| commercialbank Peer | 7051 | 7051 | gRPC |
| NationalBank Peer | 8051 | 8051 | gRPC |
| ECTA Peer | 9051 | 9051 | gRPC |
| ShippingLine Peer | 10051 | 10051 | gRPC |
| CustomAuth Peer | 11051 | 11051 | gRPC |
| Exporter API | 3001 | 3001 | HTTP |
| National API | 3002 | 3002 | HTTP |
| ECTA API | 3003 | 3003 | HTTP |
| Shipping API | 3004 | 3004 | HTTP |
| Custom API | 3005 | 3005 | HTTP |
| Frontend | 80 | 80 | HTTP |

## Troubleshooting

### Service Won't Start

```bash
# Check logs for errors
docker-compose -f docker-compose-full.yml logs [service-name]

# Check if dependencies are running
docker-compose -f docker-compose-full.yml ps

# Restart service
docker-compose -f docker-compose-full.yml restart [service-name]

# Rebuild and restart
docker-compose -f docker-compose-full.yml up -d --build [service-name]
```

### Health Check Failing

```bash
# Check health status
docker inspect commercialbank-api | grep -A 10 Health

# Test health endpoint manually
curl http://localhost:3001/health

# Exec into container
docker exec -it commercialbank-api sh

# Check logs for health check failures
docker-compose -f docker-compose-full.yml logs --tail=50 commercialbank-api
```

### Volume Issues

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect cbc_exporter-bank-wallet

# Remove unused volumes
docker volume prune

# Backup volume
docker run --rm -v cbc_exporter-bank-wallet:/data -v $(pwd):/backup \
  alpine tar czf /backup/wallet-backup.tar.gz /data

# Restore volume
docker run --rm -v cbc_exporter-bank-wallet:/data -v $(pwd):/backup \
  alpine tar xzf /backup/wallet-backup.tar.gz -C /
```

### Network Issues

```bash
# Recreate network
docker-compose -f docker-compose-full.yml down
docker network rm coffee-export-network
docker-compose -f docker-compose-full.yml up -d

# Check DNS resolution
docker exec commercialbank-api nslookup ipfs
docker exec commercialbank-api nslookup peer0.commercialbank.coffee-export.com
```

### Build Issues

```bash
# Build with no cache
docker-compose -f docker-compose-full.yml build --no-cache

# Build with verbose output
docker-compose -f docker-compose-full.yml build --progress=plain

# Build specific service
docker-compose -f docker-compose-full.yml build --no-cache commercialbank-api
```

## Maintenance

### Updating Images

```bash
# Pull latest base images
docker-compose -f docker-compose-full.yml pull

# Rebuild with updates
docker-compose -f docker-compose-full.yml build --pull

# Recreate containers with new images
docker-compose -f docker-compose-full.yml up -d --force-recreate
```

### Cleaning Up

```bash
# Stop and remove containers
docker-compose -f docker-compose-full.yml down

# Remove volumes (DATA LOSS!)
docker-compose -f docker-compose-full.yml down -v

# Remove all unused images
docker image prune -a

# Remove everything (nuclear option)
docker system prune -a --volumes
```

### Backup Strategy

```bash
# Backup script
#!/bin/bash
BACKUP_DIR=./backups/$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup volumes
for volume in $(docker volume ls -q | grep cbc_); do
  docker run --rm -v $volume:/data -v $BACKUP_DIR:/backup \
    alpine tar czf /backup/$volume.tar.gz /data
done

# Backup crypto material
tar czf $BACKUP_DIR/crypto.tar.gz network/organizations

echo "Backup complete: $BACKUP_DIR"
```

## Production Considerations

### Security

1. **Change JWT secrets** in compose file
2. **Use Docker secrets** for sensitive data
3. **Enable TLS** for external connections
4. **Change CouchDB passwords**
5. **Restrict network access** (firewall rules)
6. **Run as non-root** (already configured in Dockerfiles)

### Performance

1. **Resource Limits**: Add CPU/memory limits to compose file
2. **Restart Policies**: Already set to `unless-stopped`
3. **Health Checks**: Already configured with retries
4. **Logging**: Configure log drivers for production

### High Availability

1. **Multiple Orderers**: Raft consensus
2. **Load Balancers**: For API services
3. **Database Replication**: CouchDB clustering
4. **IPFS Clustering**: Distributed file storage

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build images
        run: docker-compose -f docker-compose-full.yml build
      
      - name: Run tests
        run: docker-compose -f docker-compose-full.yml run --rm commercialbank-api npm test
      
      - name: Deploy
        run: ./start-docker-full.sh --build
```

## Summary

✅ **Complete containerization** of all services  
✅ **18 containers** running the full stack  
✅ **Production-ready** with health checks, restart policies  
✅ **Easy deployment** with single command  
✅ **Persistent data** in named volumes  
✅ **Optimized images** using multi-stage builds  

**Start command:**
```bash
./start-docker-full.sh --build
```

**Access:**
- Frontend: http://localhost
- APIs: http://localhost:3001-3005
- IPFS: http://localhost:5001

---

**Related Files:**
- `/docker-compose-full.yml` - Complete stack definition
- `/start-docker-full.sh` - Automated startup
- `/api/*/Dockerfile` - API image definitions
- `/frontend/Dockerfile` - Frontend image definition
- `/DOCKER_COMPOSE_GUIDE.md` - Docker Compose basics
