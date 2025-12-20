# Configuration Fix Guide - Coffee Export Blockchain

This guide provides step-by-step instructions to fix all identified configuration issues.

---

## PHASE 1: CRITICAL FIXES (Do These First)

### Fix 1: Docker Network Configuration

**Issue:** Services fail to start due to missing network

**Solution:**

```bash
# Create the Docker network
docker network create coffee-export-network

# Verify it was created
docker network ls | grep coffee-export
```

**Verification:**
```bash
docker network inspect coffee-export-network
```

---

### Fix 2: Update docker-compose.postgres.yml

**Issue:** Multiple issues in postgres compose file

**Changes needed:**

1. Update version to 3.8
2. Remove API services (keep only postgres and ipfs)
3. Add Redis service
4. Fix volume paths

**Updated file structure:**

```yaml
version: '3.8'

volumes:
  postgres-data:
  ipfs-data:
  redis-data:

networks:
  coffee-export:
    name: coffee-export-network

services:
  # PostgreSQL Database
  postgres:
    container_name: postgres
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=coffee_export_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"
    networks:
      - coffee-export
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./api/shared/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  # IPFS Node
  ipfs:
    container_name: ipfs
    image: ipfs/kubo:latest
    ports:
      - "4001:4001"
      - "4001:4001/udp"
      - "127.0.0.1:5001:5001"
      - "127.0.0.1:8080:8080"
    networks:
      - coffee-export
    volumes:
      - ipfs-data:/data/ipfs
    environment:
      - IPFS_PROFILE=server
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "ipfs", "id"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # Redis Cache
  redis:
    container_name: redis
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - coffee-export
    volumes:
      - redis-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

---

### Fix 3: Update docker-compose.apis.yml

**Issue:** Services don't load environment files, network version mismatch

**Changes needed:**

1. Update version to 3.8
2. Add `env_file` to each service
3. Update Node version to 18-alpine consistently
4. Fix network configuration

**Example for commercial-bank service:**

```yaml
commercial-bank:
  build:
    context: .
    dockerfile: api/commercial-bank/Dockerfile
  container_name: cbc-commercial-bank
  env_file:
    - ./api/commercial-bank/.env
  environment:
    NODE_ENV: development
    PORT: 3001
    DB_HOST: postgres
    DB_PORT: 5432
    DB_NAME: coffee_export_db
    DB_USER: postgres
    DB_PASSWORD: postgres
    DB_SSL: "false"
    CORS_ORIGIN: "http://localhost:5173"
    WEBSOCKET_ENABLED: "true"
    LOG_LEVEL: info
    REDIS_HOST: redis
    REDIS_PORT: 6379
  ports:
    - "3001:3001"
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - coffee-export
  restart: unless-stopped
```

**Apply to all services:** commercial-bank, custom-authorities, ecta, ecx, exporter-portal, national-bank, shipping-line

---

### Fix 4: Generate Strong Secrets

**Issue:** Weak default secrets in templates

**Solution:**

```bash
# Generate JWT Secret (32 bytes base64)
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"

# Generate Encryption Key (32 bytes hex)
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"

# Generate Redis Password
REDIS_PASSWORD=$(openssl rand -base64 16)
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
```

**Update all `.env` files with these values:**

```bash
# For each API service
for service in api/commercial-bank api/custom-authorities api/ecta api/ecx api/exporter-portal api/national-bank api/shipping-line; do
  cp "$service/.env.template" "$service/.env"
  # Update with strong secrets
done
```

---

### Fix 5: Fix Vite Proxy Configuration

**File:** `frontend/vite.config.js`

**Issue:** Incorrect rewrite rules causing double path prefixes

**Current (Wrong):**
```javascript
'/api/exporter': {
  target: 'http://localhost:3007',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/exporter/, '/api/exporter')
}
```

**Fixed:**
```javascript
'/api/exporter': {
  target: 'http://localhost:3007',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/exporter/, '/api')
}
```

**Apply to all proxy rules:**

```javascript
proxy: {
  '/api/exporter': {
    target: 'http://localhost:3007',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/exporter/, '/api')
  },
  '/api/banker': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/banker/, '/api')
  },
  '/api/nb-regulatory': {
    target: 'http://localhost:3002',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/nb-regulatory/, '/api')
  },
  '/api/ncat': {
    target: 'http://localhost:3003',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/ncat/, '/api')
  },
  '/api/shipping': {
    target: 'http://localhost:3004',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/shipping/, '/api')
  },
  '/api/customs': {
    target: 'http://localhost:3005',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/customs/, '/api')
  },
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
}
```

---

### Fix 6: Fix Nginx Configuration

**File:** `frontend/nginx.conf`

**Issue:** References non-existent api-gateway service

**Current (Wrong):**
```nginx
location /api/ {
    proxy_pass http://api-gateway:8080;
}
```

**Fixed (Option 1 - For Docker):**
```nginx
# Remove the /api/ proxy block entirely if using Vite dev server
# Or configure for production API gateway
location /api/ {
    proxy_pass http://api-gateway:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**Fixed (Option 2 - For Development):**
```nginx
# Comment out API proxy for development (use Vite proxy instead)
# location /api/ {
#     proxy_pass http://api-gateway:8080;
# }
```

---

## PHASE 2: HIGH PRIORITY FIXES

### Fix 7: Enable TypeScript Strict Mode

**File:** `api/tsconfig.base.json`

**Current:**
```json
{
  "strict": false,
  "noImplicitAny": false,
  "strictNullChecks": false,
  "strictFunctionTypes": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false,
  "noImplicitReturns": false
}
```

**Fixed:**
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "forceConsistentCasingInFileNames": true
}
```

**Note:** This will require fixing type errors in existing code. Do incrementally:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": false,  // Enable gradually
  "strictFunctionTypes": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false,
  "noImplicitReturns": false
}
```

---

### Fix 8: Fix Jest Configuration

**File:** `api/jest.config.js`

**Current (Wrong):**
```javascript
collectCoverageFrom: [
  'shared/**/*.ts',
  'commercialbank/src/**/*.ts',  // ❌ Wrong
  'national-bank/src/**/*.ts',
  'ncat/src/**/*.ts',  // ❌ Wrong
  'custom-authorities/src/**/*.ts',
  'shipping-line/src/**/*.ts',
]
```

**Fixed:**
```javascript
collectCoverageFrom: [
  'shared/**/*.ts',
  'commercial-bank/src/**/*.ts',  // ✅ Correct
  'national-bank/src/**/*.ts',
  'ecta/src/**/*.ts',  // ✅ Correct
  'ecx/src/**/*.ts',
  'exporter-portal/src/**/*.ts',
  'custom-authorities/src/**/*.ts',
  'shipping-line/src/**/*.ts',
  '!**/*.d.ts',
  '!**/node_modules/**',
  '!**/__tests__/**',
]
```

---

### Fix 9: Add Prettier Configuration to API

**File:** `api/.prettierrc`

**Create new file:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true
}
```

---

### Fix 10: Create Production Environment Templates

**File:** `api/commercial-bank/.env.production.template`

```bash
# =============================================================================
# Commercial Bank API - Production Environment Configuration
# =============================================================================

# APPLICATION SETTINGS
PORT=3001
NODE_ENV=production
LOG_LEVEL=warn

# SECURITY & AUTHENTICATION
JWT_SECRET=CHANGE_ME_GENERATE_WITH_openssl_rand_-base64_32
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=CHANGE_ME_GENERATE_WITH_openssl_rand_-hex_32

# CORS origin (MUST be specific domain in production)
CORS_ORIGIN=https://yourdomain.com

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# HYPERLEDGER FABRIC CONFIGURATION
ORGANIZATION_ID=commercial-bank
ORGANIZATION_NAME=commercial-bank
MSP_ID=CommercialBankMSP
PEER_ENDPOINT=peer0.commercialbank.coffee-export.com:7051
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management
CONNECTION_PROFILE_PATH=../../network/organizations/peerOrganizations/commercialbank.coffee-export.com/connection-commercialbank.json
WALLET_PATH=./wallet
ADMIN_CERT_PATH=../../network/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp/signcerts/cert.pem
ADMIN_KEY_PATH=../../network/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp/keystore/priv_sk

# IPFS CONFIGURATION
IPFS_HOST=ipfs.yourdomain.com
IPFS_PORT=5001
IPFS_PROTOCOL=https
IPFS_GATEWAY_PORT=443
IPFS_GATEWAY=https://ipfs.yourdomain.com

# FILE UPLOAD SETTINGS
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx

# WEBSOCKET SETTINGS
WEBSOCKET_ENABLED=true
WEBSOCKET_PATH=/socket.io

# DATABASE SETTINGS
DB_HOST=postgres.internal
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_SSL=true
DB_POOL_MIN=5
DB_POOL_MAX=20

# EMAIL SETTINGS
EMAIL_ENABLED=true
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=true
EMAIL_USER=notifications@yourdomain.com
EMAIL_PASSWORD=CHANGE_ME_APP_PASSWORD
EMAIL_FROM=noreply@yourdomain.com
ECTA_ADMIN_EMAIL=admin@yourdomain.com

# PRE-REGISTRATION SYSTEM SETTINGS
RENEWAL_REMINDERS_ENABLED=true
RENEWAL_CHECK_SCHEDULE=0 9 * * *
WEEKLY_SUMMARY_SCHEDULE=0 10 * * 1
AUDIT_RETENTION_DAYS=2555
ENHANCED_AUDIT_ENABLED=true

# MONITORING
MONITORING_ENABLED=true
METRICS_PORT=9090

# REDIS
REDIS_HOST=redis.internal
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_ME_STRONG_PASSWORD
REDIS_DB=0

# SECURITY
FORCE_HTTPS=true
TRUST_PROXY=true
SESSION_SECRET=CHANGE_ME_GENERATE_WITH_openssl_rand_-base64_32
```

**Repeat for all services:** custom-authorities, ecta, ecx, exporter-portal, national-bank, shipping-line

---

## PHASE 3: MEDIUM PRIORITY FIXES

### Fix 11: Standardize ESLint Configuration

**File:** `api/.eslintrc.json` (rename from .js)

```json
{
  "env": {
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "warn"
  },
  "ignorePatterns": ["dist/", "node_modules/", "wallet/"]
}
```

---

### Fix 12: Add Path Aliases to API

**File:** `api/tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"],
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["shared/*"],
      "@controllers/*": ["shared/controllers/*"],
      "@middleware/*": ["shared/middleware/*"],
      "@models/*": ["shared/models/*"],
      "@services/*": ["shared/services/*"],
      "@utils/*": ["shared/utils/*"],
      "@types/*": ["shared/types/*"]
    }
  }
}
```

---

### Fix 13: Enable Database SSL

**File:** All `.env.production.template` files

```bash
# Change from:
DB_SSL=false

# To:
DB_SSL=true
```

**For development, keep as false:**
```bash
DB_SSL=false
```

---

### Fix 14: Add Root-Level npm Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "install-all": "npm install --legacy-peer-deps",
    "build": "npm run build --workspaces",
    "start": "npm start --workspaces",
    "test": "npm test --workspaces",
    "lint": "npm run lint --workspaces",
    "lint:fix": "npm run lint:fix --workspaces",
    "format": "npm run format --workspaces",
    "format:check": "npm run format:check --workspaces",
    "dev": "npm run dev --workspaces",
    "clean": "npm run clean --workspaces && rm -rf node_modules"
  }
}
```

---

## VERIFICATION CHECKLIST

After applying all fixes, verify:

### Docker Configuration
- [ ] Network created: `docker network ls | grep coffee-export`
- [ ] Postgres starts: `docker-compose -f docker-compose.postgres.yml up postgres`
- [ ] Redis starts: `docker-compose -f docker-compose.postgres.yml up redis`
- [ ] IPFS starts: `docker-compose -f docker-compose.postgres.yml up ipfs`
- [ ] All APIs start: `docker-compose -f docker-compose.apis.yml up`

### Environment Configuration
- [ ] All `.env` files created from templates
- [ ] Strong secrets generated and set
- [ ] No hardcoded credentials in code
- [ ] Environment variables loaded correctly

### TypeScript Configuration
- [ ] `npm run build` succeeds in all services
- [ ] No TypeScript errors
- [ ] Type checking passes: `npm run type-check`

### Code Quality
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] `npm run test` passes

### Frontend
- [ ] `npm run dev` starts without errors
- [ ] API proxy works: test API calls in browser
- [ ] No console errors

### Production Build
- [ ] `npm run build` succeeds
- [ ] Docker images build successfully
- [ ] Services start in production mode

---

## TROUBLESHOOTING

### Docker Network Issues
```bash
# If network already exists
docker network rm coffee-export-network
docker network create coffee-export-network

# Check network
docker network inspect coffee-export-network
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Test connection
psql -h localhost -U postgres -d coffee_export_db

# Check logs
docker logs postgres
```

### Redis Connection Issues
```bash
# Test connection
redis-cli ping

# Check logs
docker logs redis
```

### API Startup Issues
```bash
# Check logs
docker logs cbc-commercial-bank

# Verify environment variables
docker exec cbc-commercial-bank env | grep DB_
```

---

## NEXT STEPS

1. **Apply Phase 1 fixes** (Critical)
2. **Test thoroughly** after each fix
3. **Apply Phase 2 fixes** (High Priority)
4. **Apply Phase 3 fixes** (Medium Priority)
5. **Run full test suite**
6. **Deploy to staging**
7. **Perform security audit**
8. **Deploy to production**

---

**Last Updated:** 2024
**Status:** Ready for implementation
