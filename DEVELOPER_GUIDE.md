# Developer Guide - Coffee Blockchain Consortium

## 🎯 Overview

This guide provides comprehensive information for developers working on the Coffee Blockchain Consortium system. The system is a PostgreSQL-only REST API architecture with 7 microservices.

## 📚 Table of Contents

1. [Architecture](#architecture)
2. [Project Structure](#project-structure)
3. [Development Setup](#development-setup)
4. [API Services](#api-services)
5. [Database Schema](#database-schema)
6. [Authentication](#authentication)
7. [Error Handling](#error-handling)
8. [Logging](#logging)
9. [Testing](#testing)
10. [Deployment](#deployment)

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│                      Port 80 / 5173                         │
└────────────────────────┬───────────��────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌────▼────────┐ ┌────▼────────┐
│ Commercial Bank│ │ National Bank│ │    ECTA     │
│   API (3001)   │ │  API (3002)  │ │  API (3003) │
└────────────────┘ └─────────────┘ └─────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌────▼────────┐ ┌────▼────────┐
│ Shipping Line  │ │   Custom    │ │     ECX     │
│  API (3004)    │ │ Authorities │ │  API (3006) │
│                │ │ API (3005)  │ │             │
└────────────────┘ └─────────────┘ └─────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌────▼────────┐ ┌────▼────────┐
│  Exporter      │ │ PostgreSQL  │ │   Redis     │
│  Portal API    │ │  Database   │ │  (Optional) │
│  (3007)        │ │  (5432)     │ │  (6379)     │
└────────────────┘ └─────────────┘ └─────────────┘
```

### Technology Stack

**Backend:**
- Node.js 18+
- Express.js 4.18
- TypeScript 5.3
- PostgreSQL 15
- Redis (optional)
- Socket.io (WebSocket)

**Frontend:**
- React 18.2
- Vite 7.2
- Material-UI 5.18
- React Query (TanStack)
- React Router v6

**DevOps:**
- Docker & Docker Compose
- PostgreSQL 15-alpine

## 📁 Project Structure

```
/home/gu-da/cbc/
├── api/
│   ├── commercial-bank/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── export.controller.ts
│   │   │   │   ├── export-postgres.controller.ts  # ✅ NEW
│   │   │   │   ├── exporter.controller.ts
│   │   │   │   └── quality.controller.ts
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── export.routes.ts
│   │   │   │   ├── export-postgres.routes.ts     # ✅ NEW
│   │   │   │   ├── exporter.routes.ts
│   │   │   │   └── quality.routes.ts
│   │   │   └── index.ts                          # ✅ UPDATED
│   │   ├── package.json                          # ✅ UPDATED
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── national-bank/
│   ├── ecta/
│   ├── shipping-line/
│   ├── custom-authorities/
│   ├── ecx/
│   ├── exporter-portal/
│   │
│   └── shared/
│       ├── database/
│       │   ���── migrations/
│       │   │   ├── 001_create_ecta_preregistration_tables.sql
│       │   │   ├── 002_create_documents_table.sql
│       │   │   ├── 003_create_audit_log_table.sql
│       │   │   └── 004_create_exports_table.sql
│       │   ├── pool.ts                           # PostgreSQL connection pool
│       │   └── init.sql
│       ├── middleware/
│       │   ├── auth.middleware.ts
│       │   ├── error.middleware.ts
│       │   └── monitoring.middleware.ts
│       ├── services/
│       │   ├── export.service.ts
│       │   ├── postgres-export.service.ts        # ✅ NEW
│       │   ├── ecta-preregistration.service.ts
│       │   ├── postgres-user.service.ts
│       │   ├── audit.service.ts
│       │   ├── email.service.ts
│       │   ├── cache.service.ts
│       │   ├── websocket.service.ts
│       │   └── monitoring.service.ts
│       ├── types/
│       ├── auth/
│       ├── logger.ts
│       ├── error-codes.ts
│       ├── validation.schemas.ts
│       ├── input.sanitizer.ts
│       ├── password.validator.ts
│       ├── security.config.ts
│       ├── security.best-practices.ts
│       ├── swagger.config.ts
│       ├── package.json                          # ✅ UPDATED
│       └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tsconfig.json
│   └── Dockerfile
│
├── docker-compose.postgres.yml
├── .env.template
├── README.md
├── IMPLEMENTATION_GUIDE.md
├── CHANGES_SUMMARY.md
├── DEPLOYMENT_CHECKLIST.md
└── DEVELOPER_GUIDE.md                            # ✅ THIS FILE
```

## 🚀 Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)
- Git

### Step 1: Clone Repository

```bash
cd /home/gu-da/cbc
```

### Step 2: Setup Environment Files

```bash
# Copy environment templates
cp .env.template .env
cp api/commercial-bank/.env.template api/commercial-bank/.env
cp api/national-bank/.env.template api/national-bank/.env
cp api/ecta/.env.template api/ecta/.env
cp api/shipping-line/.env.template api/shipping-line/.env
cp api/custom-authorities/.env.template api/custom-authorities/.env
cp api/ecx/.env.template api/ecx/.env
cp api/exporter-portal/.env.template api/exporter-portal/.env
cp frontend/.env.template frontend/.env
```

### Step 3: Start Docker Services

```bash
# Start PostgreSQL and other services
docker-compose -f docker-compose.postgres.yml up -d

# Verify services are running
docker-compose -f docker-compose.postgres.yml ps
```

### Step 4: Install Dependencies

```bash
# Install shared library dependencies
cd api/shared
npm install

# Install API service dependencies (example: commercial-bank)
cd ../commercial-bank
npm install

# Install frontend dependencies
cd ../../frontend
npm install
```

### Step 5: Start Development Servers

**Terminal 1: API Service**
```bash
cd api/commercial-bank
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

**Terminal 3: Monitor Logs**
```bash
docker-compose -f docker-compose.postgres.yml logs -f
```

## 🔌 API Services

### Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Commercial Bank | 3001 | FX approval and banking |
| National Bank | 3002 | Regulatory and FX management |
| ECTA | 3003 | Quality certification |
| Shipping Line | 3004 | Shipment tracking |
| Custom Authorities | 3005 | Customs clearance |
| ECX | 3006 | Coffee lot management |
| Exporter Portal | 3007 | Exporter interface |

### Health Checks

Each service provides health check endpoints:

```bash
# Health check (database connectivity)
curl http://localhost:3001/health

# Ready check (Kubernetes readiness probe)
curl http://localhost:3001/ready

# Liveness check (Kubernetes liveness probe)
curl http://localhost:3001/live
```

### API Response Format

All APIs follow a standard response format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "retryable": false
  }
}
```

## 🗄️ Database Schema

### Core Tables

#### exports
```sql
CREATE TABLE exports (
  id VARCHAR(255) PRIMARY KEY,
  exporter_id VARCHAR(255),
  exporter_name VARCHAR(255),
  coffee_type VARCHAR(100),
  quantity DECIMAL(10, 2),
  destination_country VARCHAR(100),
  status VARCHAR(50),
  created_by VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### export_status_history
```sql
CREATE TABLE export_status_history (
  id SERIAL PRIMARY KEY,
  export_id VARCHAR(255),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_by VARCHAR(255),
  changed_at TIMESTAMP,
  notes TEXT
);
```

#### export_approvals
```sql
CREATE TABLE export_approvals (
  id SERIAL PRIMARY KEY,
  export_id VARCHAR(255),
  organization VARCHAR(100),
  approval_type VARCHAR(50),
  status VARCHAR(50),
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  notes TEXT
);
```

### Export Workflow States

```
PENDING
  ↓
FX_APPROVED (National Bank)
  ↓
QUALITY_CERTIFIED (ECTA)
  ↓
SHIPMENT_SCHEDULED (Shipping Line)
  ↓
SHIPPED
  ↓
COMPLETED

Alternative paths:
- FX_REJECTED
- QUALITY_REJECTED
- CANCELLED
```

## 🔐 Authentication

### JWT Authentication

All protected endpoints require JWT authentication:

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "password123"
  }'

# Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "username": "user@example.com",
      "organizationId": "org-id",
      "role": "admin"
    }
  }
}
```

### Using Token

```bash
# Include token in Authorization header
curl http://localhost:3001/api/exports \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token Configuration

Set in `.env`:
```
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

## ❌ Error Handling

### Error Codes

```typescript
enum ErrorCode {
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  // ... more codes
}
```

### Error Handling Pattern

```typescript
try {
  // Your code
} catch (error: any) {
  if (error instanceof AppError) {
    res.status(error.httpStatus).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      },
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
      },
    });
  }
}
```

## 📝 Logging

### Logger Usage

```typescript
import { createLogger } from '../../../shared/logger';

const logger = createLogger('MyService');

// Log levels
logger.error('Error message', { context: 'data' });
logger.warn('Warning message', { context: 'data' });
logger.info('Info message', { context: 'data' });
logger.debug('Debug message', { context: 'data' });
```

### Log Output

Logs are written to:
- Console (development)
- Daily rotating files (production)
- Location: `logs/` directory

### Log Format

```
[2024-01-15 10:30:45] [INFO] [MyService] Message here
  context: { key: 'value' }
```

## 🧪 Testing

### Unit Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- export.controller.test.ts
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run with specific database
DB_HOST=localhost npm run test:integration
```

### Test Structure

```typescript
describe('ExportController', () => {
  describe('createExport', () => {
    it('should create export with valid data', async () => {
      // Arrange
      const req = { user: { id: 'user-1' }, body: { /* ... */ } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      // Act
      await controller.createExport(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
```

## 🚀 Deployment

### Build for Production

```bash
# Build TypeScript
npm run build

# Build Docker image
docker build -t commercial-bank-api:1.0.0 -f Dockerfile .
```

### Deploy with Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.postgres.yml up -d

# View logs
docker-compose -f docker-compose.postgres.yml logs -f

# Stop services
docker-compose -f docker-compose.postgres.yml down
```

### Environment Variables for Production

```bash
NODE_ENV=production
LOG_LEVEL=info
DB_HOST=postgres-prod.example.com
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=strong-password
JWT_SECRET=very-long-secret-key-min-32-chars
CORS_ORIGIN=https://example.com
```

## 📊 Monitoring

### Health Checks

```bash
# Check all services
for port in 3001 3002 3003 3004 3005 3006 3007; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq .
done
```

### Database Monitoring

```bash
# Connect to database
docker-compose -f docker-compose.postgres.yml exec postgres psql -U postgres -d coffee_export_db

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check active connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
```

### Performance Monitoring

```bash
# Monitor resource usage
docker stats

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/health
```

## 🔄 Common Development Tasks

### Add New API Endpoint

1. **Create Controller Method**
```typescript
public myEndpoint = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    // Implementation
    res.json({ success: true, data: result });
  } catch (error: any) {
    this.handleError(error, res);
  }
};
```

2. **Add Route**
```typescript
router.post('/my-endpoint', requireAuth, controller.myEndpoint);
```

3. **Test Endpoint**
```bash
curl -X POST http://localhost:3001/api/my-endpoint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "data": "value" }'
```

### Add Database Migration

1. **Create Migration File**
```sql
-- api/shared/database/migrations/005_my_migration.sql
CREATE TABLE my_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. **Update docker-compose.postgres.yml**
```yaml
volumes:
  - ./api/shared/database/migrations/005_my_migration.sql:/docker-entrypoint-initdb.d/005_my_migration.sql
```

3. **Restart Database**
```bash
docker-compose -f docker-compose.postgres.yml restart postgres
```

### Debug Issues

```bash
# View service logs
docker-compose -f docker-compose.postgres.yml logs commercialbank-api

# View database logs
docker-compose -f docker-compose.postgres.yml logs postgres

# Connect to database and check data
docker-compose -f docker-compose.postgres.yml exec postgres psql -U postgres -d coffee_export_db

# Check service health
curl http://localhost:3001/health | jq .
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contributing

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages

### Pull Request Process

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "Add my feature"`
3. Push to branch: `git push origin feature/my-feature`
4. Create Pull Request with description
5. Wait for code review and CI/CD checks
6. Merge after approval

### Testing Requirements

- Write unit tests for new features
- Ensure all tests pass: `npm test`
- Maintain code coverage above 70%
- Test API endpoints manually

## 📞 Support

For questions or issues:
1. Check the documentation
2. Review existing code examples
3. Check logs for error messages
4. Ask in team chat or create an issue

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: ✅ READY FOR DEVELOPMENT
