#!/bin/bash

# Naming Standardization Script
# This script consolidates API directories to follow standardized naming convention

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR/api"
BACKUP_DIR="$SCRIPT_DIR/api.backup.$(date +%s)"

echo "=========================================="
echo "CBC Naming Standardization Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Step 1: Backup current state
echo "Step 1: Creating backup..."
if [ -d "$BACKUP_DIR" ]; then
    print_error "Backup directory already exists: $BACKUP_DIR"
    exit 1
fi

cp -r "$API_DIR" "$BACKUP_DIR"
print_status "Backup created at: $BACKUP_DIR"
echo ""

# Step 2: Analyze current state
echo "Step 2: Analyzing current API structure..."
echo ""

echo "Current directories:"
ls -1 "$API_DIR" | grep -v "^node_modules$" | grep -v "^dist$" | while read dir; do
    if [ -d "$API_DIR/$dir" ]; then
        if [ -f "$API_DIR/$dir/package.json" ]; then
            name=$(grep '"name"' "$API_DIR/$dir/package.json" | head -1 | sed 's/.*"name": "\(.*\)".*/\1/')
            echo "  - $dir (package.json: $name)"
        else
            echo "  - $dir (no package.json)"
        fi
    fi
done
echo ""

# Step 3: Identify conflicts
echo "Step 3: Identifying conflicts..."
echo ""

# Check for commercialbank duplicates
if [ -d "$API_DIR/exporter" ] && [ -d "$API_DIR/commercialbank" ]; then
    print_warning "Found duplicate: exporter and commercialbank"
    echo "  - exporter: $(grep '"name"' "$API_DIR/exporter/package.json" 2>/dev/null | head -1 | sed 's/.*"name": "\(.*\)".*/\1/')"
    echo "  - commercialbank: $(grep '"name"' "$API_DIR/commercialbank/package.json" 2>/dev/null | head -1 | sed 's/.*"name": "\(.*\)".*/\1/')"
fi

# Check for national-bank duplicates
if [ -d "$API_DIR/national-bank" ] && [ -d "$API_DIR/nb-regulatory" ]; then
    print_warning "Found duplicate: national-bank and nb-regulatory"
    echo "  - national-bank: $(grep '"name"' "$API_DIR/national-bank/package.json" 2>/dev/null | head -1 | sed 's/.*"name": "\(.*\)".*/\1/')"
    echo "  - nb-regulatory: $(grep '"name"' "$API_DIR/national-bank/package.json" 2>/dev/null | head -1 | sed 's/.*"name": "\(.*\)".*/\1/')"
fi

# Check for banker
if [ -d "$API_DIR/banker" ]; then
    print_warning "Found banker directory (should be national-bank)"
    echo "  - banker: $(grep '"name"' "$API_DIR/commercialbank/package.json" 2>/dev/null | head -1 | sed 's/.*"name": "\(.*\)".*/\1/')"
fi

echo ""

# Step 4: User confirmation
echo "Step 4: Confirmation required"
echo ""
echo "This script will:"
echo "  1. Move deprecated directories to api/deprecated/"
echo "  2. Keep standardized directory names:"
echo "     - commercialbank (Port 3001)"
echo "     - national-bank (Port 3002)"
echo "     - ncat (Port 3003)"
echo "     - shipping-line (Port 3004)"
echo "     - custom-authorities (Port 3005)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Cancelled by user"
    exit 1
fi

echo ""

# Step 5: Create deprecated directory
echo "Step 5: Creating deprecated directory..."
mkdir -p "$API_DIR/deprecated"
print_status "Created: $API_DIR/deprecated"
echo ""

# Step 6: Move deprecated directories
echo "Step 6: Moving deprecated directories..."

# Move exporter if commercialbank exists
if [ -d "$API_DIR/exporter" ] && [ -d "$API_DIR/commercialbank" ]; then
    print_warning "Moving exporter to deprecated (commercialbank is the standard)"
    mv "$API_DIR/exporter" "$API_DIR/deprecated/exporter.backup"
    print_status "Moved: exporter → deprecated/exporter.backup"
fi

# Move banker if national-bank exists
if [ -d "$API_DIR/banker" ] && [ -d "$API_DIR/national-bank" ]; then
    print_warning "Moving banker to deprecated (national-bank is the standard)"
    mv "$API_DIR/banker" "$API_DIR/deprecated/banker.backup"
    print_status "Moved: banker → deprecated/banker.backup"
fi

# Move nb-regulatory if national-bank exists
if [ -d "$API_DIR/nb-regulatory" ] && [ -d "$API_DIR/national-bank" ]; then
    print_warning "Moving nb-regulatory to deprecated (national-bank is the standard)"
    mv "$API_DIR/nb-regulatory" "$API_DIR/deprecated/nb-regulatory.backup"
    print_status "Moved: nb-regulatory → deprecated/nb-regulatory.backup"
fi

echo ""

# Step 7: Verify final structure
echo "Step 7: Verifying final structure..."
echo ""
echo "Final API directories:"
ls -1 "$API_DIR" | grep -v "^node_modules$" | grep -v "^dist$" | sort | while read dir; do
    if [ -d "$API_DIR/$dir" ]; then
        if [ -f "$API_DIR/$dir/package.json" ]; then
            name=$(grep '"name"' "$API_DIR/$dir/package.json" 2>/dev/null | head -1 | sed 's/.*"name": "\(.*\)".*/\1/')
            echo "  ✓ $dir (package.json: $name)"
        else
            echo "  - $dir (no package.json)"
        fi
    fi
done
echo ""

# Step 8: Summary
echo "=========================================="
echo "Standardization Complete!"
echo "=========================================="
echo ""
print_status "Frontend configuration: Already updated"
print_status "Root package.json: Already updated"
print_status "API directories: Consolidated"
echo ""
echo "Next steps:"
echo "  1. Create .env files for each API service"
echo "  2. Update docker-compose.yml"
echo "  3. Update documentation"
echo "  4. Test the system"
echo ""
echo "Backup location: $BACKUP_DIR"
echo ""
