#!/bin/bash

# Fix API .env files by ensuring all required variables are present
# This script adds missing variables from .env.example if they don't exist in .env

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================="
echo "Fixing API .env Files"
echo "=========================================="

fix_env_file() {
    local API_DIR=$1
    local ENV_FILE="$API_DIR/.env"
    local EXAMPLE_FILE="$API_DIR/.env.example"
    
    if [ ! -f "$EXAMPLE_FILE" ]; then
        echo "⚠️  $EXAMPLE_FILE not found, skipping..."
        return
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        echo "Creating $ENV_FILE from $EXAMPLE_FILE..."
        cp "$EXAMPLE_FILE" "$ENV_FILE"
        echo "✅ Created $ENV_FILE"
        return
    fi
    
    echo "Checking $ENV_FILE..."
    
    # Read variables from .env.example that are missing in .env
    local MISSING_VARS=()
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ "$line" =~ ^#.*$ ]] || [[ -z "$line" ]]; then
            continue
        fi
        
        # Extract variable name
        if [[ "$line" =~ ^([A-Z_]+)= ]]; then
            VAR_NAME="${BASH_REMATCH[1]}"
            
            # Check if variable exists in .env
            if ! grep -q "^${VAR_NAME}=" "$ENV_FILE"; then
                MISSING_VARS+=("$line")
            fi
        fi
    done < "$EXAMPLE_FILE"
    
    # Append missing variables
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "  Adding ${#MISSING_VARS[@]} missing variable(s)..."
        for var in "${MISSING_VARS[@]}"; do
            echo "$var" >> "$ENV_FILE"
            echo "    + $var"
        done
        echo "✅ Updated $ENV_FILE"
    else
        echo "✅ $ENV_FILE is up to date"
    fi
}

# Fix .env files for all API services
fix_env_file "$PROJECT_ROOT/api/commercial-bank"
fix_env_file "$PROJECT_ROOT/api/national-bank"
fix_env_file "$PROJECT_ROOT/api/ecta"
fix_env_file "$PROJECT_ROOT/api/shipping-line"
fix_env_file "$PROJECT_ROOT/api/custom-authorities"

# Remove obsolete NCAT directory
if [ -d "$PROJECT_ROOT/api/ncat" ] && [ -z "$(ls -A "$PROJECT_ROOT/api/ncat")" ]; then
    echo "Removing obsolete NCAT directory..."
    rmdir "$PROJECT_ROOT/api/ncat"
    echo "✅ Removed obsolete NCAT directory"
fi

# Remove empty ECTA directory if it exists but is empty
if [ -d "$PROJECT_ROOT/api/ecta" ] && [ -z "$(ls -A "$PROJECT_ROOT/api/ecta")" ]; then
    echo "Removing empty ECTA directory..."
    rmdir "$PROJECT_ROOT/api/ecta"
    echo "✅ Removed empty ECTA directory"
fi

echo ""
echo "=========================================="
echo "✅ All .env files have been updated!"
echo "=========================================="
