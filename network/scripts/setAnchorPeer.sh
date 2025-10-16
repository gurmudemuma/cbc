#!/bin/bash

source scripts/envVar.sh

CHANNEL_NAME=${1:-"coffeechannel"}
DELAY=${2:-"3"}
MAX_RETRY=${3:-"5"}
VERBOSE=${4:-"false"}

infoln() {
  echo "INFO: $1"
}

errorln() {
  echo "ERROR: $1"
}

successln() {
  echo "SUCCESS: $1"
}

# fetchChannelConfig <org> <channel_id> <output_json>
# Writes the current channel config for a specific channel to a JSON file
# NOTE: this must be run in a CLI container since it requires configtxlator
fetchChannelConfig() {
  ORG=$1
  CHANNEL=$2
  OUTPUT=$3

  setGlobals $ORG

  infoln "Fetching the most recent configuration block for the channel"
  set -x
  peer channel fetch config config_block.pb -o orderer.coffee-export.com:7050 --ordererTLSHostnameOverride orderer.coffee-export.com -c $CHANNEL --tls --cafile "$ORDERER_CA"
  { set +x; } 2>/dev/null

  infoln "Decoding config block to JSON and isolating config to ${OUTPUT}"
  set -x
  configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json
  jq .data.data[0].payload.data.config config_block.json >"${OUTPUT}"
  { set +x; } 2>/dev/null
}

# createConfigUpdate <channel_id> <original_config.json> <modified_config.json> <output.pb>
# Takes an original and modified config, and produces the config update tx
# which transitions between the two
# NOTE: this must be run in a CLI container since it requires configtxlator
createConfigUpdate() {
  CHANNEL=$1
  ORIGINAL=$2
  MODIFIED=$3
  OUTPUT=$4

  set -x
  configtxlator proto_encode --input "${ORIGINAL}" --type common.Config --output original_config.pb
  configtxlator proto_encode --input "${MODIFIED}" --type common.Config --output modified_config.pb
  configtxlator compute_update --channel_id "${CHANNEL}" --original original_config.pb --updated modified_config.pb --output config_update.pb
  configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json
  echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL'", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}}' | jq . >config_update_in_envelope.json
  configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output "${OUTPUT}"
  { set +x; } 2>/dev/null
}

# updateAnchorPeer <org> <channel_id>
updateAnchorPeer() {
  ORG=$1
  CHANNEL=$2
  setGlobals $ORG

  local orgmsp=""
  local host=""
  local port=""

  if [ $ORG -eq 1 ]; then
    orgmsp="ExporterBankMSP"
    host="peer0.exporterbank.coffee-export.com"
    port=7051
  elif [ $ORG -eq 2 ]; then
    orgmsp="NationalBankMSP"
    host="peer0.nationalbank.coffee-export.com"
    port=8051
  elif [ $ORG -eq 3 ]; then
    orgmsp="NCATMSP"
    host="peer0.ncat.coffee-export.com"
    port=9051
  elif [ $ORG -eq 4 ]; then
    orgmsp="ShippingLineMSP"
    host="peer0.shippingline.coffee-export.com"
    port=10051
  else
    errorln "Unknown organization: $ORG"
    exit 1
  fi

  infoln "Fetching channel config for channel $CHANNEL"
  fetchChannelConfig $ORG $CHANNEL ${CORE_PEER_LOCALMSPID}config.json

  infoln "Generating anchor peer update transaction for Org${ORG} on channel $CHANNEL"

  set -x
  # Modify the configuration to append the anchor peer
  jq '.channel_group.groups.Application.groups.'${orgmsp}'.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "'$host'","port": '$port'}]},"version": "0"}}' ${CORE_PEER_LOCALMSPID}config.json > ${CORE_PEER_LOCALMSPID}modified_config.json
  { set +x; } 2>/dev/null

  # Compute a config update, based on the differences between
  # {orgmsp}config.json and {orgmsp}modified_config.json, write
  # it as a transaction to {orgmsp}anchors.tx
  createConfigUpdate ${CHANNEL} ${CORE_PEER_LOCALMSPID}config.json ${CORE_PEER_LOCALMSPID}modified_config.json ${CORE_PEER_LOCALMSPID}anchors.tx

  infoln "Updating anchor peer for org${ORG}..."
  set -x
  peer channel update -o orderer.coffee-export.com:7050 --ordererTLSHostnameOverride orderer.coffee-export.com -c $CHANNEL -f ${CORE_PEER_LOCALMSPID}anchors.tx --tls --cafile "$ORDERER_CA" >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Anchor peer update failed"
  successln "Anchor peer set for org '$CORE_PEER_LOCALMSPID' on channel '$CHANNEL'"
}

ORG=$1
CHANNEL_NAME=$2

if [ -z "$ORG" ] || [ -z "$CHANNEL_NAME" ]; then
  errorln "Usage: setAnchorPeer.sh <org_number> <channel_name>"
  exit 1
fi

updateAnchorPeer $ORG $CHANNEL_NAME

exit 0
