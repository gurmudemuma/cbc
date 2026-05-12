# Nginx Reverse Proxy Deployment Guide
## Coffee Export System - Server 10.3.xx.xx

This guide provides a complete nginx reverse proxy configuration for deploying the Coffee Export Blockchain System on a production server.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Installation Steps](#installation-steps)
4. [Nginx Configuration](#nginx-configuration)
5. [SSL/TLS Setup](#ssltls-setup)
6. [Firewall Configuration](#firewall-configuration)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## Architecture Overview

```
Internet
    ↓
[Nginx Reverse Proxy] (Port 80/443)
    ↓
    ├─→ Frontend (Port 5173) → Static Files + SPA
    ├─→ Gateway Service (Port 3000) → Blockchain API
    ├─→ Exporter Portal (Port 3010) → Exporter APIs
    ├─→ ECTA Service (Port 3003) → ECTA APIs
    ├─→ Commercial Bank (Port 3002) → Bank APIs
    ├─→ National Bank (Port 3004) → NBE APIs
    ├─→ Customs (Port 3005) → Customs APIs
    ├─→ ECX (Port 3006) → ECX APIs
    ├─→ Shipping (Port 3007) → Shipping APIs
    └─→ Buyer Verification (Port 3009) → Verification APIs
```

---

## Prerequisites

### System Requirements
- Ubuntu 20.04+ or RHEL/CentOS 8+
- Minimum 8GB RAM, 4 CPU cores
- 100GB disk space
- Docker & Docker Compose installed
- Root or sudo access

### Domain/Network Setup
- Server IP: `10.3.xx.xx` (replace with your actual IP)
- Domain name (optional): `coffee-export.example.com`
- Open ports: 80 (HTTP), 443 (HTTPS)

---

## Installation Steps

### 1. Install Nginx

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nginx -y
```

**RHEL/CentOS:**
```bash
sudo yum install epel-release -y
sudo yum install nginx -y
```

### 2. Enable and Start Nginx
```bash
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

### 3. Verify Installation
```bash
curl http://localhost
# Should return nginx welcome page
```

---

## Nginx Configuration

### Main Configuration File

Create the main reverse proxy configuration:

**File: `/etc/nginx/sites-available/coffee-export`** (Ubuntu/Debian)  
**File: `/etc/nginx/conf.d/coffee-export.conf`** (RHEL/CentOS)

```nginx
# Upstream definitions for backend services
upstream frontend {
    server 127.0.0.1:5173;
    keepalive 32;
}

upstream gateway {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream exporter_portal {
    server 127.0.0.1:3010;
    keepalive 32;
}

upstream ecta_service {
    server 127.0.0.1:3003;
    keepalive 32;
}

upstream commercial_bank {
    server 127.0.0.1:3002;
    keepalive 32;
}

upstream national_bank {
    server 127.0.0.1:3004;
    keepalive 32;
}

upstream customs_service {
    server 127.0.0.1:3005;
    keepalive 32;
}

upstream ecx_service {
    server 127.0.0.1:3006;
    keepalive 32;
}

upstream shipping_service {
    server 127.0.0.1:3007;
    keepalive 32;
}

upstream buyer_verification {
    server 127.0.0.1:3009;
    keepalive 32;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

# HTTP Server - Redirect to HTTPS (optional, for production with SSL)
server {
    listen 80;
    listen [::]:80;
    server_name 10.3.xx.xx coffee-export.example.com;

    # For Let's Encrypt certificate validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS (uncomment when SSL is configured)
    # return 301 https://$server_name$request_uri;

    # For testing without SSL, proxy to services
    include /etc/nginx/conf.d/coffee-export-locations.conf;
}

# HTTPS Server (uncomment when SSL certificates are ready)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name 10.3.xx.xx coffee-export.example.com;
#
#     # SSL Configuration
#     ssl_certificate /etc/letsencrypt/live/coffee-export.example.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/coffee-export.example.com/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 10m;
#
#     # Security headers
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
#     add_header X-Frame-Options "SAMEORIGIN" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#     add_header Referrer-Policy "no-referrer-when-downgrade" always;
#
#     # Include location blocks
#     include /etc/nginx/conf.d/coffee-export-locations.conf;
# }
```

### Location Blocks Configuration

Create a separate file for location blocks (easier to maintain):

**File: `/etc/nginx/conf.d/coffee-export-locations.conf`**

```nginx
# Client settings
client_max_body_size 50M;
client_body_timeout 60s;
client_header_timeout 60s;

# Proxy settings (common for all locations)
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_cache_bypass $http_upgrade;
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# ==================== API Routes ====================

# Authentication endpoints (rate limited)
location /api/auth {
    limit_req zone=auth_limit burst=5 nodelay;
    proxy_pass http://exporter_portal;
}

# ECTA Contract endpoints (must come before /api/contracts)
location /api/ecta/contracts {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://ecta_service;
}

# Contract draft endpoints
location /api/contracts/drafts {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

# General contract endpoints
location /api/contracts {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

# Exporter-specific routes
location /api/exporter {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

location /api/exports {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

# Document routes
location ~ ^/api/exporter/documents(/.*)?$ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

location ~ ^/api/document-issuance(/.*)?$ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal/api/exporter/documents/issuance$1;
}

# Buyer routes
location /api/buyer {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

location /api/buyers {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://gateway;
}

# Marketplace routes
location /api/marketplace {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://gateway;
}

# Letter of Credit routes
location /api/lc {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

# Payment routes
location /api/payments {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

# Organization-specific API routes
location /api/bank {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://commercial_bank;
}

location /api/nbe {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://national_bank;
}

location /api/customs {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://customs_service;
}

location /api/ecx {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://ecx_service;
}

location /api/shipping {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://shipping_service;
}

location /api/verification {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://buyer_verification;
}

# Default API route (Gateway)
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://gateway;
}

# WebSocket support
location /socket.io/ {
    proxy_pass http://gateway;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# ==================== Frontend Routes ====================

# Static assets (cached)
location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
    proxy_pass http://frontend;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# JavaScript and CSS (no cache for updates)
location ~* \.(js|css)$ {
    proxy_pass http://frontend;
    add_header Cache-Control "no-cache, no-store, must-revalidate, max-age=0";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

# Health check endpoint
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}

# Nginx status (optional, for monitoring)
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    allow 10.3.0.0/16;  # Allow internal network
    deny all;
}

# Frontend SPA routing
location / {
    proxy_pass http://frontend;
}

# Deny access to hidden files
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}
```

### Enable Configuration

**Ubuntu/Debian:**
```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/coffee-export /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default
```

**RHEL/CentOS:**
```bash
# Configuration is already in conf.d, just ensure it's loaded
# Remove default server block if exists
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled
```

### Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

---

## SSL/TLS Setup

### Option 1: Let's Encrypt (Free SSL - Recommended for Production)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu/Debian
# OR
sudo yum install certbot python3-certbot-nginx -y  # RHEL/CentOS

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d coffee-export.example.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Option 2: Self-Signed Certificate (For Testing/Internal Use)

```bash
# Create directory for certificates
sudo mkdir -p /etc/nginx/ssl

# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/coffee-export.key \
  -out /etc/nginx/ssl/coffee-export.crt \
  -subj "/C=ET/ST=Addis Ababa/L=Addis Ababa/O=Coffee Export/CN=10.3.xx.xx"

# Update nginx config to use these certificates
# ssl_certificate /etc/nginx/ssl/coffee-export.crt;
# ssl_certificate_key /etc/nginx/ssl/coffee-export.key;
```

### Option 3: Commercial SSL Certificate

1. Generate CSR:
```bash
sudo openssl req -new -newkey rsa:2048 -nodes \
  -keyout /etc/nginx/ssl/coffee-export.key \
  -out /etc/nginx/ssl/coffee-export.csr
```

2. Submit CSR to your SSL provider
3. Download and install certificates:
```bash
# Copy certificates to nginx
sudo cp fullchain.crt /etc/nginx/ssl/coffee-export.crt
sudo cp private.key /etc/nginx/ssl/coffee-export.key

# Set permissions
sudo chmod 600 /etc/nginx/ssl/coffee-export.key
sudo chmod 644 /etc/nginx/ssl/coffee-export.crt
```

---

## Firewall Configuration

### UFW (Ubuntu/Debian)

```bash
# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Firewalld (RHEL/CentOS)

```bash
# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

### Block Direct Access to Backend Ports

```bash
# Ensure backend services only listen on localhost
# This is already configured in docker-compose-hybrid.yml
# But you can add extra firewall rules:

# UFW
sudo ufw deny 3000:3010/tcp
sudo ufw deny 5173/tcp

# Firewalld
sudo firewall-cmd --permanent --remove-port=3000-3010/tcp
sudo firewall-cmd --permanent --remove-port=5173/tcp
sudo firewall-cmd --reload
```

---

## Testing & Verification

### 1. Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### 2. Test Backend Connectivity
```bash
# Test if services are running
curl http://localhost:3000/health  # Gateway
curl http://localhost:3010/health  # Exporter Portal
curl http://localhost:3003/health  # ECTA
curl http://localhost:5173/health  # Frontend
```

### 3. Test Reverse Proxy
```bash
# From the server
curl http://localhost/health
curl http://localhost/api/health

# From another machine
curl http://10.3.xx.xx/health
curl http://10.3.xx.xx/api/health
```

### 4. Test Frontend Access
```bash
# Open in browser
http://10.3.xx.xx
# OR
https://coffee-export.example.com
```

### 5. Check Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 6. Monitor Backend Services
```bash
# Check Docker containers
docker ps

# Check specific service logs
docker logs coffee-gateway
docker logs coffee-exporter-portal
docker logs coffee-frontend
```

---

## Troubleshooting

### Issue 1: 502 Bad Gateway

**Cause:** Backend service is down or not responding

**Solution:**
```bash
# Check if services are running
docker ps

# Restart services
docker-compose -f docker-compose-hybrid.yml restart

# Check service logs
docker logs coffee-gateway
```

### Issue 2: 504 Gateway Timeout

**Cause:** Backend taking too long to respond

**Solution:**
```bash
# Increase timeout in nginx config
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;

# Reload nginx
sudo systemctl reload nginx
```

### Issue 3: Connection Refused

**Cause:** Service not listening on expected port

**Solution:**
```bash
# Check which ports are listening
sudo netstat -tlnp | grep -E ':(3000|3010|5173)'

# Or using ss
sudo ss -tlnp | grep -E ':(3000|3010|5173)'
```

### Issue 4: SSL Certificate Errors

**Cause:** Certificate not properly configured

**Solution:**
```bash
# Check certificate validity
sudo openssl x509 -in /etc/nginx/ssl/coffee-export.crt -text -noout

# Verify certificate chain
sudo openssl verify /etc/nginx/ssl/coffee-export.crt
```

### Issue 5: Rate Limiting Issues

**Cause:** Too many requests from same IP

**Solution:**
```bash
# Adjust rate limits in nginx config
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=200r/m;

# Or disable temporarily for testing
# Comment out limit_req lines
```

---

## Maintenance

### Log Rotation

Nginx logs are automatically rotated by logrotate. Verify configuration:

```bash
cat /etc/logrotate.d/nginx
```

### Monitoring

**Install monitoring tools:**
```bash
# Install htop for system monitoring
sudo apt install htop -y

# Install nginx monitoring
sudo apt install nginx-module-njs -y
```

**Monitor nginx status:**
```bash
# View nginx status
curl http://localhost/nginx_status
```

### Backup Configuration

```bash
# Backup nginx configuration
sudo tar -czf nginx-config-backup-$(date +%Y%m%d).tar.gz /etc/nginx/

# Backup SSL certificates
sudo tar -czf ssl-backup-$(date +%Y%m%d).tar.gz /etc/nginx/ssl/ /etc/letsencrypt/
```

### Update Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt upgrade nginx -y

# RHEL/CentOS
sudo yum update nginx -y

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### Performance Tuning

**Edit `/etc/nginx/nginx.conf`:**

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Enable caching
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;
    
    # Connection pooling
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

---

## Quick Reference Commands

```bash
# Start/Stop/Restart Nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx

# Test configuration
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check nginx status
sudo systemctl status nginx

# Reload after config changes
sudo nginx -t && sudo systemctl reload nginx

# Start Docker services
docker-compose -f docker-compose-hybrid.yml up -d

# Stop Docker services
docker-compose -f docker-compose-hybrid.yml down

# View Docker logs
docker-compose -f docker-compose-hybrid.yml logs -f
```

---

## Security Checklist

- [ ] SSL/TLS certificates installed and configured
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Backend services only accessible via localhost
- [ ] Rate limiting enabled for API endpoints
- [ ] Security headers configured
- [ ] Log rotation configured
- [ ] Regular backups scheduled
- [ ] Monitoring and alerting set up
- [ ] Strong passwords for all services
- [ ] Database not exposed to public internet
- [ ] Regular security updates applied

---

## Support & Resources

- **Nginx Documentation:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/
- **Docker Documentation:** https://docs.docker.com/
- **Project Repository:** [Your Git Repository URL]

---

**Last Updated:** May 12, 2026  
**Version:** 1.0
