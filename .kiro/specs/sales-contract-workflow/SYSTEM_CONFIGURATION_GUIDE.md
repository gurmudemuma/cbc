# Sales Contract Workflow - System Configuration Guide

**Date**: April 24, 2026
**Version**: 1.0.0

---

## Overview

This guide provides comprehensive configuration instructions for deploying the Sales Contract Workflow system across development, staging, and production environments.

---

## Environment Setup

### Development Environment

#### Backend Configuration (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exporter_portal_dev
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_SIZE=10
DB_IDLE_TIMEOUT=30000

# JWT Configuration
JWT_SECRET=your-development-secret-key-change-in-production
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Blockchain Configuration
BLOCKCHAIN_NETWORK=fabric-dev
BLOCKCHAIN_CHANNEL=exporter-portal
BLOCKCHAIN_CHAINCODE=contract-management
BLOCKCHAIN_PEER_URL=http://localhost:7051
BLOCKCHAIN_ORDERER_URL=http://localhost:7050

# ECTA Configuration
ECTA_API_URL=https://api-dev.ecta.gov.et
ECTA_API_KEY=your-ecta-dev-api-key
ECTA_API_SECRET=your-ecta-dev-api-secret

# Email Configuration
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=noreply@exporter-portal-dev.local

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Logging Configuration
LOG_LEVEL=debug
LOG_FORMAT=json

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
CORS_CREDENTIALS=true
```

#### Frontend Configuration (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000

# Authentication
VITE_JWT_STORAGE_KEY=auth_token
VITE_JWT_REFRESH_KEY=refresh_token

# Feature Flags
VITE_ENABLE_BLOCKCHAIN=true
VITE_ENABLE_ECTA=true
VITE_ENABLE_NOTIFICATIONS=true

# Logging
VITE_LOG_LEVEL=debug
```

### Staging Environment

#### Backend Configuration (.env.staging)
```env
# Server Configuration
NODE_ENV=staging
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=staging-db.internal
DB_PORT=5432
DB_NAME=exporter_portal_staging
DB_USER=exporter_user
DB_PASSWORD=${DB_PASSWORD_STAGING}
DB_POOL_SIZE=20
DB_IDLE_TIMEOUT=30000
DB_SSL=true

# JWT Configuration
JWT_SECRET=${JWT_SECRET_STAGING}
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Blockchain Configuration
BLOCKCHAIN_NETWORK=fabric-staging
BLOCKCHAIN_CHANNEL=exporter-portal
BLOCKCHAIN_CHAINCODE=contract-management
BLOCKCHAIN_PEER_URL=https://fabric-peer.staging.internal:7051
BLOCKCHAIN_ORDERER_URL=https://fabric-orderer.staging.internal:7050

# ECTA Configuration
ECTA_API_URL=https://api-staging.ecta.gov.et
ECTA_API_KEY=${ECTA_API_KEY_STAGING}
ECTA_API_SECRET=${ECTA_API_SECRET_STAGING}

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=${SENDGRID_API_KEY_STAGING}
SMTP_FROM=noreply@exporter-portal-staging.local

# Redis Configuration
REDIS_HOST=staging-redis.internal
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD_STAGING}
REDIS_DB=0
REDIS_SSL=true

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# CORS Configuration
CORS_ORIGIN=https://staging.exporter-portal.local
CORS_CREDENTIALS=true
```

### Production Environment

#### Backend Configuration (.env.production)
```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=${DB_HOST_PROD}
DB_PORT=5432
DB_NAME=exporter_portal_prod
DB_USER=${DB_USER_PROD}
DB_PASSWORD=${DB_PASSWORD_PROD}
DB_POOL_SIZE=50
DB_IDLE_TIMEOUT=30000
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

# JWT Configuration
JWT_SECRET=${JWT_SECRET_PROD}
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Blockchain Configuration
BLOCKCHAIN_NETWORK=fabric-prod
BLOCKCHAIN_CHANNEL=exporter-portal
BLOCKCHAIN_CHAINCODE=contract-management
BLOCKCHAIN_PEER_URL=${BLOCKCHAIN_PEER_URL_PROD}
BLOCKCHAIN_ORDERER_URL=${BLOCKCHAIN_ORDERER_URL_PROD}

# ECTA Configuration
ECTA_API_URL=https://api.ecta.gov.et
ECTA_API_KEY=${ECTA_API_KEY_PROD}
ECTA_API_SECRET=${ECTA_API_SECRET_PROD}

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=${SENDGRID_API_KEY_PROD}
SMTP_FROM=noreply@exporter-portal.local

# Redis Configuration
REDIS_HOST=${REDIS_HOST_PROD}
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD_PROD}
REDIS_DB=0
REDIS_SSL=true

# Logging Configuration
LOG_LEVEL=warn
LOG_FORMAT=json

# CORS Configuration
CORS_ORIGIN=https://exporter-portal.local
CORS_CREDENTIALS=true

# Security Configuration
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Database Setup

### PostgreSQL Installation

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb exporter_portal_dev

# Create user
sudo -u postgres createuser exporter_user
sudo -u postgres psql -c "ALTER USER exporter_user WITH PASSWORD 'secure_password';"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE exporter_portal_dev TO exporter_user;"
```

### Database Migrations

```bash
# Run migrations
npm run migrate

# Verify tables
psql -U exporter_user -d exporter_portal_dev -c "\dt"

# Expected tables:
# - contract_drafts
# - contract_history
# - contract_notifications
# - contract_permissions
# - contract_exports
# - audit_logs
```

---

## Blockchain Setup

### Hyperledger Fabric Configuration

```bash
# Install Fabric binaries
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0

# Start Fabric network
cd fabric-samples/test-network
./network.sh up createChannel -c exporter-portal

# Deploy chaincode
./network.sh deployCC -ccn contract-management -ccv 1.0 -ccl javascript

# Verify network
peer channel list
peer chaincode list --installed
```

### Blockchain Client Configuration

```typescript
// blockchain.config.ts
export const blockchainConfig = {
  network: process.env.BLOCKCHAIN_NETWORK,
  channel: process.env.BLOCKCHAIN_CHANNEL,
  chaincode: process.env.BLOCKCHAIN_CHAINCODE,
  peer: {
    url: process.env.BLOCKCHAIN_PEER_URL,
    tlsCACerts: process.env.BLOCKCHAIN_PEER_TLS_CERT,
  },
  orderer: {
    url: process.env.BLOCKCHAIN_ORDERER_URL,
    tlsCACerts: process.env.BLOCKCHAIN_ORDERER_TLS_CERT,
  },
  msp: {
    id: process.env.BLOCKCHAIN_MSP_ID,
    certPath: process.env.BLOCKCHAIN_CERT_PATH,
    keyPath: process.env.BLOCKCHAIN_KEY_PATH,
  },
};
```

---

## ECTA Integration Setup

### ECTA API Configuration

```typescript
// ecta.config.ts
export const ectaConfig = {
  apiUrl: process.env.ECTA_API_URL,
  apiKey: process.env.ECTA_API_KEY,
  apiSecret: process.env.ECTA_API_SECRET,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 5000,
  endpoints: {
    register: '/api/v1/contracts/register',
    verify: '/api/v1/contracts/verify',
    certificate: '/api/v1/certificates/generate',
  },
};
```

### ECTA Credentials Setup

```bash
# Request API credentials from ECTA
# Contact: api-support@ecta.gov.et

# Store credentials securely
export ECTA_API_KEY="your-api-key"
export ECTA_API_SECRET="your-api-secret"

# Verify credentials
curl -X GET https://api.ecta.gov.et/health \
  -H "Authorization: Bearer ${ECTA_API_KEY}"
```

---

## Email Service Setup

### SendGrid Configuration

```bash
# Create SendGrid account
# https://sendgrid.com

# Generate API key
# Settings > API Keys > Create API Key

# Store API key
export SENDGRID_API_KEY="SG.your-api-key"

# Verify configuration
curl -X GET https://api.sendgrid.com/v3/mail/settings/bounce_purge \
  -H "Authorization: Bearer ${SENDGRID_API_KEY}"
```

### Email Templates

```typescript
// email-templates.ts
export const emailTemplates = {
  CONTRACT_SENT: {
    subject: 'New Sales Contract for Review',
    template: 'contract-sent',
  },
  CONTRACT_ACCEPTED: {
    subject: 'Contract Accepted',
    template: 'contract-accepted',
  },
  CONTRACT_REJECTED: {
    subject: 'Contract Rejected',
    template: 'contract-rejected',
  },
  CONTRACT_COUNTERED: {
    subject: 'Counter-Offer Received',
    template: 'contract-countered',
  },
  COUNTER_ACCEPTED: {
    subject: 'Counter-Offer Accepted',
    template: 'counter-accepted',
  },
  CONTRACT_FINALIZED: {
    subject: 'Contract Finalized',
    template: 'contract-finalized',
  },
  ECTA_REGISTERED: {
    subject: 'ECTA Registration Complete',
    template: 'ecta-registered',
  },
  CERTIFICATE_READY: {
    subject: 'Certificate Ready for Download',
    template: 'certificate-ready',
  },
};
```

---

## Redis Setup

### Redis Installation

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis service
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Expected output: PONG
```

### Redis Configuration

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Key settings:
# maxmemory 256mb
# maxmemory-policy allkeys-lru
# requirepass your-redis-password

# Restart Redis
sudo systemctl restart redis-server

# Verify configuration
redis-cli CONFIG GET maxmemory
```

---

## SSL/TLS Configuration

### Certificate Generation

```bash
# Generate self-signed certificate (development only)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# For production, use Let's Encrypt
sudo apt-get install certbot
sudo certbot certonly --standalone -d exporter-portal.local
```

### HTTPS Configuration

```typescript
// server.ts
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

https.createServer(options, app).listen(3000);
```

---

## Monitoring & Logging

### Winston Logger Configuration

```typescript
// logger.config.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### Health Check Endpoint

```typescript
// health.route.ts
app.get('/health', (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      blockchain: await checkBlockchain(),
      ecta: await checkECTA(),
    },
  };
  res.json(health);
});
```

---

## Deployment Commands

### Development Deployment

```bash
# Install dependencies
npm install

# Build project
npm run build

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### Production Deployment

```bash
# Install dependencies
npm ci --only=production

# Build project
npm run build

# Run migrations
npm run migrate

# Start production server
npm start

# Verify deployment
curl https://exporter-portal.local/health
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1"

# Check database logs
sudo tail -f /var/log/postgresql/postgresql.log
```

### Blockchain Connection Issues

```bash
# Test blockchain connection
peer channel list

# Check blockchain logs
docker logs fabric-peer

# Verify chaincode
peer chaincode list --installed
```

### ECTA API Issues

```bash
# Test ECTA API
curl -X GET https://api.ecta.gov.et/health \
  -H "Authorization: Bearer ${ECTA_API_KEY}"

# Check ECTA logs
tail -f logs/ecta-api.log
```

---

## Security Checklist

- [ ] All secrets stored in environment variables
- [ ] SSL/TLS certificates installed
- [ ] Database password changed from default
- [ ] JWT secret changed from default
- [ ] CORS origin configured correctly
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled
- [ ] Input validation enabled
- [ ] SQL injection prevention enabled
- [ ] XSS prevention enabled
- [ ] CSRF protection enabled
- [ ] Audit logging enabled

---

## Performance Optimization

### Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_contract_drafts_exporter_id ON contract_drafts(exporter_id);
CREATE INDEX idx_contract_drafts_status ON contract_drafts(status);
CREATE INDEX idx_contract_drafts_created_at ON contract_drafts(created_at);
CREATE INDEX idx_contract_history_draft_id ON contract_history(draft_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM contract_drafts WHERE exporter_id = $1;
```

### Caching Strategy

```typescript
// Redis caching
const cacheKey = `contract:${contractId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const contract = await contractService.getById(contractId);
await redis.setex(cacheKey, 3600, JSON.stringify(contract));

return contract;
```

---

**Configuration Guide Version**: 1.0.0
**Last Updated**: April 24, 2026
**Status**: ✅ **COMPLETE**
