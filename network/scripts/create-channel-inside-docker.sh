#!/bin/bash

# This script runs INSIDE the CLI container
# It creates the channel and joins all peers

CHANNEL_NAME=${1:-"coffeechannel"}
WORKDIR="/opt/gopath/src/github.com/hyperledger/fabric/peer"

cd $WORKDIR

echo "=========================================="
echo "Creating Channel: $CHANNEL_NAME"
echo "=========================================="

# Step 1: Join orderer to channel
echo "Step 1: Joining orderer to channel..."
osnadmin channel join \
    --channelID $CHANNEL_NAME \
    --config-block $WORKDIR/channel-artifacts/${CHANNEL_NAME}.block \
    -o orderer.coffee-export.com:7053 \
    --ca-file $WORKDIR/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem \
    --client-cert $WORKDIR/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.crt \
    --client-key $WORKDIR/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.key

if [ $? -eq 0 ]; then
    echo "✅ Orderer joined to channel"
else
    echo "❌ Failed to join orderer (may already be joined)"
fi
echo ""

# Set environment
export FABRIC_CFG_PATH=/etc/hyperledger/fabric
export CORE_PEER_TLS_ENABLED=true

# Step 2: Join commercialbank peer
echo "Step 2: Joining commercialbank peer..."
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer channel join -b $WORKDIR/channel-artifacts/${CHANNEL_NAME}.block
if [ $? -eq 0 ]; then
    echo "✅ commercialbank peer joined"
else
    echo "⚠️  commercialbank peer join failed (may already be joined)"
fi
echo ""

# Step 3: Join NationalBank peer
echo "Step 3: Joining NationalBank peer..."
export CORE_PEER_LOCALMSPID="NationalBankMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/nationalbank.coffee-export.com/users/Admin@nationalbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.nationalbank.coffee-export.com:8051

peer channel join -b $WORKDIR/channel-artifacts/${CHANNEL_NAME}.block
if [ $? -eq 0 ]; then
    echo "✅ NationalBank peer joined"
else
    echo "⚠️  NationalBank peer join failed (may already be joined)"
fi
echo ""

# Step 4: Join ECTA peer
echo "Step 4: Joining ECTA peer..."
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/ecta.coffee-export.com/users/Admin@ecta.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.ecta.coffee-export.com:9051

peer channel join -b $WORKDIR/channel-artifacts/${CHANNEL_NAME}.block
if [ $? -eq 0 ]; then
    echo "✅ ECTA peer joined"
else
    echo "⚠️  ECTA peer join failed (may already be joined)"
fi
echo ""

# Step 5: Join ShippingLine peer
echo "Step 5: Joining ShippingLine peer..."
export CORE_PEER_LOCALMSPID="ShippingLineMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/shippingline.coffee-export.com/users/Admin@shippingline.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.shippingline.coffee-export.com:10051

peer channel join -b $WORKDIR/channel-artifacts/${CHANNEL_NAME}.block
if [ $? -eq 0 ]; then
    echo "✅ ShippingLine peer joined"
else
    echo "⚠️  ShippingLine peer join failed (may already be joined)"
fi
echo ""

echo "=========================================="
echo "✅ Channel '$CHANNEL_NAME' setup complete!"
echo "=========================================="
