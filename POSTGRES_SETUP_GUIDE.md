# PostgreSQL Configuration & Setup Guide

This guide explains how to set up and run the system with PostgreSQL databases for both the National Bank API and Exporter Portal API.

## Overview

The system now uses PostgreSQL for persistent data storage:

- **National Bank API**: Uses Prisma ORM with PostgreSQL for user management and export licensing
- **Exporter Portal API**: Uses Prisma ORM with PostgreSQL for export requests and documents

Both services previously used in-memory storage; they are now fully database-backed.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for running migrations locally)
- PostgreSQL client tools (optional, for manual database inspection)

## Quick Start (Docker Compose)

### 1. Start PostgreSQL Services

The `docker-compose.override.yml` file provides PostgreSQL services for both APIs:

```bash
# Start all services including PostgreSQL
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Verify PostgreSQL containers are running
docker-compose ps | grep postgres
```

This will start:
- `postgres-national-bank` on port 5432
- `postgres-exporter-portal` on port 5433
- `pgadmin` (optional UI) on port 5050

### 2. Configure Environment Variables

Copy the `.env.example` files to `.env` in each service directory:

```bash
# National Bank API
cp api/national-bank/.env.example api/national-bank/.env

# Exporter Portal API
cp api/exporter-portal/.env.example api/exporter-portal/.env
```

The `.env` files are pre-configured to connect to the Docker Compose PostgreSQL services.

### 3. Run Database Migrations

#### National Bank API

```bash
cd api/national-bank

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# (Optional) Start Prisma Studio to inspect database
npm run prisma:studio
```

#### Exporter Portal API

```bash
cd api/exporter-portal

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# (Optional) Seed database with initial data
npm run prisma:seed
```

### 4. Start the APIs

In separate terminals:

```bash
# Terminal 1: National Bank API
cd api/national-bank
npm run dev

# Terminal 2: Exporter Portal API
cd api/exporter-portal
npm run dev
```

Both services will now connect to their respective PostgreSQL databases.

## Database Connection Details

### National Bank API

- **Container Name**: `postgres-national-bank`
- **Host**: `postgres-national-bank` (from Docker) or `localhost` (from host)
- **Port**: 5432
- **Username**: `nationalbank`
- **Password**: `nationalbank_dev_password`
- **Database**: `national_bank_db`
- **Connection String**: `postgresql://nationalbank:nationalbank_dev_password@postgres-national-bank:5432/national_bank_db`

### Exporter Portal API

- **Container Name**: `postgres-exporter-portal`
- **Host**: `postgres-exporter-portal` (from Docker) or `localhost` (from host)
- **Port**: 5433
- **Username**: `exporter_portal`
- **Password**: `exporter_portal_dev_password`
- **Database**: `exporter_portal_db`
- **Connection String**: `postgresql://exporter_portal:exporter_portal_dev_password@postgres-exporter-portal:5433/exporter_portal_db`

## Database Management

### Using pgAdmin (Web UI)

pgAdmin is included in the docker-compose.override.yml for easy database management:

1. Open http://localhost:5050 in your browser
2. Login with:
   - Email: `admin@coffee-export.local`
   - Password: `admin`
3. Add servers for both PostgreSQL instances:
   - **National Bank**: Host `postgres-national-bank`, Port 5432
   - **Exporter Portal**: Host `postgres-exporter-portal`, Port 5433

### Using Prisma Studio

Prisma Studio provides a visual database editor:

```bash
# National Bank API
cd api/national-bank
npm run prisma:studio

# Exporter Portal API
cd api/exporter-portal
npm run prisma:studio
```

### Using psql (Command Line)

```bash
# Connect to National Bank database
psql -h localhost -p 5432 -U nationalbank -d national_bank_db

# Connect to Exporter Portal database
psql -h localhost -p 5433 -U exporter_portal -d exporter_portal_db
```

## Prisma Commands Reference

### National Bank API

```bash
cd api/national-bank

# Generate Prisma Client (required after schema changes)
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Deploy existing migrations (production)
npm run prisma:migrate:deploy

# Open Prisma Studio (visual database editor)
npm run prisma:studio
```

### Exporter Portal API

```bash
cd api/exporter-portal

# Generate Prisma Client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Deploy existing migrations (production)
npm run prisma:migrate:deploy

# Open Prisma Studio
npm run prisma:studio

# Run seed script
npm run prisma:seed
```

## Database Schemas

### National Bank API Schema

Located at: `api/national-bank/prisma/schema.prisma`

**Models**:
- `User`: Portal users (exporters) with authentication

### Exporter Portal API Schema

Located at: `api/exporter-portal/prisma/schema.prisma`

**Models**:
- `ExportRequest`: Coffee export requests with full details
- `ExportDocument`: Documents attached to export requests
- `StatusHistory`: Audit trail of status changes

## Troubleshooting

### PostgreSQL Connection Issues

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**: Ensure PostgreSQL containers are running:
```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml ps
```

**Problem**: `FATAL: password authentication failed for user "nationalbank"`

**Solution**: Check DATABASE_URL in `.env` file matches the credentials in docker-compose.override.yml

### Migration Issues

**Problem**: `Error: P3005 - The database schema is not in sync with the Prisma schema`

**Solution**: 
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually sync
npx prisma db push
```

**Problem**: `Error: P1001 - Can't reach database server`

**Solution**: 
1. Verify PostgreSQL container is running: `docker-compose ps`
2. Check DATABASE_URL in `.env` file
3. Wait for PostgreSQL to be ready (check healthcheck): `docker-compose logs postgres-national-bank`

### Prisma Client Issues

**Problem**: `Cannot find module '@prisma/client'`

**Solution**: Regenerate Prisma Client:
```bash
npm run prisma:generate
```

## Environment Variables

### National Bank API (.env)

```env
# Database
DATABASE_URL=postgresql://nationalbank:nationalbank_dev_password@postgres-national-bank:5432/national_bank_db

# Server
PORT=3000
NODE_ENV=development

# Fabric & IPFS
ORGANIZATION_ID=nationalbank
ORGANIZATION_NAME=NationalBank
MSP_ID=NationalBankMSP
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management
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

### Exporter Portal API (.env)

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

For production deployments:

1. **Use strong passwords** instead of dev defaults
2. **Use environment-specific .env files** (never commit .env to git)
3. **Enable SSL/TLS** for database connections
4. **Use managed PostgreSQL services** (AWS RDS, Azure Database, etc.)
5. **Run migrations** before deploying new code:
   ```bash
   npm run prisma:migrate:deploy
   ```
6. **Set up automated backups** for PostgreSQL
7. **Monitor database performance** and connections
8. **Use connection pooling** for production (PgBouncer, etc.)

## Data Persistence

All data is now persisted in PostgreSQL:

- **National Bank API**: User accounts, export licenses, authentication
- **Exporter Portal API**: Export requests, documents, status history

Data survives container restarts and is stored in Docker volumes:
- `postgres-national-bank` volume
- `postgres-exporter-portal` volume

To preserve data when stopping containers:
```bash
# Stop containers (data persists in volumes)
docker-compose -f docker-compose.yml -f docker-compose.override.yml down

# Start containers (data is restored)
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

To completely remove data:
```bash
# Remove containers AND volumes (WARNING: deletes all data)
docker-compose -f docker-compose.yml -f docker-compose.override.yml down -v
```

## Next Steps

1. ✅ Start PostgreSQL services with Docker Compose
2. ✅ Configure .env files
3. ✅ Run database migrations
4. ✅ Start the APIs
5. Test the APIs with sample requests
6. Monitor database performance
7. Set up automated backups

For more information on Prisma, visit: https://www.prisma.io/docs/
