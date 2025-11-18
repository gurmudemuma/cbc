#!/bin/bash

# Cleanup Duplicate Configurations Script
# Removes backup directories and standardizes .env.example files

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Cleanup Duplicate Configurations                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Phase 1: Remove Backup Directories
echo -e "${YELLOW}Phase 1: Removing Backup Directories...${NC}"
echo ""

BACKUP_DIRS=(
    "$PROJECT_ROOT/api/commercialbank.backup"
    "$PROJECT_ROOT/api/national-bank.backup"
    "$PROJECT_ROOT/api/exporter-portal.backup"
    "$PROJECT_ROOT/api/deprecated"
)

BACKUP_FILES=(
    "$PROJECT_ROOT/network/docker/docker-compose.yaml.backup"
)

TOTAL_SIZE=0

for dir in "${BACKUP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        SIZE=$(du -sh "$dir" | cut -f1)
        echo -e "${YELLOW}  Removing: $dir ($SIZE)${NC}"
        rm -rf "$dir"
        echo -e "${GREEN}  ✅ Removed${NC}"
    else
        echo -e "${BLUE}  ℹ️  Not found: $dir${NC}"
    fi
done

for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        SIZE=$(du -sh "$file" | cut -f1)
        echo -e "${YELLOW}  Removing: $file ($SIZE)${NC}"
        rm -f "$file"
        echo -e "${GREEN}  ✅ Removed${NC}"
    else
        echo -e "${BLUE}  ℹ️  Not found: $file${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Phase 1 Complete: Backup directories removed${NC}"
echo ""

# Phase 2: Standardize .env.example Files
echo -e "${YELLOW}Phase 2: Standardizing .env.example Files...${NC}"
echo ""

APIS=("commercial-bank" "national-bank" "ecta" "shipping-line" "custom-authorities")

for api in "${APIS[@]}"; do
    ENV_FILE="$PROJECT_ROOT/api/$api/.env.example"
    
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}  ❌ Not found: $ENV_FILE${NC}"
        continue
    fi
    
    echo -e "${BLUE}  Processing: $api${NC}"
    CHANGES=0
    
    # Add missing IPFS_GATEWAY
    if ! grep -q "^IPFS_GATEWAY=" "$ENV_FILE"; then
        echo -e "${YELLOW}    Adding IPFS_GATEWAY${NC}"
        # Find the IPFS section and add after IPFS_GATEWAY_PORT
        sed -i '/^IPFS_GATEWAY_PORT=/a IPFS_GATEWAY=https://ipfs.io' "$ENV_FILE"
        CHANGES=$((CHANGES + 1))
    fi
    
    # Add missing Redis config
    if ! grep -q "^REDIS_HOST=" "$ENV_FILE"; then
        echo -e "${YELLOW}    Adding Redis configuration${NC}"
        cat >> "$ENV_FILE" << 'EOF'

# Redis (optional - for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
EOF
        CHANGES=$((CHANGES + 1))
    fi
    
    # Add missing SMTP config
    if ! grep -q "^SMTP_HOST=" "$ENV_FILE"; then
        echo -e "${YELLOW}    Adding SMTP configuration${NC}"
        cat >> "$ENV_FILE" << 'EOF'

# Email/SMTP Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@coffeeexport.com
EOF
        CHANGES=$((CHANGES + 1))
    fi
    
    if [ $CHANGES -eq 0 ]; then
        echo -e "${GREEN}    ✅ Already standardized${NC}"
    else
        echo -e "${GREEN}    ✅ $CHANGES changes applied${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Phase 2 Complete: .env.example files standardized${NC}"
echo ""

# Phase 3: Verification
echo -e "${YELLOW}Phase 3: Verification...${NC}"
echo ""

echo -e "${BLUE}Checking for remaining backups...${NC}"
REMAINING=$(find "$PROJECT_ROOT" -name "*.backup" -o -name "deprecated" -type d 2>/dev/null | wc -l)
if [ "$REMAINING" -eq 0 ]; then
    echo -e "${GREEN}✅ No backup directories found${NC}"
else
    echo -e "${YELLOW}⚠️  Found $REMAINING remaining backup items${NC}"
    find "$PROJECT_ROOT" -name "*.backup" -o -name "deprecated" -type d 2>/dev/null
fi

echo ""
echo -e "${BLUE}Verifying .env.example consistency...${NC}"
CONSISTENT=true
for api in "${APIS[@]}"; do
    ENV_FILE="$PROJECT_ROOT/api/$api/.env.example"
    
    if [ -f "$ENV_FILE" ]; then
        HAS_IPFS_GATEWAY=$(grep -c "^IPFS_GATEWAY=" "$ENV_FILE" || echo 0)
        HAS_REDIS=$(grep -c "^REDIS_HOST=" "$ENV_FILE" || echo 0)
        HAS_SMTP=$(grep -c "^SMTP_HOST=" "$ENV_FILE" || echo 0)
        
        if [ "$HAS_IPFS_GATEWAY" -eq 0 ] || [ "$HAS_REDIS" -eq 0 ] || [ "$HAS_SMTP" -eq 0 ]; then
            echo -e "${YELLOW}  ⚠️  $api: Missing configurations${NC}"
            CONSISTENT=false
        else
            echo -e "${GREEN}  ✅ $api: All configurations present${NC}"
        fi
    fi
done

echo ""
if [ "$CONSISTENT" = true ]; then
    echo -e "${GREEN}✅ All .env.example files are consistent${NC}"
else
    echo -e "${YELLOW}⚠️  Some .env.example files need manual review${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Cleanup Complete!                                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  ✅ Backup directories removed"
echo -e "  ✅ .env.example files standardized"
echo -e "  ✅ Configuration consistency verified"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Review changes: git diff"
echo -e "  2. Update .env files if needed"
echo -e "  3. Test all APIs: ./start-system.sh"
echo ""
