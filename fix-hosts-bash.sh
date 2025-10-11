#!/bin/bash
# Quick fix for Windows hosts file (requires admin/elevated privileges)

echo "=========================================="
echo "Blockchain Network - Hosts File Setup"
echo "=========================================="
echo ""

HOSTS_FILE="/c/Windows/System32/drivers/etc/hosts"

# Check if running with admin privileges
if [ ! -w "$HOSTS_FILE" ]; then
    echo "❌ ERROR: This script requires administrator privileges"
    echo ""
    echo "Please run Git Bash as Administrator and try again."
    echo ""
    echo "Alternative: Manually add these lines to C:\\Windows\\System32\\drivers\\etc\\hosts:"
    echo ""
    echo "127.0.0.1 orderer.coffee-export.com"
    echo "127.0.0.1 peer0.exporterbank.coffee-export.com"
    echo "127.0.0.1 peer0.nationalbank.coffee-export.com"
    echo "127.0.0.1 peer0.ncat.coffee-export.com"
    echo "127.0.0.1 peer0.shippingline.coffee-export.com"
    echo ""
    exit 1
fi

# Add entries if they don't exist
add_host() {
    local hostname=$1
    if ! grep -q "$hostname" "$HOSTS_FILE"; then
        echo "127.0.0.1 $hostname" >> "$HOSTS_FILE"
        echo "✅ Added: $hostname"
    else
        echo "⏭️  Already exists: $hostname"
    fi
}

echo "Adding blockchain hostnames to hosts file..."
echo ""

add_host "orderer.coffee-export.com"
add_host "peer0.exporterbank.coffee-export.com"
add_host "peer0.nationalbank.coffee-export.com"
add_host "peer0.ncat.coffee-export.com"
add_host "peer0.shippingline.coffee-export.com"

echo ""
echo "=========================================="
echo "✅ Hosts file updated successfully!"
echo "=========================================="
echo ""
echo "You can now run:"
echo "  cd network"
echo "  ./network.sh createChannel"
echo ""
