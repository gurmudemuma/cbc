#!/bin/bash
# ============================================================================
# COMPREHENSIVE CHAINCODE DEPLOYMENT SCRIPT
# Handles all deployment scenarios: fresh install, upgrade, and redeploy
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}                    ECTA CHAINCODE DEPLOYMENT${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Configuration
CHANNEL_NAME="coffeechannel"
CC_NAME="ecta"
CC_VERSION="1.0"
CC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta"
CC_LANG="node"
CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# Check if chaincode is already deployed
echo -e "${YELLOW}[INFO] Checking current deployment status...${NC}"
if docker exec cli peer lifecycle chaincode querycommitted -C ${CHANNEL_NAME} -n ${CC_NAME} &>/dev/null; then
    echo -e "${YELLOW}[INFO] Chaincode is already deployed. This will be an UPGRADE.${NC}"
    DEPLOYMENT_TYPE="UPGRADE"
    
    # Get current sequence
    CURRENT_SEQ=$(docker exec cli peer lifecycle chaincode querycommitted -C ${CHANNEL_NAME} -n ${CC_NAME} 2>&1 | grep "Sequence:" | awk -F': ' '{print $2}' | tr -d ',' | tr -d ' ')
    NEW_SEQ=$((CURRENT_SEQ + 1))
    echo -e "${YELLOW}[INFO] Current Sequence: ${CURRENT_SEQ}${NC}"
    echo -e "${YELLOW}[INFO] New Sequence: ${NEW_SEQ}${NC}"
else
    echo -e "${YELLOW}[INFO] No existing chaincode found. This will be a FRESH INSTALL.${NC}"
    DEPLOYMENT_TYPE="FRESH"
    NEW_SEQ=1
fi

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}DEPLOYMENT TYPE: ${DEPLOYMENT_TYPE}${NC}"
echo -e "${BLUE}SEQUENCE: ${NEW_SEQ}${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Step 1: Clean up old chaincode containers and images
echo -e "${YELLOW}[STEP 1/9] Cleaning up old chaincode containers...${NC}"
docker ps -a --filter "name=dev-peer" --format "{{.Names}}" | while read container; do
    echo "  Removing container: $container"
    docker rm -f $container 2>/dev/null || true
done
echo -e "${GREEN}[SUCCESS] Old containers removed${NC}"
echo ""

echo -e "${YELLOW}[STEP 2/9] Removing old chaincode images...${NC}"
docker images --filter "reference=dev-peer*" --format "{{.Repository}}:{{.Tag}}" | while read image; do
    echo "  Removing image: $image"
    docker rmi -f $image 2>/dev/null || true
done
echo -e "${GREEN}[SUCCESS] Old images removed${NC}"
echo ""

# Step 2: Package chaincode
echo -e "${YELLOW}[STEP 3/9] Packaging chaincode...${NC}"
docker exec cli rm -f /opt/gopath/src/github.com/hyperledger/fabric/peer/*.tar.gz 2>/dev/null || true
docker exec cli peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ${CC_PATH} --lang ${CC_LANG} --label ${CC_NAME}_${CC_VERSION}
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Packaging failed${NC}"
    exit 1
fi
echo -e "${GREEN}[SUCCESS] Chaincode packaged${NC}"
echo ""

# Step 3: Install on all peers
echo -e "${YELLOW}[STEP 4/9] Installing chaincode on all peers...${NC}"

echo "  Installing on ECTA peer..."
docker exec -e CORE_PEER_LOCALMSPID=ECTAMSP \
    -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] ECTA installation failed${NC}"
    exit 1
fi

echo "  Installing on Bank peer..."
docker exec -e CORE_PEER_LOCALMSPID=BankMSP \
    -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz

echo "  Installing on NBE peer..."
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP \
    -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz

echo "  Installing on Customs peer..."
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP \
    -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz

echo "  Installing on Shipping peer..."
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP \
    -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz

echo -e "${GREEN}[SUCCESS] Installed on all peers${NC}"
echo ""

# Step 4: Get package ID
echo -e "${YELLOW}[STEP 5/9] Querying package ID...${NC}"
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep "${CC_NAME}_${CC_VERSION}" | awk '{print $3}' | sed 's/,$//')
if [ -z "$PACKAGE_ID" ]; then
    echo -e "${RED}[ERROR] Failed to get package ID${NC}"
    exit 1
fi
echo -e "${GREEN}[SUCCESS] Package ID: ${PACKAGE_ID}${NC}"
echo ""

# Step 5: Approve for all organizations
echo -e "${YELLOW}[STEP 6/9] Approving chaincode for all organizations...${NC}"

approve_for_org() {
    local ORG=$1
    local MSP_ID=$2
    local PEER_ADDRESS=$3
    
    echo "  Approving for ${ORG}..."
    docker exec -e CORE_PEER_LOCALMSPID=${MSP_ID} \
        -e CORE_PEER_ADDRESS=${PEER_ADDRESS} \
        -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/peers/${PEER_ADDRESS}/tls/ca.crt \
        -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp \
        cli peer lifecycle chaincode approveformyorg \
        -o orderer1.orderer.example.com:7050 \
        --ordererTLSHostnameOverride orderer1.orderer.example.com \
        --tls \
        --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
        --channelID ${CHANNEL_NAME} \
        --name ${CC_NAME} \
        --version ${CC_VERSION} \
        --package-id ${PACKAGE_ID} \
        --sequence ${NEW_SEQ}
}

approve_for_org "ecta" "ECTAMSP" "peer0.ecta.example.com:7051"
approve_for_org "bank" "BankMSP" "peer0.bank.example.com:9051"
approve_for_org "nbe" "NBEMSP" "peer0.nbe.example.com:10051"
approve_for_org "customs" "CustomsMSP" "peer0.customs.example.com:11051"
approve_for_org "shipping" "ShippingMSP" "peer0.shipping.example.com:12051"

echo -e "${GREEN}[SUCCESS] All organizations approved${NC}"
echo ""

# Step 6: Check commit readiness
echo -e "${YELLOW}[STEP 7/9] Checking commit readiness...${NC}"
docker exec cli peer lifecycle chaincode checkcommitreadiness \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${NEW_SEQ} \
    --output json
echo ""

# Step 7: Commit chaincode
echo -e "${YELLOW}[STEP 8/9] Committing chaincode definition...${NC}"
docker exec cli peer lifecycle chaincode commit \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls \
    --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${NEW_SEQ} \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --peerAddresses peer0.bank.example.com:9051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    --peerAddresses peer0.nbe.example.com:10051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Commit failed${NC}"
    exit 1
fi
echo -e "${GREEN}[SUCCESS] Chaincode committed${NC}"
echo ""

# Step 8: Verify deployment
echo -e "${YELLOW}[STEP 9/9] Verifying deployment...${NC}"
docker exec cli peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CC_NAME}
echo ""

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}                    DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo "Deployment Type: ${DEPLOYMENT_TYPE}"
echo "Chaincode: ${CC_NAME}"
echo "Version: ${CC_VERSION}"
echo "Sequence: ${NEW_SEQ}"
echo "Channel: ${CHANNEL_NAME}"
echo "Package ID: ${PACKAGE_ID}"
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}                 AVAILABLE BLOCKCHAIN FUNCTIONS (140+)${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}USER MANAGEMENT (8):${NC} RegisterUser, GetUser, UpdateUserStatus, GetUsersByRole,"
echo "  GetPendingUsers, GetUsersByStatus, InitLedger"
echo ""
echo -e "${YELLOW}EXPORTER PROFILE & PRE-REGISTRATION (11):${NC} SubmitPreRegistration,"
echo "  GetExporterProfile, UpdateExporterProfile, CheckLicenseExpiry, RenewLicense,"
echo "  RevokeLicense, SuspendExporter, ReactivateExporter, ApprovePreRegistration,"
echo "  RejectPreRegistration, SubmitPreRegistrationStage"
echo ""
echo -e "${YELLOW}EXPORT WORKFLOW (7):${NC} CreateExportRequest, GetExportRequest, UpdateExportWorkflow,"
echo "  UpdateExportContract, UpdateBankingDetails, UpdateCustomsDetails,"
echo "  UpdateShippingDetails"
echo ""
echo -e "${YELLOW}SALES CONTRACT REGISTRATION (14):${NC} CreateShipment, RegisterSalesContract,"
echo "  ValidateMinimumPrice, ApproveSalesContract, GenerateCommercialInvoice,"
echo "  UpdatePaymentDetails, VerifyPayment, UpdatePackingList, GetShipment,"
echo "  GetShipmentsByExporter, GetPendingContractApprovals,"
echo "  GetPendingPaymentVerifications, SetMinimumPrice, GetMinimumPrice, GetPriceHistory"
echo ""
echo -e "${YELLOW}CERTIFICATE ISSUANCE (11):${NC} RequestCertificate, IssueCQICAuthorization,"
echo "  IssuePhytosanitaryCertificate, IssueCertificateOfOrigin, IssueEUDRCompliance,"
echo "  IssueICOCertificate, GetCertificate, GetCertificatesByShipment,"
echo "  GetPendingCertificates, RevokeCertificate, VerifyCertificate"
echo ""
echo -e "${YELLOW}NETWORK SUBMISSION (9):${NC} FinalizeContractFromDraft,"
echo "  RegisterSalesContractWithReference, GetContractByReference, GetReferenceByDraftId,"
echo "  SubmitToNetwork, UpdateOrganizationApproval, GetApprovalStatus,"
echo "  QueryContractsByStatus, QueryContractsByExporter"
echo ""
echo -e "${GREEN}DOCUMENT ISSUANCE & AUTHENTICATION (8) - NEW FEATURE:${NC}"
echo "  • RecordDocumentIssuance: Record document issuance on blockchain"
echo "  • VerifyDocumentAuthenticity: Verify document by hash"
echo "  • RecordDocumentAuthentication: Record authentication event"
echo "  • RecordDocumentRevocation: Revoke issued document"
echo "  • GetDocument: Get document by ID"
echo "  • QueryDocumentsByExporter: Query exporter's documents"
echo "  • QueryDocumentsByIssuer: Query issuer's documents"
echo "  • QueryAuthenticationsBySubmission: Query submission authentications"
echo ""
echo "Plus: ESW (3), Quality Certificates (2), Qualification Documents (3),"
echo "  Statutory Documents (4), Contract Drafts (3), GPS Plot (4),"
echo "  Certificate Bundle (2), Customs (5), Fumigation (3), Shipping (13),"
echo "  Legal Framework (10), Query Functions (5)"
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "Next Steps:"
echo "  1. Test with: node test-workflow-from-registration.js"
echo "  2. Verify blockchain functions are accessible"
echo "  3. Check chaincode logs: docker logs dev-peer0.ecta.example.com-ecta_${CC_VERSION}"
echo ""
echo -e "${GREEN}============================================================================${NC}"
