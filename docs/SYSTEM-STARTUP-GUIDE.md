# System Startup Guide

## Prerequisites

If you don't have internet connectivity during startup, pre-pull images first:

**Windows:**
```bash
scripts/prepare-images.bat
```

**Linux/Mac:**
```bash
bash scripts/prepare-images.sh
```

## Quick Start

### Windows
```bash
scripts/start-system.bat
```

### Linux/Mac
```bash
bash scripts/start-system.sh
```

## What Happens During Startup

1. **Cleanup** - Removes old containers and volumes
2. **Blockchain** - Starts orderers, peers, CouchDB, CLI
3. **Infrastructure** - Starts PostgreSQL, Redis, Kafka, Zookeeper
4. **Gateway** - Starts API gateway and core services
5. **Database** - Seeds users and profiles in PostgreSQL
6. **Services** - Starts CBC services and frontend
7. **Sync** - Syncs users to blockchain
8. **Verify** - Checks database contents

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Web UI |
| Gateway API | http://localhost:3000 | REST API |
| ECTA Service | http://localhost:3003 | ECTA operations |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |
| CLI | docker exec -it cli bash | Blockchain CLI |

## Test Credentials

```
Admin:     admin / admin123
Exporter1: exporter1 / password123
Exporter2: exporter2 / password123
```

## Troubleshooting

### Docker Network Error: "No such host"
- Run `scripts/prepare-images.bat` (Windows) or `bash scripts/prepare-images.sh` (Linux/Mac)
- See: docs/DOCKER-NETWORK-TROUBLESHOOTING.md

### CLI Container Not Starting
- Already fixed in startup script
- CLI now has `depends_on` on peers/orderers
- Startup script waits for CLI to be ready

### Blockchain Sync Failed
- System still works (PostgreSQL is primary)
- Manually sync: `npm run sync-users`
- Check logs: `docker-compose logs gateway`

### Database Issues
- Check contents: `npm run check-db`
- Verify users: `npm run verify-users`
- Reseed: `npm run seed`

## Data Flow

```
PostgreSQL (Primary)
    ↓
    ├─ Users & Profiles
    ├─ Qualifications
    └─ Transactions
    
Blockchain (Audit Log)
    ↓
    ├─ User registrations
    ├─ Status changes
    └─ Immutable history
```

## Manual Operations

### Sync Users to Blockchain
```bash
docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run sync-users
```

### Check Database
```bash
docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run check-db
```

### Verify Users
```bash
docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run verify-users
```

### Access CLI
```bash
docker exec -it cli bash
```

## System Architecture

- **PostgreSQL**: Primary data store (users, profiles, qualifications)
- **Blockchain**: Immutable audit log (registrations, transactions)
- **Gateway**: REST API (authentication, profile management)
- **CBC Services**: Business logic (ECTA, banks, customs)
- **Frontend**: Web UI (React/TypeScript)
