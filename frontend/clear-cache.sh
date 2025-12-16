#!/bin/bash
echo "🧹 Clearing frontend cache..."
cd /home/gu-da/cbc/frontend
rm -rf node_modules/.cache
rm -rf build
rm -rf .cache
echo "✅ Cache cleared!"
echo ""
echo "Now restart the dev server:"
echo "  npm start"
