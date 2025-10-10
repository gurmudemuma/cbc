# 🚀 Production Deployment Guide

Complete guide for deploying the Coffee Export Consortium Blockchain to production with security best practices.

---

## Pre-Deployment Checklist

### Security Requirements
- [ ] All critical security fixes implemented
- [ ] JWT secrets generated and stored securely
- [ ] Encryption keys generated and stored securely
- [ ] TLS certificates obtained
- [ ] Firewall rules configured
- [ ] Security audit completed
- [ ] Penetration testing performed
- [ ] Vulnerability scanning completed

### Infrastructure Requirements
- [ ] Production servers provisioned
- [ ] Load balancers configured
- [ ] Database backups configured
- [ ] Monitoring systems set up
- [ ] Log aggregation configured
- [ ] Disaster recovery plan documented
- [ ] Backup and restore tested

### Application Requirements
- [ ] All dependencies updated
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Integration tests passing
- [ ] Performance tests completed
- [ ] Documentation updated

---

## 1. Secret Management

### Using AWS Secrets Manager (Recommended)

#### Step 1: Create Secrets

```bash
# Generate secrets
JWT_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 64)

# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name cbc/exporter-bank/jwt-secret \
  --secret-string "$JWT_SECRET"

aws secretsmanager create-secret \
  --name cbc/exporter-bank/encryption-key \
  --secret-string "$ENCRYPTION_KEY"

# Repeat for each service
```

#### Step 2: Create IAM Role for Secret Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:region:account:secret:cbc/*"
      ]
    }
  ]
}
```

#### Step 3: Update Application to Use Secrets Manager

Create `api/shared/secrets.service.ts`:

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export class SecretsService {
  private static client = new SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  private static cache: Map<string, { value: string; expiry: number }> = new Map();
  private static readonly CACHE_TTL = 300000; // 5 minutes

  public static async getSecret(secretName: string): Promise<string> {
    // Check cache
    const cached = this.cache.get(secretName);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.client.send(command);
      const secret = response.SecretString || "";

      // Cache the secret
      this.cache.set(secretName, {
        value: secret,
        expiry: Date.now() + this.CACHE_TTL,
      });

      return secret;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error);
      throw new Error(`Secret retrieval failed: ${secretName}`);
    }
  }

  public static async getJWTSecret(serviceName: string): Promise<string> {
    return await this.getSecret(`cbc/${serviceName}/jwt-secret`);
  }

  public static async getEncryptionKey(serviceName: string): Promise<string> {
    return await this.getSecret(`cbc/${serviceName}/encryption-key`);
  }
}
```

### Alternative: HashiCorp Vault

```typescript
import * as vault from "node-vault";

export class VaultService {
  private static client = vault({
    apiVersion: "v1",
    endpoint: process.env.VAULT_ADDR,
    token: process.env.VAULT_TOKEN,
  });

  public static async getSecret(path: string): Promise<string> {
    try {
      const result = await this.client.read(path);
      return result.data.value;
    } catch (error) {
      console.error(`Failed to retrieve secret from Vault:`, error);
      throw error;
    }
  }
}
```

---

## 2. TLS/HTTPS Configuration

### Step 1: Obtain SSL Certificates

```bash
# Using Let's Encrypt
sudo certbot certonly --standalone \
  -d api-exporter.coffeeexport.com \
  -d api-nationalbank.coffeeexport.com \
  -d api-ncat.coffeeexport.com \
  -d api-shipping.coffeeexport.com

# Or use AWS Certificate Manager for AWS deployments
```

### Step 2: Configure HTTPS in Express

Update `api/*/src/index.ts`:

```typescript
import https from 'https';
import fs from 'fs';

const app: Application = express();

// HTTPS configuration
let server;
if (process.env.NODE_ENV === 'production') {
  const httpsOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/domain/privkey.pem'),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/domain/fullchain.pem'),
    // Enable modern TLS only
    minVersion: 'TLSv1.2',
    ciphers: [
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
    ].join(':'),
  };

  server = https.createServer(httpsOptions, app);
} else {
  server = createServer(app);
}

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### Step 3: Configure HSTS

```typescript
import helmet from 'helmet';

app.use(helmet({
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

---

## 3. Database and State Management

### Redis Configuration for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
      --appendonly yes
      --appendfsync everysec
    volumes:
      - redis-data:/data
    networks:
      - cbc-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  redis-sentinel:
    image: redis:7-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - ./redis-sentinel.conf:/etc/redis/sentinel.conf
    networks:
      - cbc-network
    depends_on:
      - redis

volumes:
  redis-data:

networks:
  cbc-network:
    driver: bridge
```

### Redis Sentinel Configuration

```conf
# redis-sentinel.conf
sentinel monitor mymaster redis 6379 2
sentinel auth-pass mymaster ${REDIS_PASSWORD}
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 10000
```

---

## 4. Monitoring and Logging

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'exporter-bank-api'
    static_configs:
      - targets: ['exporter-bank-api:3001']
    metrics_path: '/metrics'

  - job_name: 'national-bank-api'
    static_configs:
      - targets: ['national-bank-api:3002']

  - job_name: 'ncat-api'
    static_configs:
      - targets: ['ncat-api:3003']

  - job_name: 'shipping-line-api'
    static_configs:
      - targets: ['shipping-line-api:3004']

  - job_name: 'fabric-peers'
    static_configs:
      - targets: 
        - 'peer0.exporterbank:9443'
        - 'peer0.nationalbank:9443'
        - 'peer0.ncat:9443'
        - 'peer0.shippingline:9443'
```

### Add Prometheus Metrics to APIs

```typescript
import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const blockchainTransactions = new promClient.Counter({
  name: 'blockchain_transactions_total',
  help: 'Total number of blockchain transactions',
  labelNames: ['type', 'status'],
  registers: [register],
});

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Coffee Export Blockchain Monitoring",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_count[5m])"
          }
        ]
      },
      {
        "title": "Blockchain Transaction Rate",
        "targets": [
          {
            "expr": "rate(blockchain_transactions_total[5m])"
          }
        ]
      },
      {
        "title": "API Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

### Structured Logging with Winston

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'cbc-api',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Write errors to file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Write all logs to file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 10,
    }),
  ],
});

// If in production, also send to log aggregation service
if (process.env.NODE_ENV === 'production') {
  // Example: CloudWatch Logs
  logger.add(new winston.transports.Stream({
    stream: process.stdout,
  }));
}

export default logger;
```

---

## 5. Load Balancing and High Availability

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/cbc-api

upstream exporter_bank_api {
    least_conn;
    server exporter-bank-api-1:3001 max_fails=3 fail_timeout=30s;
    server exporter-bank-api-2:3001 max_fails=3 fail_timeout=30s;
    server exporter-bank-api-3:3001 max_fails=3 fail_timeout=30s;
}

upstream national_bank_api {
    least_conn;
    server national-bank-api-1:3002 max_fails=3 fail_timeout=30s;
    server national-bank-api-2:3002 max_fails=3 fail_timeout=30s;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

server {
    listen 443 ssl http2;
    server_name api.coffeeexport.com;

    ssl_certificate /etc/letsencrypt/live/api.coffeeexport.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.coffeeexport.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Exporter Bank API
    location /exporter-bank/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://exporter_bank_api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth endpoints with stricter rate limiting
    location ~ ^/[^/]+/api/auth/(login|register) {
        limit_req zone=auth_limit burst=3 nodelay;
        
        proxy_pass http://exporter_bank_api;
        # ... same proxy settings ...
    }

    # Health check endpoint (no rate limiting)
    location ~ ^/[^/]+/health {
        access_log off;
        proxy_pass http://exporter_bank_api;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.coffeeexport.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 6. Docker Production Configuration

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  exporter-bank-api:
    image: cbc/exporter-bank-api:${VERSION}
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
      - PORT=3001
      - AWS_REGION=${AWS_REGION}
    secrets:
      - jwt_secret
      - encryption_key
    networks:
      - cbc-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

secrets:
  jwt_secret:
    external: true
  encryption_key:
    external: true

networks:
  cbc-network:
    driver: overlay
    encrypted: true
```

### Production Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
```

---

## 7. Backup and Disaster Recovery

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

set -e

BACKUP_DIR="/backups/cbc"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"

mkdir -p "$BACKUP_PATH"

echo "Starting backup at $TIMESTAMP"

# Backup Fabric ledger data
echo "Backing up Fabric ledger..."
docker exec peer0.exporterbank.coffee-export.com \
  tar czf - /var/hyperledger/production > "$BACKUP_PATH/peer-exporterbank.tar.gz"

docker exec peer0.nationalbank.coffee-export.com \
  tar czf - /var/hyperledger/production > "$BACKUP_PATH/peer-nationalbank.tar.gz"

docker exec peer0.ncat.coffee-export.com \
  tar czf - /var/hyperledger/production > "$BACKUP_PATH/peer-ncat.tar.gz"

docker exec peer0.shippingline.coffee-export.com \
  tar czf - /var/hyperledger/production > "$BACKUP_PATH/peer-shippingline.tar.gz"

# Backup Redis data
echo "Backing up Redis..."
docker exec redis redis-cli BGSAVE
sleep 5
docker cp redis:/data/dump.rdb "$BACKUP_PATH/redis-dump.rdb"

# Backup certificates
echo "Backing up certificates..."
tar czf "$BACKUP_PATH/certificates.tar.gz" \
  network/organizations/peerOrganizations \
  network/organizations/ordererOrganizations

# Backup configuration
echo "Backing up configuration..."
tar czf "$BACKUP_PATH/config.tar.gz" \
  network/configtx \
  network/docker

# Create backup manifest
cat > "$BACKUP_PATH/manifest.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "version": "$(git rev-parse HEAD)",
  "components": [
    "fabric-ledger",
    "redis",
    "certificates",
    "configuration"
  ]
}
EOF

# Compress entire backup
echo "Compressing backup..."
tar czf "$BACKUP_DIR/cbc-backup-$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "$TIMESTAMP"
rm -rf "$BACKUP_PATH"

# Upload to S3
if [ -n "$AWS_S3_BUCKET" ]; then
  echo "Uploading to S3..."
  aws s3 cp "$BACKUP_DIR/cbc-backup-$TIMESTAMP.tar.gz" \
    "s3://$AWS_S3_BUCKET/backups/"
fi

# Cleanup old backups (keep last 30 days)
find "$BACKUP_DIR" -name "cbc-backup-*.tar.gz" -mtime +30 -delete

echo "Backup completed successfully"
```

### Restore Script

```bash
#!/bin/bash
# restore.sh

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

BACKUP_FILE="$1"
RESTORE_DIR="/tmp/cbc-restore"

echo "Restoring from $BACKUP_FILE"

# Extract backup
mkdir -p "$RESTORE_DIR"
tar xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# Stop services
echo "Stopping services..."
docker-compose down

# Restore Fabric ledger
echo "Restoring Fabric ledger..."
# ... restoration logic ...

# Restore Redis
echo "Restoring Redis..."
docker cp "$RESTORE_DIR/redis-dump.rdb" redis:/data/dump.rdb

# Restore certificates
echo "Restoring certificates..."
tar xzf "$RESTORE_DIR/certificates.tar.gz" -C network/

# Start services
echo "Starting services..."
docker-compose up -d

# Cleanup
rm -rf "$RESTORE_DIR"

echo "Restore completed successfully"
```

---

## 8. Deployment Automation

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security scan
        run: |
          npm audit --production
          npm run lint
          
      - name: Run SAST
        uses: github/codeql-action/analyze@v2

  build-and-test:
    needs: security-scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build Docker images
        run: |
          docker build -t cbc/exporter-bank-api:${{ github.ref_name }} \
            -f api/exporter-bank/Dockerfile .

  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          # Deploy using your preferred method
          # (Kubernetes, Docker Swarm, ECS, etc.)
          
      - name: Run smoke tests
        run: |
          curl -f https://api.coffeeexport.com/health
          
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
```

---

## 9. Post-Deployment Verification

### Smoke Test Script

```bash
#!/bin/bash
# smoke-test.sh

API_BASE_URL="https://api.coffeeexport.com"

echo "Running smoke tests..."

# Test health endpoints
for service in exporter-bank national-bank ncat shipping-line; do
  echo "Testing $service health..."
  response=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/$service/health")
  if [ "$response" != "200" ]; then
    echo "❌ $service health check failed"
    exit 1
  fi
  echo "✅ $service health check passed"
done

# Test authentication
echo "Testing authentication..."
response=$(curl -s -X POST "$API_BASE_URL/exporter-bank/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}')

if echo "$response" | grep -q "success"; then
  echo "✅ Authentication test passed"
else
  echo "❌ Authentication test failed"
  exit 1
fi

echo "All smoke tests passed ✅"
```

---

## 10. Rollback Procedure

```bash
#!/bin/bash
# rollback.sh

PREVIOUS_VERSION="$1"

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: $0 <previous-version>"
  exit 1
fi

echo "Rolling back to version $PREVIOUS_VERSION"

# Update image tags
docker service update --image cbc/exporter-bank-api:$PREVIOUS_VERSION exporter-bank-api
docker service update --image cbc/national-bank-api:$PREVIOUS_VERSION national-bank-api
docker service update --image cbc/ncat-api:$PREVIOUS_VERSION ncat-api
docker service update --image cbc/shipping-line-api:$PREVIOUS_VERSION shipping-line-api

# Wait for services to stabilize
sleep 30

# Run smoke tests
./smoke-test.sh

echo "Rollback completed"
```

---

## Maintenance Schedule

### Daily
- Monitor system health
- Review error logs
- Check backup completion

### Weekly
- Review security alerts
- Update dependencies
- Performance analysis

### Monthly
- Security audit
- Capacity planning
- Disaster recovery drill

### Quarterly
- Penetration testing
- Compliance review
- Secret rotation

---

**Deployment Checklist:**
- [ ] All security fixes applied
- [ ] Secrets configured
- [ ] TLS certificates installed
- [ ] Monitoring configured
- [ ] Backups tested
- [ ] Load balancers configured
- [ ] Smoke tests passing
- [ ] Team trained
- [ ] Documentation updated
- [ ] Rollback plan tested
