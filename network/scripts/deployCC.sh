#!/bin/bash

source scripts/envVar.sh

# All lifecycle commands will run inside the Docker CLI container to avoid host binary issues

CHANNEL_NAME=${1:-"coffeechannel"}
CC_NAME=${2:-"coffee-export"}
# Note: inside the CLI container, the repo is mounted at /opt/gopath/src/github.com/hyperledger/fabric/peer
# and the chaincode lives under the 'chaincode/' subdirectory there. Avoid '../' prefixes.
CC_SRC_PATH=${3:-"chaincode/coffee-export"}
CC_SRC_LANGUAGE=${4:-"go"}
CC_VERSION=${5:-"1.0"}
CC_SEQUENCE=${6:-"1"}
CC_INIT_FCN=${7:-"NA"}
CC_END_POLICY=${8:-"NA"}
CC_COLL_CONFIG=${9:-"NA"}
DELAY=${10:-"3"}
MAX_RETRY=${11:-"5"}
VERBOSE=${12:-"false"}

println() {
  echo "$1"
}

errorln() {
  echo "ERROR: $1"
}

successln() {
  echo "SUCCESS: $1"
}

infoln() {
  echo "INFO: $1"
}

# Normalize chaincode source path for inside the CLI container
# Map '../chaincode/foo' or './chaincode/foo' to 'chaincode/foo'
normalize_cc_path() {
  local in="$1"
  if [[ "$in" == ../chaincode/* ]]; then
    echo "chaincode/${in#../chaincode/}"
  elif [[ "$in" == ./chaincode/* ]]; then
    echo "${in#./}"
  elif [[ "$in" == chaincode/* ]]; then
    echo "$in"
  else
    # Fallback: strip leading ../ or ./ if present
    local tmp="${in#../}"
    tmp="${tmp#./}"
    echo "$tmp"
  fi
}

# packageChaincode VERSION PEER ORG
packageChaincode() {
  local CC_SRC_PATH_DOCKER
  CC_SRC_PATH_DOCKER=$(normalize_cc_path "$CC_SRC_PATH")
  set -x
  MSYS_NO_PATHCONV=1 docker exec -e GOFLAGS=-mod=vendor -e GOPROXY=direct -e GOSUMDB=off cli bash -c "\
    cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
    peer lifecycle chaincode package ${CC_NAME}.tar.gz \
      --path ${CC_SRC_PATH_DOCKER} --lang ${CC_SRC_LANGUAGE} --label ${CC_NAME}_${CC_VERSION}" >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode packaging has failed"
  successln "Chaincode is packaged"
}

# installChaincode PEER ORG
installChaincode() {
  ORG=$1
  set -x
  MSYS_NO_PATHCONV=1 docker exec cli bash -c "\
    cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
    . ./scripts/envVar.sh && \
    setGlobalsCLI ${ORG} && \
    (peer lifecycle chaincode queryinstalled | grep -q '${CC_NAME}_${CC_VERSION}' && echo 'Chaincode already installed') || peer lifecycle chaincode install ${CC_NAME}.tar.gz" >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode installation on peer0.org${ORG} has failed"
  successln "Chaincode is installed on peer0.org${ORG}"
}

# queryInstalled PEER ORG
queryInstalled() {
  ORG=$1
  set -x
  MSYS_NO_PATHCONV=1 docker exec cli bash -c "\
    cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
    . ./scripts/envVar.sh && \
    setGlobalsCLI ${ORG} && \
    peer lifecycle chaincode queryinstalled" >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  PACKAGE_ID=$(sed -n "/${CC_NAME}_${CC_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt | tail -n 1)
  verifyResult $res "Query installed on peer0.org${ORG} has failed"
  successln "Query installed successful on peer0.org${ORG} on channel"
}

# approveForMyOrg VERSION PEER ORG
approveForMyOrg() {
  ORG=$1
  set -x
  if [ "$CC_END_POLICY" = "NA" ]; then
    MSYS_NO_PATHCONV=1 docker exec cli bash -c "\
      cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
      . ./scripts/envVar.sh && \
      setGlobalsCLI ${ORG} && \
      peer lifecycle chaincode approveformyorg \
        -o orderer.coffee-export.com:7050 --ordererTLSHostnameOverride orderer.coffee-export.com \
        --tls --cafile \$ORDERER_CA \
        --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} \
        --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}" >&log.txt
  else
    MSYS_NO_PATHCONV=1 docker exec cli bash -c "\
      cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
      . ./scripts/envVar.sh && \
      setGlobalsCLI ${ORG} && \
      peer lifecycle chaincode approveformyorg \
        -o orderer.coffee-export.com:7050 --ordererTLSHostnameOverride orderer.coffee-export.com \
        --tls --cafile \$ORDERER_CA \
        --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} \
        --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE} --signature-policy '$CC_END_POLICY'" >&log.txt
  fi
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode definition approved on peer0.org${ORG} on channel '$CHANNEL_NAME' failed"
  successln "Chaincode definition approved on peer0.org${ORG} on channel '$CHANNEL_NAME'"
}

# checkCommitReadiness VERSION PEER ORG
checkCommitReadiness() {
  ORG=$1
  shift 1
  infoln "Checking the commit readiness of the chaincode definition on peer0.org${ORG} on channel '$CHANNEL_NAME'..."
  local rc=1
  local COUNTER=1
  while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ]; do
    sleep $DELAY
    infoln "Attempting to check the commit readiness of the chaincode definition on peer0.org${ORG}, Retry after $DELAY seconds."
    set -x
    MSYS_NO_PATHCONV=1 docker exec cli bash -c "\
      cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
      . ./scripts/envVar.sh && \
      setGlobalsCLI ${ORG} && \
      peer lifecycle chaincode checkcommitreadiness \
        --channelID $CHANNEL_NAME --name ${CC_NAME} \
        --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --output json" >&log.txt
    res=$?
    { set +x; } 2>/dev/null
    let rc=0
    for var in "$@"; do
      grep "$var" log.txt &>/dev/null || let rc=1
    done
    COUNTER=$(expr $COUNTER + 1)
  done
  cat log.txt
  if test $rc -eq 0; then
    infoln "Checking the commit readiness of the chaincode definition successful on peer0.org${ORG} on channel '$CHANNEL_NAME'"
  else
    errorln "After $MAX_RETRY attempts, Check commit readiness result on peer0.org${ORG} is INVALID!"
    exit 1
  fi
}

# commitChaincodeDefinition VERSION PEER ORG (PEER ORG)...
commitChaincodeDefinition() {
  # Run commit from inside Docker CLI container where internal DNS works
  # This avoids TLS hostname override issues with multiple peers
  # Don't call parsePeerConnectionParameters - it pollutes environment with Windows paths
  infoln "Committing chaincode definition from Docker CLI container..."
  
  set -x
  fcn_call='{"function":"'${CC_INIT_FCN}'","Args":[]}'
  infoln "invoke fcn call:${fcn_call}"
  
  # Run the commit command inside the Docker CLI container
  # Use setGlobalsCLI approach - run the script from inside Docker
  if [ "$CC_END_POLICY" = "NA" ]; then
    MSYS_NO_PATHCONV=1 docker exec cli bash -c "
      cd /opt/gopath/src/github.com/hyperledger/fabric/peer &&
      . ./scripts/envVar.sh &&
      setGlobalsCLI 1 &&
      peer lifecycle chaincode commit \
        -o orderer.coffee-export.com:7050 --ordererTLSHostnameOverride orderer.coffee-export.com \
        --tls --cafile \$ORDERER_CA \
        --channelID $CHANNEL_NAME --name ${CC_NAME} \
        --peerAddresses peer0.commercialbank.coffee-export.com:7051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
        --peerAddresses peer0.nationalbank.coffee-export.com:8051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt \
        --peerAddresses peer0.ecta.coffee-export.com:9051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt \
        --peerAddresses peer0.shippingline.coffee-export.com:10051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt \
        --peerAddresses peer0.custom-authorities.coffee-export.com:11051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/peers/peer0.custom-authorities.coffee-export.com/tls/ca.crt \
        --version ${CC_VERSION} --sequence ${CC_SEQUENCE}" >&log.txt
  else
    MSYS_NO_PATHCONV=1 docker exec cli bash -c "
      cd /opt/gopath/src/github.com/hyperledger/fabric/peer &&
      . ./scripts/envVar.sh &&
      setGlobalsCLI 1 &&
      peer lifecycle chaincode commit \
        -o orderer.coffee-export.com:7050 --ordererTLSHostnameOverride orderer.coffee-export.com \
        --tls --cafile \$ORDERER_CA \
        --channelID $CHANNEL_NAME --name ${CC_NAME} \
        --peerAddresses peer0.commercialbank.coffee-export.com:7051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
        --peerAddresses peer0.nationalbank.coffee-export.com:8051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt \
        --peerAddresses peer0.ecta.coffee-export.com:9051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt \
        --peerAddresses peer0.shippingline.coffee-export.com:10051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt \
        --peerAddresses peer0.custom-authorities.coffee-export.com:11051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/peers/peer0.custom-authorities.coffee-export.com/tls/ca.crt \
        --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --signature-policy '$CC_END_POLICY'" >&log.txt
  fi

  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode definition commit failed on channel '$CHANNEL_NAME'"
  successln "Chaincode definition committed on channel '$CHANNEL_NAME'"
}

# queryCommitted ORG
queryCommitted() {
  ORG=$1
  EXPECTED_RESULT="Version: ${CC_VERSION}, Sequence: ${CC_SEQUENCE}, Endorsement Plugin: escc, Validation Plugin: vscc"
  infoln "Querying chaincode definition on peer0.org${ORG} on channel '$CHANNEL_NAME'..."
  local rc=1
  local COUNTER=1
  # continue to poll
  # we either get a successful response, or reach MAX RETRY
  while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ]; do
    sleep $DELAY
    infoln "Attempting to Query committed status on peer0.org${ORG}, Retry after $DELAY seconds."
    set -x
    MSYS_NO_PATHCONV=1 docker exec cli bash -c "\
      cd /opt/gopath/src/github.com/hyperledger/fabric/peer && \
      . ./scripts/envVar.sh && \
      setGlobalsCLI ${ORG} && \
      peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CC_NAME}" >&log.txt
    res=$?
    { set +x; } 2>/dev/null
    test $res -eq 0 && VALUE=$(cat log.txt | grep -o '^Version: '$CC_VERSION', Sequence: [0-9]*, Endorsement Plugin: escc, Validation Plugin: vscc')
    test "$VALUE" = "$EXPECTED_RESULT" && let rc=0
    COUNTER=$(expr $COUNTER + 1)
  done
  cat log.txt
  if test $rc -eq 0; then
    successln "Query chaincode definition successful on peer0.org${ORG} on channel '$CHANNEL_NAME'"
  else
    errorln "After $MAX_RETRY attempts, Query chaincode definition result on peer0.org${ORG} is INVALID!"
    exit 1
  fi
}

chaincodeInvokeInit() {
  # Run init from inside Docker CLI container where internal DNS works
  # Don't call parsePeerConnectionParameters - it pollutes environment with Windows paths
  infoln "Invoking chaincode init from Docker CLI container..."
  
  set -x
  fcn_call='{"function":"'${CC_INIT_FCN}'","Args":[]}'
  infoln "invoke fcn call:${fcn_call}"
  
  # Run the init invoke inside the Docker CLI container
  MSYS_NO_PATHCONV=1 docker exec cli bash -c "
    cd /opt/gopath/src/github.com/hyperledger/fabric/peer &&
    . ./scripts/envVar.sh &&
    setGlobalsCLI 1 &&
    peer chaincode invoke \
      -o orderer.coffee-export.com:7050 --ordererTLSHostnameOverride orderer.coffee-export.com \
      --tls --cafile \$ORDERER_CA \
      -C $CHANNEL_NAME -n ${CC_NAME} \
      --peerAddresses peer0.commercialbank.coffee-export.com:7051 \
      --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
      --peerAddresses peer0.nationalbank.coffee-export.com:8051 \
      --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt \
      --peerAddresses peer0.ecta.coffee-export.com:9051 \
      --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt \
      --peerAddresses peer0.shippingline.coffee-export.com:10051 \
      --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt \
      --peerAddresses peer0.custom-authorities.coffee-export.com:11051 \
      --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/peers/peer0.custom-authorities.coffee-export.com/tls/ca.crt \
      --isInit -c '$fcn_call'" >&log.txt
    
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Invoke execution failed"
  successln "Invoke transaction successful on channel '$CHANNEL_NAME'"
}

chaincodeQuery() {
  ORG=$1
  setGlobals $ORG
  infoln "Querying on peer0.org${ORG} on channel '$CHANNEL_NAME'..."
  local rc=1
  local COUNTER=1
  # continue to poll
  # we either get a successful response, or reach MAX RETRY
  while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ]; do
    sleep $DELAY
    infoln "Attempting to Query peer0.org${ORG}, Retry after $DELAY seconds."
    set -x
    peer chaincode query -C $CHANNEL_NAME -n ${CC_NAME} -c '{"Args":["queryAllExports"]}' >&log.txt
    res=$?
    { set +x; } 2>/dev/null
    let rc=$res
    COUNTER=$(expr $COUNTER + 1)
  done
  cat log.txt
  if test $rc -eq 0; then
    successln "Query successful on peer0.org${ORG} on channel '$CHANNEL_NAME'"
  else
    errorln "After $MAX_RETRY attempts, Query result on peer0.org${ORG} is INVALID!"
    exit 1
  fi
}

## Package the chaincode (run inside CLI container)
packageChaincode

## Install chaincode on all organizations
infoln "Installing chaincode on peer0.commercialbank..."
installChaincode 1
infoln "Install chaincode on peer0.nationalbank..."
installChaincode 2
infoln "Install chaincode on peer0.ecta..."
installChaincode 3
infoln "Install chaincode on peer0.shippingline..."
installChaincode 4
infoln "Install chaincode on peer0.customauthorities..."
installChaincode 5

## query whether the chaincode is installed
queryInstalled 1

## approve the definition for org1
infoln "Approving chaincode definition for commercialbank..."
approveForMyOrg 1

## check whether the chaincode definition is ready to be committed
## expect org1 to have approved and others not to
checkCommitReadiness 1 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": false" "\"ECTAMSP\": false" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 2 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": false" "\"ECTAMSP\": false" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 3 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": false" "\"ECTAMSP\": false" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 4 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": false" "\"ECTAMSP\": false" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 5 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": false" "\"ECTAMSP\": false" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"

## now approve also for org2
infoln "Approving chaincode definition for NationalBank..."
approveForMyOrg 2

## check whether the chaincode definition is ready to be committed
checkCommitReadiness 1 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": false" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 2 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": false" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 3 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": false" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 4 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": false" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 5 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": false" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"

## now approve for org3
infoln "Approving chaincode definition for ECTA..."
approveForMyOrg 3

## check whether the chaincode definition is ready to be committed
checkCommitReadiness 1 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 2 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 3 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 4 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 5 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": false" "\"CustomAuthoritiesMSP\": false"

## now approve for org4
infoln "Approving chaincode definition for ShippingLine..."
approveForMyOrg 4

## check whether the chaincode definition is ready to be committed
checkCommitReadiness 1 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": true" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 2 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": true" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 3 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": true" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 4 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": true" "\"CustomAuthoritiesMSP\": false"
checkCommitReadiness 5 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": true" "\"CustomAuthoritiesMSP\": false"

## now approve for org5
infoln "Approving chaincode definition for CustomAuthorities..."
approveForMyOrg 5

## check whether the chaincode definition is ready to be committed
## expect all orgs to have approved
checkCommitReadiness 1 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": true" "\"CustomAuthoritiesMSP\": true"
checkCommitReadiness 2 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": true" "\"CustomAuthoritiesMSP\": true"
checkCommitReadiness 3 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": true" "\"CustomAuthoritiesMSP\": true"
checkCommitReadiness 4 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": true" "\"CustomAuthoritiesMSP\": true"
checkCommitReadiness 5 "\"CommercialBankMSP\": true" "\"NationalBankMSP\": true" "\"ECTAMSP\": true" "\"ShippingLineMSP\": true" "\"CustomAuthoritiesMSP\": true"

## now that we know for sure all orgs have approved, commit the definition
infoln "Committing chaincode definition to channel '$CHANNEL_NAME'..."
commitChaincodeDefinition 1 2 3 4 5

## query on all orgs to see that the definition committed successfully
queryCommitted 1
queryCommitted 2
queryCommitted 3
queryCommitted 4
queryCommitted 5

## Invoke the chaincode - this does require that the chaincode have the 'initLedger'
## method defined
if [ "$CC_INIT_FCN" = "NA" ]; then
  infoln "Chaincode initialization is not required"
else
  chaincodeInvokeInit 1 2 3 4 5
fi

exit 0
