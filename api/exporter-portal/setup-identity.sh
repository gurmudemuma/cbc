#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Exporter Portal Identity Setup                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Configuration:"
echo "   • Uses Commercial Bank's admin identity"
echo "   • No separate Fabric identity for Exporter Portal"
echo "   • Exporters authenticated via JWT (not Fabric)"
echo ""

# Check if Commercial Bank admin exists
if [ ! -f "../commercial-bank/wallet/admin.id" ]; then
    echo "❌ Commercial Bank admin identity not found"
    echo ""
    echo "Please enroll Commercial Bank admin first:"
    echo "   cd ../commercial-bank"
    echo "   node enrollAdmin.js"
    echo ""
    exit 1
fi

# Create wallet directory
mkdir -p wallet

# Copy admin identity from Commercial Bank
echo "📋 Copying Commercial Bank admin identity..."
cp ../commercial-bank/wallet/admin.id wallet/admin.id

if [ -f "wallet/admin.id" ]; then
    echo "✅ Admin identity copied successfully"
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              Setup Complete - Ready to Use                 ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo "  1. Start Exporter Portal: npm run dev"
    echo "  2. Exporters can register/login via JWT"
    echo "  3. All transactions use CommercialBankMSP"
else
    echo "❌ Failed to copy admin identity"
    exit 1
fi
