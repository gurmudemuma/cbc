# 🛠️ Scripts Directory

Automation scripts for the Coffee Export Blockchain system.

---

## 📋 Available Scripts

### 1. generate-secrets.sh

**Purpose:** Generate secure secrets for all services

**Usage:**
```bash
./scripts/generate-secrets.sh
```

**What it does:**
- Generates 32-character random secrets
- Creates CouchDB credentials
- Creates JWT secrets for each service (5 services)
- Creates Redis password
- Saves to `secrets/` directory
- Creates `.env.secrets` reference file

**Output:**
```
secrets/
├── couchdb_user.txt
├── couchdb_password.txt
├── jwt_secret_commercialbank.txt
├── jwt_secret_national_bank.txt
├── jwt_secret_ncat.txt
├── jwt_secret_shipping_line.txt
├── jwt_secret_custom_authorities.txt
└── redis_password.txt

.env.secrets (reference file)
```

**When to run:**
- Initial setup
- Secret rotation (every 90 days recommended)
- After security incident

---

### 2. backup-system.sh

**Purpose:** Backup entire blockchain system

**Usage:**
```bash
# Basic backup
./scripts/backup-system.sh

# With encryption
ENCRYPT_BACKUP=true ENCRYPTION_KEY="your-key" ./scripts/backup-system.sh

# With S3 upload
S3_BUCKET="my-bucket" ./scripts/backup-system.sh

# Custom retention
RETENTION_DAYS=90 ./scripts/backup-system.sh

# All options combined
ENCRYPT_BACKUP=true \
ENCRYPTION_KEY="your-key" \
S3_BUCKET="my-bucket" \
RETENTION_DAYS=90 \
./scripts/backup-system.sh
```

**What it backs up:**
1. Fabric ledger data (all peers + orderer)
2. CouchDB databases (all 5 instances)
3. MSP certificates
4. Configuration files
5. Chaincode source

**Output:**
```
backups/
└── cbc_backup_20251022_140530.tar.gz (or .tar.gz.enc if encrypted)
```

**Environment Variables:**
- `BACKUP_DIR` - Backup directory (default: ./backups)
- `RETENTION_DAYS` - Days to keep backups (default: 30)
- `S3_BUCKET` - S3 bucket for upload (optional)
- `ENCRYPT_BACKUP` - Enable encryption (default: true)
- `ENCRYPTION_KEY` - Encryption password (required if ENCRYPT_BACKUP=true)

**Schedule with cron:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/cbc/scripts/backup-system.sh >> /var/log/cbc-backup.log 2>&1
```

---

### 3. restore-system.sh (To Be Created)

**Purpose:** Restore from backup

**Planned Usage:**
```bash
./scripts/restore-system.sh backups/cbc_backup_20251022_140530.tar.gz
```

---

## 🔧 Utility Scripts

### System Status

Check system health:
```bash
./scripts/system-status.sh
```

### Port Management

Kill processes on specific ports:
```bash
./scripts/force-kill-ports.sh
```

### Docker Cleanup

Clean up Docker resources:
```bash
./scripts/cleanup.sh
```

---

## 📝 Script Templates

### Creating a New Script

```bash
#!/bin/bash

# Script Name: my-script.sh
# Purpose: Brief description
# Usage: ./scripts/my-script.sh [options]

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
VAR1="${VAR1:-default_value}"

# Functions
log() {
    echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# Main logic
main() {
    log "Starting script..."
    
    # Your code here
    
    log "Script completed successfully"
}

# Run main function
main "$@"
```

---

## 🔐 Security Best Practices

### Secret Management

1. **Never commit secrets to git**
   ```bash
   # .gitignore already includes:
   secrets/
   .env
   .env.secrets
   ```

2. **Rotate secrets regularly**
   ```bash
   # Every 90 days
   ./scripts/generate-secrets.sh
   # Then update all services
   ```

3. **Use encryption for backups**
   ```bash
   ENCRYPT_BACKUP=true ENCRYPTION_KEY="strong-password" ./scripts/backup-system.sh
   ```

4. **Store encryption keys separately**
   - Use a password manager
   - Use environment variables
   - Use a secrets vault (HashiCorp Vault, AWS Secrets Manager)

---

## 📊 Monitoring Scripts

### Log Analysis

View recent errors:
```bash
tail -n 100 api/commercialbank/logs/error.log
```

View all logs:
```bash
tail -f api/commercialbank/logs/combined.log
```

### Cache Statistics

```bash
redis-cli INFO stats
redis-cli DBSIZE
```

### Metrics

```bash
curl http://localhost:3001/metrics
```

---

## 🧪 Testing Scripts

### Run All Tests

```bash
cd api
npm run test:all
```

### Test Specific Service

```bash
cd api/commercialbank
npm test
```

### Test Backup/Restore

```bash
# Create test backup
./scripts/backup-system.sh

# Verify backup
tar -tzf backups/cbc_backup_*.tar.gz | head -20

# Test restore (when implemented)
./scripts/restore-system.sh backups/cbc_backup_*.tar.gz
```

---

## 🚨 Emergency Procedures

### System Down

```bash
# 1. Check Docker containers
docker ps -a

# 2. Check logs
docker-compose logs --tail=100

# 3. Restart services
docker-compose restart

# 4. Full restart if needed
docker-compose down
docker-compose up -d
```

### Data Corruption

```bash
# 1. Stop services
docker-compose down

# 2. Restore from backup
./scripts/restore-system.sh backups/latest_backup.tar.gz

# 3. Verify data integrity
./scripts/verify-system.sh

# 4. Restart services
docker-compose up -d
```

### Security Incident

```bash
# 1. Rotate all secrets immediately
./scripts/generate-secrets.sh

# 2. Update all service .env files
# (Manual step - copy from .env.secrets)

# 3. Restart all services
docker-compose restart

# 4. Review logs for suspicious activity
grep -i "failed\|error\|unauthorized" api/*/logs/combined.log

# 5. Create incident backup
./scripts/backup-system.sh
```

---

## 📈 Performance Optimization

### Cache Warming

```bash
# Warm up cache after restart
curl http://localhost:3001/api/exports
curl http://localhost:3002/api/fx/exports
curl http://localhost:3003/api/quality/exports
curl http://localhost:3004/api/shipments/exports
```

### Database Optimization

```bash
# Compact CouchDB databases
for i in {0..4}; do
  curl -X POST http://admin:adminpw@localhost:$((5984+i*1000))/_compact
done
```

---

## 🔄 Maintenance Schedule

### Daily

```bash
# Check system health
./scripts/system-status.sh

# Review logs
tail -n 50 api/*/logs/error.log
```

### Weekly

```bash
# Backup
./scripts/backup-system.sh

# Update dependencies
cd api && npm update
```

### Monthly

```bash
# Rotate secrets
./scripts/generate-secrets.sh

# Clean old backups (automatic in backup script)

# Security scan
npm audit
```

### Quarterly

```bash
# Major updates
npm outdated
npm update --save

# Full system backup
ENCRYPT_BACKUP=true ./scripts/backup-system.sh

# Disaster recovery test
./scripts/restore-system.sh backups/test_backup.tar.gz
```

---

## 📚 Additional Resources

### Documentation

- [FIXES_IMPLEMENTED.md](../FIXES_IMPLEMENTED.md) - Detailed implementation guide
- [QUICK_START_V2.md](../QUICK_START_V2.md) - Quick start guide
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Production deployment

### External Tools

- **Docker:** https://docs.docker.com/
- **Redis:** https://redis.io/documentation
- **Prometheus:** https://prometheus.io/docs/
- **Grafana:** https://grafana.com/docs/

---

## 🆘 Troubleshooting

### Script Permission Denied

```bash
chmod +x scripts/*.sh
```

### Backup Fails - No Space

```bash
# Check disk space
df -h

# Clean old backups
find backups/ -name "*.tar.gz" -mtime +30 -delete

# Clean Docker volumes
docker system prune -a --volumes
```

### Secret Generation Fails

```bash
# Check OpenSSL is installed
which openssl

# Install if missing (Ubuntu/Debian)
sudo apt-get install openssl

# Install if missing (macOS)
brew install openssl
```

### S3 Upload Fails

```bash
# Check AWS CLI is installed
which aws

# Install AWS CLI
pip install awscli

# Configure credentials
aws configure
```

---

## 💡 Tips & Tricks

### Parallel Backups

```bash
# Backup multiple components in parallel
./scripts/backup-system.sh &
./scripts/backup-logs.sh &
wait
```

### Automated Testing

```bash
# Test backup integrity
tar -tzf backups/latest.tar.gz > /dev/null && echo "Backup OK" || echo "Backup corrupted"
```

### Remote Backups

```bash
# Backup to remote server via SSH
./scripts/backup-system.sh
scp backups/latest.tar.gz user@remote:/backups/
```

### Monitoring Integration

```bash
# Send metrics to monitoring system
./scripts/backup-system.sh && curl -X POST https://monitoring.example.com/backup-success
```

---

## 🎯 Script Development Guidelines

### Standards

1. **Always use `set -e`** - Exit on error
2. **Use absolute paths** - Avoid relative path issues
3. **Add logging** - Use log() function
4. **Handle errors** - Use error_exit() function
5. **Document usage** - Add comments and help text
6. **Make idempotent** - Safe to run multiple times
7. **Test thoroughly** - Test on clean system

### Example

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log() { echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1"; }
error_exit() { log "ERROR: $1"; exit 1; }

# Main logic
log "Starting..."
# Your code here
log "Complete"
```

---

## 📞 Support

For issues with scripts:

1. Check script permissions: `ls -la scripts/`
2. Review script output for errors
3. Check logs: `tail -f /var/log/cbc-*.log`
4. Open an issue on GitHub

---

**Last Updated:** October 22, 2025  
**Maintained By:** Coffee Blockchain Consortium Team
