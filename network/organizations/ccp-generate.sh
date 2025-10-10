#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${ORGMSP}/$2/" \
        -e "s/\${P0PORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.json
}

function yaml_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${ORGMSP}/$2/" \
        -e "s/\${P0PORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

# ExporterBank
ORG=exporterbank
ORGMSP=ExporterBank
P0PORT=7051
PEERPEM=organizations/peerOrganizations/exporterbank.coffee-export.com/tlsca/tlsca.exporterbank.coffee-export.com-cert.pem
CAPEM=organizations/peerOrganizations/exporterbank.coffee-export.com/ca/ca.exporterbank.coffee-export.com-cert.pem

echo "$(json_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/exporterbank.coffee-export.com/connection-exporterbank.json
echo "$(yaml_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/exporterbank.coffee-export.com/connection-exporterbank.yaml

# NationalBank
ORG=nationalbank
ORGMSP=NationalBank
P0PORT=8051
PEERPEM=organizations/peerOrganizations/nationalbank.coffee-export.com/tlsca/tlsca.nationalbank.coffee-export.com-cert.pem
CAPEM=organizations/peerOrganizations/nationalbank.coffee-export.com/ca/ca.nationalbank.coffee-export.com-cert.pem

echo "$(json_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/nationalbank.coffee-export.com/connection-nationalbank.json
echo "$(yaml_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/nationalbank.coffee-export.com/connection-nationalbank.yaml

# NCAT
ORG=ncat
ORGMSP=NCAT
P0PORT=9051
PEERPEM=organizations/peerOrganizations/ncat.coffee-export.com/tlsca/tlsca.ncat.coffee-export.com-cert.pem
CAPEM=organizations/peerOrganizations/ncat.coffee-export.com/ca/ca.ncat.coffee-export.com-cert.pem

echo "$(json_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/ncat.coffee-export.com/connection-ncat.json
echo "$(yaml_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/ncat.coffee-export.com/connection-ncat.yaml

# ShippingLine
ORG=shippingline
ORGMSP=ShippingLine
P0PORT=10051
PEERPEM=organizations/peerOrganizations/shippingline.coffee-export.com/tlsca/tlsca.shippingline.coffee-export.com-cert.pem
CAPEM=organizations/peerOrganizations/shippingline.coffee-export.com/ca/ca.shippingline.coffee-export.com-cert.pem

echo "$(json_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/shippingline.coffee-export.com/connection-shippingline.json
echo "$(yaml_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/shippingline.coffee-export.com/connection-shippingline.yaml
