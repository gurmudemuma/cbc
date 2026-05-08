# Blockchain Deployment Scripts

This directory contains all scripts needed for blockchain chaincode deployment and management.

## 📋 Available Scripts

### 🚀 Installation & Deployment

There are TWO approaches to chaincode deployment:

1. **All-in-One Scripts** (Automated) - Recommended for most users
2. **Modular Scripts** (Step-by-Step) - For advanced users who need control

---

## APPROACH 1: All-in-One Scripts (Automated)

### `install-blockchain.bat` / `install-blockchain.sh`
**Purpose**: Complete blockchain setup from scratch

**What it does**:
1. Initializes blockchain channel
2. Joins all 5 peers to the channel
3. Packages chaincode
4. Installs chaincode on all peers
5. Approves chaincode for all organizations
6. Commits chaincode to the channel
7. Verifies deployment

**When to use**: First-time setup or complete system reset

**Usage**:
```bash
# Windows
scripts\install-blockchain.bat

# Linux/Mac
bash scripts/install-blockchain.sh
```

---

### `deploy-chaincode.bat` / `deploy-chaincode.sh`
**Purpose**: Smart chaincode deployment (auto-detects fresh install vs upgrade)

**What it does**:
- Detects if chaincode is already deployed
- For fresh install: Deploys with sequence 1
- For upgrade: Automatically increments sequence
- Cleans up old containers and images
- Packages, installs, approves, and commits
- Documents all 140+ blockchain functions

**When to use**: 
- Updating chaincode after code changes
- Deploying new features
- Upgrading to new version

**Usage**:
```bash
# Windows
scripts\deploy-chaincode.bat

# Linux/Mac
bash scripts/deploy-chaincode.sh
```

---

## APPROACH 2: Modular Scripts (Step-by-Step)

For advanced users who need granular control over each deployment step.

### Step 1: `1-package-chaincode.bat` / `1-package-chaincode.sh`
**Purpose**: Package chaincode into deployable .tar.gz

**What it does**:
- Cleans old packages
- Creates chaincode package with label
- Outputs package location

**When to use**: 
- First step in manual deployment
- Testing package creation
- Preparing for multi-environment deployment

**Usage**:
```bash
# Windows
scripts\1-package-chaincode.bat

# Linux/Mac
bash scripts/1-package-chaincode.sh
```

**Output**: Package ID and location for next step

---

### Step 2: `2-install-chaincode.bat` / `2-install-chaincode.sh`
**Purpose**: Install packaged chaincode on all 5 peers

**What it does**:
- Installs on ECTA, Bank, NBE, Customs, Shipping peers
- Queries and displays Package ID
- Verifies installation on each peer

**When to use**:
- After packaging (Step 1)
- Re-installing on specific peers
- Troubleshooting installation issues

**Usage**:
```bash
# Windows
scripts\2-install-chaincode.bat

# Linux/Mac
bash scripts/2-install-chaincode.sh
```

**Output**: Package ID (SAVE THIS for Step 3!)

---

### Step 3: `3-approve-chaincode.bat` / `3-approve-chaincode.sh`
**Purpose**: Approve chaincode for all 5 organizations

**What it does**:
- Auto-detects Package ID from installation
- Approves for ECTA, Bank, NBE, Customs, Shipping
- Checks commit readiness
- Displays approval status

**When to use**:
- After installation (Step 2)
- Re-approving after changes
- Troubleshooting approval issues

**Usage**:
```bash
# Windows
scripts\3-approve-chaincode.bat

# Linux/Mac
bash scripts/3-approve-chaincode.sh
```

**Note**: Script will prompt for Package ID if not found automatically

---

### Step 4: `4-commit-chaincode.bat` / `4-commit-chaincode.sh`
**Purpose**: Commit approved chaincode to blockchain channel

**What it does**:
- Commits chaincode definition to channel
- Verifies deployment
- Displays all 140+ available functions
- Provides next steps

**When to use**:
- After approval (Step 3)
- Final step in deployment
- Activating chaincode on network

**Usage**:
```bash
# Windows
scripts\4-commit-chaincode.bat

# Linux/Mac
bash scripts/4-commit-chaincode.sh
```

**Output**: Deployment confirmation and function list

---

## 🔄 Which Approach Should I Use?

### Use All-in-One Scripts When:
- ✅ You want quick, automated deployment
- ✅ You're doing routine updates
- ✅ You trust the auto-detection logic
- ✅ You want minimal interaction

### Use Modular Scripts When:
- ✅ You need to troubleshoot specific steps
- ✅ You want to pause between steps
- ✅ You're learning the deployment process
- ✅ You need to retry individual steps
- ✅ You're deploying to multiple environments
- ✅ You want maximum control

---

## 📝 Modular Workflow Example

Complete manual deployment in 4 steps:

```bash
# Step 1: Package
scripts\1-package-chaincode.bat
# Output: ecta.tar.gz created

# Step 2: Install on all peers
scripts\2-install-chaincode.bat
# Output: Package ID: ecta_1.0:abc123...
# SAVE THIS PACKAGE ID!

# Step 3: Approve for all orgs
scripts\3-approve-chaincode.bat
# Uses Package ID from Step 2
# Output: All orgs approved, ready to commit

# Step 4: Commit to channel
scripts\4-commit-chaincode.bat
# Output: Deployment complete!
```

---

## 🔍 Verification & Status

#### `verify-chaincode-status.bat`
**Purpose**: Comprehensive chaincode status check

**What it checks**:
1. Chaincode installation on all 5 peers
2. Committed chaincode on channel
3. Running chaincode containers
4. Channel membership
5. Peer connectivity
6. Gateway connection

**When to use**: 
- After deployment to verify success
- Troubleshooting deployment issues
- Checking system health

**Usage**:
```bash
scripts\verify-chaincode-status.bat
```

---

## 🖥️ System Management

#### `start-system.bat` / `start-system.sh`
**Purpose**: Start the complete hybrid system

**What it does**:
- Starts all Docker containers
- Initializes database
- Starts blockchain network
- Starts gateway service

**Usage**:
```bash
# Windows
scripts\start-system.bat

# Linux/Mac
bash scripts/start-system.sh
```

---

## 📊 Blockchain Functions Available

The ECTA chaincode includes **140+ blockchain functions** across multiple categories:

### Core Categories:
- **User Management** (8 functions)
- **Exporter Profile & Pre-Registration** (11 functions)
- **Export Workflow** (7 functions)
- **Sales Contract Registration** (14 functions)
- **Certificate Issuance** (11 functions)
- **Network Submission** (9 functions)
- **Document Issuance & Authentication** (8 functions) ⭐ NEW
- **ESW** (3 functions)
- **Quality Certificates** (2 functions)
- **Qualification Documents** (3 functions)
- **Statutory Documents & NBE** (4 functions)
- **Contract Drafts** (3 functions)
- **GPS Plot & Deforestation** (4 functions)
- **Certificate Bundle** (2 functions)
- **Customs Clearance** (5 functions)
- **Fumigation** (3 functions)
- **Shipping & Logistics** (13 functions)
- **Legal Framework** (10 functions)
- **Query Functions** (5 functions)

### New Document Issuance Functions:
1. `RecordDocumentIssuance` - Record document issuance on blockchain
2. `VerifyDocumentAuthenticity` - Verify document by hash
3. `RecordDocumentAuthentication` - Record authentication event
4. `RecordDocumentRevocation` - Revoke issued document
5. `GetDocument` - Get document by ID
6. `QueryDocumentsByExporter` - Query exporter's documents
7. `QueryDocumentsByIssuer` - Query issuer's documents
8. `QueryAuthenticationsBySubmission` - Query submission authentications

---

## 🔄 Deployment Workflows

### Workflow 1: First-Time Setup (All-in-One)
```bash
1. Start system: scripts\start-system.bat
2. Install blockchain: scripts\install-blockchain.bat
3. Verify: scripts\verify-chaincode-status.bat
4. Test: node test-workflow-from-registration.js
```

### Workflow 2: Update Chaincode (All-in-One)
```bash
1. Make changes to chaincode/ecta/index.js
2. Deploy update: scripts\deploy-chaincode.bat
3. Verify: scripts\verify-chaincode-status.bat
4. Test: node test-workflow-from-registration.js
```

### Workflow 3: Manual Step-by-Step Deployment (Modular)
```bash
1. Package: scripts\1-package-chaincode.bat
2. Install: scripts\2-install-chaincode.bat
   → Save the Package ID displayed
3. Approve: scripts\3-approve-chaincode.bat
   → Uses Package ID from step 2
4. Commit: scripts\4-commit-chaincode.bat
5. Verify: scripts\verify-chaincode-status.bat
6. Test: node test-workflow-from-registration.js
```

### Workflow 4: Troubleshooting Failed Deployment (Modular)
```bash
# If deployment fails at any step, use modular scripts to retry:

# Failed at packaging?
scripts\1-package-chaincode.bat

# Failed at installation?
scripts\2-install-chaincode.bat

# Failed at approval?
scripts\3-approve-chaincode.bat

# Failed at commit?
scripts\4-commit-chaincode.bat

# Check status after each retry
scripts\verify-chaincode-status.bat
```

---

## 🛠️ Troubleshooting

### Chaincode not deploying?
```bash
# Check peer logs
docker logs peer0.ecta.example.com

# Check chaincode container logs
docker logs dev-peer0.ecta.example.com-ecta_1.0

# Verify status
scripts\verify-chaincode-status.bat

# Try modular approach to isolate the issue:
scripts\1-package-chaincode.bat  # Does packaging work?
scripts\2-install-chaincode.bat  # Does installation work?
scripts\3-approve-chaincode.bat  # Does approval work?
scripts\4-commit-chaincode.bat   # Does commit work?
```

### Specific step failing in modular deployment?

**Package step fails:**
- Check if chaincode source exists at `chaincode/ecta/`
- Verify Docker containers are running: `docker ps`
- Check CLI container: `docker logs cli`

**Install step fails:**
- Verify package was created in Step 1
- Check peer connectivity: `docker ps | grep peer`
- Try installing on one peer at a time

**Approve step fails:**
- Verify Package ID from Step 2
- Check if all peers are running
- Verify orderer is accessible: `docker logs orderer1.orderer.example.com`

**Commit step fails:**
- Verify all 5 orgs approved (check Step 3 output)
- Check commit readiness: `docker exec cli peer lifecycle chaincode checkcommitreadiness ...`
- Ensure at least 3 peers are available

### Containers not starting?
```bash
# Check all containers
docker ps -a

# Restart specific container
docker restart peer0.ecta.example.com

# Check logs
docker logs coffee-gateway
```

### Need to reset everything?
```bash
# Stop all containers
docker-compose -f docker-compose-hybrid.yml down

# Remove volumes (WARNING: deletes all data)
docker-compose -f docker-compose-hybrid.yml down -v

# Start fresh
scripts\start-system.bat
scripts\install-blockchain.bat
```

### Package ID not found in Step 3?
```bash
# Manually query Package ID
docker exec cli peer lifecycle chaincode queryinstalled

# Copy the Package ID and provide it when prompted in Step 3
# Format: ecta_1.0:abc123def456...
```

---

## 📝 Configuration

### Chaincode Configuration:
- **Name**: ecta
- **Version**: 1.0 (auto-incremented on upgrade)
- **Language**: Node.js
- **Channel**: coffeechannel
- **Organizations**: ECTA, Bank, NBE, Customs, Shipping

### Network Configuration:
- **Peers**: 5 (one per organization)
- **Orderers**: 3 (Raft consensus)
- **Channel**: coffeechannel
- **Endorsement Policy**: Majority (3 of 5)

### Modular Scripts Configuration:
Each modular script uses the same configuration:
- **Package Label**: ecta_1.0
- **Sequence**: 1 (for fresh install, increment for upgrades)
- **Crypto Path**: `/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config`
- **Chaincode Path**: `/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta`

---

## 🎯 Best Practices

### When to Use All-in-One Scripts:
1. Production deployments (tested and reliable)
2. Routine updates and upgrades
3. Time-sensitive deployments
4. When you trust the automation

### When to Use Modular Scripts:
1. Learning the deployment process
2. Troubleshooting specific issues
3. Testing individual components
4. Multi-environment deployments
5. When you need audit trails for each step
6. Development and testing phases

### General Best Practices:
1. **Always verify** deployment with `verify-chaincode-status.bat` after changes
2. **Test thoroughly** with test scripts before production use
3. **Backup data** before major upgrades
4. **Check logs** if anything fails
5. **Save Package IDs** when using modular approach
6. **Document changes** to chaincode between deployments
7. **Use version control** for chaincode changes

---

## 🔐 Security Notes

- All scripts use TLS for peer communication
- Crypto materials are stored in `crypto-config/`
- Admin credentials required for deployment
- Package IDs are automatically generated and verified

---

## 📚 Additional Resources

- **Chaincode Source**: `chaincode/ecta/index.js`
- **Connection Profile**: `coffee-export-gateway/src/config/connection-profile.json`
- **Docker Compose**: `docker-compose-hybrid.yml`
- **Documentation**: `docs/` directory

---

## ⚠️ Important Notes

1. **Modular vs All-in-One**: Both approaches achieve the same result. Choose based on your needs.
2. **Package ID**: Critical for modular approach - save it from Step 2 for Step 3
3. **Sequence Numbers**: Auto-increment in all-in-one scripts, manual in modular (set to 1 for fresh, increment for upgrades)
4. **Verification**: Always run `verify-chaincode-status.bat` after deployment
5. **Testing**: Test with `test-workflow-from-registration.js` before production
6. **Logs**: Check peer and chaincode logs if issues occur
7. **Cleanup**: Old containers/images are cleaned automatically in all-in-one scripts
8. **Retry**: Modular scripts allow retrying individual steps without starting over

---

## 📂 Script Files Summary

### All-in-One Scripts:
- `install-blockchain.bat/sh` - Complete fresh installation
- `deploy-chaincode.bat/sh` - Smart deployment (fresh or upgrade)
- `verify-chaincode-status.bat` - Status verification

### Modular Scripts:
- `1-package-chaincode.bat/sh` - Step 1: Package
- `2-install-chaincode.bat/sh` - Step 2: Install
- `3-approve-chaincode.bat/sh` - Step 3: Approve
- `4-commit-chaincode.bat/sh` - Step 4: Commit

### System Scripts:
- `start-system.bat/sh` - Start Docker containers

### Total: 11 scripts (8 deployment + 1 verification + 2 system)

---

## 🆘 Support

If you encounter issues:
1. Check the verification script output
2. Review peer and chaincode logs
3. Ensure all containers are running
4. Verify network connectivity
5. Check the troubleshooting section above

---

**Last Updated**: 2026-04-01
**Chaincode Version**: 1.0
**Total Functions**: 140+
