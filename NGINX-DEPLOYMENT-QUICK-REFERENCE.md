# Nginx Deployment Quick Reference Card
## Coffee Export System - Server 10.3.xx.xx

---

## 🚀 Quick Deployment (Automated)

### Option 1: Basic HTTP Setup
```bash
# Copy script to server
scp deploy-nginx-proxy.sh root@10.3.xx.xx:/root/

# SSH to server
ssh root@10.3.xx.xx

# Run deployment script
chmod +x deploy-nginx-proxy.sh
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

---

## 📋 Manual Deployment Steps

### 1. Install Nginx
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nginx -y

# RHEL/CentOS
sudo yum install epel-release -y && sudo yum install nginx -y
```

### 2. Copy Configuration Files
```bash
# Ubuntu/Debian
sudo cp nginx-configs/coffee-export /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/coffee-export /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# RHEL/CentOS
sudo cp nginx-configs/coffee-export.conf /etc/nginx/conf.d/
sudo cp nginx-configs/coffee-export-locations.conf /etc/nginx/conf.d/
```

### 3. Update Server IP
```bash
# Edit configuration file
sudo nano /etc/nginx/sites-available/coffee-export  # Ubuntu
# OR
sudo nano /etc/nginx/conf.d/coffee-export.conf      # RHEL

# Replace SERVER_NAME_PLACEHOLDER with your IP
# server_name 10.3.xx.xx;
```

### 4. Test and Start
```bash
# Test configuration
sudo nginx -t

# Start nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 🔧 Common Commands

### Nginx Control
```bash
sudo systemctl start nginx      # Start
sudo systemctl stop nginx       # Stop
sudo systemctl restart nginx    # Restart
sudo systemctl reload nginx     # Reload config (no downtime)
sudo systemctl status nginx     # Check status
```

### Configuration Testing
```bash
sudo nginx -t                   # Test configuration
sudo nginx -T                   # Test and dump configuration
```

### Log Viewing
```bash
# Real-time access logs
sudo tail -f /var/log/nginx/access.log

# Real-time error logs
sudo tail -f /var/log/nginx/error.log

# Last 100 lines
sudo tail -n 100 /var/log/nginx/error.log
```

### Docker Services
```bash
# Start all services
docker-compose -f docker-compose-hybrid.yml up -d

# Stop all services
docker-compose -f docker-compose-hybrid.yml down

# Restart specific service
docker-compose -f docker-compose-hybrid.yml restart frontend

# View logs
docker-compose -f docker-compose-hybrid.yml logs -f gateway
```

---

## 🔍 Troubleshooting

### Check if Backend Services are Running
```bash
# Check all Docker containers
docker ps

# Test individual services
curl http://localhost:3000/health  # Gateway
curl http://localhost:3010/health  # Exporter Portal
curl http://localhost:3003/health  # ECTA
curl http://localhost:5173/health  # Frontend
```

### Check Port Listening
```bash
# Check which ports are open
sudo netstat -tlnp | grep -E ':(80|443|3000|3010|5173)'

# Or using ss
sudo ss -tlnp | grep -E ':(80|443|3000|3010|5173)'
```

### Test Nginx Proxy
```bash
# From server
curl http://localhost/health
curl http://localhost/api/health

# From another machine
curl http://10.3.xx.xx/health
```

### Fix 502 Bad Gateway
```bash
# Check if backend is running
docker ps

# Restart backend services
docker-compose -f docker-compose-hybrid.yml restart

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Fix 504 Gateway Timeout
```bash
# Increase timeout in nginx config
# Add to location blocks:
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔒 SSL/TLS Setup

### Let's Encrypt (Free SSL)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d coffee-export.example.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Self-Signed Certificate (Testing)
```bash
# Generate certificate
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/coffee-export.key \
  -out /etc/nginx/ssl/coffee-export.crt \
  -subj "/C=ET/ST=Addis Ababa/O=Coffee Export/CN=10.3.xx.xx"

# Update nginx config to use SSL
# Uncomment HTTPS server block in config file
```

---

## 🛡️ Firewall Configuration

### UFW (Ubuntu/Debian)
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

### Firewalld (RHEL/CentOS)
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

---

## 📊 Monitoring

### Check Nginx Status
```bash
# View status page (if enabled)
curl http://localhost/nginx_status

# Check process
ps aux | grep nginx

# Check memory usage
sudo systemctl status nginx
```

### Monitor Logs in Real-Time
```bash
# Access logs with filtering
sudo tail -f /var/log/nginx/access.log | grep -E '(POST|PUT|DELETE)'

# Error logs only
sudo tail -f /var/log/nginx/error.log | grep error

# Count requests per minute
sudo tail -f /var/log/nginx/access.log | pv -l -i 60 > /dev/null
```

---

## 🔄 Update & Maintenance

### Update Nginx
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade nginx -y

# RHEL/CentOS
sudo yum update nginx -y

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### Backup Configuration
```bash
# Backup nginx config
sudo tar -czf nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx/

# Backup SSL certificates
sudo tar -czf ssl-backup-$(date +%Y%m%d).tar.gz /etc/nginx/ssl/
```

### Restore Configuration
```bash
# Restore from backup
sudo tar -xzf nginx-backup-20260512.tar.gz -C /

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🌐 Service URLs

After deployment, access services at:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | `http://10.3.xx.xx/` | Main web application |
| **API Gateway** | `http://10.3.xx.xx/api/` | General API endpoints |
| **Exporter Portal** | `http://10.3.xx.xx/api/exporter/` | Exporter-specific APIs |
| **ECTA Service** | `http://10.3.xx.xx/api/ecta/` | ECTA registration APIs |
| **Marketplace** | `http://10.3.xx.xx/api/marketplace/` | Marketplace APIs |
| **Health Check** | `http://10.3.xx.xx/health` | System health status |

---

## 📝 Configuration File Locations

### Ubuntu/Debian
- Main config: `/etc/nginx/nginx.conf`
- Site config: `/etc/nginx/sites-available/coffee-export`
- Enabled sites: `/etc/nginx/sites-enabled/`
- Logs: `/var/log/nginx/`

### RHEL/CentOS
- Main config: `/etc/nginx/nginx.conf`
- Site configs: `/etc/nginx/conf.d/*.conf`
- Logs: `/var/log/nginx/`

---

## ⚡ Performance Tuning

### Increase Worker Connections
```bash
# Edit /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 4096;

# Reload
sudo systemctl reload nginx
```

### Enable Caching
```bash
# Add to http block in nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g;

# Add to location blocks
proxy_cache api_cache;
proxy_cache_valid 200 5m;
```

---

## 🆘 Emergency Commands

### Quick Restart Everything
```bash
# Restart all services
docker-compose -f docker-compose-hybrid.yml restart
sudo systemctl restart nginx
```

### Stop Everything
```bash
# Stop Docker services
docker-compose -f docker-compose-hybrid.yml down

# Stop nginx
sudo systemctl stop nginx
```

### Check System Resources
```bash
# CPU and memory
htop

# Disk usage
df -h

# Docker stats
docker stats
```

---

## 📞 Support Checklist

Before asking for help, collect this information:

```bash
# System info
uname -a
cat /etc/os-release

# Nginx version and status
nginx -v
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check logs
sudo tail -n 50 /var/log/nginx/error.log

# Check Docker services
docker ps
docker-compose -f docker-compose-hybrid.yml ps

# Check ports
sudo netstat -tlnp | grep -E ':(80|443|3000|3010|5173)'
```

---

## 🎯 Quick Test Script

Save as `test-deployment.sh`:

```bash
#!/bin/bash

echo "Testing Coffee Export System Deployment..."
echo "=========================================="

# Test nginx
echo -n "Nginx status: "
systemctl is-active nginx

# Test backend services
services=("3000:Gateway" "3010:Exporter" "3003:ECTA" "5173:Frontend")
for service in "${services[@]}"; do
    port="${service%%:*}"
    name="${service##*:}"
    echo -n "$name (port $port): "
    if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✓ OK"
    else
        echo "✗ FAILED"
    fi
done

# Test reverse proxy
echo -n "Reverse proxy: "
if curl -s -f "http://localhost/health" > /dev/null 2>&1; then
    echo "✓ OK"
else
    echo "✗ FAILED"
fi

echo "=========================================="
echo "Test complete!"
```

Run with: `bash test-deployment.sh`

---

**Last Updated:** May 12, 2026  
**Version:** 1.0
