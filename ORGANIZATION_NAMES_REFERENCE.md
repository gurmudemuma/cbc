# Organization Names Reference

This document provides the correct organization names and domain mappings for the Coffee Blockchain Consortium.

## Peer Organizations

The actual peer organization directories in `network/organizations/peerOrganizations/`:

1. **commercialbank.coffee-export.com**
2. **nationalbank.coffee-export.com**
3. **ncat.coffee-export.com**
4. **shippingline.coffee-export.com**
5. **customauthorities.coffee-export.com**

## Organization to API Mapping

| Organization Domain | MSP ID | API Directory | Port | Service Name |
|---------------------|--------|---------------|------|--------------|
| `commercialbank.coffee-export.com` | ExporterBankMSP | `api/banker` | 3001 | commercialbank API |
| `nationalbank.coffee-export.com` | NationalBankMSP | `api/nb-regulatory` | 3002 | National Bank API |
| `ncat.coffee-export.com` | ECTAMSP | `api/ncat` | 3003 | ECTA API |
| `shippingline.coffee-export.com` | ShippingLineMSP | `api/shipping-line` | 3004 | Shipping Line API |
| `customauthorities.coffee-export.com` | CustomAuthoritiesMSP | `api/custom-authorities` | 3005 | Custom Authorities API |

## Admin Credentials Location

Admin credentials are stored in:
```
network/organizations/peerOrganizations/{org-domain}/users/Admin@{org-domain}/msp/
```

Example:
```
network/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp/
├── admincerts/
├── cacerts/
├── config.yaml
├── keystore/
├── signcerts/
└── tlscacerts/
```

## Wallet Locations

Admin wallets are stored in each API directory:
```
api/{api-directory}/wallet/admin.id
```

Examples:
- `api/banker/wallet/admin.id` (commercialbank)
- `api/nb-regulatory/wallet/admin.id` (National Bank)
- `api/ncat/wallet/admin.id` (ECTA)
- `api/shipping-line/wallet/admin.id` (Shipping Line)
- `api/custom-authorities/wallet/admin.id` (Custom Authorities)

## Common Mistakes to Avoid

❌ **Don't use these (they don't exist):**
- `banker.coffee-export.com`
- `nbregulatory.coffee-export.com`
- `exporter.coffee-export.com`
- `api/commercialbank`
- `api/national-bank`

✅ **Use these instead:**
- `commercialbank.coffee-export.com`
- `nationalbank.coffee-export.com`
- `ncat.coffee-export.com`
- `api/banker`
- `api/nb-regulatory`

## Scripts Using Organization Names

The following scripts reference organization names and should use the correct domains:

1. **scripts/enroll-admins.sh** - Enrolls admin users for all organizations
2. **start-system.sh** - Starts the complete system including APIs
3. **scripts/dev-apis.sh** - Starts APIs in development mode
4. **scripts/register-test-users.sh** - Registers test users
5. **scripts/check-health.sh** - Checks API health status

## Network Configuration

The network configuration in `network/configtx/configtx.yaml` defines these organizations with their respective MSP IDs and policies.

## Chaincode Endorsement

For multi-organization transactions, ensure endorsement policies reference the correct MSP IDs:
- ExporterBankMSP
- NationalBankMSP
- ECTAMSP
- ShippingLineMSP
- CustomAuthoritiesMSP
