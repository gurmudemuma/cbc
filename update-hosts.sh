#!/bin/bash
# Script to add Hyperledger Fabric hostnames to Windows hosts file

HOSTS_FILE="/c/Windows/System32/drivers/etc/hosts"
BACKUP_FILE="/c/Windows/System32/drivers/etc/hosts.backup"

echo "================================================"
echo "Updating Windows Hosts File for Fabric Network"
echo "================================================"
echo ""
echo "ℹ️  NOTE: Only orderer.coffee-export.com is required for osnadmin"
echo "   Peer connections use localhost with TLS hostname override"
echo ""

# Check if running with admin privileges
if ! touch "$HOSTS_FILE" 2>/dev/null; then
    echo "❌ ERROR: Need Administrator privileges to modify hosts file"
    echo ""
    echo "Please run ONE of these options:"
    echo ""
    echo "Option 1: Run Git Bash as Administrator"
    echo "  1. Close this terminal"
    echo "  2. Right-click Git Bash → Run as Administrator"
    echo "  3. cd /c/cbc && ./update-hosts.sh"
    echo ""
    echo "Option 2: Manual edit (Easiest)"
    echo "  1. Press Win+X, select 'Windows Terminal (Admin)'"
    echo "  2. Run: notepad C:\\Windows\\System32\\drivers\\etc\\hosts"
    echo "  3. Add this line at the end:"
    echo "     127.0.0.1 orderer.coffee-export.com"
    echo "  4. Save and close"
    echo ""
    exit 1
fi

# Create backup
echo "Creating backup of hosts file..."
cp "$HOSTS_FILE" "$BACKUP_FILE"

# Define the hostnames (only orderer is required for osnadmin)
HOSTNAMES=(
    "orderer.coffee-export.com"
)

# Check and add entries
ADDED=0
for hostname in "${HOSTNAMES[@]}"; do
    if grep -q "$hostname" "$HOSTS_FILE"; then
        echo "✅ $hostname already in hosts file"
    else
        echo "127.0.0.1 $hostname" >> "$HOSTS_FILE"
        echo "➕ Added $hostname"
        ADDED=$((ADDED + 1))
    fi
done

echo ""
if [ $ADDED -gt 0 ]; then
    echo "✅ Added $ADDED new entries to hosts file"
else
    echo "✅ All entries already present"
fi

echo ""
echo "Current Fabric-related entries in hosts file:"
echo "----------------------------------------------"
grep "coffee-export.com" "$HOSTS_FILE"

echo ""
echo "================================================"
echo "✅ Hosts file update complete!"
echo "================================================"
