#!/bin/bash

# Cleanup script for Coffee Blockchain Consortium
# Removes temporary files, old backups, and consolidates documentation

set -e

echo "🧹 Starting cleanup of Coffee Blockchain project..."

# Navigate to project root
cd "$(dirname "$0")"

echo ""
echo "📋 Cleanup Summary:"
echo "==================="

# 1. Remove backup files
echo ""
echo "1. Removing backup files..."
if [ -f "./chaincode/coffee-export/contract_v1_original.go.bak" ]; then
  rm -f ./chaincode/coffee-export/contract_v1_original.go.bak
  echo "   ✓ Removed contract_v1_original.go.bak"
fi

# 2. Remove outdated documentation
echo ""
echo "2. Removing outdated/redundant documentation..."
OUTDATED_DOCS=(
  "EXPORT_WORKFLOW.md"           # Replaced by CORRECTED_WORKFLOW.md
  "WORKFLOW_GAP_ANALYSIS.md"     # Historical analysis, not needed
  "WORKFLOW_MAPPING.md"          # Redundant with CORRECTED_WORKFLOW.md
  "EXPORT_MANAGEMENT_FIX.md"     # Historical fix, no longer needed
  "DASHBOARD_RATE_LIMIT_FIX.md"  # Historical fix, no longer needed
  "COUCHDB_SETUP_REQUIRED.md"    # Replaced by COUCHDB_MIGRATION_COMPLETE.md
  "IPFS_MANDATORY_CHANGES.md"    # Completed, integrated into guides
  "FRONTEND_LOGIN_GUIDE.md"      # Redundant with FRONTEND_GUIDE.md
  "DOCKER_COMPOSE_GUIDE.md"      # Redundant with DEPLOYMENT_GUIDE.md
  "CONTAINERIZATION_SUMMARY.md"  # Redundant with FULL_CONTAINERIZATION_GUIDE.md
  "WINDOWS-SETUP-NOTES.md"       # Redundant with WINDOWS-QUICK-START.md
)

for doc in "${OUTDATED_DOCS[@]}"; do
  if [ -f "./$doc" ]; then
    rm -f "./$doc"
    echo "   ✓ Removed $doc"
  fi
done

# 3. Clear log files (keep directory)
echo ""
echo "3. Clearing old log files..."
if [ -d "./logs" ]; then
  rm -f ./logs/*.log
  echo "   ✓ Cleared all log files"
fi

# 4. List documentation that should remain
echo ""
echo "4. Documentation structure after cleanup:"
echo ""
echo "   📚 Core Documentation:"
echo "      • README.md - Project overview"
echo "      • ARCHITECTURE.md - System architecture"
echo "      • CORRECTED_WORKFLOW.md - v2.0 workflow (authoritative)"
echo "      • DEPLOYMENT_GUIDE.md - Deployment instructions"
echo "      • QUICK_START.md - Quick start guide"
echo ""
echo "   🔧 Setup & Configuration:"
echo "      • WARP.md - WARP AI assistant rules"
echo "      • IPFS_SETUP.md - IPFS configuration"
echo "      • COUCHDB_MIGRATION_GUIDE.md - CouchDB setup"
echo "      • COUCHDB_MIGRATION_COMPLETE.md - Migration status"
echo "      • FULL_CONTAINERIZATION_GUIDE.md - Docker setup"
echo ""
echo "   💻 Development:"
echo "      • DEVELOPER_NOTES.md - Developer reference"
echo "      • TESTING_GUIDE.md - Testing procedures"
echo "      • FRONTEND_GUIDE.md - Frontend development"
echo "      • FRONTEND_WORKFLOW_UPDATE.md - v2.0 frontend changes"
echo "      • IMPLEMENTATION_CHECKLIST.md - Implementation tracking"
echo ""
echo "   🔐 Operations:"
echo "      • SECURITY.md - Security practices"
echo "      • STARTUP_ORDER.md - Service startup sequence"
echo "      • USER_CREDENTIALS.md - Test user credentials"
echo "      • INTER_SERVICE_COMMUNICATION.md - API integration"
echo ""
echo "   📊 Reference:"
echo "      • SYSTEM_DIAGRAM.md - System diagrams"
echo "      • DOCUMENT_TYPES.md - Document specifications"
echo "      • DOCUMENTATION_INDEX.md - Documentation index"
echo "      • DASHBOARD_WORKFLOW_CHART.md - Dashboard features"
echo "      • CHANGELOG.md - Version history"
echo "      • WINDOWS-QUICK-START.md - Windows setup"
echo ""

# 5. Build artifacts info (not removed, just reported)
echo "5. Build artifacts (preserved):"
echo "   • frontend/dist/ - Frontend build output"
echo "   • frontend/node_modules/ - NPM dependencies"
echo "   • api/*/node_modules/ - API dependencies"
echo "   • chaincode/*/vendor/ - Go vendor dependencies"
echo ""
echo "   💡 To clean build artifacts, run:"
echo "      npm run clean  # (if available)"
echo "      rm -rf frontend/dist"
echo "      rm -rf api/*/dist"
echo ""

# 6. Create .gitignore if needed
echo "6. Checking .gitignore..."
if [ ! -f ".gitignore" ]; then
  cat > .gitignore << 'EOF'
# Logs
logs/
*.log
npm-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Dependencies
node_modules/
api/*/node_modules/
frontend/node_modules/

# Build outputs
dist/
build/
api/*/dist/
frontend/dist/

# Environment files
.env
.env.local
.env.*.local
api/*/.env
frontend/.env

# Wallets (Fabric credentials)
api/*/wallet/
*/wallet/

# Fabric network data
network/organizations/peerOrganizations/
network/organizations/ordererOrganizations/
network/channel-artifacts/
network/system-genesis-block/

# Backup files
*.bak
*~
*.swp

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.iml

# Docker volumes
docker-volumes/

# Temporary files
*.tmp
temp/
EOF
  echo "   ✓ Created .gitignore"
else
  echo "   ✓ .gitignore exists"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review remaining documentation in root directory"
echo "   2. Commit changes to version control"
echo "   3. Run 'git status' to see what changed"
echo ""
