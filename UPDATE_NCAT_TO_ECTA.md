# ECTA to ECTA Update Guide
**Date:** November 5, 2024

## ✅ Files Already Updated

1. **docker-compose.yml** - Peer renamed, ECX added
2. **frontend/** - All ECTA references changed to ECTA
3. **api/package.json** - Workspaces updated
4. **README.md** - Documentation updated
5. **ARCHITECTURE.md** - Documentation updated
6. **network/scripts/envVar.sh** - Organization 3 renamed to ECTA, Organization 6 (ECX) added

## 📝 Files That Still Need Manual Updates

Due to the complexity of network configuration files and the need to regenerate certificates, the following files contain ECTA references that should be updated when regenerating the network:

### Network Configuration Files:
1. `network/config_block.json` - Contains ECTAMSP references
2. `network/NationalBankMSPmodified_config.json` - Contains ECTAMSP references  
3. `network/ECTAMSPconfig.json` - Entire file needs to be renamed/regenerated

### Network Scripts:
1. `network/fix-channel-acl.sh` - References ncat in lines 77, 119, 131, 144
2. `network/approve-commit-user-management.sh` - Line 30 comment says "ECTA"

## 🔧 Recommended Approach

### Option 1: Regenerate Network (Recommended)
The cleanest approach is to regenerate the entire Hyperledger Fabric network with correct naming:

```bash
# 1. Backup current data if needed
cd /home/gu-da/cbc

# 2. Stop and clean current network
docker-compose down -v
docker system prune -af

# 3. Regenerate crypto materials with correct organization names
cd network
./network.sh down
rm -rf organizations/peerOrganizations/ncat.coffee-export.com

# 4. Generate new certificates for ECTA and ECX
./network.sh up createChannel

# 5. Deploy chaincode
./network.sh deployCC
```

### Option 2: Manual Updates (Quick Fix)
If you need to keep existing data, manually update these files:

```bash
cd /home/gu-da/cbc/network

# Update fix-channel-acl.sh
sed -i 's/ncat/ecta/g' fix-channel-acl.sh
sed -i 's/ECTA/ECTA/g' fix-channel-acl.sh  
sed -i 's/ECTAMSP/ECTAMSP/g' fix-channel-acl.sh

# Update approve-commit-user-management.sh
sed -i 's/ECTA/ECTA/g' approve-commit-user-management.sh

# Note: JSON config files should be regenerated, not manually edited
```

## 📋 Organization Mapping

### Current (After Updates):
| Org # | Name | MSP ID | Port | Domain |
|-------|------|--------|------|--------|
| 1 | commercialbank | commercialbankMSP | 7051 | commercialbank.coffee-export.com |
| 2 | National Bank | NationalBankMSP | 8051 | nationalbank.coffee-export.com |
| 3 | **ECTA** | **ECTAMSP** | 9051 | **ecta.coffee-export.com** |
| 4 | Shipping Line | ShippingLineMSP | 10051 | shippingline.coffee-export.com |
| 5 | Custom Authorities | CustomAuthoritiesMSP | 11051 | customauthorities.coffee-export.com |
| 6 | **ECX** | **ECXMSP** | 12051 | **ecx.coffee-export.com** |

## ⚠️ Important Notes

1. **Certificate Generation**: When you regenerate the network, ensure certificates are created for:
   - `ecta.coffee-export.com` (not ncat)
   - `ecx.coffee-export.com` (new)

2. **Channel Configuration**: The channel needs to include all 6 organizations

3. **Chaincode Deployment**: Chaincode must be approved by all 6 organizations

4. **API Connection Profiles**: Ensure API connection profiles point to correct peer addresses

## 🎯 Quick Fix Script

Here's a script to update the remaining shell scripts:

```bash
#!/bin/bash
cd /home/gu-da/cbc/network

# Update fix-channel-acl.sh
sed -i 's/join_peer "ncat"/join_peer "ecta"/g' fix-channel-acl.sh
sed -i 's/update_anchor "ncat"/update_anchor "ecta"/g' fix-channel-acl.sh
sed -i 's/ECTAMSP/ECTAMSP/g' fix-channel-acl.sh
sed -i 's/for org in commercialbank nationalbank ncat/for org in commercialbank nationalbank ecta/g' fix-channel-acl.sh
sed -i 's/ncat-api/ecta-api/g' fix-channel-acl.sh

# Update approve-commit-user-management.sh
sed -i 's/echo "Approving for ECTA..."/echo "Approving for ECTA..."/g' approve-commit-user-management.sh

echo "Shell scripts updated!"
echo "Note: JSON config files should be regenerated when you recreate the network"
```

## ✅ Verification

After updates, verify:

```bash
# Check for remaining ECTA references
cd /home/gu-da/cbc
grep -r "ncat" network/scripts/ --ignore-case | grep -v "concatenate"
grep -r "ECTAMSP" network/ | grep -v ".json"

# Should only find references in JSON config files (which will be regenerated)
```

## 📚 Summary

- ✅ **Code**: All application code updated (frontend, backend, docker-compose)
- ✅ **Scripts**: Main environment script (envVar.sh) updated
- ⚠️ **Network Config**: JSON files need regeneration
- ⚠️ **Helper Scripts**: 2 shell scripts need quick updates

**Recommendation**: Run the network regeneration to ensure all certificates and configurations are created with correct ECTA and ECX naming.
