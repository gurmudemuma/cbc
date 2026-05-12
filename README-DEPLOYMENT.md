# Nginx Reverse Proxy Deployment - README

## 🎯 Quick Start

Deploy nginx reverse proxy for Coffee Export System on server **10.3.xx.xx** in 3 steps:

### Step 1: Copy Files to Server
```bash
scp deploy-nginx-proxy.sh test-deployment.sh root@10.3.xx.xx:/root/
```

### Step 2: Run Deployment Script
```bash
ssh root@10.3.xx.xx
chmod +x deploy-nginx-proxy.sh test-deployment.sh
./deploy-nginx-proxy.sh --ip 10.3.xx.xx
```

### Step 3: Test Deployment
```bash
./test-deployment.sh
```

### Step 4: Access Application
Open browser: `http://10.3.xx.xx`

---

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **NGINX-REVERSE-PROXY-DEPLOYMENT-GUIDE.md** | Complete deployment guide | Detailed setup & understanding |
| **NGINX-DEPLOYMENT-QUICK-REFERENCE.md** | Quick command reference | Daily operations |
| **DEPLOYMENT-FILES-SUMMARY.md** | Overview of all files | Understanding file structure |
| **deploy-nginx-proxy.sh** | Automated deployment | Quick automated setup |
| **test-deployment.sh** | Testing script | Verify deployment |
| **README-DEPLOYMENT.md** | This file | Getting started |

---

## 🚀 Deployment Options

### Option 1: Basic HTTP (Fastest)
```bash
./deploy-nginx-proxy.sh --ip 10.3.xx.xx
```

### Option 2: With Domain and SSL
```bash
./deploy-nginx-proxy.sh --ip 10.3.xx.xx --domain coffee-export.example.com --ssl letsencrypt
```

### Option 3: Self-Signed SSL (Testing)
```bash
./deploy-nginx-proxy.sh --ip 10.3.xx.xx --ssl selfsigned
```

### Option 4: Manual Deployment
Follow instructions in `NGINX-REVERSE-PROXY-DEPLOYMENT-GUIDE.md`

---

## 🔍 What Gets Deployed

### Nginx Configuration
- Reverse proxy for all backend services
- Rate limiting on API endpoints
- Security headers
- Static asset caching
- WebSocket support
- Health check endpoints

### Service Routing
```
http://10.3.xx.xx/              → Frontend (React SPA)
http://10.3.xx.xx/api/          → Gateway Service
http://10.3.xx.xx/api/exporter/ → Exporter Portal
http://10.3.xx.xx/api/ecta/     → ECTA Service
http://10.3.xx.xx/api/auth      → Authentication
```

### Security
- Firewall rules (ports 80, 443 open)
- Backend services only on localhost
- Rate limiting enabled
- Security headers configured

---

## ✅ Prerequisites

Before deployment, ensure:

- [ ] Server running Ubuntu 20.04+ or RHEL/CentOS 8+
- [ ] Docker and Docker Compose installed
- [ ] All backend services running (`docker ps`)
- [ ] Root or sudo access
- [ ] Ports 80 and 443 available

**Check backend services:**
```bash
docker-compose -f docker-compose-hybrid.yml ps
```

**Start services if needed:**
```bash
docker-compose -f docker-compose-hybrid.yml up -d
```

---

## 🧪 Testing

After deployment, run the test script:

```bash
sudo ./test-deployment.sh
```

**Expected output:**
```
========================================
Coffee Export System - Deployment Test
========================================

1. Nginx Service Tests
Testing Nginx service status... ✓ PASSED
Testing Nginx configuration... ✓ PASSED

2. Port Listening Tests
Testing Port 80 (HTTP)... ✓ PASSED
Testing Port 3000 (Gateway)... ✓ PASSED
...

Test Summary
Total tests: 30
Passed: 30
Failed: 0

✓ All tests passed! System is ready.
```

---

## 🔧 Common Tasks

### View Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Docker logs
docker-compose -f docker-compose-hybrid.yml logs -f
```

### Restart Services
```bash
# Restart nginx
sudo systemctl restart nginx

# Restart Docker services
docker-compose -f docker-compose-hybrid.yml restart
```

### Update Configuration
```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/coffee-export  # Ubuntu
sudo nano /etc/nginx/conf.d/coffee-export.conf      # RHEL

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🆘 Troubleshooting

### Problem: 502 Bad Gateway
```bash
# Check if backend services are running
docker ps

# Restart services
docker-compose -f docker-compose-hybrid.yml restart
```

### Problem: Cannot access from browser
```bash
# Check firewall
sudo ufw status              # Ubuntu
sudo firewall-cmd --list-all # RHEL

# Check nginx is running
sudo systemctl status nginx
```

### Problem: SSL not working
```bash
# Check certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew
```

**For more troubleshooting, see:** `NGINX-DEPLOYMENT-QUICK-REFERENCE.md`

---

## 📖 Documentation Structure

```
Root Directory
├── README-DEPLOYMENT.md                      ← You are here
├── DEPLOYMENT-FILES-SUMMARY.md               ← Overview of all files
├── NGINX-REVERSE-PROXY-DEPLOYMENT-GUIDE.md   ← Complete guide
├── NGINX-DEPLOYMENT-QUICK-REFERENCE.md       ← Quick reference
├── deploy-nginx-proxy.sh                     ← Automated deployment
└── test-deployment.sh                        ← Testing script
```

**Reading order:**
1. **README-DEPLOYMENT.md** (this file) - Start here
2. **DEPLOYMENT-FILES-SUMMARY.md** - Understand what each file does
3. **NGINX-REVERSE-PROXY-DEPLOYMENT-GUIDE.md** - Detailed deployment
4. **NGINX-DEPLOYMENT-QUICK-REFERENCE.md** - Keep for daily use

---

## 🔒 Security Notes

### Default Security Features
✅ Firewall configured (only 80, 443 open)  
✅ Backend services on localhost only  
✅ Rate limiting enabled  
✅ Security headers configured  
✅ Hidden files blocked  

### Recommended Additional Steps
- [ ] Configure SSL/TLS certificates
- [ ] Set up fail2ban for brute force protection
- [ ] Configure log monitoring/alerting
- [ ] Regular security updates
- [ ] Backup configuration files

---

## 📊 System Requirements

### Minimum
- 4 CPU cores
- 8 GB RAM
- 50 GB disk space
- Ubuntu 20.04+ or RHEL 8+

### Recommended
- 8 CPU cores
- 16 GB RAM
- 100 GB disk space
- SSD storage

---

## 🌐 Service Ports

| Service | Internal Port | External Access |
|---------|---------------|-----------------|
| Frontend | 5173 | via nginx :80 |
| Gateway | 3000 | via nginx :80 |
| Exporter Portal | 3010 | via nginx :80 |
| ECTA Service | 3003 | via nginx :80 |
| Commercial Bank | 3002 | via nginx :80 |
| National Bank | 3004 | via nginx :80 |
| Customs | 3005 | via nginx :80 |
| ECX | 3006 | via nginx :80 |
| Shipping | 3007 | via nginx :80 |
| Buyer Verification | 3009 | via nginx :80 |
| PostgreSQL | 5432 | localhost only |
| Redis | 6379 | localhost only |
| Kafka | 9092 | localhost only |

---

## 💡 Tips

### Performance
- Nginx uses connection pooling (keepalive)
- Static assets are cached
- Gzip compression enabled

### Monitoring
- Health endpoint: `http://10.3.xx.xx/health`
- Nginx status: `http://10.3.xx.xx/nginx_status` (localhost only)

### Maintenance
- Logs rotate automatically
- SSL certificates auto-renew (Let's Encrypt)
- Configuration backups recommended weekly

---

## 📞 Getting Help

### Check Documentation
1. Read `NGINX-REVERSE-PROXY-DEPLOYMENT-GUIDE.md` for detailed info
2. Check `NGINX-DEPLOYMENT-QUICK-REFERENCE.md` for quick fixes
3. Review `DEPLOYMENT-FILES-SUMMARY.md` for file overview

### Collect Debug Information
```bash
# System info
uname -a
nginx -v

# Service status
systemctl status nginx
docker ps

# Test configuration
nginx -t

# Check logs
tail -n 50 /var/log/nginx/error.log
```

### Common Resources
- Nginx docs: https://nginx.org/en/docs/
- Docker docs: https://docs.docker.com/
- Let's Encrypt: https://letsencrypt.org/

---

## 🎓 Learning Path

### Beginner
1. Run automated deployment script
2. Test with test-deployment.sh
3. Learn basic nginx commands from quick reference

### Intermediate
1. Read complete deployment guide
2. Understand nginx configuration structure
3. Customize configuration for your needs

### Advanced
1. Optimize performance settings
2. Set up monitoring and alerting
3. Implement advanced security features
4. Configure load balancing

---

## ✨ Features

### Included
✅ Reverse proxy for all services  
✅ Rate limiting  
✅ Security headers  
✅ Static asset caching  
✅ WebSocket support  
✅ Health checks  
✅ Firewall configuration  
✅ SSL/TLS support  
✅ Automated deployment  
✅ Testing script  

### Optional (Manual Setup)
⚪ Let's Encrypt SSL  
⚪ Custom domain  
⚪ Advanced monitoring  
⚪ Log aggregation  
⚪ Backup automation  

---

## 📅 Maintenance Schedule

### Daily
- Check service status
- Review error logs

### Weekly
- Review access logs
- Check disk space
- Verify backups

### Monthly
- Update system packages
- Review SSL certificates
- Security audit
- Performance review

---

## 🚦 Status Indicators

After deployment, check these:

✅ **Nginx running:** `systemctl status nginx`  
✅ **Config valid:** `nginx -t`  
✅ **Services up:** `docker ps`  
✅ **Frontend accessible:** `curl http://10.3.xx.xx`  
✅ **API working:** `curl http://10.3.xx.xx/api/health`  
✅ **Firewall active:** `ufw status` or `firewall-cmd --list-all`  

---

## 📝 Quick Command Reference

```bash
# Deploy
./deploy-nginx-proxy.sh --ip 10.3.xx.xx

# Test
./test-deployment.sh

# Restart nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/error.log

# Restart Docker services
docker-compose -f docker-compose-hybrid.yml restart

# Check status
systemctl status nginx
docker ps
```

---

## 🎯 Success Criteria

Deployment is successful when:

1. ✅ Test script passes all tests
2. ✅ Frontend loads in browser
3. ✅ Can login to application
4. ✅ API endpoints respond
5. ✅ No errors in nginx logs
6. ✅ All Docker containers running
7. ✅ Firewall configured correctly

---

**Need help?** Check the detailed guides or run `./test-deployment.sh` for diagnostics.

**Last Updated:** May 12, 2026  
**Version:** 1.0  
**Project:** Coffee Export Blockchain System
