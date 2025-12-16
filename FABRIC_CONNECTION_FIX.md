# Fabric Connection Fix - Complete

## Problem Identified
The APIs were failing to connect to the Hyperledger Fabric network with the error:
```
Failed to connect before the deadline on Endorser
DiscoveryService has failed to return results
```

## Root Cause
The connection profile generation script (`generate-connection-profiles.sh`) was not properly embedding the TLS CA certificate content. Instead of the actual PEM certificate, it was inserting the file path as a string.

**Before:**
```json
"tlsCACerts": {
  "pem": "/home/gu-da/cbc/network/organizations/peerOrganizations/commercialbank.coffee-export.com/ca/ca.commercialbank.coffee-export.com-cert.pem"
}
```

**After:**
```json
"tlsCACerts": {
  "pem": "-----BEGIN CERTIFICATE-----\nMIICmTCCAj+gAwIBAgIQL92yd3qrih0Rmh2g4hOLDTAKBggqhkjOPQQDAjCBljEL\n..."
}
```

## Fix Applied
Updated `/home/gu-da/cbc/network/scripts/generate-connection-profiles.sh`:
- Read the TLS certificate into a variable BEFORE the heredoc
- Use the variable in the heredoc to embed actual PEM content
- This ensures the Fabric SDK can properly validate TLS connections

## Test Results
✅ All 5 APIs successfully connected to Fabric network
✅ All test users registered successfully:
  - exporter1 → Commercial Bank (exporter role)
  - banker1 → Commercial Bank (bank role)  
  - governor1 → National Bank (governor role)
  - inspector1 → ECTA
  - shipper1 → Shipping Line
  - custom1 → Custom Authorities

## Files Modified
1. `/home/gu-da/cbc/network/scripts/generate-connection-profiles.sh` - Fixed PEM embedding
2. `/home/gu-da/cbc/start-system.sh` - Updated test user mapping
3. `/home/gu-da/cbc/scripts/register-test-users.sh` - Updated test user mapping

## Next Steps
The system is now fully operational. Run `npm start --clean` to start with all fixes applied.
