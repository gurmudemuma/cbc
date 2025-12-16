# Deployment Guide

## Production Deployment

### Prerequisites
- Docker Swarm or Kubernetes cluster
- SSL certificates
- Domain names configured
- Backup storage

### Environment Configuration

1. **Create production secrets**
```bash
./scripts/generate-strong-secrets.sh
```

2. **Configure environment variables**
```bash
cp .env.production.example .env.production
# Edit with production values
nano .env.production
```

3. **Set up SSL certificates**
```bash
mkdir -p certs
# Copy SSL certificates
cp /path/to/cert.pem certs/
cp /path/to/key.pem certs/
```

### Docker Compose Deployment

```bash
# Build images
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# Verify
docker-compose -f docker-compose.production.yml ps
```

### Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace coffee-export

# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Deploy services
kubectl apply -f k8s/

# Check status
kubectl get pods -n coffee-export
```

## Monitoring Setup

### Prometheus
```bash
# Access Prometheus
http://your-domain:9090
```

### Grafana
```bash
# Access Grafana
http://your-domain:3001
# Default: admin/admin
```

## Backup Strategy

### Database Backup
```bash
# Automated daily backup
0 2 * * * /opt/cbc/scripts/backup-db.sh
```

### Blockchain Backup
```bash
# Backup ledger data
docker exec peer0.commercialbank.coffee-export.com peer node snapshot
```

## Health Checks

```bash
# API health
curl https://api.yourdomain.com/health

# Blockchain health
./scripts/check-health.sh
```

## Rollback Procedure

```bash
# Stop current version
docker-compose -f docker-compose.production.yml down

# Restore previous version
git checkout <previous-tag>

# Redeploy
docker-compose -f docker-compose.production.yml up -d
```

## Security Checklist

- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Secrets rotated
- [ ] Rate limiting enabled
- [ ] Monitoring alerts configured
- [ ] Backup tested
- [ ] Access logs enabled
- [ ] Security headers configured
