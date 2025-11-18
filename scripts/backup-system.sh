#!/bin/bash

# Automated Backup Script for Coffee Export Blockchain
# This script backs up:
# - Fabric ledger data
# - CouchDB databases
# - MSP certificates
# - Configuration files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="cbc_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Configuration
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"
ENCRYPT_BACKUP="${ENCRYPT_BACKUP:-true}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"

echo "========================================="
echo "  Coffee Export Blockchain Backup"
echo "========================================="
echo "Timestamp: $TIMESTAMP"
echo "Backup Path: $BACKUP_PATH"
echo ""

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Function to log messages
log() {
    echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1"
}

# Function to handle errors
error_exit() {
    log "ERROR: $1"
    exit 1
}

# 1. Backup Fabric Ledger Data
log "Backing up Fabric ledger data..."
LEDGER_BACKUP="$BACKUP_PATH/ledger"
mkdir -p "$LEDGER_BACKUP"

# Backup peer data
for peer in peer0.commercialbank peer0.nationalbank peer0.ncat peer0.shippingline peer0.customauthorities; do
    PEER_DIR="$peer.coffee-export.com"
    if docker volume inspect "$PEER_DIR" &> /dev/null; then
        log "  Backing up $PEER_DIR..."
        docker run --rm \
            -v "$PEER_DIR:/source:ro" \
            -v "$LEDGER_BACKUP:/backup" \
            alpine tar czf "/backup/$PEER_DIR.tar.gz" -C /source .
    else
        log "  Warning: Volume $PEER_DIR not found, skipping..."
    fi
done

# Backup orderer data
if docker volume inspect "orderer.coffee-export.com" &> /dev/null; then
    log "  Backing up orderer data..."
    docker run --rm \
        -v "orderer.coffee-export.com:/source:ro" \
        -v "$LEDGER_BACKUP:/backup" \
        alpine tar czf "/backup/orderer.coffee-export.com.tar.gz" -C /source .
fi

log "✓ Ledger backup completed"
echo ""

# 2. Backup CouchDB Databases
log "Backing up CouchDB databases..."
COUCHDB_BACKUP="$BACKUP_PATH/couchdb"
mkdir -p "$COUCHDB_BACKUP"

for i in {0..4}; do
    COUCHDB_CONTAINER="couchdb$i"
    if docker ps --format '{{.Names}}' | grep -q "^$COUCHDB_CONTAINER$"; then
        log "  Backing up $COUCHDB_CONTAINER..."
        
        # Get CouchDB credentials from environment or use defaults
        COUCHDB_USER="${COUCHDB_USER:-admin}"
        COUCHDB_PASSWORD="${COUCHDB_PASSWORD:-adminpw}"
        
        # Get list of databases
        DATABASES=$(docker exec "$COUCHDB_CONTAINER" curl -s \
            -u "$COUCHDB_USER:$COUCHDB_PASSWORD" \
            http://localhost:5984/_all_dbs | jq -r '.[]' | grep -v '^_')
        
        # Backup each database
        for db in $DATABASES; do
            log "    Backing up database: $db"
            docker exec "$COUCHDB_CONTAINER" curl -s \
                -u "$COUCHDB_USER:$COUCHDB_PASSWORD" \
                "http://localhost:5984/$db/_all_docs?include_docs=true" \
                > "$COUCHDB_BACKUP/${COUCHDB_CONTAINER}_${db}.json"
        done
    else
        log "  Warning: Container $COUCHDB_CONTAINER not running, skipping..."
    fi
done

log "✓ CouchDB backup completed"
echo ""

# 3. Backup MSP Certificates
log "Backing up MSP certificates..."
MSP_BACKUP="$BACKUP_PATH/msp"
mkdir -p "$MSP_BACKUP"

if [ -d "$PROJECT_ROOT/network/organizations" ]; then
    cp -r "$PROJECT_ROOT/network/organizations" "$MSP_BACKUP/"
    log "✓ MSP certificates backed up"
else
    log "  Warning: MSP directory not found"
fi
echo ""

# 4. Backup Configuration Files
log "Backing up configuration files..."
CONFIG_BACKUP="$BACKUP_PATH/config"
mkdir -p "$CONFIG_BACKUP"

# Backup docker-compose files
cp "$PROJECT_ROOT"/docker-compose*.yml "$CONFIG_BACKUP/" 2>/dev/null || true

# Backup network configuration
if [ -d "$PROJECT_ROOT/network/configtx" ]; then
    cp -r "$PROJECT_ROOT/network/configtx" "$CONFIG_BACKUP/"
fi

# Backup chaincode
if [ -d "$PROJECT_ROOT/chaincode" ]; then
    tar czf "$CONFIG_BACKUP/chaincode.tar.gz" -C "$PROJECT_ROOT" chaincode
fi

# Backup .env.example files (not actual .env with secrets)
find "$PROJECT_ROOT" -name ".env.example" -exec cp --parents {} "$CONFIG_BACKUP/" \;

log "✓ Configuration backup completed"
echo ""

# 5. Create backup manifest
log "Creating backup manifest..."
cat > "$BACKUP_PATH/manifest.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "backup_name": "$BACKUP_NAME",
  "components": {
    "ledger": "$(du -sh "$LEDGER_BACKUP" | cut -f1)",
    "couchdb": "$(du -sh "$COUCHDB_BACKUP" | cut -f1)",
    "msp": "$(du -sh "$MSP_BACKUP" | cut -f1)",
    "config": "$(du -sh "$CONFIG_BACKUP" | cut -f1)"
  },
  "total_size": "$(du -sh "$BACKUP_PATH" | cut -f1)",
  "hostname": "$(hostname)",
  "user": "$(whoami)"
}
EOF

log "✓ Manifest created"
echo ""

# 6. Compress entire backup
log "Compressing backup..."
cd "$BACKUP_DIR"
tar czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
log "✓ Backup compressed: ${BACKUP_NAME}.tar.gz ($BACKUP_SIZE)"
echo ""

# 7. Encrypt backup (optional)
if [ "$ENCRYPT_BACKUP" = "true" ]; then
    if [ -n "$ENCRYPTION_KEY" ]; then
        log "Encrypting backup..."
        openssl enc -aes-256-cbc -salt -in "${BACKUP_NAME}.tar.gz" \
            -out "${BACKUP_NAME}.tar.gz.enc" -k "$ENCRYPTION_KEY"
        rm "${BACKUP_NAME}.tar.gz"
        log "✓ Backup encrypted"
        echo ""
    else
        log "Warning: ENCRYPT_BACKUP=true but ENCRYPTION_KEY not set, skipping encryption"
    fi
fi

# 8. Upload to S3 (optional)
if [ -n "$S3_BUCKET" ]; then
    log "Uploading to S3..."
    UPLOAD_FILE="${BACKUP_NAME}.tar.gz"
    [ -f "${BACKUP_NAME}.tar.gz.enc" ] && UPLOAD_FILE="${BACKUP_NAME}.tar.gz.enc"
    
    if command -v aws &> /dev/null; then
        aws s3 cp "$UPLOAD_FILE" "s3://$S3_BUCKET/backups/$UPLOAD_FILE"
        log "✓ Backup uploaded to S3: s3://$S3_BUCKET/backups/$UPLOAD_FILE"
    else
        log "Warning: AWS CLI not found, skipping S3 upload"
    fi
    echo ""
fi

# 9. Clean up old backups
log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "cbc_backup_*.tar.gz*" -mtime +$RETENTION_DAYS -delete
REMOVED=$(find "$BACKUP_DIR" -name "cbc_backup_*" -type d -mtime +$RETENTION_DAYS -print -exec rm -rf {} + | wc -l)
log "✓ Removed $REMOVED old backup(s)"
echo ""

# 10. Remove temporary uncompressed backup
rm -rf "$BACKUP_PATH"

echo "========================================="
echo "  Backup Completed Successfully!"
echo "========================================="
echo "Backup file: ${BACKUP_NAME}.tar.gz"
echo "Location: $BACKUP_DIR"
echo "Size: $BACKUP_SIZE"
echo ""
echo "To restore from this backup, run:"
echo "  ./scripts/restore-system.sh ${BACKUP_NAME}.tar.gz"
echo ""
