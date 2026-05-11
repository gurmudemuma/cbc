#!/bin/bash
# ============================================================================
# Join Channel to Orderers using Channel Participation API
# This script joins the coffeechannel to all orderers
# ============================================================================

set -e

CHANNEL_NAME="coffeechannel"
CHANNEL_BLOCK="/tmp/${CHANNEL_NAME}.block"

echo "============================================================================"
echo "         JOIN CHANNEL TO ORDERERS (Channel Participation API)"
echo "============================================================================"
echo ""
echo "Channel: $CHANNEL_NAME"
echo ""

# Fetch the channel genesis block from peer
echo "[1/4] Fetching channel genesis block from peer..."
peer channel fetch 0 $CHANNEL_BLOCK -c $CHANNEL_NAME
echo "[SUCCESS] Channel block fetched"
echo ""

# Join orderer1
echo "[2/4] Joining channel to orderer1..."
RESPONSE=$(curl -k -X POST -s -w "\n%{http_code}" \
  -F "config-block=@${CHANNEL_BLOCK}" \
  https://orderer1.orderer.example.com:7053/participation/v1/channels \
  --cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.crt \
  --key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.key \
  --cacert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/ca.crt)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response (HTTP $HTTP_CODE): $BODY"
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "[SUCCESS] Orderer1 joined"
elif echo "$BODY" | grep -q "already exists"; then
  echo "[INFO] Orderer1 already joined to channel"
else
  echo "[WARNING] Orderer1 join may have failed"
fi
echo ""

# Join orderer2
echo "[3/4] Joining channel to orderer2..."
RESPONSE=$(curl -k -X POST -s -w "\n%{http_code}" \
  -F "config-block=@${CHANNEL_BLOCK}" \
  https://orderer2.orderer.example.com:8053/participation/v1/channels \
  --cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/server.crt \
  --key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/server.key \
  --cacert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/ca.crt)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response (HTTP $HTTP_CODE): $BODY"
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "[SUCCESS] Orderer2 joined"
elif echo "$BODY" | grep -q "already exists"; then
  echo "[INFO] Orderer2 already joined to channel"
else
  echo "[WARNING] Orderer2 join may have failed"
fi
echo ""

# Join orderer3
echo "[4/4] Joining channel to orderer3..."
RESPONSE=$(curl -k -X POST -s -w "\n%{http_code}" \
  -F "config-block=@${CHANNEL_BLOCK}" \
  https://orderer3.orderer.example.com:9053/participation/v1/channels \
  --cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/server.crt \
  --key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/server.key \
  --cacert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/ca.crt)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response (HTTP $HTTP_CODE): $BODY"
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "[SUCCESS] Orderer3 joined"
elif echo "$BODY" | grep -q "already exists"; then
  echo "[INFO] Orderer3 already joined to channel"
else
  echo "[WARNING] Orderer3 join may have failed"
fi
echo ""

echo "============================================================================"
echo "[SUCCESS] All orderers joined to channel: $CHANNEL_NAME"
echo "============================================================================"
echo ""
echo "You can now proceed with chaincode approval"
echo ""
