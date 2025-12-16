#!/bin/bash

# Generate Strong Secrets for Coffee Export System
# This script generates cryptographically secure secrets for use in production

echo "🔐 Generating Strong Secrets for Coffee Export System"
echo "======================================================"
echo ""

# Function to generate random string
generate_secret() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

echo "## JWT Secrets (64 characters each)"
echo "-----------------------------------"
echo "Commercial Bank:"
echo "JWT_SECRET=$(generate_secret 64)"
echo ""
echo "National Bank:"
echo "JWT_SECRET=$(generate_secret 64)"
echo ""
echo "ECTA:"
echo "JWT_SECRET=$(generate_secret 64)"
echo ""
echo "Shipping Line:"
echo "JWT_SECRET=$(generate_secret 64)"
echo ""
echo "Custom Authorities:"
echo "JWT_SECRET=$(generate_secret 64)"
echo ""

echo "## Encryption Keys (64 hex characters for AES-256)"
echo "---------------------------------------------------"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo ""

echo "## Database Password"
echo "--------------------"
echo "DB_PASSWORD=$(generate_secret 32)"
echo ""

echo "## Session Secret"
echo "-----------------"
echo "SESSION_SECRET=$(generate_secret 64)"
echo ""

echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "1. Copy these secrets to your .env files"
echo "2. NEVER commit .env files to version control"
echo "3. Use different secrets for each environment (dev/staging/prod)"
echo "4. Rotate secrets regularly (every 90 days recommended)"
echo "5. Store production secrets in a secrets manager (e.g., HashiCorp Vault)"
echo "6. Set file permissions: chmod 600 .env"
echo ""
