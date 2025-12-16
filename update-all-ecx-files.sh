#!/bin/bash

# Update all files that need ECX integration
echo "🔄 Updating all ECX-related files..."

# 1. Update network scripts
find network -name "*.sh" -exec sed -i 's/peer0.ecta.coffee-export.com peer0.shippingline/peer0.ecta.coffee-export.com peer0.ecx.coffee-export.com peer0.shippingline/g' {} \;

# 2. Update README
sed -i '/• ECTA: http:\/\/localhost:3003/a\    • ECX: http://localhost:3006' README.md

# 3. Create ECX API directory structure
mkdir -p api/ecx/src

# 4. Update package.json to include ECX
if [ -f api/package.json ]; then
    sed -i '/"ecta"/a\    "ecx": "file:./ecx",' api/package.json
fi

# 5. Update .env files
for env_file in .env api/*/.env; do
    if [ -f "$env_file" ]; then
        echo "ECX_API_URL=http://localhost:3006" >> "$env_file"
    fi
done

echo "✅ All ECX files updated"
