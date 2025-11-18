#!/bin/bash

# Script to generate secure secrets for Docker deployment
# This should be run once during initial setup

set -e

SECRETS_DIR="./secrets"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "  Generating Secure Secrets"
echo "========================================="
echo ""

# Create secrets directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/$SECRETS_DIR"

# Function to generate a random secure string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to create secret file
create_secret_file() {
    local filename=$1
    local value=$2
    local filepath="$PROJECT_ROOT/$SECRETS_DIR/$filename"
    
    echo "$value" > "$filepath"
    chmod 600 "$filepath"
    echo "✓ Created: $filename"
}

# Generate CouchDB credentials
echo "Generating CouchDB credentials..."
COUCHDB_USER="admin"
COUCHDB_PASSWORD=$(generate_secret)
create_secret_file "couchdb_user.txt" "$COUCHDB_USER"
create_secret_file "couchdb_password.txt" "$COUCHDB_PASSWORD"
echo ""

# Generate JWT secrets for each service
echo "Generating JWT secrets..."
create_secret_file "jwt_secret_exporter_bank.txt" "$(generate_secret)"
create_secret_file "jwt_secret_national_bank.txt" "$(generate_secret)"
create_secret_file "jwt_secret_ncat.txt" "$(generate_secret)"
create_secret_file "jwt_secret_shipping_line.txt" "$(generate_secret)"
create_secret_file "jwt_secret_custom_authorities.txt" "$(generate_secret)"
echo ""

# Generate Redis password
echo "Generating Redis password..."
REDIS_PASSWORD=$(generate_secret)
create_secret_file "redis_password.txt" "$REDIS_PASSWORD"
echo ""

# Create .env file with references to secrets
echo "Creating .env file..."
cat > "$PROJECT_ROOT/.env.secrets" << EOF
# Auto-generated secrets configuration
# Generated on: $(date)

# CouchDB Credentials
COUCHDB_USER=$COUCHDB_USER
COUCHDB_PASSWORD=$COUCHDB_PASSWORD

# Redis Password
REDIS_PASSWORD=$REDIS_PASSWORD

# JWT Secrets (use these in your API .env files)
JWT_SECRET_EXPORTER_BANK=$(cat "$PROJECT_ROOT/$SECRETS_DIR/jwt_secret_exporter_bank.txt")
JWT_SECRET_NATIONAL_BANK=$(cat "$PROJECT_ROOT/$SECRETS_DIR/jwt_secret_national_bank.txt")
JWT_SECRET_ECTA=$(cat "$PROJECT_ROOT/$SECRETS_DIR/jwt_secret_ncat.txt")
JWT_SECRET_SHIPPING_LINE=$(cat "$PROJECT_ROOT/$SECRETS_DIR/jwt_secret_shipping_line.txt")
JWT_SECRET_CUSTOM_AUTHORITIES=$(cat "$PROJECT_ROOT/$SECRETS_DIR/jwt_secret_custom_authorities.txt")

# Note: Never commit this file to version control
EOF

chmod 600 "$PROJECT_ROOT/.env.secrets"
echo "✓ Created: .env.secrets"
echo ""

# Create .gitignore for secrets directory
cat > "$PROJECT_ROOT/$SECRETS_DIR/.gitignore" << EOF
# Ignore all secret files
*
!.gitignore
!README.md
EOF

echo "✓ Created: secrets/.gitignore"
echo ""

# Create README for secrets directory
cat > "$PROJECT_ROOT/$SECRETS_DIR/README.md" << EOF
# Secrets Directory

This directory contains sensitive credentials and secrets for the application.

## Security Guidelines

1. **Never commit secrets to version control**
2. **Rotate secrets regularly** (every 90 days minimum)
3. **Use different secrets for each environment** (dev, staging, production)
4. **Store production secrets in a secure vault** (HashiCorp Vault, AWS Secrets Manager, etc.)

## Files

- \`couchdb_user.txt\` - CouchDB admin username
- \`couchdb_password.txt\` - CouchDB admin password
- \`jwt_secret_*.txt\` - JWT signing secrets for each API service
- \`redis_password.txt\` - Redis authentication password

## Regenerating Secrets

To regenerate all secrets:

\`\`\`bash
./scripts/generate-secrets.sh
\`\`\`

**Warning:** This will invalidate all existing tokens and sessions.

## Using Secrets in Production

For production deployments, consider using:

- **Kubernetes Secrets**
- **Docker Swarm Secrets**
- **HashiCorp Vault**
- **AWS Secrets Manager**
- **Azure Key Vault**
- **Google Secret Manager**

## Backup

Store encrypted backups of secrets in a secure location separate from the application.
EOF

echo "✓ Created: secrets/README.md"
echo ""

echo "========================================="
echo "  Secrets Generated Successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Review the generated secrets in: $SECRETS_DIR/"
echo "2. Update your API .env files with the JWT secrets from .env.secrets"
echo "3. Use docker-compose.secrets.yml for secure deployment"
echo ""
echo "⚠️  IMPORTANT: Never commit the secrets directory to version control!"
echo ""
