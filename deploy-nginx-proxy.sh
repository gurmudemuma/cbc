#!/bin/bash

################################################################################
# Coffee Export System - Nginx Reverse Proxy Deployment Script
# Server: 10.3.xx.xx
# 
# This script automates the deployment of nginx reverse proxy for the
# Coffee Export Blockchain System
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="10.3.xx.xx"  # Replace with your actual server IP
DOMAIN_NAME=""  # Optional: Set your domain name
USE_SSL="false"  # Set to "true" to enable SSL
SSL_TYPE="letsencrypt"  # Options: letsencrypt, selfsigned, commercial

################################################################################
# Helper Functions
################################################################################

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
}

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        print_error "Cannot detect OS"
        exit 1
    fi
    print_info "Detected OS: $OS $VERSION"
}

################################################################################
# Installation Functions
################################################################################

install_nginx_ubuntu() {
    print_info "Installing Nginx on Ubuntu/Debian..."
    apt update
    apt install -y nginx
}

install_nginx_rhel() {
    print_info "Installing Nginx on RHEL/CentOS..."
    yum install -y epel-release
    yum install -y nginx
}

install_nginx() {
    if command -v nginx &> /dev/null; then
        print_info "Nginx is already installed"
        nginx -v
        return
    fi

    case $OS in
        ubuntu|debian)
            install_nginx_ubuntu
            ;;
        rhel|centos|rocky|almalinux)
            install_nginx_rhel
            ;;
        *)
            print_error "Unsupported OS: $OS"
            exit 1
            ;;
    esac

    systemctl enable nginx
    print_info "Nginx installed successfully"
}

################################################################################
# Configuration Functions
################################################################################

create_nginx_config() {
    print_info "Creating Nginx configuration..."

    # Determine config directory based on OS
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        CONFIG_DIR="/etc/nginx/sites-available"
        ENABLED_DIR="/etc/nginx/sites-enabled"
        CONFIG_FILE="$CONFIG_DIR/coffee-export"
    else
        CONFIG_DIR="/etc/nginx/conf.d"
        CONFIG_FILE="$CONFIG_DIR/coffee-export.conf"
    fi

    # Create upstream configuration
    cat > "$CONFIG_FILE" << 'EOF'
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

# HTTP Server
server {
    listen 80;
    listen [::]:80;
    server_name SERVER_NAME_PLACEHOLDER;

    # Include location blocks
    include /etc/nginx/conf.d/coffee-export-locations.conf;
}
EOF

    # Replace server name placeholder
    if [ -n "$DOMAIN_NAME" ]; then
        sed -i "s/SERVER_NAME_PLACEHOLDER/$SERVER_IP $DOMAIN_NAME/g" "$CONFIG_FILE"
    else
        sed -i "s/SERVER_NAME_PLACEHOLDER/$SERVER_IP/g" "$CONFIG_FILE"
    fi

    # Create locations configuration
    cat > "/etc/nginx/conf.d/coffee-export-locations.conf" << 'EOF'
# Client settings
client_max_body_size 50M;
client_body_timeout 60s;
client_header_timeout 60s;

# Proxy settings
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

# Authentication endpoints (rate limited)
location /api/auth {
    limit_req zone=auth_limit burst=5 nodelay;
    proxy_pass http://exporter_portal;
}

# ECTA Contract endpoints
location /api/ecta/contracts {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://ecta_service;
}

# Contract endpoints
location /api/contracts/drafts {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

location /api/contracts {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

# Exporter routes
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

# LC routes
location /api/lc {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

# Payment routes
location /api/payments {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://exporter_portal;
}

# Default API route
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
}

# Static assets
location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
    proxy_pass http://frontend;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(js|css)$ {
    proxy_pass http://frontend;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# Health check
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}

# Frontend SPA
location / {
    proxy_pass http://frontend;
}

# Deny hidden files
location ~ /\. {
    deny all;
    access_log off;
}
EOF

    # Enable site for Ubuntu/Debian
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        ln -sf "$CONFIG_FILE" "$ENABLED_DIR/coffee-export"
        rm -f "$ENABLED_DIR/default"
    else
        # Disable default for RHEL/CentOS
        [ -f /etc/nginx/conf.d/default.conf ] && mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled
    fi

    print_info "Nginx configuration created"
}

################################################################################
# SSL Functions
################################################################################

setup_letsencrypt() {
    if [ -z "$DOMAIN_NAME" ]; then
        print_error "Domain name is required for Let's Encrypt"
        return 1
    fi

    print_info "Setting up Let's Encrypt SSL..."

    # Install certbot
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        apt install -y certbot python3-certbot-nginx
    else
        yum install -y certbot python3-certbot-nginx
    fi

    # Obtain certificate
    certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --email admin@$DOMAIN_NAME

    print_info "Let's Encrypt SSL configured"
}

setup_selfsigned() {
    print_info "Setting up self-signed SSL certificate..."

    mkdir -p /etc/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/coffee-export.key \
        -out /etc/nginx/ssl/coffee-export.crt \
        -subj "/C=ET/ST=Addis Ababa/L=Addis Ababa/O=Coffee Export/CN=$SERVER_IP"

    chmod 600 /etc/nginx/ssl/coffee-export.key
    chmod 644 /etc/nginx/ssl/coffee-export.crt

    print_info "Self-signed SSL certificate created"
}

################################################################################
# Firewall Functions
################################################################################

configure_firewall_ufw() {
    print_info "Configuring UFW firewall..."

    # Install if not present
    if ! command -v ufw &> /dev/null; then
        apt install -y ufw
    fi

    # Allow SSH, HTTP, HTTPS
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Enable firewall
    ufw --force enable

    print_info "UFW firewall configured"
}

configure_firewall_firewalld() {
    print_info "Configuring firewalld..."

    # Install if not present
    if ! command -v firewall-cmd &> /dev/null; then
        yum install -y firewalld
        systemctl enable firewalld
        systemctl start firewalld
    fi

    # Allow HTTP and HTTPS
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload

    print_info "Firewalld configured"
}

configure_firewall() {
    if command -v ufw &> /dev/null || [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        configure_firewall_ufw
    elif command -v firewall-cmd &> /dev/null || [[ "$OS" == "rhel" || "$OS" == "centos" ]]; then
        configure_firewall_firewalld
    else
        print_warning "No supported firewall found. Please configure manually."
    fi
}

################################################################################
# Verification Functions
################################################################################

verify_backend_services() {
    print_info "Verifying backend services..."

    services=(
        "3000:Gateway"
        "3010:Exporter Portal"
        "3003:ECTA Service"
        "5173:Frontend"
    )

    all_running=true
    for service in "${services[@]}"; do
        port="${service%%:*}"
        name="${service##*:}"

        if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
            print_info "$name (port $port): ✓ Running"
        else
            print_warning "$name (port $port): ✗ Not responding"
            all_running=false
        fi
    done

    if [ "$all_running" = false ]; then
        print_warning "Some backend services are not running. Start them with:"
        print_warning "docker-compose -f docker-compose-hybrid.yml up -d"
    fi
}

test_nginx_config() {
    print_info "Testing Nginx configuration..."

    if nginx -t; then
        print_info "Nginx configuration is valid"
        return 0
    else
        print_error "Nginx configuration has errors"
        return 1
    fi
}

################################################################################
# Main Deployment Function
################################################################################

main() {
    print_info "Starting Coffee Export System Nginx Deployment"
    print_info "================================================"

    # Check prerequisites
    check_root
    detect_os

    # Install Nginx
    install_nginx

    # Create configuration
    create_nginx_config

    # Test configuration
    if ! test_nginx_config; then
        print_error "Configuration test failed. Aborting."
        exit 1
    fi

    # Configure firewall
    configure_firewall

    # Setup SSL if requested
    if [ "$USE_SSL" = "true" ]; then
        case $SSL_TYPE in
            letsencrypt)
                setup_letsencrypt
                ;;
            selfsigned)
                setup_selfsigned
                ;;
            *)
                print_warning "Unknown SSL type: $SSL_TYPE. Skipping SSL setup."
                ;;
        esac
    fi

    # Restart Nginx
    print_info "Restarting Nginx..."
    systemctl restart nginx
    systemctl status nginx --no-pager

    # Verify backend services
    verify_backend_services

    # Final instructions
    print_info ""
    print_info "================================================"
    print_info "Deployment Complete!"
    print_info "================================================"
    print_info ""
    print_info "Access your application at:"
    print_info "  HTTP:  http://$SERVER_IP"
    if [ "$USE_SSL" = "true" ] && [ -n "$DOMAIN_NAME" ]; then
        print_info "  HTTPS: https://$DOMAIN_NAME"
    fi
    print_info ""
    print_info "Useful commands:"
    print_info "  Check Nginx status:  systemctl status nginx"
    print_info "  View access logs:    tail -f /var/log/nginx/access.log"
    print_info "  View error logs:     tail -f /var/log/nginx/error.log"
    print_info "  Test configuration:  nginx -t"
    print_info "  Reload Nginx:        systemctl reload nginx"
    print_info ""
    print_info "Next steps:"
    print_info "1. Ensure Docker services are running"
    print_info "2. Test the application in your browser"
    print_info "3. Configure SSL if not done already"
    print_info "4. Set up monitoring and backups"
    print_info ""
}

################################################################################
# Script Entry Point
################################################################################

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --ip)
            SERVER_IP="$2"
            shift 2
            ;;
        --domain)
            DOMAIN_NAME="$2"
            shift 2
            ;;
        --ssl)
            USE_SSL="true"
            SSL_TYPE="${2:-letsencrypt}"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --ip IP          Server IP address (default: 10.3.xx.xx)"
            echo "  --domain DOMAIN  Domain name for SSL"
            echo "  --ssl TYPE       Enable SSL (letsencrypt|selfsigned)"
            echo "  --help           Show this help message"
            echo ""
            echo "Example:"
            echo "  $0 --ip 10.3.1.100 --domain coffee.example.com --ssl letsencrypt"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main deployment
main
