#!/bin/bash
# Fix ECTA connection profile and restart API

echo "🔧 Fixing ECTA connection profile..."

cd /home/gu-da/cbc/network/organizations/peerOrganizations

# Check if ecta directory exists
if [ ! -d "ecta.coffee-export.com" ]; then
    echo "❌ ECTA directory not found"
    exit 1
fi

cd ecta.coffee-export.com

# Find the TLS CA cert
TLSCA_CERT=$(find tlsca -name "*.pem" 2>/dev/null | head -1)
CA_CERT=$(find ca -name "*.pem" 2>/dev/null | head -1)

if [ -z "$TLSCA_CERT" ] || [ -z "$CA_CERT" ]; then
    echo "❌ Certificate files not found"
    echo "This means we need to regenerate the entire network with correct ECTA naming"
    echo ""
    echo "Run: npm start --clean"
    exit 1
fi

# Create a basic connection profile
cat > connection-ecta.json << 'EOF'
{
  "name": "coffee-export-ecta",
  "version": "1.0.0",
  "client": {
    "organization": "ECTA",
    "connection": {
      "timeout": {
        "peer": {
          "endorser": "300"
        },
        "orderer": "300"
      }
    }
  },
  "organizations": {
    "ECTA": {
      "mspid": "ECTAMSP",
      "peers": [
        "peer0.ecta.coffee-export.com"
      ],
      "certificateAuthorities": [
        "ca.ecta.coffee-export.com"
      ]
    }
  },
  "peers": {
    "peer0.ecta.coffee-export.com": {
      "url": "grpcs://localhost:9051",
      "tlsCACerts": {
        "path": "TLSCA_CERT_PATH"
      },
      "grpcOptions": {
        "ssl-target-name-override": "peer0.ecta.coffee-export.com",
        "hostnameOverride": "peer0.ecta.coffee-export.com"
      }
    }
  },
  "certificateAuthorities": {
    "ca.ecta.coffee-export.com": {
      "url": "https://localhost:7984",
      "caName": "ca-ecta",
      "tlsCACerts": {
        "path": "CA_CERT_PATH"
      },
      "httpOptions": {
        "verify": false
      }
    }
  }
}
EOF

# Replace placeholders with actual paths
sed -i "s|TLSCA_CERT_PATH|$TLSCA_CERT|g" connection-ecta.json
sed -i "s|CA_CERT_PATH|$CA_CERT|g" connection-ecta.json

echo "✅ Connection profile created"

# Restart ECTA API
echo "🔄 Restarting ECTA API..."
cd /home/gu-da/cbc
pkill -f "api/ecta" 2>/dev/null || true
sleep 2

cd api/ecta
nohup npm run dev > ../../logs/ecta.log 2>&1 &
ECTA_PID=$!

echo "✅ ECTA API started (PID: $ECTA_PID)"
echo ""
echo "Waiting 10 seconds for API to initialize..."
sleep 10

# Test the API
if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    echo "✅ ECTA API is responding!"
    curl -s http://localhost:3003/health | head -5
else
    echo "❌ ECTA API is not responding"
    echo "Check logs: tail -f logs/ecta.log"
fi
