# CBC Database Connection Documentation Index

## Quick Navigation

### 🚀 Getting Started (Start Here)
1. **[DATABASE_CONNECTION_README.md](DATABASE_CONNECTION_README.md)** - Main overview and quick start
2. **[STARTUP_GUIDE_DATABASE_VERIFIED.md](STARTUP_GUIDE_DATABASE_VERIFIED.md)** - Complete startup guide

### 📋 Verification & Troubleshooting
1. **[DATABASE_CONNECTION_VERIFICATION.md](DATABASE_CONNECTION_VERIFICATION.md)** - Detailed verification procedures
2. **[verify-database-connection.sh](verify-database-connection.sh)** - Automated verification script

### 📊 Configuration & Summary
1. **[DATABASE_CONNECTION_SUMMARY.md](DATABASE_CONNECTION_SUMMARY.md)** - Expert configuration summary
2. **[docker-compose.postgres.yml](docker-compose.postgres.yml)** - Infrastructure configuration
3. **[docker-compose.apis.yml](docker-compose.apis.yml)** - API services configuration

---

## Document Descriptions

### DATABASE_CONNECTION_README.md
**Purpose**: Main entry point for database connection information
**Contains**:
- Quick start guide (5 minutes)
- Architecture overview
- Configuration details
- API services list
- Database tables overview
- Verification commands
- Troubleshooting guide
- Health check endpoints
- Backup & recovery procedures
- Performance optimization tips
- Production checklist

**Best For**: Getting a complete overview and quick reference

---

### STARTUP_GUIDE_DATABASE_VERIFIED.md
**Purpose**: Comprehensive startup and operational guide
**Contains**:
- Step-by-step startup procedure
- Detailed configuration reference
- Service port mapping
- Database tables documentation
- Verification commands
- Monitoring and logging
- Troubleshooting procedures
- Backup and recovery
- Performance tuning
- Production deployment checklist

**Best For**: Setting up the system and ongoing operations

---

### DATABASE_CONNECTION_VERIFICATION.md
**Purpose**: Detailed verification and troubleshooting guide
**Contains**:
- Current configuration overview
- 7-step verification procedure
- Database tables list (29 total)
- Connection pool configuration
- Environment variables
- Troubleshooting guide with solutions
- Docker compose commands
- Health check configuration
- Performance monitoring
- Security considerations
- Backup and recovery procedures

**Best For**: Verifying connections and troubleshooting issues

---

### DATABASE_CONNECTION_SUMMARY.md
**Purpose**: Executive summary of changes and configuration
**Contains**:
- Executive summary
- Changes made to docker-compose.apis.yml
- Database connection pool configuration
- Verification and monitoring tools
- Database configuration details
- Connection flow architecture
- Connection parameters
- Verification results
- Health check endpoints
- Startup procedure
- Monitoring commands
- Troubleshooting guide
- Performance optimization
- Security considerations
- Files modified/created
- Next steps

**Best For**: Understanding what was changed and why

---

### verify-database-connection.sh
**Purpose**: Automated verification script
**Checks**:
1. Docker network existence
2. PostgreSQL container status
3. PostgreSQL connection readiness
4. Database and table verification
5. Redis container and connection status
6. API container status
7. API health endpoints
8. Database connection pool status

**Usage**:
```bash
./verify-database-connection.sh
```

**Best For**: Quick automated verification of all connections

---

## Configuration Files

### docker-compose.postgres.yml
**Services**:
- PostgreSQL 15 (Port 5432)
- Redis 7 (Port 6379)
- IPFS (Port 5001, 8080)

**Network**: coffee-export-network

**Volumes**: postgres-data, redis-data, ipfs-data

---

### docker-compose.apis.yml
**Services** (7 total):
1. Commercial Bank (Port 3001)
2. Custom Authorities (Port 3002)
3. ECTA (Port 3003)
4. Exporter Portal (Port 3004)
5. National Bank (Port 3005)
6. ECX (Port 3006)
7. Shipping Line (Port 3007)

**Configuration**:
- All use Docker service names (postgres, redis)
- All have depends_on with health checks
- All on coffee-export-network

---

## Quick Commands

### Start Everything
```bash
# Start infrastructure
docker-compose -f docker-compose.postgres.yml up -d

# Start APIs
docker-compose -f docker-compose.apis.yml up -d

# Verify
./verify-database-connection.sh
```

### Check Status
```bash
# Infrastructure
docker-compose -f docker-compose.postgres.yml ps

# APIs
docker-compose -f docker-compose.apis.yml ps

# Specific service
docker ps | grep postgres
docker ps | grep redis
docker ps | grep cbc-
```

### View Logs
```bash
# Infrastructure
docker-compose -f docker-compose.postgres.yml logs -f

# APIs
docker-compose -f docker-compose.apis.yml logs -f

# Specific service
docker logs -f postgres
docker logs -f cbc-commercial-bank
```

### Test Connections
```bash
# PostgreSQL
docker exec postgres pg_isready -U postgres

# Redis
docker exec redis redis-cli ping

# API
curl http://localhost:3001/health | jq .
```

### Stop Everything
```bash
# Stop APIs
docker-compose -f docker-compose.apis.yml down

# Stop infrastructure
docker-compose -f docker-compose.postgres.yml down
```

---

## Database Information

### Connection Details
- **Host**: postgres (Docker service name)
- **Port**: 5432
- **Database**: coffee_export_db
- **User**: postgres
- **Password**: postgres
- **SSL**: false

### Connection Pool
- **Max Connections**: 20
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 2 seconds

### Tables (29 Total)
- User Management: 4 tables
- Export Management: 6 tables
- Pre-registration: 2 tables
- Quality & Inspection: 4 tables
- Certificates: 3 tables
- Additional System: 10 tables

---

## API Services

### Ports
- Commercial Bank: 3001
- Custom Authorities: 3002
- ECTA: 3003
- Exporter Portal: 3004
- National Bank: 3005
- ECX: 3006
- Shipping Line: 3007

### Health Endpoints
- `/health` - Full status with database connection
- `/ready` - Readiness probe (database connectivity)
- `/live` - Liveness probe (service running)

---

## Troubleshooting Quick Links

### PostgreSQL Issues
See: [DATABASE_CONNECTION_VERIFICATION.md](DATABASE_CONNECTION_VERIFICATION.md#troubleshooting)

### API Connection Issues
See: [STARTUP_GUIDE_DATABASE_VERIFIED.md](STARTUP_GUIDE_DATABASE_VERIFIED.md#troubleshooting)

### Connection Pool Issues
See: [DATABASE_CONNECTION_VERIFICATION.md](DATABASE_CONNECTION_VERIFICATION.md#troubleshooting)

### Performance Issues
See: [STARTUP_GUIDE_DATABASE_VERIFIED.md](STARTUP_GUIDE_DATABASE_VERIFIED.md#performance-tuning)

---

## Production Deployment

### Pre-deployment Checklist
See: [STARTUP_GUIDE_DATABASE_VERIFIED.md](STARTUP_GUIDE_DATABASE_VERIFIED.md#production-deployment-checklist)

### Security Considerations
See: [DATABASE_CONNECTION_VERIFICATION.md](DATABASE_CONNECTION_VERIFICATION.md#security-considerations)

### Backup Procedures
See: [STARTUP_GUIDE_DATABASE_VERIFIED.md](STARTUP_GUIDE_DATABASE_VERIFIED.md#backup-and-recovery)

---

## Monitoring & Performance

### Monitoring Commands
See: [STARTUP_GUIDE_DATABASE_VERIFIED.md](STARTUP_GUIDE_DATABASE_VERIFIED.md#monitoring-and-logs)

### Performance Tuning
See: [STARTUP_GUIDE_DATABASE_VERIFIED.md](STARTUP_GUIDE_DATABASE_VERIFIED.md#performance-tuning)

### Query Performance
See: [DATABASE_CONNECTION_VERIFICATION.md](DATABASE_CONNECTION_VERIFICATION.md#performance-monitoring)

---

## File Structure

```
/home/gu-da/cbc/
├── DATABASE_CONNECTION_README.md          ← Main overview
├── DATABASE_CONNECTION_VERIFICATION.md    ← Detailed verification
├── DATABASE_CONNECTION_SUMMARY.md         ← Configuration summary
├── STARTUP_GUIDE_DATABASE_VERIFIED.md     ← Complete startup guide
├── DATABASE_CONNECTION_INDEX.md           ← This file
├── verify-database-connection.sh          ← Verification script
├── docker-compose.postgres.yml            ← Infrastructure config
├── docker-compose.apis.yml                ← API services config
└── api/
    ├── shared/
    │   └── database/
    │       ├── pool.ts                    ← Connection pool config
    │       ├── db.config.ts               ← Database config
    │       └── migrations/                ← Database migrations
    └── [7 API services]/
        └── src/
            └── index.ts                   ← Service entry points
```

---

## Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| PostgreSQL | ✓ Running | Port 5432, coffee_export_db |
| Redis | ✓ Running | Port 6379 |
| IPFS | ✓ Running | Port 5001, 8080 |
| Docker Network | ✓ Configured | coffee-export-network |
| Database | ✓ Initialized | 29 tables |
| Connection Pool | ✓ Configured | 20 max connections |
| API Services | ✓ Configured | All 7 services ready |
| Health Checks | ✓ Implemented | All endpoints available |
| Documentation | ✓ Complete | 5 comprehensive guides |

---

## Next Steps

1. **Read**: Start with [DATABASE_CONNECTION_README.md](DATABASE_CONNECTION_README.md)
2. **Verify**: Run `./verify-database-connection.sh`
3. **Start**: Follow [STARTUP_GUIDE_DATABASE_VERIFIED.md](STARTUP_GUIDE_DATABASE_VERIFIED.md)
4. **Test**: Check API health endpoints
5. **Monitor**: Use provided monitoring commands
6. **Deploy**: Follow production checklist

---

## Support

For issues or questions:

1. Check the relevant documentation file
2. Run the verification script
3. Review service logs
4. Check troubleshooting sections

---

**Last Updated**: 2025-12-19
**Status**: ✓ Database Connection Verified and Optimized
**Version**: 1.0
