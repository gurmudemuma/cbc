#!/bin/bash

echo "🔧 Fixing line endings for critical scripts..."

# Critical scripts that need fixing
SCRIPTS=(
    "scripts/dev-apis.sh"
    "scripts/start-apis.sh" 
    "scripts/stop-apis.sh"
    "scripts/enroll-admins.sh"
    "scripts/check-health.sh"
    "network/scripts/setAnchorPeer.sh"
)

# Fix line endings
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo "Fixing: $script"
        # Remove carriage returns and ensure Unix line endings
        sed -i 's/\r$//' "$script" 2>/dev/null || tr -d '\r' < "$script" > "${script}.tmp" && mv "${script}.tmp" "$script"
        chmod +x "$script"
    else
        echo "⚠️  Not found: $script"
    fi
done

echo "✅ Line endings fixed for critical scripts"
