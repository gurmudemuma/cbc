#!/bin/bash

echo "🔧 Fixing line endings for all shell scripts..."

# List of critical scripts that need line ending fixes
SCRIPTS=(
    "network/scripts/setAnchorPeer.sh"
    "scripts/start-apis.sh"
    "scripts/stop-apis.sh"
    "scripts/enroll-admins.sh"
    "scripts/dev-apis.sh"
    "scripts/check-health.sh"
    "scripts/setup-env.sh"
    "start-system.sh"
)

# Fix line endings for each script
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo "Fixing line endings in: $script"
        tr -d '\r' < "$script" > "${script}.tmp" && mv "${script}.tmp" "$script"
        chmod +x "$script"
    else
        echo "⚠️  Script not found: $script"
    fi
done

echo "✅ Line endings fixed for all scripts"
