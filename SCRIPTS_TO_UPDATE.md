# 📝 Scripts That Need Updating

**Date:** October 25, 2025  
**Status:** ⚠️ **IDENTIFIED - NEEDS FIXING**

---

## 🔍 Scripts with Old References Found

### **Critical Scripts (High Priority)** 🔴

These scripts are frequently used and must be updated:

1. **`start-system.sh`** (14 matches)
   - Lines 276-280: Process killing commands
   - Lines 318-321: Wallet directory paths
   - Lines 572-576: Directory creation
   - Lines 608-611: Cryptogen commands
   - Lines 626: MSP verification
   - Lines 700-728: Channel and chaincode checks
   - Lines 851-860: API startup in tmux

2. **`scripts/start-apis.sh`** (8 matches)
   - Lines 31-46: Build commands
   - Lines 80-118: API startup commands
   - Lines 124-128: Status display

3. **`package.json`** (8 matches)
   - Lines 6-19: Install and build scripts

4. **`setup-postgres.sh`** (9 matches)
   - Database setup for old API names

5. **`scripts/fix-configurations.sh`** (7 matches)
   - Configuration fixes

6. **`scripts/setup-env.sh`** (6 matches)
   - Environment setup

---

### **Important Scripts (Medium Priority)** 🟡

7. **`scripts/validate-all.sh`** (6 matches)
8. **`scripts/security-validation.sh`** (5 matches)
9. **`complete-fix.sh`** (4 matches)
10. **`kill-api-processes.sh`** (4 matches)
11. **`scripts/clean.sh`** (4 matches)
12. **`scripts/dev-apis.sh`** (3 matches)
13. **`scripts/update-auth-blockchain.sh`** (3 matches)
14. **`diagnose-api-issues.sh`** (2 matches)
15. **`install-new-features.sh`** (2 matches)
16. **`scripts/deploy-blockchain-auth.sh`** (2 matches)
17. **`scripts/enroll-admins.sh`** (2 matches)
18. **`scripts/stop-apis.sh`** (2 matches)
19. **`scripts/test-inter-communication.sh`** (2 matches)
20. **`start-docker-full.sh`** (2 matches)

---

### **Low Priority Scripts** 🟢

21. **`scripts/tests/run-all-tests.sh`** (1 match)
22. **`scripts/validate-config.sh`** (1 match)
23. **Package lock files** (auto-generated, will fix on npm install)

---

## 🔧 Required Changes

### **Pattern to Find and Replace:**

```bash
# Directory paths
api/commercialbank     → api/banker
api/national-bank     → api/nb-regulatory
api/exporter-portal   → api/exporter

# Process names
commercialbank         → banker
national-bank         → nb-regulatory
exporter-portal       → exporter

# Docker container names
commercialbank          → banker
nationalbank          → nbregulatory

# Peer names
peer0.commercialbank    → peer0.banker
peer0.nationalbank    → peer0.nbregulatory

# Organization names
commercialbank          → Banker
NationalBank          → NBRegulatory
ExporterPortal        → Exporter
```

---

## 📋 Detailed Script Issues

### **1. start-system.sh** (Most Critical)

**Lines with Issues:**
```bash
# Line 208: Docker check
if docker ps | grep -q "peer0.commercialbank"; then

# Lines 276-280: Process killing
pkill -f "npm run dev.*commercialbank" 2>/dev/null || true
pkill -f "npm run dev.*national-bank" 2>/dev/null || true

# Lines 318-321: Wallet removal
rm -rf api/commercialbank/wallet/* 2>/dev/null || true
rm -rf api/national-bank/wallet/* 2>/dev/null || true

# Lines 572-576: Directory creation
mkdir -p "$PROJECT_ROOT/api/commercialbank/wallet"
mkdir -p "$PROJECT_ROOT/api/national-bank/wallet"

# Lines 587: Connection profile check
if [ ! -f "$PROJECT_ROOT/network/organizations/peerOrganizations/commercialbank.coffee-export.com/connection-commercialbank.json" ]; then

# Lines 608-611: Cryptogen
echo -e "${YELLOW}  - Generating commercialbank identities...${NC}"
cryptogen generate --config=./organizations/cryptogen/crypto-config-commercialbank.yaml

echo -e "${YELLOW}  - Generating National Bank identities...${NC}"
cryptogen generate --config=./organizations/cryptogen/crypto-config-nationalbank.yaml

# Line 626: MSP verification
if [ ! -d "organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/msp" ]; then

# Line 700: Channel check
CHANNEL_TEMP=$(docker exec peer0.commercialbank.coffee-export.com ls /var/hyperledger/production/ledgersData/chains/chains 2>/dev/null || echo "")

# Line 725: Chaincode check
CHAINCODE_TEMP=$(docker exec peer0.commercialbank.coffee-export.com ls /var/hyperledger/production/lifecycle/chaincodes 2>/dev/null || echo "")

# Lines 851-860: Tmux API startup
tmux send-keys -t cbc-apis "cd $PROJECT_ROOT/api/commercialbank && echo 'Starting commercialbank API...' && npm run dev" C-m
tmux send-keys -t cbc-apis "cd $PROJECT_ROOT/api/national-bank && echo 'Starting National Bank API...' && npm run dev" C-m
```

**Should Be:**
```bash
# Line 208
if docker ps | grep -q "peer0.banker"; then

# Lines 276-280
pkill -f "npm run dev.*banker" 2>/dev/null || true
pkill -f "npm run dev.*nb-regulatory" 2>/dev/null || true

# Lines 318-321
rm -rf api/banker/wallet/* 2>/dev/null || true
rm -rf api/nb-regulatory/wallet/* 2>/dev/null || true

# Lines 572-576
mkdir -p "$PROJECT_ROOT/api/banker/wallet"
mkdir -p "$PROJECT_ROOT/api/nb-regulatory/wallet"

# Lines 587
if [ ! -f "$PROJECT_ROOT/network/organizations/peerOrganizations/banker.coffee-export.com/connection-banker.json" ]; then

# Lines 608-611
echo -e "${YELLOW}  - Generating Banker identities...${NC}"
cryptogen generate --config=./organizations/cryptogen/crypto-config-banker.yaml

echo -e "${YELLOW}  - Generating NB Regulatory identities...${NC}"
cryptogen generate --config=./organizations/cryptogen/crypto-config-nbregulatory.yaml

# Line 626
if [ ! -d "organizations/peerOrganizations/banker.coffee-export.com/peers/peer0.banker.coffee-export.com/msp" ]; then

# Line 700
CHANNEL_TEMP=$(docker exec peer0.banker.coffee-export.com ls /var/hyperledger/production/ledgersData/chains/chains 2>/dev/null || echo "")

# Line 725
CHAINCODE_TEMP=$(docker exec peer0.banker.coffee-export.com ls /var/hyperledger/production/lifecycle/chaincodes 2>/dev/null || echo "")

# Lines 851-860
tmux send-keys -t cbc-apis "cd $PROJECT_ROOT/api/banker && echo 'Starting Banker API...' && npm run dev" C-m
tmux send-keys -t cbc-apis "cd $PROJECT_ROOT/api/nb-regulatory && echo 'Starting NB Regulatory API...' && npm run dev" C-m
```

---

### **2. scripts/start-apis.sh**

**Lines with Issues:**
```bash
# Lines 31-46: Build commands
print_header "Building commercialbank API..."
if ! (cd "$PROJECT_ROOT/api/commercialbank" && npm run build); then
  echo "❌ Failed to build commercialbank API"
fi

print_header "Building National Bank API..."
if ! (cd "$PROJECT_ROOT/api/national-bank" && npm run build); then
  echo "❌ Failed to build National Bank API"
fi

# Lines 80-118: Startup commands
LOG_FILE="$PROJECT_ROOT/logs/commercialbank.log"
PID_FILE="$PROJECT_ROOT/logs/commercialbank.pid"
(cd "$PROJECT_ROOT/api/commercialbank" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &

LOG_FILE="$PROJECT_ROOT/logs/national-bank.log"
PID_FILE="$PROJECT_ROOT/logs/national-bank.pid"
(cd "$PROJECT_ROOT/api/national-bank" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &

# Lines 124-128: Status display
echo "  🏦 commercialbank API: http://localhost:3001"
echo "  🏦 National Bank API: http://localhost:3002"
```

**Should Be:**
```bash
# Lines 31-46
print_header "Building Banker API..."
if ! (cd "$PROJECT_ROOT/api/banker" && npm run build); then
  echo "❌ Failed to build Banker API"
fi

print_header "Building NB Regulatory API..."
if ! (cd "$PROJECT_ROOT/api/nb-regulatory" && npm run build); then
  echo "❌ Failed to build NB Regulatory API"
fi

# Lines 80-118
LOG_FILE="$PROJECT_ROOT/logs/banker.log"
PID_FILE="$PROJECT_ROOT/logs/banker.pid"
(cd "$PROJECT_ROOT/api/banker" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &

LOG_FILE="$PROJECT_ROOT/logs/nb-regulatory.log"
PID_FILE="$PROJECT_ROOT/logs/nb-regulatory.pid"
(cd "$PROJECT_ROOT/api/nb-regulatory" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &

# Lines 124-128
echo "  🏦 Banker API: http://localhost:3001"
echo "  🏦 NB Regulatory API: http://localhost:3002"
```

---

### **3. package.json (Root)**

**Lines with Issues:**
```json
"install:all": "npm run install:commercialbank && npm run install:national-bank && npm run install:ncat && npm run install:shipping-line && npm run install:custom-authorities && npm run install:exporter-portal",
"install:commercialbank": "cd api/commercialbank && npm install",
"install:national-bank": "cd api/national-bank && npm install",
"install:exporter-portal": "cd api/exporter-portal && npm install",
"build:all": "npm run build:commercialbank && npm run build:national-bank && npm run build:ncat && npm run build:shipping-line && npm run build:custom-authorities && npm run build:exporter-portal",
"build:commercialbank": "cd api/commercialbank && npm run build",
"build:national-bank": "cd api/national-bank && npm run build",
"build:exporter-portal": "cd api/exporter-portal && npm run build",
```

**Should Be:**
```json
"install:all": "npm run install:banker && npm run install:nb-regulatory && npm run install:ncat && npm run install:shipping-line && npm run install:custom-authorities && npm run install:exporter",
"install:banker": "cd api/banker && npm install",
"install:nb-regulatory": "cd api/nb-regulatory && npm install",
"install:exporter": "cd api/exporter && npm install",
"build:all": "npm run build:banker && npm run build:nb-regulatory && npm run build:ncat && npm run build:shipping-line && npm run build:custom-authorities && npm run build:exporter",
"build:banker": "cd api/banker && npm run build",
"build:nb-regulatory": "cd api/nb-regulatory && npm run build",
"build:exporter": "cd api/exporter && npm run build",
```

---

## 🎯 Recommended Action Plan

### **Phase 1: Critical Scripts** (Do Now)
1. Update `package.json` (root)
2. Update `scripts/start-apis.sh`
3. Update `start-system.sh`

### **Phase 2: Important Scripts** (Do Soon)
4. Update `scripts/stop-apis.sh`
5. Update `scripts/clean.sh`
6. Update `kill-api-processes.sh`
7. Update `setup-postgres.sh`

### **Phase 3: All Other Scripts** (Do Later)
8. Update remaining validation and test scripts
9. Update deployment scripts
10. Update configuration scripts

---

## 🚀 Quick Fix Command

For simple path replacements in scripts:

```bash
cd /home/gu-da/cbc

# Find all shell scripts with old references
find . -name "*.sh" -type f -exec grep -l "commercialbank\|national-bank\|exporter-portal" {} \;

# For each script, you can use sed to replace:
# sed -i 's/commercialbank/banker/g' script.sh
# sed -i 's/national-bank/nb-regulatory/g' script.sh
# sed -i 's/exporter-portal/exporter/g' script.sh
```

---

## ⚠️ Important Notes

1. **Backup First:** Always backup scripts before mass replacement
2. **Test After:** Test each script after updating
3. **Docker Names:** Network/Docker configs may also need updates
4. **Fabric Configs:** Crypto-config files need renaming
5. **Connection Profiles:** May need regeneration

---

**Status:** ⚠️ **IDENTIFIED - READY TO FIX**  
**Priority:** 🔴 **HIGH - Scripts are critical for system operation**  
**Estimated Time:** 2-3 hours for all scripts

Would you like me to update these scripts now?
