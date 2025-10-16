#!/bin/bash

# Network management script for Coffee Export Consortium Blockchain

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/configtx
export VERBOSE=false

# Print the usage message
function printHelp() {
  echo "Usage: "
  echo "  network.sh <Mode> [Flags]"
  echo "    Modes:"
  echo "      up - Bring up Fabric network with docker-compose"
  echo "      down - Clear the network with docker-compose down"
  echo "      restart - Restart the network"
  echo "      createChannel - Create and join a channel"
  echo "      deployCC - Deploy chaincode"
  echo ""
  echo "    Flags:"
  echo "    -c <channel name> - Channel name to use (defaults to 'coffeechannel')"
  echo "    -ccn <chaincode name> - Chaincode name (defaults to 'coffee-export')"
  echo "    -ccp <chaincode path> - Path to the chaincode (defaults to '../chaincode/coffee-export/')"
  echo "    -ccl <language> - Programming language of the chaincode (defaults to 'golang')"
  echo "    -ccv <version> - Chaincode version (defaults to '1.0')"
  echo "    -ccs <sequence> - Chaincode definition sequence (defaults to '1')"
  echo "    -verbose - Verbose mode"
  echo ""
  echo "  network.sh -h (print this message)"
}

# Obtain CONTAINER_IDS and remove them
function clearContainers() {
  CONTAINER_IDS=$(docker ps -a | awk '($2 ~ /hyperledger/) {print $1}')
  if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" == " " ]; then
    echo "---- No containers available for deletion ----"
  else
    docker rm -f $CONTAINER_IDS
  fi
}

# Delete any images that were generated as a part of this setup
function removeUnwantedImages() {
  DOCKER_IMAGE_IDS=$(docker images | awk '($1 ~ /dev-peer.*/) {print $3}')
  if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" == " " ]; then
    echo "---- No images available for deletion ----"
  else
    docker rmi -f $DOCKER_IMAGE_IDS
  fi
}

# Versions of fabric known not to work with the test network
NONWORKING_VERSIONS="^1\.0\. ^1\.1\. ^1\.2\. ^1\.3\. ^1\.4\."

# Do some basic sanity checking to make sure that the appropriate versions of fabric
# binaries/images are available
function checkPrereqs() {
  ## Check if peer binary is accessible (from PATH or direct path)
  PEER_WORKS=1
  PEER_CMD=""
  
  # Try to find peer command
  if command -v peer.exe &> /dev/null; then
    PEER_CMD="peer.exe"
    peer.exe version > /dev/null 2>&1
    PEER_WORKS=$?
  elif command -v peer &> /dev/null; then
    PEER_CMD="peer"
    peer version > /dev/null 2>&1
    PEER_WORKS=$?
  else
    # Try direct paths as fallback
    BIN_DIR="${PWD}/../bin"
    if [ -x "$BIN_DIR/peer.exe" ]; then
      PEER_CMD="$BIN_DIR/peer.exe"
      "$PEER_CMD" version > /dev/null 2>&1
      PEER_WORKS=$?
    elif [ -x "$BIN_DIR/peer" ]; then
      PEER_CMD="$BIN_DIR/peer"
      "$PEER_CMD" version > /dev/null 2>&1
      PEER_WORKS=$?
    fi
  fi

  if [[ $PEER_WORKS -ne 0 || ! -d "../config" ]]; then
    echo "ERROR! Peer binary and configuration files not found.."
    echo
    echo "Follow the instructions in the Fabric docs to install the Fabric Binaries:"
    echo "https://hyperledger-fabric.readthedocs.io/en/latest/install.html"
    echo ""
    echo "Debug info:"
    echo "  PWD: ${PWD}"
    echo "  PATH: $PATH"
    echo "  peer.exe in PATH: $(command -v peer.exe || echo 'not found')"
    echo "  peer in PATH: $(command -v peer || echo 'not found')"
    echo "  config exists: $([ -d '../config' ] && echo 'yes' || echo 'no')"
    if [ -d "${PWD}/../bin" ]; then
      echo "  Binaries in ../bin:"
      ls "${PWD}/../bin/" | grep -E "(peer|cryptogen|orderer)" | head -10
    fi
    exit 1
  fi
  
  echo "Using peer command: $PEER_CMD"

  # use the fabric tools container to see if the samples and binaries match your
  # docker images
  LOCAL_VERSION=$($PEER_CMD version 2>&1 | sed -ne 's/ Version: //p')
  DOCKER_IMAGE_VERSION=$(docker run --rm hyperledger/fabric-tools:latest peer version 2>&1 | sed -ne 's/ Version: //p' | head -1)

  echo "LOCAL_VERSION=$LOCAL_VERSION"
  echo "DOCKER_IMAGE_VERSION=$DOCKER_IMAGE_VERSION"

  if [ "$LOCAL_VERSION" != "$DOCKER_IMAGE_VERSION" ]; then
    echo "=================== WARNING ==================="
    echo "  Local fabric binaries and docker images are  "
    echo "  out of  sync. This may cause problems.       "
    echo "==============================================="
  fi

  for UNSUPPORTED_VERSION in $NONWORKING_VERSIONS; do
    echo "$LOCAL_VERSION" | grep -q $UNSUPPORTED_VERSION
    if [ $? -eq 0 ]; then
      echo "ERROR! Local Fabric binary version of $LOCAL_VERSION does not match the versions supported by the test network."
      exit 1
    fi

    echo "$DOCKER_IMAGE_VERSION" | grep -q $UNSUPPORTED_VERSION
    if [ $? -eq 0 ]; then
      echo "ERROR! Fabric Docker image version of $DOCKER_IMAGE_VERSION does not match the versions supported by the test network."
      exit 1
    fi
  done
}

# Before you can bring up a network, each organization needs to generate the crypto
# material that will define that organization on the network
function createOrgs() {
  echo "Generating certificates using cryptogen tool"
  
  if [ -d "organizations/peerOrganizations" ]; then
    rm -Rf organizations/peerOrganizations && rm -Rf organizations/ordererOrganizations
  fi

  # Create crypto material using cryptogen
  # Check for cryptogen binary (from PATH or direct path)
  CRYPTOGEN_CMD=""
  
  if command -v cryptogen.exe &> /dev/null; then
    CRYPTOGEN_CMD="cryptogen.exe"
  elif command -v cryptogen &> /dev/null; then
    CRYPTOGEN_CMD="cryptogen"
  else
    # Try direct paths as fallback
    BIN_DIR="${PWD}/../bin"
    if [ -x "$BIN_DIR/cryptogen.exe" ]; then
      CRYPTOGEN_CMD="$BIN_DIR/cryptogen.exe"
    elif [ -x "$BIN_DIR/cryptogen" ]; then
      CRYPTOGEN_CMD="$BIN_DIR/cryptogen"
    fi
  fi
  
  if [ -z "$CRYPTOGEN_CMD" ]; then
    echo "cryptogen tool not found. exiting"
    exit 1
  fi
  
  echo "Using cryptogen command: $CRYPTOGEN_CMD"
  
  echo "##########################################################"
  echo "##### Generate certificates using cryptogen tool #########"
  echo "##########################################################"

  echo "Creating Exporter Bank Identities"
  "$CRYPTOGEN_CMD" generate --config=./organizations/cryptogen/crypto-config-exporterbank.yaml --output="organizations"

  echo "Creating National Bank Identities"
  "$CRYPTOGEN_CMD" generate --config=./organizations/cryptogen/crypto-config-nationalbank.yaml --output="organizations"

  echo "Creating NCAT Identities"
  "$CRYPTOGEN_CMD" generate --config=./organizations/cryptogen/crypto-config-ncat.yaml --output="organizations"

  echo "Creating Shipping Line Identities"
  "$CRYPTOGEN_CMD" generate --config=./organizations/cryptogen/crypto-config-shippingline.yaml --output="organizations"

  echo "Creating Orderer Org Identities"
  "$CRYPTOGEN_CMD" generate --config=./organizations/cryptogen/crypto-config-orderer.yaml --output="organizations"

  echo "Generating CCP files for organizations"
  ./organizations/ccp-generate.sh
}

# Bring up the peer and orderer nodes using docker compose
function networkUp() {
  checkPrereqs
  
  # generate artifacts if they don't exist
  if [ ! -d "organizations/peerOrganizations" ]; then
    createOrgs
  fi

  COMPOSE_FILES="-f ${PWD}/docker/docker-compose.yaml"
  
  IMAGE_TAG=latest docker-compose ${COMPOSE_FILES} up -d 2>&1

  docker ps -a
  if [ $? -ne 0 ]; then
    echo "ERROR !!!! Unable to start network"
    exit 1
  fi
}

# Tear down running network
function networkDown() {
  COMPOSE_FILES="-f ${PWD}/docker/docker-compose.yaml"
  
  docker-compose ${COMPOSE_FILES} down --volumes --remove-orphans
  
  # Bring down the network, deleting the volumes
  # Delete any ledger backups
  docker run --rm -v $(pwd):/data busybox sh -c 'cd /data && rm -rf organizations/peerOrganizations organizations/ordererOrganizations'
  
  # remove orderer block and other channel configuration transactions and certs
  docker run --rm -v $(pwd):/data busybox sh -c 'cd /data && rm -rf channel-artifacts/*.block channel-artifacts/*.tx'
  
  # remove channel and script artifacts
  docker run --rm -v $(pwd):/data busybox sh -c 'cd /data && rm -rf channel-artifacts'
  
  clearContainers
  removeUnwantedImages
}

# Using crpto vs CA. default is cryptogen
CRYPTO="cryptogen"
# timeout duration - the duration the CLI should wait for a response from
# another container before giving up
MAX_RETRY=5
# default for delay between commands
CLI_DELAY=3
# channel name defaults to "coffeechannel"
CHANNEL_NAME="coffeechannel"
# chaincode name defaults to "coffee-export"
CC_NAME="coffee-export"
# chaincode path
CC_SRC_PATH="../chaincode/coffee-export/"
# chaincode language
CC_RUNTIME_LANGUAGE="golang"
# Chaincode version
CC_VERSION="1.0"
# Chaincode definition sequence
CC_SEQUENCE=1

# Parse commandline args

## Parse mode
if [[ $# -lt 1 ]] ; then
  printHelp
  exit 0
else
  MODE=$1
  shift
fi

# parse flags

while [[ $# -ge 1 ]] ; do
  key="$1"
  case $key in
  -h )
    printHelp
    exit 0
    ;;
  -c )
    CHANNEL_NAME="$2"
    shift
    ;;
  -ccn )
    CC_NAME="$2"
    shift
    ;;
  -ccp )
    CC_SRC_PATH="$2"
    shift
    ;;
  -ccl )
    CC_RUNTIME_LANGUAGE="$2"
    shift
    ;;
  -ccv )
    CC_VERSION="$2"
    shift
    ;;
  -ccs )
    CC_SEQUENCE="$2"
    shift
    ;;
  -verbose )
    VERBOSE=true
    ;;
  * )
    echo "Unknown flag: $key"
    printHelp
    exit 1
    ;;
  esac
  shift
done

# Determine mode of operation and printing out what we asked for
if [ "$MODE" == "up" ]; then
  echo "Starting network"
  networkUp
elif [ "$MODE" == "createChannel" ]; then
  echo "Creating channel '${CHANNEL_NAME}'."
  ./scripts/create-channel.sh $CHANNEL_NAME $CLI_DELAY $MAX_RETRY $VERBOSE
elif [ "$MODE" == "down" ]; then
  echo "Stopping network"
  networkDown
elif [ "$MODE" == "restart" ]; then
  echo "Restarting network"
  networkDown
  networkUp
elif [ "$MODE" == "deployCC" ]; then
  echo "Deploying chaincode"
  # Normalize language parameter (go -> golang)
  if [ "$CC_RUNTIME_LANGUAGE" == "go" ]; then
    CC_RUNTIME_LANGUAGE="golang"
  fi
  export FABRIC_CFG_PATH=$PWD/../config/
  ./scripts/deployCC.sh $CHANNEL_NAME $CC_NAME $CC_SRC_PATH $CC_RUNTIME_LANGUAGE $CC_VERSION $CC_SEQUENCE
else
  printHelp
  exit 1
fi
