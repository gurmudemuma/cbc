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

# commercialbank
ORG=commercialbank
ORGMSP=commercialbank
P0PORT=7051
PEERPEM=organizations/peerOrganizations/commercialbank.coffee-export.com/tlsca/tlsca.commercialbank.coffee-export.com-cert.pem
CAPEM=organizations/peerOrganizations/commercialbank.coffee-export.com/ca/ca.commercialbank.coffee-export.com-cert.pem

echo "$(json_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/commercialbank.coffee-export.com/connection-commercialbank.json
echo "$(yaml_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/commercialbank.coffee-export.com/connection-commercialbank.yaml

# NationalBank
ORG=nationalbank
ORGMSP=NationalBank
P0PORT=8051
PEERPEM=organizations/peerOrganizations/nationalbank.coffee-export.com/tlsca/tlsca.nationalbank.coffee-export.com-cert.pem
CAPEM=organizations/peerOrganizations/nationalbank.coffee-export.com/ca/ca.nationalbank.coffee-export.com-cert.pem

echo "$(json_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/nationalbank.coffee-export.com/connection-nationalbank.json
echo "$(yaml_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/nationalbank.coffee-export.com/connection-nationalbank.yaml

# ECTA
ORG=ecta
ORGMSP=ECTA
P0PORT=9051
PEERPEM=organizations/peerOrganizations/ecta.coffee-export.com/tlsca/tlsca.ecta.coffee-export.com-cert.pem
CAPEM=organizations/peerOrganizations/ecta.coffee-export.com/ca/ca.ecta.coffee-export.com-cert.pem

echo "$(json_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/ecta.coffee-export.com/connection-ecta.json
echo "$(yaml_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/ecta.coffee-export.com/connection-ecta.yaml

# ShippingLine
ORG=shippingline
ORGMSP=ShippingLine
P0PORT=10051
PEERPEM=organizations/peerOrganizations/shippingline.coffee-export.com/tlsca/tlsca.shippingline.coffee-export.com-cert.pem
CAPEM=organizations/peerOrganizations/shippingline.coffee-export.com/ca/ca.shippingline.coffee-export.com-cert.pem

echo "$(json_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/shippingline.coffee-export.com/connection-shippingline.json
echo "$(yaml_ccp $ORG $ORGMSP $P0PORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/shippingline.coffee-export.com/connection-shippingline.yaml
