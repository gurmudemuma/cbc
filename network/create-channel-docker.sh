#!/bin/bash

# Create channel using the CLI container (Docker internal network)
# This avoids hostname resolution issues on Windows

CHANNEL_NAME=${1:-"coffeechannel"}

echo "=========================================="
echo "Creating Channel: $CHANNEL_NAME"
echo "=========================================="
echo ""

# Step 1: Generate channel genesis block
echo "Generating channel genesis block..."
export FABRIC_CFG_PATH=${PWD}/configtx
../bin/configtxgen -profile CoffeeExportGenesis -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID $CHANNEL_NAME

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate channel genesis block"
    exit 1
fi
echo "✅ Genesis block generated"
echo ""

# Step 2: Run channel creation inside CLI container
echo "Joining orderer and peers to channel..."
docker exec cli ./scripts/create-channel-inside-docker.sh $CHANNEL_NAME

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Channel '$CHANNEL_NAME' created successfully!"
    echo "=========================================="
    echo ""
    echo "Next step: Deploy chaincode with:"
    echo "  ./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang"
    echo ""
else
    echo "❌ Channel creation encountered errors"
    exit 1
fi
