#!/bin/bash

# Generate connection profiles for all organizations

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local ORG=$1
    local ORGMSP=$2
    local DOMAIN=$3
    local P0PORT=$4
    local CAPORT=$5
    local PEERPEM=$SCRIPT_DIR/peerOrganizations/${DOMAIN}/tlsca/tlsca.${DOMAIN}-cert.pem
    local CAPEM=$SCRIPT_DIR/peerOrganizations/${DOMAIN}/ca/ca.${DOMAIN}-cert.pem

    sed -e "s/\${ORG}/$ORG/" \
        -e "s/\${ORGMSP}/$ORGMSP/" \
        -e "s/\${DOMAIN}/$DOMAIN/" \
        -e "s/\${P0PORT}/$P0PORT/" \
        -e "s/\${CAPORT}/$CAPORT/" \
        -e "s#\${PEERPEM}#$PEERPEM#" \
        -e "s#\${CAPEM}#$CAPEM#" \
        $SCRIPT_DIR/ccp-template.json
}

function yaml_ccp {
    local ORG=$1
    local ORGMSP=$2
    local DOMAIN=$3
    local P0PORT=$4
    local CAPORT=$5
    local PEERPEM=$SCRIPT_DIR/peerOrganizations/${DOMAIN}/tlsca/tlsca.${DOMAIN}-cert.pem
    local CAPEM=$SCRIPT_DIR/peerOrganizations/${DOMAIN}/ca/ca.${DOMAIN}-cert.pem

    sed -e "s/\${ORG}/$ORG/" \
        -e "s/\${ORGMSP}/$ORGMSP/" \
        -e "s/\${DOMAIN}/$DOMAIN/" \
        -e "s/\${P0PORT}/$P0PORT/" \
        -e "s/\${CAPORT}/$CAPORT/" \
        -e "s#\${PEERPEM}#$PEERPEM#" \
        -e "s#\${CAPEM}#$CAPEM#" \
        $SCRIPT_DIR/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

# Generate connection profiles for CommercialBank
ORG=CommercialBank
ORGMSP=CommercialBankMSP
DOMAIN=commercialbank.coffee-export.com
P0PORT=7051
CAPORT=7054

echo "Generating connection profile for ${ORG}..."
json_ccp $ORG $ORGMSP $DOMAIN $P0PORT $CAPORT > $SCRIPT_DIR/peerOrganizations/${DOMAIN}/connection-${ORG,,}.json
yaml_ccp $ORG $ORGMSP $DOMAIN $P0PORT $CAPORT > $SCRIPT_DIR/peerOrganizations/${DOMAIN}/connection-${ORG,,}.yaml

# Generate connection profiles for NationalBank
ORG=NationalBank
ORGMSP=NationalBankMSP
DOMAIN=nationalbank.coffee-export.com
P0PORT=8051
CAPORT=8054

echo "Generating connection profile for ${ORG}..."
json_ccp $ORG $ORGMSP $DOMAIN $P0PORT $CAPORT > $SCRIPT_DIR/peerOrganizations/${DOMAIN}/connection-${ORG,,}.json
yaml_ccp $ORG $ORGMSP $DOMAIN $P0PORT $CAPORT > $SCRIPT_DIR/peerOrganizations/${DOMAIN}/connection-${ORG,,}.yaml

# Generate connection profiles for ECTA
ORG=ECTA
ORGMSP=ECTAMSP
DOMAIN=ecta.coffee-export.com
P0PORT=9051
CAPORT=9054

echo "Generating connection profile for ${ORG}..."
json_ccp $ORG $ORGMSP $DOMAIN $P0PORT $CAPORT > $SCRIPT_DIR/peerOrganizations/${DOMAIN}/connection-${ORG,,}.json
yaml_ccp $ORG $ORGMSP $DOMAIN $P0PORT $CAPORT > $SCRIPT_DIR/peerOrganizations/${DOMAIN}/connection-${ORG,,}.yaml

# Generate connection profiles for ShippingLine
ORG=ShippingLine
ORGMSP=ShippingLineMSP
DOMAIN=shippingline.coffee-export.com
P0PORT=10051
CAPORT=10054

echo "Generating connection profile for ${ORG}..."
json_ccp $ORG $ORGMSP $DOMAIN $P0PORT $CAPORT > $SCRIPT_DIR/peerOrganizations/${DOMAIN}/connection-${ORG,,}.json
yaml_ccp $ORG $ORGMSP $DOMAIN $P0PORT $CAPORT > $SCRIPT_DIR/peerOrganizations/${DOMAIN}/connection-${ORG,,}.yaml

# Generate connection profiles for CustomAuthorities
ORG=CustomAuthorities
ORGMSP=CustomAuthoritiesMSP
DOMAIN=customauthorities.coffee-export.com
P0PORT=11051
CAPORT=11054

echo "Generating connection profile for ${ORG}..."
json_ccp $ORG $ORGMSP $DOMAIN $P0PORT $CAPORT > $SCRIPT_DIR/peerOrganizations/${DOMAIN}/connection-${ORG,,}.json
yaml_ccp $ORG $ORGMSP $DOMAIN $P0PORT $CAPORT > $SCRIPT_DIR/peerOrganizations/${DOMAIN}/connection-${ORG,,}.yaml

echo "Connection profiles generated successfully!"
