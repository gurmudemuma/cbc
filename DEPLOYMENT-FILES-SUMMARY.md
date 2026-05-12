# Nginx Reverse Proxy Deployment - Files Summary

This document provides an overview of all the deployment files created for setting up nginx reverse proxy on server 10.3.xx.xx.

---

## 📁 Created Files

### 1. **NGINX-REVERSE-PROXY-DEPLOYMENT-GUIDE.md**
**Purpose:** Comprehensive deployment guide with detailed instructions

**Contents:**
- Architecture overview
- Prerequisites and system requirements
- Step-by-step installation instructions
- Complete nginx configuration templates
- SSL/TLS setup (Let's Encrypt, self-signed, commercial)
- Firewall configuration (UFW and firewalld)
- Testing and verification procedures
- Troubleshooting guide
- Maintenance procedures
- Security checklist

**When to use:** For detailed understanding and manual deployment

---

### 2. **deploy-nginx-proxy.sh**
**Purpose:** Automated deployment script

**Features:**
- Auto-detects OS (Ubuntu/Debian/RHEL/CentOS)
- Installs nginx automatically
- Creates and configures nginx files
- Sets up firewall rules
- Optional SSL configuration
- Verifies backend services
- Provides deployment summary

**Usage:**
```bash
# Basic deployment
./deploy-nginx-proxy.sh --ip 10.3.xx.xx

# With domain and SSL
./deploy-nginx-proxy.sh --ip 10.3.1.100 --domain coffee.example.com --ssl letsencrypt

# With self-signed SSL
./deploy-nginx-proxy.sh --ip 10.3.1.100 --ssl selfsigned

# Help
./deploy-nginx-proxy.sh --help
```

**When to use:** For quick automated deployment

---

### 3. **NGINX-DEPLOYMENT-QUICK-REFERENCE.md**
**Purpose:** Quick reference card for common tasks

**Contents:**
- Quick deployment commands
- Common nginx commands
- Troubleshooting quick fixes
- SSL setup commands
- Firewall configuration
- Monitoring commands
- Service URLs
- Emergency commands
- Quick test script

**When to use:** For day-to-day operations and quick lookups

---

### 4. **test-deployment.sh**
**Purpose:** Comprehensive deployment testing script

**Tests:**
- Nginx service status and configuration
- Port listening status
- Docker container status
- Backend service health checks
- Reverse proxy functionality
- API endpoint accessibility
- Database connectivity
- Log file existence

**Usage:**
```bash
# Run tests
sudo bash test-deployment.sh

# Or make executable and run
chmod +x test-deployment.sh
sudo ./test-deployment.sh
```

**When to use:** After deployment to verify everything is working

---

## 🚀 Deployment Workflow

### Quick Start (Recommended)

1. **Copy files to server:**
```bash
scp deploy-nginx-proxy.sh test-deployment.sh root@10.3.xx.xx:/root/
```

2. **SSH to server:**
```bash
ssh root@10.3.xx.xx
```

3. **Run deployment:**
```bash
chmod +x deploy-nginx-proxy.sh test-deployment.sh
./deploy-nginx-proxy.sh --ip 10.3.xx.xx
```

4. **Test deployment:**
```bash
./test-deployment.sh
```

5. **Access application:**
```
http://10.3.xx.xx
```

---

### Manual Deployment

If you prefer manual control, follow these steps:

1. **Read the comprehensive guide:**
   - Open `NGINX-REVERSE-PROXY-DEPLOYMENT-GUIDE.md`
   - Follow step-by-step instructions

2. **Install nginx:**
   - Ubuntu: `apt install nginx`
   - RHEL: `yum install nginx`

3. **Create configuration:**
   - Copy templates from guide
   - Customize for your environment

4. **Test and start:**
   - Test: `nginx -t`
   - Start: `systemctl start nginx`

5. **Verify:**
   - Run `test-deployment.sh`

---

## 📋 Configuration Overview

### Nginx Architecture

```
Client Request
    ↓
[Nginx :80/443]
    ↓
    ├─ /api/auth          → Exporter Portal :3010
    ├─ /api/ecta/*        → ECTA Service :3003
    ├─ /api/contracts/*   → Exporter Portal :3010
    ├─ /api/exporter/*    → Exporter Portal :3010
    ├─ /api/marketplace/* → Gateway :3000
    ├─ /api/lc/*          → Exporter Portal :3010
    ├─ /api/payments/*    → Exporter Portal :3010
    ├─ /api/*             → Gateway :3000 (default)
    └─ /*                 → Frontend :5173
```

### Key Features

✅ **Load Balancing:** Connection pooling with keepalive  
✅ **Rate Limiting:** API and auth endpoints protected  
✅ **Security Headers:** XSS, CSRF, clickjacking protection  
✅ **SSL/TLS:** Multiple setup options  
✅ **Caching:** Static assets cached, API responses fresh  
✅ **WebSocket:** Full support for real-time features  
✅ **Health Checks:** Monitoring endpoints  
✅ **Logging:** Access and error logs  

---

## 🔧 Configuration Files Location

After deployment, configuration files will be at:

### Ubuntu/Debian
```
/etc/nginx/
├── nginx.conf                              # Main config
├── sites-available/
│   └── coffee-export                       # Site config
├── sites-enabled/
│   └── coffee-export -> ../sites-available/coffee-export
└── conf.d/
    └── coffee-export-locations.conf        # Location blocks
```

### RHEL/CentOS
```
/etc/nginx/
├── nginx.conf                              # Main config
└── conf.d/
    ├── coffee-export.conf                  # Site config
    └── coffee-export-locations.conf        # Location blocks
```

---

## 🔒 Security Considerations

### Firewall Rules
- **Open:** 22 (SSH), 80 (HTTP), 443 (HTTPS)
- **Closed:** All backend service ports (3000-3010, 5173)

### SSL/TLS
- **Production:** Use Let's Encrypt (free, auto-renewal)
- **Testing:** Use self-signed certificates
- **Enterprise:** Use commercial certificates

### Rate Limiting
- **API endpoints:** 100 requests/minute per IP
- **Auth endpoints:** 10 requests/minute per IP

### Headers
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (with SSL)

---

## 📊 Monitoring & Maintenance

### Daily Checks
```bash
# Check nginx status
systemctl status nginx

# Check error logs
tail -f /var/log/nginx/error.log

# Check Docker services
docker ps
```

### Weekly Tasks
```bash
# Review access logs
tail -n 1000 /var/log/nginx/access.log | less

# Check disk space
df -h

# Update system
apt update && apt upgrade  # Ubuntu
yum update                 # RHEL
```

### Monthly Tasks
```bash
# Backup configuration
tar -czf nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx/

# Review SSL certificates
certbot certificates  # If using Let's Encrypt

# Review security updates
apt list --upgradable  # Ubuntu
yum check-update       # RHEL
```

---

## 🆘 Troubleshooting Quick Guide

### Problem: 502 Bad Gateway
**Solution:**
```bash
# Check backend services
docker ps
docker-compose restart

# Check nginx logs
tail -f /var/log/nginx/error.log
```

### Problem: 504 Gateway Timeout
**Solution:**
```bash
# Increase timeouts in nginx config
proxy_read_timeout 120s;

# Reload nginx
nginx -t && systemctl reload nginx
```

### Problem: SSL Certificate Error
**Solution:**
```bash
# Renew Let's Encrypt
certbot renew

# Check certificate
openssl x509 -in /etc/letsencrypt/live/domain/cert.pem -text -noout
```

### Problem: High CPU Usage
**Solution:**
```bash
# Check nginx processes
ps aux | grep nginx

# Check access logs for unusual traffic
tail -f /var/log/nginx/access.log

# Consider rate limiting or blocking IPs
```

---

## 📞 Support Resources

### Documentation
- **Nginx Official Docs:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **Docker Compose:** https://docs.docker.com/compose/

### Log Locations
- **Nginx Access:** `/var/log/nginx/access.log`
- **Nginx Error:** `/var/log/nginx/error.log`
- **Docker Logs:** `docker logs <container-name>`

### Useful Commands Reference
See `NGINX-DEPLOYMENT-QUICK-REFERENCE.md` for complete command list

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Nginx is running: `systemctl status nginx`
- [ ] Configuration is valid: `nginx -t`
- [ ] Firewall is configured: `ufw status` or `firewall-cmd --list-all`
- [ ] Backend services are running: `docker ps`
- [ ] Frontend is accessible: `curl http://10.3.xx.xx`
- [ ] API endpoints work: `curl http://10.3.xx.xx/api/health`
- [ ] SSL is configured (if applicable): `curl https://domain.com`
- [ ] Logs are being written: `ls -lh /var/log/nginx/`
- [ ] Test script passes: `./test-deployment.sh`
- [ ] Monitoring is set up
- [ ] Backups are scheduled

---

## 🎯 Next Steps

After successful deployment:

1. **Configure SSL/TLS** (if not done during deployment)
2. **Set up monitoring** (Prometheus, Grafana, or similar)
3. **Configure log rotation** (usually automatic)
4. **Set up automated backups**
5. **Document any custom changes**
6. **Train team on maintenance procedures**
7. **Set up alerting** for service failures
8. **Review and optimize** performance settings

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-12 | Initial deployment files created |

---

**Created:** May 12, 2026  
**Author:** Kiro AI Assistant  
**Project:** Coffee Export Blockchain System  
**Server:** 10.3.xx.xx
