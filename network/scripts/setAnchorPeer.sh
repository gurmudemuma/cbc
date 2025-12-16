#!/bin/bash

# Resolve script directory and source env vars with absolute path
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# Ensure Fabric binaries in PATH and configuration path set
export PATH=${SCRIPT_DIR}/../../bin:$PATH
export FABRIC_CFG_PATH=${SCRIPT_DIR}/../../config
source ${SCRIPT_DIR}/envVar.sh

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
  MAX_RETRIES=3
  RETRY_COUNT=0

  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    set -x
    configtxlator proto_encode --input "${ORIGINAL}" --type common.Config --output original_config.pb 2>&1
    ENCODE1_RESULT=$?
    { set +x; } 2>/dev/null

    if [ $ENCODE1_RESULT -ne 0 ]; then
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        errorln "configtxlator proto_encode failed (attempt $RETRY_COUNT/$MAX_RETRIES), retrying..."
        sleep 2
        continue
      else
        errorln "configtxlator proto_encode failed after $MAX_RETRIES attempts"
        return 1
      fi
    fi

    set -x
    configtxlator proto_encode --input "${MODIFIED}" --type common.Config --output modified_config.pb 2>&1
    ENCODE2_RESULT=$?
    { set +x; } 2>/dev/null

    if [ $ENCODE2_RESULT -ne 0 ]; then
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        errorln "configtxlator proto_encode (modified) failed (attempt $RETRY_COUNT/$MAX_RETRIES), retrying..."
        sleep 2
        continue
      else
        errorln "configtxlator proto_encode (modified) failed after $MAX_RETRIES attempts"
        return 1
      fi
    fi

    set -x
    configtxlator compute_update --channel_id "${CHANNEL}" --original original_config.pb --updated modified_config.pb --output config_update.pb 2>&1
    COMPUTE_RESULT=$?
    { set +x; } 2>/dev/null

    if [ $COMPUTE_RESULT -ne 0 ]; then
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        errorln "configtxlator compute_update failed (attempt $RETRY_COUNT/$MAX_RETRIES), retrying..."
        sleep 2
        continue
      else
        errorln "configtxlator compute_update failed after $MAX_RETRIES attempts"
        return 1
      fi
    fi

    set -x
    configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json 2>&1
    DECODE_RESULT=$?
    { set +x; } 2>/dev/null

    if [ $DECODE_RESULT -ne 0 ]; then
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        errorln "configtxlator proto_decode failed (attempt $RETRY_COUNT/$MAX_RETRIES), retrying..."
        sleep 2
        continue
      else
        errorln "configtxlator proto_decode failed after $MAX_RETRIES attempts"
        return 1
      fi
    fi

    set -x
    jq --arg channel "$CHANNEL" '{payload: {header: {channel_header: {channel_id: $channel, type: 2}}, data: {config_update: .}}}' config_update.json > config_update_in_envelope.json
    configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output "${OUTPUT}" 2>&1
    FINAL_ENCODE_RESULT=$?
    { set +x; } 2>/dev/null

    if [ $FINAL_ENCODE_RESULT -ne 0 ]; then
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        errorln "configtxlator proto_encode (envelope) failed (attempt $RETRY_COUNT/$MAX_RETRIES), retrying..."
        sleep 2
        continue
      else
        errorln "configtxlator proto_encode (envelope) failed after $MAX_RETRIES attempts"
        return 1
      fi
    fi

    # All operations succeeded
    return 0
  done

  return 1
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
    orgmsp="CommercialBankMSP"
    host="peer0.commercialbank.coffee-export.com"
    port=7051
  elif [ $ORG -eq 2 ]; then
    orgmsp="NationalBankMSP"
    host="peer0.nationalbank.coffee-export.com"
    port=8051
  elif [ $ORG -eq 3 ]; then
    orgmsp="ECTAMSP"
    host="peer0.ecta.coffee-export.com"
    port=9051
  elif [ $ORG -eq 4 ]; then
    orgmsp="ShippingLineMSP"
    host="peer0.shippingline.coffee-export.com"
    port=10051
  elif [ $ORG -eq 5 ]; then
    orgmsp="CustomAuthoritiesMSP"
    host="peer0.custom-authorities.coffee-export.com"
    port=11051
  else
    errorln "Unknown organization: $ORG"
    exit 1
  fi

  infoln "Fetching channel config for channel $CHANNEL"
  fetchChannelConfig $ORG $CHANNEL ${orgmsp}config.json

  infoln "Generating anchor peer update transaction for Org${ORG} on channel $CHANNEL"

  # Check if AnchorPeers already exists
  if jq -e '.channel_group.groups.Application.groups.'${orgmsp}'.values.AnchorPeers' ${orgmsp}config.json >/dev/null 2>&1; then
    infoln "AnchorPeers already set for ${orgmsp}, skipping update"
    successln "Anchor peer already configured for org '$orgmsp' on channel '$CHANNEL'"
    return 0
  fi

  set -x
  # Modify the configuration to add the anchor peer
  # Note: version should be 0 for new anchor peers (not incremented)
  jq '.channel_group.groups.Application.groups.'${orgmsp}'.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "'$host'","port": '$port'}]},"version": 0}}' ${orgmsp}config.json > ${orgmsp}modified_config.json
  { set +x; } 2>/dev/null

  # Compute a config update, based on the differences between
  # {orgmsp}config.json and {orgmsp}modified_config.json, write
  # it as a transaction to {orgmsp}anchors.tx
  createConfigUpdate ${CHANNEL} ${orgmsp}config.json ${orgmsp}modified_config.json ${orgmsp}anchors.tx

  # Sign the config update with the target org's Admin (mod_policy: Admins of the org)
  setGlobals $ORG
  peer channel signconfigtx -f ${orgmsp}anchors.tx

  # Submit the update from the same org
  setGlobals $ORG
  infoln "Updating anchor peer for org${ORG}..."
  set -x
  peer channel update -o orderer.coffee-export.com:7050 --ordererTLSHostnameOverride orderer.coffee-export.com -c $CHANNEL -f ${orgmsp}anchors.tx --tls --cafile "$ORDERER_CA" >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Anchor peer update failed"
  successln "Anchor peer set for org '$orgmsp' on channel '$CHANNEL'"
}

ORG=$1
CHANNEL_NAME=$2

if [ -z "$ORG" ] || [ -z "$CHANNEL_NAME" ]; then
  errorln "Usage: setAnchorPeer.sh <org_number> <channel_name>"
  exit 1
fi

updateAnchorPeer $ORG $CHANNEL_NAME

exit 0
