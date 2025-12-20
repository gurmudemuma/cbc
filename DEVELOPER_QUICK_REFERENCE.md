# Developer Quick Reference

## Quick Start

### 1. Start Infrastructure
```bash
cd /home/gu-da/cbc
docker-compose -f docker-compose.postgres.yml up -d
```

### 2. Start All APIs
```bash
docker-compose -f docker-compose.apis.yml up -d
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Common Commands

### Development
```bash
# Install dependencies
npm install --legacy-peer-deps

# Build all services
npm run build

# Start development mode
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### Docker
```bash
# View logs
docker-compose -f docker-compose.apis.yml logs -f [service-name]

# Stop all services
docker-compose -f docker-compose.apis.yml down

# Rebuild images
docker-compose -f docker-compose.apis.yml build --no-cache

# Remove volumes
docker-compose -f docker-compose.apis.yml down -v
```

---

## API Endpoints

### Commercial Bank (Port 3001)
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/exports` - List exports
- `POST /api/exports` - Create export
- `GET /api/exports/:id` - Get export details

### Custom Authorities (Port 3002)
- `GET /api/customs` - List customs clearances
- `POST /api/customs/approve` - Approve customs
- `POST /api/customs/reject` - Reject customs

### ECTA (Port 3003)
- `GET /api/licenses` - List licenses
- `POST /api/licenses/approve` - Approve license
- `GET /api/quality` - List quality inspections

### Exporter Portal (Port 3004)
- `POST /api/preregistration/profile` - Register profile
- `POST /api/preregistration/license` - Apply for license
- `POST /api/preregistration/laboratory` - Register laboratory

### National Bank (Port 3005)
- `GET /api/fx` - List FX approvals
- `POST /api/fx/approve` - Approve FX

### ECX (Port 3006)
- `GET /api/lots` - List coffee lots
- `POST /api/lots/verify` - Verify lot

### Shipping Line (Port 3007)
- `GET /api/shipments` - List shipments
- `POST /api/shipments/schedule` - Schedule shipment

---

## File Structure

```
/home/gu-da/cbc/
├── api/
│   ├── commercial-bank/     # Commercial Bank API
│   ├── custom-authorities/  # Customs Authority API
│   ├── ecta/               # ECTA API
│   ├── ecx/                # ECX API
│   ├─�� exporter-portal/    # Exporter Portal API
│   ├── national-bank/      # National Bank API
│   ├── shipping-line/      # Shipping Line API
│   └── shared/             # Shared utilities
├── frontend/               # React frontend
├── config/                 # Hyperledger config
├── docker-compose.postgres.yml
├── docker-compose.apis.yml
└── package.json
```

---

## Key Files

### Shared Services
- `api/shared/logger.ts` - Logging service
- `api/shared/cache.service.ts` - Redis caching
- `api/shared/email.service.ts` - Email notifications
- `api/shared/websocket.service.ts` - WebSocket events
- `api/shared/types/index.ts` - TypeScript types
- `api/shared/env.validator.postgres.ts` - Environment validation

### Database
- `api/shared/database/db.config.ts` - Database configuration
- `api/shared/database/pool.ts` - Connection pooling
- `api/shared/database/init.sql` - Database initialization

### Middleware
- `api/shared/middleware/auth.middleware.ts` - Authentication
- `api/shared/middleware/error.middleware.ts` - Error handling
- `api/shared/middleware/monitoring.middleware.ts` - Request monitoring

---

## Environment Variables

### Required for All Services
```
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug
JWT_SECRET=your-secret-key-min-32-characters
CORS_ORIGIN=http://localhost:5173
```

### Database
```
DB_HOST=postgres
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Redis
```
REDIS_HOST=redis
REDIS_PORT=6379
```

### Email
```
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@coffeeexport.com
```

---

## Common Issues & Solutions

### Issue: Port Already in Use
```bash
# Find process using port
lsof -i :6379

# Kill process
kill -9 <PID>

# Or stop Redis service
sudo systemctl stop redis-server
```

### Issue: Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs postgres

# Restart PostgreSQL
docker restart postgres
```

### Issue: Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Issue: TypeScript Compilation Error
```bash
# Clear build cache
npm run clean

# Rebuild
npm run build
```

---

## Debugging

### Enable Debug Logging
```bash
# Set environment variable
export LOG_LEVEL=debug

# Or in .env
LOG_LEVEL=debug
```

### View Docker Logs
```bash
# All services
docker-compose -f docker-compose.apis.yml logs -f

# Specific service
docker-compose -f docker-compose.apis.yml logs -f commercial-bank

# Last 100 lines
docker-compose -f docker-compose.apis.yml logs --tail=100
```

### Database Debugging
```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d coffee_export_db

# List tables
\dt

# Query exports
SELECT * FROM exports LIMIT 10;

# Check logs
\l
```

---

## Testing

### Run Tests
```bash
npm run test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- export.controller.test.ts
```

### Watch Mode
```bash
npm test -- --watch
```

---

## Code Quality

### Lint Code
```bash
npm run lint
```

### Fix Linting Issues
```bash
npm run lint:fix
```

### Format Code
```bash
npm run format
```

### Type Check
```bash
npm run type-check
```

---

## Git Workflow

### Create Feature Branch
```bash
git checkout -b feature/export-approval
```

### Commit Changes
```bash
git add .
git commit -m "feat: add export approval workflow"
```

### Push Changes
```bash
git push origin feature/export-approval
```

### Create Pull Request
```bash
# On GitHub, create PR from feature branch to main
```

---

## Performance Tips

### 1. Use Caching
```typescript
const cacheKey = `export:${id}`;
let export = await cacheService.get(cacheKey);
if (!export) {
  export = await db.query(...);
  await cacheService.set(cacheKey, export, 3600);
}
```

### 2. Use Pagination
```typescript
const page = req.query.page || 1;
const limit = req.query.limit || 10;
const offset = (page - 1) * limit;
```

### 3. Use Indexes
```sql
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_exports_exporter_id ON exports(exporter_id);
```

### 4. Use Connection Pooling
```typescript
// Already configured in db.config.ts
const result = await pool.query(sql, params);
```

---

## Security Checklist

- [ ] All environment variables are set
- [ ] JWT_SECRET is at least 32 characters
- [ ] Database password is strong
- [ ] CORS_ORIGIN is set correctly
- [ ] Authentication middleware is applied
- [ ] Input validation is in place
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting is enabled
- [ ] HTTPS is enabled in production
- [ ] Sensitive data is not logged

---

## Deployment Checklist

- [ ] All tests pass
- [ ] Code is linted and formatted
- [ ] Environment variables are configured
- [ ] Database migrations are run
- [ ] Docker images are built
- [ ] Health checks are passing
- [ ] Logs are being collected
- [ ] Monitoring is configured
- [ ] Backups are configured
- [ ] Documentation is updated

---

## Useful Links

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Docker Documentation](https://docs.docker.com/)
- [React Documentation](https://react.dev/)

---

## Support

For issues or questions:
1. Check the logs: `docker logs <container-name>`
2. Review the documentation in `/home/gu-da/cbc/`
3. Check the code comments
4. Review the BEST_PRACTICES_GUIDE.md

---

**Last Updated**: 2024
**Version**: 1.0
