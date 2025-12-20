# Coffee Blockchain Consortium - Setup & Development Guide

## PostgreSQL-Only System

---

## 1. PREREQUISITES

### System Requirements
- **Node.js**: v18+ (for API services)
- **Node.js**: v20+ (for frontend)
- **Docker**: Latest version
- **Docker Compose**: v2.0+
- **Git**: Latest version
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: Minimum 10GB

### Verify Installation
```bash
node --version      # Should be v18+
npm --version       # Should be v9+
docker --version    # Should be latest
docker-compose --version  # Should be v2.0+
git --version       # Should be latest
```

---

## 2. PROJECT STRUCTURE

```
coffee-blockchain-consortium/
├── .env.template                    # Root environment template
├── .env                             # Root environment (local, not in git)
├── .gitignore                       # Git ignore rules
├── docker-compose.postgres.yml      # Docker Compose configuration
├── SETUP_GUIDE.md                   # This file
├── REQUIREMENTS_CHECKLIST_POSTGRES_ONLY.md
│
├── api/                             # Backend services
│   ├── commercial-bank/             # Port 3001 - FX Approval
│   │   ├── src/
│   │   ├── .env.template
│   │   ├── .env
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── national-bank/               # Port 3002 - Regulatory
│   │   ├── src/
│   │   ├── .env.template
│   │   ├── .env
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── ecta/                        # Port 3003 - Quality Certification
│   │   ├── src/
│   │   ├── .env.template
│   │   ├── .env
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── shipping-line/               # Port 3004 - Shipment Tracking
│   │   ├── src/
│   │   ├── .env.template
│   │   ├── .env
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── custom-authorities/          # Port 3005 - Customs Clearance
│   │   ├── src/
│   │   ├── .env.template
│   │   ├── .env
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── ecx/                         # Port 3006 - Coffee Lot Management
│   │   ├── src/
│   │   ├── .env.template
│   │   ├── .env
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── exporter-portal/             # Port 3007 - Exporter Interface
│   │   ├── src/
│   │   ├── .env.template
│   │   ├── .env
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                      # Shared utilities & services
│       ├── database/
│       │   ├── migrations/          # SQL migration files
│       │   ├── db.config.ts
│       │   └── init.sql
│       ├── middleware/
│       ├── services/
│       ├── package.json
│       └── tsconfig.json
│
├── frontend/                        # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── config/
│   │   └── App.tsx
│   ├── .env.template
│   ├── .env
│   ├── package.json
│   ├── vite.config.js
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── nginx.conf
│
└── config/                          # Hyperledger Fabric config (for future)
    ├── configtx.yaml
    ├── core.yaml
    └── orderer.yaml
```

---

## 3. QUICK START (5 MINUTES)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/coffee-blockchain-consortium.git
cd coffee-blockchain-consortium
```

### Step 2: Setup Environment Files
```bash
# Root environment
cp .env.template .env

# API Services
cp api/commercial-bank/.env.template api/commercial-bank/.env
cp api/national-bank/.env.template api/national-bank/.env
cp api/ecta/.env.template api/ecta/.env
cp api/shipping-line/.env.template api/shipping-line/.env
cp api/custom-authorities/.env.template api/custom-authorities/.env
cp api/ecx/.env.template api/ecx/.env
cp api/exporter-portal/.env.template api/exporter-portal/.env

# Frontend
cp frontend/.env.template frontend/.env
```

### Step 3: Start Docker Services
```bash
docker-compose -f docker-compose.postgres.yml up -d
```

### Step 4: Verify Services
```bash
docker-compose -f docker-compose.postgres.yml ps
# All services should show "Up"
```

### Step 5: Access Applications
- **Frontend**: http://localhost:80 or http://localhost:5173 (dev)
- **Commercial Bank API**: http://localhost:3001/health
- **National Bank API**: http://localhost:3002/health
- **ECTA API**: http://localhost:3003/health
- **Shipping Line API**: http://localhost:3004/health
- **Custom Authorities API**: http://localhost:3005/health
- **Database**: localhost:5432

---

## 4. DETAILED SETUP

### 4.1 Install Dependencies

#### Backend (Shared Library)
```bash
cd api/shared
npm install
cd ../..
```

#### API Services
```bash
# Commercial Bank
cd api/commercial-bank
npm install
cd ../..

# National Bank
cd api/national-bank
npm install
cd ../..

# ECTA
cd api/ecta
npm install
cd ../..

# Shipping Line
cd api/shipping-line
npm install
cd ../..

# Custom Authorities
cd api/custom-authorities
npm install
cd ../..

# ECX
cd api/ecx
npm install
cd ../..

# Exporter Portal
cd api/exporter-portal
npm install
cd ../..
```

#### Frontend
```bash
cd frontend
npm install
cd ..
```

### 4.2 Configure Environment Variables

#### Root `.env`
```bash
nano .env
# Edit with your local values
```

#### Each API Service `.env`
```bash
nano api/commercial-bank/.env
# Edit with your local values
# Repeat for other services
```

#### Frontend `.env`
```bash
nano frontend/.env
# Edit with your local values
```

### 4.3 Start Docker Services
```bash
# Start all services (PostgreSQL, APIs, Frontend)
docker-compose -f docker-compose.postgres.yml up -d

# View logs
docker-compose -f docker-compose.postgres.yml logs -f

# Stop services
docker-compose -f docker-compose.postgres.yml down
```

### 4.4 Database Setup
```bash
# Database migrations run automatically via docker-entrypoint-initdb.d
# Verify database is ready
docker-compose -f docker-compose.postgres.yml exec postgres pg_isready

# Connect to database
docker-compose -f docker-compose.postgres.yml exec postgres psql -U postgres -d coffee_export_db

# View tables
\dt

# Exit
\q
```

---

## 5. DEVELOPMENT WORKFLOW

### 5.1 Start Development Environment

#### Terminal 1: Start Docker Services
```bash
docker-compose -f docker-compose.postgres.yml up -d
```

#### Terminal 2: Start API Service (Example: Commercial Bank)
```bash
cd api/commercial-bank
npm run dev
# Service runs on http://localhost:3001
```

#### Terminal 3: Start Frontend
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

### 5.2 Development Commands

#### API Services
```bash
# Development (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Start production build
npm start

# Linting
npm run lint

# Tests
npm test
```

#### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format

# Tests
npm run test

# Type checking
npm run type-check
```

### 5.3 Database Operations

#### Connect to Database
```bash
docker-compose -f docker-compose.postgres.yml exec postgres psql -U postgres -d coffee_export_db
```

#### View Tables
```sql
\dt                    -- List all tables
\d exporter_profiles   -- Describe table
SELECT * FROM exports LIMIT 10;  -- Query data
```

#### Run Migrations Manually
```bash
# Migrations run automatically on container start
# To run manually:
docker-compose -f docker-compose.postgres.yml exec postgres psql -U postgres -d coffee_export_db -f /docker-entrypoint-initdb.d/001_create_ecta_preregistration_tables.sql
```

---

## 6. API ENDPOINTS

### Health Checks
```bash
# Commercial Bank
curl http://localhost:3001/health

# National Bank
curl http://localhost:3002/health

# ECTA
curl http://localhost:3003/health

# Shipping Line
curl http://localhost:3004/health

# Custom Authorities
curl http://localhost:3005/health
```

### Example API Calls

#### Create Export
```bash
curl -X POST http://localhost:3001/api/exports \
  -H "Content-Type: application/json" \
  -d '{
    "exporter_id": "uuid-here",
    "coffee_type": "Arabica",
    "quantity": 1000,
    "destination_country": "USA"
  }'
```

#### Get Exports
```bash
curl http://localhost:3001/api/exports
```

#### Get Export by ID
```bash
curl http://localhost:3001/api/exports/{export_id}
```

---

## 7. TROUBLESHOOTING

### Issue: Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port in .env
PORT=3008
```

### Issue: Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.postgres.yml ps

# Check logs
docker-compose -f docker-compose.postgres.yml logs postgres

# Restart PostgreSQL
docker-compose -f docker-compose.postgres.yml restart postgres
```

### Issue: npm install Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Docker Build Fails
```bash
# Rebuild images
docker-compose -f docker-compose.postgres.yml build --no-cache

# Start services
docker-compose -f docker-compose.postgres.yml up -d
```

### Issue: Frontend Not Loading
```bash
# Check if frontend is running
curl http://localhost:5173

# Check logs
docker-compose -f docker-compose.postgres.yml logs frontend

# Restart frontend
docker-compose -f docker-compose.postgres.yml restart frontend
```

---

## 8. TESTING

### Backend Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- exportService.test.ts

# Run with coverage
npm test -- --coverage
```

### Frontend Tests
```bash
# Run tests
npm run test

# Run with UI
npm run test:ui

# Coverage
npm run test:coverage
```

---

## 9. DEPLOYMENT

### Production Build

#### API Services
```bash
# Build Docker image
docker build -f api/commercial-bank/Dockerfile -t cbc-commercial-bank:latest .

# Tag for registry
docker tag cbc-commercial-bank:latest your-registry/cbc-commercial-bank:latest

# Push to registry
docker push your-registry/cbc-commercial-bank:latest
```

#### Frontend
```bash
# Build Docker image
docker build -f frontend/Dockerfile -t cbc-frontend:latest .

# Tag for registry
docker tag cbc-frontend:latest your-registry/cbc-frontend:latest

# Push to registry
docker push your-registry/cbc-frontend:latest
```

### Deploy with Docker Compose
```bash
# Pull latest images
docker-compose -f docker-compose.postgres.yml pull

# Start services
docker-compose -f docker-compose.postgres.yml up -d

# Verify
docker-compose -f docker-compose.postgres.yml ps
```

---

## 10. MONITORING & LOGS

### View Logs
```bash
# All services
docker-compose -f docker-compose.postgres.yml logs -f

# Specific service
docker-compose -f docker-compose.postgres.yml logs -f commercial-bank-api

# Last 100 lines
docker-compose -f docker-compose.postgres.yml logs --tail=100
```

### Health Checks
```bash
# Check all services
for port in 3001 3002 3003 3004 3005; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq .
done
```

### Database Monitoring
```bash
# Connect to database
docker-compose -f docker-compose.postgres.yml exec postgres psql -U postgres -d coffee_export_db

# Check active connections
SELECT * FROM pg_stat_activity;

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 11. COMMON TASKS

### Add New Environment Variable
1. Add to `.env.template` with placeholder
2. Add to each service's `.env.template`
3. Update `.env` files with real values
4. Update code to use `process.env.NEW_VAR`

### Create New API Endpoint
1. Create route file in `src/routes/`
2. Create controller in `src/controllers/`
3. Add route to `src/index.ts`
4. Test with curl or Postman

### Add Database Migration
1. Create SQL file in `api/shared/database/migrations/`
2. Name it `00X_description.sql`
3. Add to `init.sql` if needed
4. Restart Docker to apply

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all packages
npm update
```

---

## 12. USEFUL COMMANDS

```bash
# Docker
docker-compose -f docker-compose.postgres.yml up -d      # Start
docker-compose -f docker-compose.postgres.yml down       # Stop
docker-compose -f docker-compose.postgres.yml ps         # Status
docker-compose -f docker-compose.postgres.yml logs -f    # Logs
docker-compose -f docker-compose.postgres.yml exec postgres psql -U postgres -d coffee_export_db  # DB

# Git
git status
git add .
git commit -m "message"
git push origin main

# npm
npm install
npm run dev
npm run build
npm test
npm run lint

# Database
psql -U postgres -d coffee_export_db
\dt                    # List tables
\d table_name          # Describe table
SELECT * FROM table;   # Query
```

---

## 13. NEXT STEPS

1. ✅ Clone repository
2. ✅ Setup environment files
3. ✅ Start Docker services
4. ✅ Verify all services running
5. ✅ Access frontend at http://localhost
6. ✅ Test API endpoints
7. ✅ Start development
8. ✅ Create features
9. ✅ Run tests
10. ✅ Deploy to production

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: ✅ Ready for development
