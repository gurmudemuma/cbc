#!/bin/bash

# Professional Codebase Refactor
echo "🔧 Starting professional refactor..."

# 1. Clean directory structure
mkdir -p {network,chaincode,apis,frontend,shared,scripts,config,docs}

# 2. Move files to proper locations
echo "📁 Organizing directory structure..."
mv network/* network/ 2>/dev/null || true
mv chaincode/* chaincode/ 2>/dev/null || true
mv api/* apis/ 2>/dev/null || true
mv frontend frontend/ 2>/dev/null || true

# 3. Remove duplicate/obsolete files
echo "🗑️ Removing obsolete files..."
rm -f *.log *.pid *temp* *backup* 2>/dev/null || true
rm -f fix-*.sh quick-*.sh ultra-*.sh instant-*.sh 2>/dev/null || true

# 4. Standardize naming
echo "📝 Standardizing naming conventions..."
find . -name "*-api" -type d | while read dir; do
    new_name=$(echo "$dir" | sed 's/-api$//')
    if [ "$dir" != "$new_name" ]; then
        mv "$dir" "$new_name" 2>/dev/null || true
    fi
done

echo "✅ Professional refactor structure complete"
