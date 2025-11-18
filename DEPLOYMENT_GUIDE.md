# 🚀 Deployment Guide

Complete guide for deploying the Coffee Export Consortium Blockchain to development, staging, and production environments.

> **Version 2.0** - Updated with new workflow: National Bank creates exports, Banking approval stage added, Dashboard visualization with actor tracking

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [What's New in v2.0](#whats-new-in-v20)
3. [Prerequisites](#prerequisites)
4. [Local Development](#local-development)
5. [Docker Build](#docker-build)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Production Deployment](#production-deployment)
8. [Security Configuration](#security-configuration)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup & Recovery](#backup--recovery)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Troubleshooting](#troubleshooting)

---

## Quick Start

For rapid deployment with all v2.0 updates:

```bash
cd /home/gu-da/cbc
./start-system.sh --clean
```

This handles:
- Chaincode v2.0 deployment (National Bank workflow)
- Frontend dependencies (recharts for dashboard)
- All services startup
- Test user creation

**See detailed steps below for manual deployment or production.**

---

## What's New in v2.0

### Chaincode Changes
- **National Bank creates export requests** (not commercialbank)
- **New Banking Approval stage** for commercialbank financial validation
- **Updated status constants**:
  - `BANKING_PENDING`
  - `BANKING_APPROVED`
  - `BANKING_REJECTED`
- **Sequential workflow**: Portal → National Bank → FX → Banking → Quality → Customs → Shipping

### Frontend Updates
- **Dashboard workflow chart** - visualize export requests through all blockchain stages
- **Actor tracking** - hover chart to see who approved each stage
- **Updated navigation** - all sidebar items independently clickable
- **New dependency**: recharts for data visualization

### Deployment Changes
- Chaincode version updated to v2.0 (sequence 2)
- Frontend npm install required for recharts
- Updated test user credentials

---

## Prerequisites

### Required Software
- **Docker** 20.10+ and Docker Compose
- **Kubernetes** 1.21+ (for production)
- **kubectl** CLI
- **Helm** 3.0+ (optional)
- **Node.js** 16+
- **Go** 1.19+
- **Git**

### Cloud Provider Setup (Production)
Choose one:
- **AWS**: EKS cluster
- **Google Cloud**: GKE cluster
- **Azure**: AKS cluster
- **DigitalOcean**: DOKS cluster

### Domain and SSL (Production)
- Domain name (e.g., coffeeexport.com)
- SSL certificate (Let's Encrypt recommended)

---

## Local Development

### 1. Install Dependencies

```bash
# Install API dependencies
cd api
npm install
cd commercialbank && npm install && cd ..
cd national-bank && npm install && cd ..
cd ncat && npm install && cd ..
cd shipping-line && npm install && cd ..
cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy environment templates
cp .env.example .env
cp api/commercialbank/.env.example api/commercialbank/.env
cp api/national-bank/.env.example api/national-bank/.env
cp api/ncat/.env.example api/ncat/.env
cp api/shipping-line/.env.example api/shipping-line/.env
cp frontend/.env.example frontend/.env
```

### 3. Start Fabric Network

```bash
cd network
./network.sh up createChannel -c coffeechannel

# Deploy v2.0 chaincode with new workflow
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export/ -ccl golang -ccv 2.0 -ccs 2
./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management/ -ccl golang
```

### 4. Start Services

```bash
# Option A: Use automated script (recommended)
./scripts/dev-apis.sh

# Option B: Start individually
cd api/commercialbank && npm run dev &
cd api/national-bank && npm run dev &
cd api/ncat && npm run dev &
cd api/shipping-line && npm run dev &
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

Access at: http://localhost:5173

### 6. Verify v2.0 Features

```bash
# Check chaincode version
docker exec peer0.commercialbank.coffee-export.com \
  peer lifecycle chaincode querycommitted -C coffeechannel

# Should show coffee-export version 2.0, sequence 2
```

**Test workflow:**
1. Login as National Bank user
2. Create export request (blockchain record created)
3. Approve FX
4. Login as commercialbank user
5. Approve banking/financial validation
6. Continue through quality → customs → shipping
7. Check Dashboard to see workflow chart with actor info

---

## Docker Build

### 1. Build API Images

```bash
# Build all API images
for service in commercialbank national-bank ncat shipping-line; do
  docker build -t your-registry/cbc-api-$service:latest \
    -f api/$service/Dockerfile \
    api/$service
done
```

### 2. Build Frontend Image

```bash
docker build -t your-registry/cbc-frontend:latest \
  -f frontend/Dockerfile \
  frontend
```

### 3. Production Dockerfile

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

### 4. Push to Registry

```bash
# Login to Docker registry
docker login

# Push images
for service in commercialbank national-bank ncat shipping-line; do
  docker push your-registry/cbc-api-$service:latest
done

docker push your-registry/cbc-frontend:latest
```

---

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Create Secrets

```bash
# Generate secrets
kubectl create secret generic cbc-secrets \
  --from-literal=JWT_SECRET=$(openssl rand -base64 64) \
  --from-literal=ENCRYPTION_KEY=$(openssl rand -base64 64) \
  -n coffee-export

# Or apply from file
kubectl apply -f k8s/secrets.yaml
```

### 3. Create ConfigMaps

```bash
kubectl apply -f k8s/configmap.yaml
```

### 4. Deploy Services

```bash
# Deploy API services
kubectl apply -f k8s/api-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n coffee-export

# Check services
kubectl get svc -n coffee-export

# Check ingress
kubectl get ingress -n coffee-export

# View logs
kubectl logs -f deployment/commercialbank-api -n coffee-export
```

### 6. Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: commercialbank-api-hpa
  namespace: coffee-export
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: commercialbank-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Production Deployment

### Pre-Deployment Checklist

#### Security Requirements
- [ ] All critical security fixes implemented
- [ ] JWT secrets generated and stored securely
- [ ] Encryption keys generated and stored securely
- [ ] TLS certificates obtained
- [ ] Firewall rules configured
- [ ] Security audit completed
- [ ] Penetration testing performed
- [ ] Vulnerability scanning completed

#### Infrastructure Requirements
- [ ] Production servers provisioned
- [ ] Load balancers configured
- [ ] Database backups configured
- [ ] Monitoring systems set up
- [ ] Log aggregation configured
- [ ] Disaster recovery plan documented
- [ ] Backup and restore tested

#### Application Requirements
- [ ] All dependencies updated
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Integration tests passing
- [ ] Performance tests completed
- [ ] Documentation updated

### 1. Secret Management

#### Using AWS Secrets Manager

```bash
# Generate secrets
JWT_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 64)

# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name cbc/commercialbank/jwt-secret \
  --secret-string "$JWT_SECRET"

aws secretsmanager create-secret \
  --name cbc/commercialbank/encryption-key \
  --secret-string "$ENCRYPTION_KEY"
```

#### Secrets Service Implementation

```typescript
// api/shared/secrets.service.ts
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
}
```

### 2. TLS/HTTPS Configuration

#### Obtain SSL Certificates

```bash
# Using Let's Encrypt
sudo certbot certonly --standalone \
  -d api-exporter.coffeeexport.com \
  -d api-nationalbank.coffeeexport.com \
  -d api-ncat.coffeeexport.com \
  -d api-shipping.coffeeexport.com
```

#### Configure HTTPS in Express

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
```

#### Install Cert-Manager (Kubernetes)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@coffeeexport.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 3. Load Balancing

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/cbc-api

upstream exporter_bank_api {
    least_conn;
    server commercialbank-api-1:3001 max_fails=3 fail_timeout=30s;
    server commercialbank-api-2:3001 max_fails=3 fail_timeout=30s;
    server commercialbank-api-3:3001 max_fails=3 fail_timeout=30s;
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

    # commercialbank API
    location /commercialbank/ {
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

### 4. Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  commercialbank-api:
    image: cbc/commercialbank-api:${VERSION}
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

---

## Security Configuration

### 1. Network Policies (Kubernetes)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: coffee-export
spec:
  podSelector:
    matchLabels:
      tier: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: frontend
    ports:
    - protocol: TCP
      port: 3001
```

### 2. Pod Security Policies

```bash
kubectl apply -f k8s/pod-security-policy.yaml
```

### 3. Regular Security Scans

```bash
# Scan images for vulnerabilities
trivy image your-registry/cbc-api-commercialbank:latest

# Scan Kubernetes manifests
kubesec scan k8s/api-deployment.yaml
```

---

## Monitoring & Logging

### 1. Deploy Prometheus

```bash
kubectl apply -f monitoring/prometheus-config.yaml
```

### 2. Deploy Grafana

```bash
kubectl apply -f monitoring/grafana-config.yaml
```

### 3. Add Prometheus Metrics to APIs

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

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### 4. Structured Logging

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
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 10,
    }),
  ],
});

export default logger;
```

### 5. Access Monitoring

```bash
# Port forward Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n coffee-export

# Port forward Grafana
kubectl port-forward svc/grafana 3000:3000 -n coffee-export

# Access Grafana at http://localhost:3000
# Default credentials: admin / admin (change immediately)
```

---

## Backup & Recovery

### 1. Automated Backup Script

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
docker exec peer0.commercialbank.coffee-export.com \
  tar czf - /var/hyperledger/production > "$BACKUP_PATH/peer-commercialbank.tar.gz"

docker exec peer0.nationalbank.coffee-export.com \
  tar czf - /var/hyperledger/production > "$BACKUP_PATH/peer-nationalbank.tar.gz"

docker exec peer0.ncat.coffee-export.com \
  tar czf - /var/hyperledger/production > "$BACKUP_PATH/peer-ncat.tar.gz"

docker exec peer0.shippingline.coffee-export.com \
  tar czf - /var/hyperledger/production > "$BACKUP_PATH/peer-shippingline.tar.gz"

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

### 2. Restore Script

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

### 3. Schedule Automated Backups

```yaml
# Kubernetes CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-job
  namespace: coffee-export
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: your-backup-image
            command: ["/backup.sh"]
          restartPolicy: OnFailure
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

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
          docker build -t cbc/commercialbank-api:${{ github.ref_name }} \
            -f api/commercialbank/Dockerfile .

  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          kubectl set image deployment/commercialbank-api \
            commercialbank-api=cbc/commercialbank-api:${{ github.ref_name }} \
            -n coffee-export
          
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

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n coffee-export

# Check logs
kubectl logs <pod-name> -n coffee-export

# Check events
kubectl get events -n coffee-export --sort-by='.lastTimestamp'
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints -n coffee-export

# Test service connectivity
kubectl run test-pod --image=busybox -it --rm -- \
  wget -O- http://commercialbank-api:3001/health
```

### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n coffee-export

# Increase memory limits
kubectl set resources deployment/commercialbank-api \
  --limits=memory=1Gi -n coffee-export
```

### Rollback Procedure

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
kubectl set image deployment/commercialbank-api \
  commercialbank-api=cbc/commercialbank-api:$PREVIOUS_VERSION \
  -n coffee-export

# Wait for rollout
kubectl rollout status deployment/commercialbank-api -n coffee-export

# Run smoke tests
./smoke-test.sh

echo "Rollback completed"
```

---

## Post-Deployment Verification

### Smoke Test Script

```bash
#!/bin/bash
# smoke-test.sh

API_BASE_URL="https://api.coffeeexport.com"

echo "Running smoke tests..."

# Test health endpoints
for service in commercialbank national-bank ncat shipping-line; do
  echo "Testing $service health..."
  response=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/$service/health")
  if [ "$response" != "200" ]; then
    echo "❌ $service health check failed"
    exit 1
  fi
  echo "✅ $service health check passed"
done

echo "All smoke tests passed ✅"
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

## Deployment Checklist

### Pre-Deployment
- [ ] All security fixes applied
- [ ] Secrets configured
- [ ] TLS certificates installed
- [ ] Monitoring configured
- [ ] Backups tested
- [ ] Load balancers configured
- [ ] Team trained
- [ ] Documentation updated
- [ ] Rollback plan tested

### Post-Deployment
- [ ] All pods running
- [ ] Services accessible
- [ ] Ingress configured
- [ ] SSL certificates valid
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Backups scheduled
- [ ] Security scans passed
- [ ] Load testing completed
- [ ] Smoke tests passed

---

**For more information:**
- [QUICK_START.md](./QUICK_START.md) - Local development setup
- [CORRECTED_WORKFLOW.md](./CORRECTED_WORKFLOW.md) - v2.0 workflow details
- [DASHBOARD_WORKFLOW_CHART.md](./DASHBOARD_WORKFLOW_CHART.md) - Dashboard features
- [SECURITY.md](./SECURITY.md) - Security best practices
- [INTER_SERVICE_COMMUNICATION.md](./INTER_SERVICE_COMMUNICATION.md) - Service integration
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Current system status

**Version:** 2.0  
**Last Updated:** 2025-01-21  
**Status:** ✅ Ready for Deployment
