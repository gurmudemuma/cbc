# 🚀 Deployment Guide - Coffee Export Consortium Blockchain

This guide covers deploying the Coffee Export Consortium Blockchain system to production using Kubernetes.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Build](#docker-build)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring Setup](#monitoring-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software
- Docker 20.10+
- Kubernetes 1.21+
- kubectl CLI
- Helm 3.0+ (optional)
- Git

### Cloud Provider Setup
Choose one of the following:
- **AWS**: EKS cluster
- **Google Cloud**: GKE cluster
- **Azure**: AKS cluster
- **DigitalOcean**: DOKS cluster

### Domain and SSL
- Domain name (e.g., coffeeexport.com)
- SSL certificate (Let's Encrypt recommended)

## 💻 Local Development

### 1. Install Dependencies

```bash
# Install API dependencies
for service in exporter-bank national-bank ncat shipping-line; do
  cd api/$service
  npm install
  cd ../..
done

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Start Fabric Network

```bash
cd network
./network.sh up
./network.sh createChannel -c coffeechannel
./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export/ -ccl golang
```

### 3. Start Services

```bash
# Terminal 1 - Exporter Bank API
cd api/exporter-bank && npm run dev

# Terminal 2 - National Bank API
cd api/national-bank && npm run dev

# Terminal 3 - NCAT API
cd api/ncat && npm run dev

# Terminal 4 - Shipping Line API
cd api/shipping-line && npm run dev

# Terminal 5 - Frontend
cd frontend && npm run dev
```

## 🐳 Docker Build

### 1. Build API Images

```bash
# Build all API images
for service in exporter-bank national-bank ncat shipping-line; do
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

### 3. Push to Registry

```bash
# Login to Docker registry
docker login

# Push images
for service in exporter-bank national-bank ncat shipping-line; do
  docker push your-registry/cbc-api-$service:latest
done

docker push your-registry/cbc-frontend:latest
```

## ☸️ Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Create Secrets

```bash
# Update secrets with your values
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
kubectl logs -f deployment/exporter-bank-api -n coffee-export
```

## 📊 Monitoring Setup

### 1. Deploy Prometheus

```bash
kubectl apply -f monitoring/prometheus-config.yaml
```

### 2. Deploy Grafana

```bash
kubectl apply -f monitoring/grafana-config.yaml
```

### 3. Access Monitoring

```bash
# Port forward Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n coffee-export

# Port forward Grafana
kubectl port-forward svc/grafana 3000:3000 -n coffee-export

# Access Grafana at http://localhost:3000
# Default credentials: admin / admin (change immediately)
```

### 4. Configure Alerts

Alerts are automatically configured via Prometheus alert rules. Configure Alertmanager for notifications:

```bash
# Create Alertmanager config
kubectl create configmap alertmanager-config \
  --from-file=alertmanager.yml \
  -n coffee-export
```

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Setup

The CI/CD pipeline is configured in `.github/workflows/ci-cd.yml`.

#### Required Secrets

Add these secrets to your GitHub repository:

```
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password
KUBE_CONFIG=base64-encoded-kubeconfig
SLACK_WEBHOOK=your-slack-webhook-url
```

#### Pipeline Stages

1. **Test**: Run tests for chaincode, APIs, and frontend
2. **Security Scan**: Scan for vulnerabilities
3. **Build**: Build Docker images
4. **Push**: Push images to registry
5. **Deploy**: Deploy to Kubernetes

### 2. Manual Deployment

```bash
# Deploy to staging
kubectl apply -f k8s/ --namespace=coffee-export-staging

# Deploy to production
kubectl apply -f k8s/ --namespace=coffee-export
```

## 💾 Backup and Recovery

### 1. Backup Fabric Ledger

```bash
# Backup peer data
kubectl exec -it peer0-exporter-bank -n coffee-export -- \
  tar czf /tmp/ledger-backup.tar.gz /var/hyperledger/production

# Copy backup to local
kubectl cp coffee-export/peer0-exporter-bank:/tmp/ledger-backup.tar.gz \
  ./backups/ledger-$(date +%Y%m%d).tar.gz
```

### 2. Backup Databases

```bash
# If using external database
kubectl exec -it postgres-0 -n coffee-export -- \
  pg_dump -U postgres cbc > backup-$(date +%Y%m%d).sql
```

### 3. Automated Backups

Create a CronJob for automated backups:

```yaml
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

### 4. Restore from Backup

```bash
# Stop services
kubectl scale deployment --all --replicas=0 -n coffee-export

# Restore data
kubectl cp ./backups/ledger-20240101.tar.gz \
  coffee-export/peer0-exporter-bank:/tmp/

kubectl exec -it peer0-exporter-bank -n coffee-export -- \
  tar xzf /tmp/ledger-20240101.tar.gz -C /

# Start services
kubectl scale deployment --all --replicas=3 -n coffee-export
```

## 🔐 Security Best Practices

### 1. Update Secrets

```bash
# Generate strong JWT secret
openssl rand -base64 32

# Update secret
kubectl create secret generic cbc-secrets \
  --from-literal=JWT_SECRET=your-new-secret \
  --dry-run=client -o yaml | kubectl apply -f -
```

### 2. Enable Network Policies

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

### 3. Enable Pod Security Policies

```bash
kubectl apply -f k8s/pod-security-policy.yaml
```

### 4. Regular Security Scans

```bash
# Scan images for vulnerabilities
trivy image your-registry/cbc-api-exporter-bank:latest

# Scan Kubernetes manifests
kubesec scan k8s/api-deployment.yaml
```

## 🔍 Troubleshooting

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
  wget -O- http://exporter-bank-api:3001/health
```

### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n coffee-export

# Increase memory limits
kubectl set resources deployment/exporter-bank-api \
  --limits=memory=1Gi -n coffee-export
```

### Database Connection Issues

```bash
# Check database connectivity
kubectl exec -it <api-pod> -n coffee-export -- \
  nc -zv postgres-service 5432

# Check database logs
kubectl logs postgres-0 -n coffee-export
```

## 📈 Scaling

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: exporter-bank-api-hpa
  namespace: coffee-export
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: exporter-bank-api
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

### Manual Scaling

```bash
# Scale deployment
kubectl scale deployment exporter-bank-api --replicas=5 -n coffee-export

# Scale all deployments
kubectl scale deployment --all --replicas=5 -n coffee-export
```

## 🌐 Domain and SSL Setup

### 1. Configure DNS

Point your domain to the load balancer:

```bash
# Get load balancer IP
kubectl get ingress -n coffee-export

# Add DNS A record
# coffeeexport.com -> <LOAD_BALANCER_IP>
# www.coffeeexport.com -> <LOAD_BALANCER_IP>
# api.coffeeexport.com -> <LOAD_BALANCER_IP>
```

### 2. Install Cert-Manager

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

## 📞 Support

For deployment issues:
1. Check logs: `kubectl logs -f <pod-name> -n coffee-export`
2. Check events: `kubectl get events -n coffee-export`
3. Review documentation
4. Contact DevOps team

## 🎉 Post-Deployment Checklist

- [ ] All pods are running
- [ ] Services are accessible
- [ ] Ingress is configured
- [ ] SSL certificates are valid
- [ ] Monitoring is active
- [ ] Alerts are configured
- [ ] Backups are scheduled
- [ ] Security scans passed
- [ ] Load testing completed
- [ ] Documentation updated

---

**Deployment Status**: Ready for Production ✅

**Last Updated**: January 2024
