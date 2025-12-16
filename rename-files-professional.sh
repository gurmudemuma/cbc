#!/bin/bash

# Professional File Renaming Script
echo "📝 Renaming files to professional standards..."

# Function to rename files professionally
rename_file() {
    local old_file="$1"
    local new_file="$2"
    
    if [ -f "$old_file" ] && [ "$old_file" != "$new_file" ]; then
        mv "$old_file" "$new_file"
        echo "✅ $old_file → $new_file"
    fi
}

# Rename configuration files
rename_file "frontend/src/config/theme.config.enhanced.ts" "frontend/src/config/theme.config.ts"
rename_file "api/shared/env.validator.enhanced.js" "api/shared/env.validator.js"

# Remove duplicate/similar files (keep only one)
echo "🗑️ Removing duplicate files..."

# Remove files with unprofessional suffixes
find . -name "*-improved.*" -delete 2>/dev/null
find . -name "*-enhanced.*" -delete 2>/dev/null
find . -name "*-fixed.*" -delete 2>/dev/null
find . -name "*-updated.*" -delete 2>/dev/null
find . -name "*-new.*" -delete 2>/dev/null
find . -name "*-temp.*" -delete 2>/dev/null
find . -name "*-backup.*" -delete 2>/dev/null
find . -name "*-old.*" -delete 2>/dev/null
find . -name "*-copy.*" -delete 2>/dev/null
find . -name "*-final.*" -delete 2>/dev/null
find . -name "*-complete.*" -delete 2>/dev/null

# Rename API files to standard names
if [ -f "api/commercial-bank/Dockerfile.simple" ]; then
    rename_file "api/commercial-bank/Dockerfile.simple" "api/commercial-bank/Dockerfile"
fi

# Standardize script names
rename_file "start-system.sh" "scripts/start.sh"
rename_file "stop-system.sh" "scripts/stop.sh"
rename_file "deploy-enterprise-system.sh" "scripts/deploy-enterprise.sh"

# Remove redundant files (keep only the main one)
echo "🔄 Consolidating similar files..."

# Keep only main docker-compose file
if [ -f "docker-compose.yml" ] && [ -f "docker-compose.production.yml" ]; then
    rm -f docker-compose-*.yml 2>/dev/null
    echo "✅ Kept main docker-compose files only"
fi

# Keep only main package.json
find . -name "package.json" -path "*/node_modules" -prune -o -name "package.json" -print | head -1 | while read main_pkg; do
    find . -name "package.json.backup" -o -name "package.json.old" -delete 2>/dev/null
done

echo "✅ Professional file naming complete!"
echo "📊 Summary:"
echo "  - Removed unprofessional suffixes"
echo "  - Standardized configuration files"
echo "  - Consolidated duplicate files"
echo "  - One file per task achieved"
