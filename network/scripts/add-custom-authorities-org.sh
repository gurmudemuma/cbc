#!/bin/bash

# Get the directory of this script
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Set PATH to include binaries
export PATH=${SCRIPT_DIR}/../../bin:$PATH

CHANNEL_NAME="coffeechannel"
ORG_NAME="CustomAuthorities"
ORG_MSP="CustomAuthoritiesMSP"
ORDERER_CA=${SCRIPT_DIR}/../organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem
BLOCK_FILE=${SCRIPT_DIR}/../channel-artifacts/${CHANNEL_NAME}.block

# Set FABRIC_CFG_PATH for configtxgen (directory containing configtx.yaml)
export FABRIC_CFG_PATH=${SCRIPT_DIR}/../configtx

# Generate the org config json
configtxgen -printOrg ${ORG_MSP} > ${SCRIPT_DIR}/${ORG_NAME}config.json

# Set FABRIC_CFG_PATH for peer commands (directory containing core.yaml)
export FABRIC_CFG_PATH=${SCRIPT_DIR}/../../config
source ${SCRIPT_DIR}/envVar.sh
setGlobals 1

# Fetch latest config
set -x
peer channel fetch config ${SCRIPT_DIR}/config_block.pb -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "${ORDERER_CA}" -c ${CHANNEL_NAME}
{ set +x; } 2>/dev/null

# Decode to json
configtxlator proto_decode --input ${SCRIPT_DIR}/config_block.pb --type common.Block | jq .data.data[0].payload.data.config > ${SCRIPT_DIR}/config.json

# Check if the org already exists in the channel config
if jq -e '.channel_group.groups.Application.groups | has("'${ORG_MSP}'")' ${SCRIPT_DIR}/config.json >/dev/null; then
  echo "${ORG_MSP} already exists in channel ${CHANNEL_NAME}; skipping channel config update."
  SKIP_UPDATE=1
else
  SKIP_UPDATE=0
fi

if [ "$SKIP_UPDATE" -eq 0 ]; then
  # Add the new org with mod_policy and ensure values have proper policies
  jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"'${ORG_MSP}'": (. [1] + {"mod_policy": "Admins"})}}}}}' ${SCRIPT_DIR}/config.json ${SCRIPT_DIR}/${ORG_NAME}config.json \
    | jq '.channel_group.groups.Application.groups.'${ORG_MSP}'.policies.Admins.mod_policy = "Admins" | .channel_group.groups.Application.groups.'${ORG_MSP}'.policies.Readers.mod_policy = "Admins" | .channel_group.groups.Application.groups.'${ORG_MSP}'.policies.Writers.mod_policy = "Admins" | .channel_group.groups.Application.groups.'${ORG_MSP}'.policies.Endorsement.mod_policy = "Admins"' \
    > ${SCRIPT_DIR}/modified_config.json

  # Encode back
  configtxlator proto_encode --input ${SCRIPT_DIR}/config.json --type common.Config --output ${SCRIPT_DIR}/config.pb
  configtxlator proto_encode --input ${SCRIPT_DIR}/modified_config.json --type common.Config --output ${SCRIPT_DIR}/modified_config.pb

  # Compute update (handle "no differences" gracefully)
  if ! configtxlator compute_update --channel_id ${CHANNEL_NAME} --original ${SCRIPT_DIR}/config.pb --updated ${SCRIPT_DIR}/modified_config.pb --output ${SCRIPT_DIR}/update.pb; then
    echo "No differences detected or compute_update failed; skipping channel update."
    SKIP_UPDATE=1
  else
    # Decode update
    configtxlator proto_decode --input ${SCRIPT_DIR}/update.pb --type common.ConfigUpdate | jq . > ${SCRIPT_DIR}/update.json

    # Wrap in envelope
    echo '{"payload":{"header":{"channel_header":{"channel_id":"'${CHANNEL_NAME}'", "type":2}},"data":{"config_update":'$(cat ${SCRIPT_DIR}/update.json)'}}}' | jq . > ${SCRIPT_DIR}/update_in_envelope.json

    configtxlator proto_encode --input ${SCRIPT_DIR}/update_in_envelope.json --type common.Envelope --output ${SCRIPT_DIR}/update_in_envelope.pb

    # Source envVar.sh using absolute path
    source ${SCRIPT_DIR}/envVar.sh

    # Collect signatures from majority existing orgs (ExporterBank, NationalBank, NCAT)
    setGlobals 1
    peer channel signconfigtx -f ${SCRIPT_DIR}/update_in_envelope.pb

    setGlobals 2
    peer channel signconfigtx -f ${SCRIPT_DIR}/update_in_envelope.pb

    setGlobals 3
    peer channel signconfigtx -f ${SCRIPT_DIR}/update_in_envelope.pb

    # Submit the update from ExporterBank
    setGlobals 1
    peer channel update -f ${SCRIPT_DIR}/update_in_envelope.pb -c ${CHANNEL_NAME} -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "${ORDERER_CA}"
  fi
fi

# Join the peer to the channel (regardless of whether update was needed)
setGlobals 5
peer channel join -b ${BLOCK_FILE}

# Set the anchor peer
${SCRIPT_DIR}/setAnchorPeer.sh 5 ${CHANNEL_NAME}

echo "Custom Authorities org added (or already present), peer joined, and anchor set!"
