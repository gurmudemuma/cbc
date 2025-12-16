#!/bin/bash
cd /home/gu-da/cbc/frontend/src/pages

# Fix all startIcon props
find . -name "*.tsx" -exec sed -i -E 's/startIcon=\{<([A-Z][a-zA-Z0-9]*)(.*?)\/>\}/startIcon={<span><\1\2\/><\/span>}/g' {} \;

# Fix all endIcon props
find . -name "*.tsx" -exec sed -i -E 's/endIcon=\{<([A-Z][a-zA-Z0-9]*)(.*?)\/>\}/endIcon={<span><\1\2\/><\/span>}/g' {} \;

# Fix all icon props in Tab/Chip
find . -name "*.tsx" -exec sed -i -E 's/icon=\{<([A-Z][a-zA-Z0-9]*)(.*?)\/>\}/icon={<span><\1\2\/><\/span>}/g' {} \;

echo "✅ All icons fixed!"
