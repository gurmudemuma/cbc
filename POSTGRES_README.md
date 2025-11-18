# PostgreSQL Database Configuration

## Overview

The Coffee Export system has been fully migrated from in-memory storage to **PostgreSQL** for persistent data storage. Both the National Bank API and Exporter Portal API now use Prisma ORM with PostgreSQL.

### What Changed

| Component | Before | After |
|-----------|--------|-------|
| **National Bank API** | In-memory (lost on restart) | PostgreSQL + Prisma |
| **Exporter Portal API** | In-memory Map storage | PostgreSQL + Prisma |
| **Data Persistence** | ❌ No | ✅ Yes |
| **Scalability** | Limited | ✅ Full |
| **Multi-instance** | ❌ Not possible | ✅ Supported |

## Quick Start (Automated)

### Linux/macOS

```bash
# Make script executable (first time only)
chmod +x setup-postgres.sh

# Run setup
./setup-postgres.sh
```

### Windows

```bash
# Run setup
setup-postgres.bat
```

The script will:
1. ✅ Start PostgreSQL containers
2. ✅ Wait for databases to be ready
3. ✅ Install dependencies
4. ✅ Generate Prisma clients
5. ✅ Run migrations
6. ✅ Display connection details

## Manual Setup

### Step 1: Start PostgreSQL Services

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

Verify services are running:
```bash
docker-compose ps | grep postgres
```

### Step 2: Configure Environment Variables

#### National Bank API

```bash
cd api/national-bank
cp .env.example .env
```

Edit `.env` if needed (defaults work with Docker Compose):
```env
DATABASE_URL=postgresql://nationalbank:nationalbank_dev_password@postgres-national-bank:5432/national_bank_db
```

#### Exporter Portal API

```bash
cd api/exporter-portal
cp .env.example .env
```

Edit `.env` if needed:
```env
DATABASE_URL=postgresql://exporter_portal:exporter_portal_dev_password@postgres-exporter-portal:5433/exporter_portal_db
```

### Step 3: Install Dependencies & Run Migrations

#### National Bank API

```bash
cd api/national-bank
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
```

#### Exporter Portal API

```bash
cd api/exporter-portal
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
```

### Step 4: Start the APIs

In separate terminals:

```bash
# Terminal 1
cd api/national-bank
npm run dev

# Terminal 2
cd api/exporter-portal
npm run dev
```

## Database Details

### National Bank PostgreSQL

```
Container: postgres-national-bank
Host: localhost (from host) or postgres-national-bank (from Docker)
Port: 5432
Username: nationalbank
Password: nationalbank_dev_password
Database: national_bank_db
```

**Tables**:
- `User` - Portal users with authentication

### Exporter Portal PostgreSQL

```
Container: postgres-exporter-portal
Host: localhost (from host) or postgres-exporter-portal (from Docker)
Port: 5433
Username: exporter_portal
Password: exporter_portal_dev_password
Database: exporter_portal_db
```

**Tables**:
- `ExportRequest` - Coffee export requests
- `ExportDocument` - Attached documents
- `StatusHistory` - Status change audit trail

## Database Management Tools

### pgAdmin (Web UI)

Access at: http://localhost:5050

```
Email: admin@coffee-export.local
Password: admin
```

Servers are pre-configured for both databases.

### Prisma Studio (Visual Editor)

```bash
# National Bank
cd api/national-bank
npm run prisma:studio

# Exporter Portal
cd api/exporter-portal
npm run prisma:studio
```

Opens at: http://localhost:5555

### psql (Command Line)

```bash
# National Bank
psql -h localhost -p 5432 -U nationalbank -d national_bank_db

# Exporter Portal
psql -h localhost -p 5433 -U exporter_portal -d exporter_portal_db
```

## Prisma Commands

### Generate Prisma Client

```bash
npm run prisma:generate
```

Run after modifying `schema.prisma`.

### Create & Run Migrations

```bash
npm run prisma:migrate
```

Creates a new migration and applies it.

### Deploy Existing Migrations

```bash
npm run prisma:migrate:deploy
```

Use in CI/CD and production.

### View Database (Prisma Studio)

```bash
npm run prisma:studio
```

### Seed Database

```bash
npm run prisma:seed
```

(Exporter Portal only)

## Data Persistence

### Docker Volumes

Data is stored in Docker volumes:
- `postgres-national-bank` - National Bank data
- `postgres-exporter-portal` - Exporter Portal data

### Backup & Restore

```bash
# Backup National Bank database
docker exec postgres-national-bank pg_dump -U nationalbank national_bank_db > backup-national-bank.sql

# Backup Exporter Portal database
docker exec postgres-exporter-portal pg_dump -U exporter_portal exporter_portal_db > backup-exporter-portal.sql

# Restore National Bank database
docker exec -i postgres-national-bank psql -U nationalbank national_bank_db < backup-national-bank.sql

# Restore Exporter Portal database
docker exec -i postgres-exporter-portal psql -U exporter_portal exporter_portal_db < backup-exporter-portal.sql
```

### Reset Database (WARNING: Deletes All Data)

```bash
# National Bank
cd api/national-bank
npx prisma migrate reset

# Exporter Portal
cd api/exporter-portal
npx prisma migrate reset
```

## Troubleshooting

### Connection Refused

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if containers are running
docker-compose ps

# Start containers if needed
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

### Authentication Failed

**Error**: `FATAL: password authentication failed for user "nationalbank"`

**Solution**:
1. Check `.env` file has correct credentials
2. Verify docker-compose.override.yml environment variables
3. Recreate containers: `docker-compose down -v && docker-compose up -d`

### Database Not Found

**Error**: `FATAL: database "national_bank_db" does not exist`

**Solution**:
```bash
# Run migrations to create database
npm run prisma:migrate:deploy
```

### Prisma Client Not Found

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npm install
npm run prisma:generate
```

### Port Already in Use

**Error**: `Error: listen EADDRINUSE :::5432`

**Solution**:
```bash
# Find process using port
lsof -i :5432

# Kill process or use different port in docker-compose.override.yml
```

## Environment Variables

### National Bank API

```env
# Database
DATABASE_URL=postgresql://nationalbank:nationalbank_dev_password@postgres-national-bank:5432/national_bank_db

# Server
PORT=3000
NODE_ENV=development

# Fabric
ORGANIZATION_ID=nationalbank
ORGANIZATION_NAME=NationalBank
MSP_ID=NationalBankMSP
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management

# IPFS
IPFS_HOST=ipfs
IPFS_PORT=5001
IPFS_PROTOCOL=http

# Security
CORS_ORIGIN=http://localhost:3000,http://localhost:80,http://localhost
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-here
MAX_FILE_SIZE_MB=50

# WebSocket
WEBSOCKET_ENABLED=true
WEBSOCKET_PORT=3001

# Logging
LOG_LEVEL=debug
```

### Exporter Portal API

```env
# Database
DATABASE_URL=postgresql://exporter_portal:exporter_portal_dev_password@postgres-exporter-portal:5433/exporter_portal_db

# Server
PORT=3002
NODE_ENV=development

# Organization
ORGANIZATION_ID=exporter-portal
ORGANIZATION_NAME=ExporterPortal

# Security
CORS_ORIGIN=http://localhost:3000,http://localhost:80,http://localhost
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-here
MAX_FILE_SIZE_MB=50

# File Upload
UPLOAD_PATH=./uploads

# WebSocket
WEBSOCKET_ENABLED=true
WEBSOCKET_PORT=3003

# Logging
LOG_LEVEL=debug
```

## Production Deployment

### Security Checklist

- [ ] Use strong passwords (not dev defaults)
- [ ] Use environment-specific .env files
- [ ] Never commit .env to version control
- [ ] Enable SSL/TLS for database connections
- [ ] Use managed PostgreSQL services (AWS RDS, Azure, etc.)
- [ ] Set up automated backups
- [ ] Monitor database performance
- [ ] Use connection pooling (PgBouncer)
- [ ] Implement database access controls
- [ ] Enable audit logging

### Deployment Steps

1. **Set up PostgreSQL** (managed service or self-hosted)
2. **Configure DATABASE_URL** in production environment
3. **Run migrations**:
   ```bash
   npm run prisma:migrate:deploy
   ```
4. **Start services** with production environment
5. **Monitor** database connections and performance

### Connection Pooling

For production, use PgBouncer or similar:

```env
# Use connection pool URL instead of direct connection
DATABASE_URL=postgresql://user:password@pgbouncer-host:6432/database
```

## Files Modified/Created

### New Files
- `docker-compose.override.yml` - PostgreSQL services
- `api/exporter-portal/prisma/schema.prisma` - Database schema
- `api/exporter-portal/prisma/seed.ts` - Database seeding
- `api/exporter-portal/src/lib/prisma.ts` - Prisma client
- `api/national-bank/.env.example` - Environment template
- `api/exporter-portal/.env.example` - Environment template
- `POSTGRES_SETUP_GUIDE.md` - Detailed setup guide
- `POSTGRES_README.md` - This file
- `setup-postgres.sh` - Linux/macOS setup script
- `setup-postgres.bat` - Windows setup script
- `pgadmin-servers.json` - pgAdmin configuration

### Modified Files
- `api/exporter-portal/package.json` - Added Prisma dependencies
- `api/exporter-portal/src/services/export-request.service.ts` - Refactored to use Prisma
- `api/national-bank/package.json` - Already had Prisma configured

## Next Steps

1. ✅ Run setup script or follow manual steps
2. ✅ Verify databases are created and migrations run
3. ✅ Start the APIs
4. ✅ Test with sample requests
5. Monitor database performance
6. Set up automated backups
7. Plan production deployment

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review POSTGRES_SETUP_GUIDE.md for detailed information
3. Check Prisma documentation: https://www.prisma.io/docs/
4. Review Docker Compose documentation: https://docs.docker.com/compose/

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
