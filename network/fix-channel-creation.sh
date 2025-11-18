#!/bin/bash

# Fix script for channel creation issues in Hyperledger Fabric network
# This script addresses TLS handshake failures and channel NOT_FOUND errors

set -e

CHANNEL_NAME="${1:-coffeechannel}"
DELAY="${2:-3}"
MAX_RETRY="${3:-5}"

echo "=========================================="
echo "Fabric Channel Creation Fix"
echo "=========================================="
echo "Channel: $CHANNEL_NAME"
echo "Delay: $DELAY seconds"
echo "Max Retries: $MAX_RETRY"
echo ""

# Source environment variables
. scripts/envVar.sh

# Step 1: Verify network is running
echo "[1/5] Verifying network containers are running..."
RUNNING_CONTAINERS=$(docker ps --filter "label=service=hyperledger-fabric" --format "{{.Names}}" | wc -l)
if [ "$RUNNING_CONTAINERS" -lt 6 ]; then
    echo "ERROR: Not all containers are running. Expected at least 6, found $RUNNING_CONTAINERS"
    echo "Please run: cd network && ./network.sh up"
    exit 1
fi
echo "✓ All containers are running"
echo ""

# Step 2: Wait for orderer to be ready
echo "[2/5] Waiting for orderer to be ready..."
COUNTER=0
while [ $COUNTER -lt $MAX_RETRY ]; do
    if docker exec orderer.coffee-export.com test -f /var/hyperledger/production/orderer/system.block 2>/dev/null; then
        echo "✓ Orderer is ready"
        break
    fi
    COUNTER=$((COUNTER + 1))
    if [ $COUNTER -lt $MAX_RETRY ]; then
        echo "  Waiting... ($COUNTER/$MAX_RETRY)"
        sleep $DELAY
    fi
done

if [ $COUNTER -eq $MAX_RETRY ]; then
    echo "WARNING: Orderer may not be fully initialized, continuing anyway..."
fi
echo ""

# Step 3: Create channel genesis block
echo "[3/5] Creating channel genesis block..."
FABRIC_CFG_PATH=$PWD/configtx

# Find configtxgen
CONFIGTXGEN_CMD=""
if command -v configtxgen.exe &> /dev/null; then
    CONFIGTXGEN_CMD="configtxgen.exe"
elif command -v configtxgen &> /dev/null; then
    CONFIGTXGEN_CMD="configtxgen"
else
    if [ -x "${PWD}/../bin/configtxgen.exe" ]; then
        CONFIGTXGEN_CMD="${PWD}/../bin/configtxgen.exe"
    elif [ -x "${PWD}/../bin/configtxgen" ]; then
        CONFIGTXGEN_CMD="${PWD}/../bin/configtxgen"
    fi
fi

if [ -z "$CONFIGTXGEN_CMD" ]; then
    echo "ERROR: configtxgen tool not found"
    exit 1
fi

if [ ! -d "channel-artifacts" ]; then
    mkdir -p channel-artifacts
fi

# Remove old block if exists
rm -f channel-artifacts/${CHANNEL_NAME}.block

# Generate the block
$CONFIGTXGEN_CMD -profile CoffeeExportGenesis -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID $CHANNEL_NAME 2>&1 | grep -v "^$" || true

if [ ! -f "channel-artifacts/${CHANNEL_NAME}.block" ]; then
    echo "ERROR: Failed to generate channel block"
    exit 1
fi
echo "✓ Channel genesis block created"
echo ""

# Step 4: Create channel via osnadmin
echo "[4/5] Creating channel on orderer..."
ORDERER_ADMIN_ENDPOINT="orderer.coffee-export.com:7053"
BLOCK_FILE="./channel-artifacts/${CHANNEL_NAME}.block"

COUNTER=0
while [ $COUNTER -lt $MAX_RETRY ]; do
    echo "  Attempt $((COUNTER + 1))/$MAX_RETRY..."
    
    # Use docker exec to run osnadmin from CLI container
    if MSYS_NO_PATHCONV=1 docker exec cli osnadmin channel join \
        --channelID $CHANNEL_NAME \
        --config-block //opt//gopath//src//github.com//hyperledger//fabric//peer//channel-artifacts//${CHANNEL_NAME}.block \
        -o $ORDERER_ADMIN_ENDPOINT \
        --ca-file //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//msp//tlscacerts//tlsca.coffee-export.com-cert.pem \
        --client-cert //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//tls//server.crt \
        --client-key //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//tls//server.key 2>&1 | tee -a channel-creation.log; then
        echo "✓ Channel created successfully"
        break
    fi
    
    COUNTER=$((COUNTER + 1))
    if [ $COUNTER -lt $MAX_RETRY ]; then
        echo "  Retrying in $DELAY seconds..."
        sleep $DELAY
    fi
done

if [ $COUNTER -eq $MAX_RETRY ]; then
    echo "ERROR: Failed to create channel after $MAX_RETRY attempts"
    echo "Check channel-creation.log for details"
    exit 1
fi
echo ""

# Step 5: Join peers to channel
echo "[5/5] Joining peers to channel..."
FABRIC_CFG_PATH=$PWD/../config/
BLOCKFILE="./channel-artifacts/${CHANNEL_NAME}.block"

# Find peer command
PEER_CMD=""
if command -v peer.exe &> /dev/null; then
    PEER_CMD="peer.exe"
elif command -v peer &> /dev/null; then
    PEER_CMD="peer"
else
    if [ -x "${PWD}/../bin/peer.exe" ]; then
        PEER_CMD="${PWD}/../bin/peer.exe"
    elif [ -x "${PWD}/../bin/peer" ]; then
        PEER_CMD="${PWD}/../bin/peer"
    fi
fi

if [ -z "$PEER_CMD" ]; then
    echo "ERROR: peer tool not found"
    exit 1
fi

# Join each peer
PEERS=(
    "1:commercialbank"
    "2:NationalBank"
    "3:ECTA"
    "4:ShippingLine"
    "5:CustomAuthorities"
)

for PEER_INFO in "${PEERS[@]}"; do
    ORG_NUM="${PEER_INFO%:*}"
    ORG_NAME="${PEER_INFO#*:}"
    
    echo "  Joining $ORG_NAME peer..."
    setGlobals $ORG_NUM
    
    COUNTER=0
    while [ $COUNTER -lt $MAX_RETRY ]; do
        if $PEER_CMD channel join -b $BLOCKFILE 2>&1 | tee -a channel-join.log; then
            echo "    ✓ $ORG_NAME joined"
            break
        fi
        COUNTER=$((COUNTER + 1))
        if [ $COUNTER -lt $MAX_RETRY ]; then
            sleep $DELAY
        fi
    done
    
    if [ $COUNTER -eq $MAX_RETRY ]; then
        echo "    WARNING: Failed to join $ORG_NAME after $MAX_RETRY attempts"
    fi
done

echo ""
echo "=========================================="
echo "✓ Channel creation completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify channel: peer channel list"
echo "2. Deploy chaincode: ./network.sh deployCC"
echo ""
