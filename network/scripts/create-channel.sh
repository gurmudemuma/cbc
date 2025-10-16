#!/bin/bash

# Import environment variables and functions
. scripts/envVar.sh

CHANNEL_NAME="$1"
DELAY="$2"
MAX_RETRY="$3"
VERBOSE="$4"

: ${CHANNEL_NAME:="coffeechannel"}
: ${DELAY:="3"}
: ${MAX_RETRY:="5"}
: ${VERBOSE:="false"}

FABRIC_CFG_PATH=$PWD/../configtx
BLOCKFILE="./channel-artifacts/${CHANNEL_NAME}.block"

if [ ! -d "channel-artifacts" ]; then
	mkdir channel-artifacts
fi

createChannelGenesisBlock() {
	# Find configtxgen command (Windows/Linux compatible)
	CONFIGTXGEN_CMD=""
	if command -v configtxgen.exe &> /dev/null; then
		CONFIGTXGEN_CMD="configtxgen.exe"
	elif command -v configtxgen &> /dev/null; then
		CONFIGTXGEN_CMD="configtxgen"
	else
		# Try direct path as fallback
		if [ -x "${PWD}/../bin/configtxgen.exe" ]; then
			CONFIGTXGEN_CMD="${PWD}/../bin/configtxgen.exe"
		elif [ -x "${PWD}/../bin/configtxgen" ]; then
			CONFIGTXGEN_CMD="${PWD}/../bin/configtxgen"
		fi
	fi
	
	if [ -z "$CONFIGTXGEN_CMD" ]; then
		echo "configtxgen tool not found."
		exit 1
	fi
	
	echo "Using configtxgen: $CONFIGTXGEN_CMD"
	set -x
	$CONFIGTXGEN_CMD -profile CoffeeExportGenesis -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID $CHANNEL_NAME
	res=$?
	{ set +x; } 2>/dev/null
  cat log.txt
	if [ $res -ne 0 ]; then
		echo "Failed to generate channel configuration transaction..."
		exit 1
	fi
}

createChannel() {
	setGlobals 1
	
	# Run osnadmin from inside Docker CLI container where internal DNS works
	# This avoids needing to modify the Windows hosts file
	ORDERER_ADMIN_ENDPOINT="orderer.coffee-export.com:7053"
	
	echo "Connecting to orderer at: $ORDERER_ADMIN_ENDPOINT (using Docker internal DNS)"
	
	# Copy the genesis block to a location accessible by CLI container
	BLOCK_FILE="./channel-artifacts/${CHANNEL_NAME}.block"
	
	# Poll in case the raft leader is not set yet
	local rc=1
	local COUNTER=1
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
		sleep $DELAY
		set -x
		# Run osnadmin from inside the CLI container where DNS works
		# MSYS_NO_PATHCONV=1 prevents Git Bash from converting Linux paths to Windows paths
		MSYS_NO_PATHCONV=1 docker exec cli osnadmin channel join \
			--channelID $CHANNEL_NAME \
			--config-block //opt//gopath//src//github.com//hyperledger//fabric//peer//channel-artifacts//${CHANNEL_NAME}.block \
			-o $ORDERER_ADMIN_ENDPOINT \
			--ca-file //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//msp//tlscacerts//tlsca.coffee-export.com-cert.pem \
			--client-cert //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//tls//server.crt \
			--client-key //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//tls//server.key >&log.txt
		res=$?
		{ set +x; } 2>/dev/null
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	if [ $rc -ne 0 ]; then
		echo "Failed to create channel '$CHANNEL_NAME'"
		exit 1
	fi
}

# joinChannel ORG
joinChannel() {
  FABRIC_CFG_PATH=$PWD/../config/
  ORG=$1
  setGlobals $ORG
  
  # Find peer command (Windows/Linux compatible)
  PEER_CMD=""
  if command -v peer.exe &> /dev/null; then
    PEER_CMD="peer.exe"
  elif command -v peer &> /dev/null; then
    PEER_CMD="peer"
  else
    # Try direct path as fallback
    if [ -x "${PWD}/../bin/peer.exe" ]; then
      PEER_CMD="${PWD}/../bin/peer.exe"
    elif [ -x "${PWD}/../bin/peer" ]; then
      PEER_CMD="${PWD}/../bin/peer"
    fi
  fi
  
  if [ -z "$PEER_CMD" ]; then
    echo "peer tool not found."
    exit 1
  fi
  
	local rc=1
	local COUNTER=1
	## Sometimes Join takes time, hence retry
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
    sleep $DELAY
    set -x
    $PEER_CMD channel join -b $BLOCKFILE >&log.txt
    res=$?
    { set +x; } 2>/dev/null
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	if [ $res -ne 0 ]; then
		echo "Failed to join peer to channel '$CHANNEL_NAME'"
		exit 1
	fi
}

setAnchorPeer() {
  ORG=$1
  # Use MSYS_NO_PATHCONV to prevent Git Bash path conversion
  MSYS_NO_PATHCONV=1 docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && ./scripts/setAnchorPeer.sh $ORG $CHANNEL_NAME"
}

FABRIC_CFG_PATH=${PWD}/configtx

## Create channel genesis block
echo "Generating channel genesis block '${CHANNEL_NAME}.block'"
createChannelGenesisBlock

FABRIC_CFG_PATH=$PWD/../config/
BLOCKFILE="./channel-artifacts/${CHANNEL_NAME}.block"

## Create channel
echo "Creating channel ${CHANNEL_NAME}"
createChannel

## Join all the peers to the channel
echo "Joining ExporterBank peer to the channel..."
joinChannel 1
echo "Joining NationalBank peer to the channel..."
joinChannel 2
echo "Joining NCAT peer to the channel..."
joinChannel 3
echo "Joining ShippingLine peer to the channel..."
joinChannel 4

## Set the anchor peers for each org in the channel
echo "Setting anchor peer for ExporterBank..."
setAnchorPeer 1
echo "Setting anchor peer for NationalBank..."
setAnchorPeer 2
echo "Setting anchor peer for NCAT..."
setAnchorPeer 3
echo "Setting anchor peer for ShippingLine..."
setAnchorPeer 4

echo "Channel '$CHANNEL_NAME' created and peers joined successfully"
