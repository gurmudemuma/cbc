#!/bin/bash

echo "Testing peer binary access from network directory..."
cd c:/cbc/network

echo ""
echo "Current directory: $(pwd)"
echo ""

echo "Checking with -f test:"
if [ -f "../bin/peer.exe" ]; then
    echo "  ✅ ../bin/peer.exe found"
else
    echo "  ❌ ../bin/peer.exe NOT found"
fi

echo ""
echo "Checking with absolute path:"
if [ -f "/c/cbc/bin/peer.exe" ]; then
    echo "  ✅ /c/cbc/bin/peer.exe found"
else
    echo "  ❌ /c/cbc/bin/peer.exe NOT found"
fi

echo ""
echo "Directory listing of ../bin:"
ls -la ../bin/ | head -20

echo ""
echo "Trying to execute peer.exe:"
if ../bin/peer.exe version 2>/dev/null; then
    echo "  ✅ peer.exe executed successfully"
else
    echo "  ❌ peer.exe execution failed"
fi
