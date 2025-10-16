#!/bin/bash
# Quick test to verify binary detection

echo "========================================"
echo "Testing Hyperledger Fabric Binary Detection"
echo "========================================"
echo ""

cd /c/cbc/network

echo "Current directory: $(pwd)"
echo ""

echo "1. Testing peer.exe in PATH:"
if command -v peer.exe &> /dev/null; then
    echo "   ✅ Found: $(command -v peer.exe)"
    peer.exe version | head -2
else
    echo "   ❌ Not found in PATH"
fi
echo ""

echo "2. Testing cryptogen.exe in PATH:"
if command -v cryptogen.exe &> /dev/null; then
    echo "   ✅ Found: $(command -v cryptogen.exe)"
else
    echo "   ❌ Not found in PATH"
fi
echo ""

echo "3. Testing direct path to peer.exe:"
if [ -x "../bin/peer.exe" ]; then
    echo "   ✅ Executable: ../bin/peer.exe"
    ../bin/peer.exe version | head -2
else
    echo "   ❌ Not executable or not found"
fi
echo ""

echo "4. Testing direct path to cryptogen.exe:"
if [ -x "../bin/cryptogen.exe" ]; then
    echo "   ✅ Executable: ../bin/cryptogen.exe"
else
    echo "   ❌ Not executable or not found"
fi
echo ""

echo "5. PATH variable:"
echo "   $PATH" | tr ':' '\n' | grep -E "(cbc|bin)" || echo "   No cbc/bin in PATH"
echo ""

echo "========================================"
echo "Test Complete"
echo "========================================"
