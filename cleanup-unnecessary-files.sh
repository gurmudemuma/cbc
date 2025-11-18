#!/bin/bash
# Cleanup unnecessary files from codebase
# Safe deletions only - removes old backups, deprecated configs, and temporary files

echo "🧹 Starting codebase cleanup..."
echo ""

cd /home/gu-da/cbc

# Count files before
BEFORE_COUNT=$(find . -type f | wc -l)
echo "Files before cleanup: $BEFORE_COUNT"
echo ""

# Remove old backup directory
if [ -d "api.backup.1761459750" ]; then
    echo "✓ Removing old backup directory (api.backup.1761459750/)..."
    rm -rf api.backup.1761459750/
else
    echo "  (api.backup.1761459750/ not found - already removed)"
fi

# Remove ECTA files
echo "✓ Removing deprecated ECTA configuration files..."
rm -f network/ECTAMSPconfig.json
rm -f network/ECTAMSPmodified_config.json

# Remove temporary network files
echo "✓ Removing temporary network configuration files..."
rm -f network/config_block.json
rm -f network/config_update.json
rm -f network/config_update_in_envelope.json
rm -f network/scripts/config.json
rm -f network/scripts/config_block.json
rm -f network/scripts/config_update.json
rm -f network/scripts/config_update_in_envelope.json
rm -f network/scripts/modified_config.json
rm -f network/scripts/update.json
rm -f network/scripts/update_in_envelope.json

# Remove backup files
echo "✓ Removing backup files..."
rm -f docker-compose.yml.backup
rm -rf bin.backup.20251024_090807/

# Remove research files
echo "✓ Removing research/reference files..."
rm -f 2502.06540v1.pdf
rm -f pdf_text.txt
rm -f log.txt

# Remove empty directories
echo "✓ Removing empty directories..."
rmdir bin/ 2>/dev/null || true
rmdir logs/ 2>/dev/null || true
rmdir .qodo/ 2>/dev/null || true

# Count files after
AFTER_COUNT=$(find . -type f | wc -l)
FILES_REMOVED=$((BEFORE_COUNT - AFTER_COUNT))

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Summary:"
echo "  Files before: $BEFORE_COUNT"
echo "  Files after:  $AFTER_COUNT"
echo "  Files removed: $FILES_REMOVED"
echo "  Estimated space saved: ~52MB"
echo ""
echo "Files removed:"
echo "  - Old backup directory (api.backup.1761459750/)"
echo "  - 2 ECTA configuration files"
echo "  - 10 temporary network JSON files"
echo "  - 2 backup files"
echo "  - 3 research/reference files"
echo "  - Empty directories"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Test system: npm run install:all"
echo "  3. Commit: git add -A && git commit -m 'Cleanup unnecessary files'"
