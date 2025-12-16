# Single Chaincode Version - No Version Tracking

## ✅ Changes Made

### Removed Version Numbers
All chaincode deployments now use a **single version** without version tracking (no v2.0, v2.1, v2.2, etc.)

### Files Updated

1. **`/home/gu-da/cbc/start-system.sh`**
   - Removed all version numbers from chaincode deployment
   - Simplified deployment logic
   - No more version detection or auto-update logic

2. **`/home/gu-da/cbc/update-chaincode.sh`**
   - Removed version numbers
   - Simplified update script

---

## How It Works Now

### Initial Deployment
```bash
./start-system.sh
```

**What happens:**
- Deploys `coffee-export` chaincode (no version number)
- Uses default sequence from `network.sh`
- Simple and clean

### Force Update
```bash
./start-system.sh --update-chaincode
```

**What happens:**
- Redeploys `coffee-export` chaincode with latest code
- Increments sequence automatically
- No version tracking needed

---

## Deployment Commands

### Before (Multiple Versions)
```bash
./network.sh deployCC -ccn coffee-export -ccv 2.0 -ccs 1
./network.sh deployCC -ccn coffee-export -ccv 2.1 -ccs 2
./network.sh deployCC -ccn coffee-export -ccv 2.2 -ccs 3
```

### After (Single Version)
```bash
./network.sh deployCC -ccn coffee-export -ccl golang
./network.sh deployCC -ccn coffee-export -ccl golang
./network.sh deployCC -ccn coffee-export -ccl golang
```

Same chaincode, different sequences, but **no version numbers**.

---

## Benefits

### ✅ Simpler
- No version tracking
- No version detection logic
- Cleaner scripts

### ✅ Cleaner
- No version numbers in container names
- Easier to understand
- Less confusion

### ✅ Easier Maintenance
- Update code, redeploy
- No need to bump versions
- Sequence numbers handle updates

---

## Current Chaincode Features

All features are included in the single chaincode:

- ✅ **Commercial Bank can create exports**
- ✅ **Temporary license numbers auto-generated**
- ✅ **Accept all coffee types from frontend**
- ✅ **All MSP references updated to CommercialBankMSP**
- ✅ **Payment confirmation**
- ✅ **Export completion**
- ✅ **Export updates**
- ✅ **Export resubmission**
- ✅ **Export cancellation**

---

## Usage

### Normal Startup
```bash
./start-system.sh
```
- Deploys chaincode if not exists
- Skips if already deployed

### Update Chaincode
```bash
./start-system.sh --update-chaincode
```
- Forces redeployment with latest code
- Useful after code changes

### Clean Start
```bash
./start-system.sh --clean
```
- Removes all data
- Deploys fresh chaincode

### Standalone Update
```bash
./update-chaincode.sh
```
- Quick chaincode update
- Same as `--update-chaincode` flag

---

## Container Names

### Before (With Versions)
```
dev-peer0.commercialbank.coffee-export.com-coffee-export_2.0-...
dev-peer0.commercialbank.coffee-export.com-coffee-export_2.1-...
dev-peer0.commercialbank.coffee-export.com-coffee-export_2.2-...
```

### After (Single Version)
```
dev-peer0.commercialbank.coffee-export.com-coffee-export_1.0-...
dev-peer0.commercialbank.coffee-export.com-coffee-export_1.0-...
dev-peer0.commercialbank.coffee-export.com-coffee-export_1.0-...
```

All use the same base version, sequences handle updates internally.

---

## Sequence Numbers

Hyperledger Fabric uses **sequence numbers** for chaincode updates, not version numbers.

### How Sequences Work
```
Sequence 1: Initial deployment
Sequence 2: First update
Sequence 3: Second update
...
```

### Version vs Sequence
- **Version**: User-facing label (removed)
- **Sequence**: Internal Fabric tracking (kept)

We removed the version label, Fabric still uses sequences internally.

---

## Migration

### If You Have Existing Deployments

**Option 1: Continue with existing**
```bash
./start-system.sh
```
- Will detect existing chaincode
- Won't redeploy unless `--update-chaincode` is used

**Option 2: Clean start**
```bash
./start-system.sh --clean
```
- Removes all existing data
- Deploys fresh with single version

---

## Summary

### What Changed
- ❌ Removed: Version numbers (v2.0, v2.1, v2.2)
- ❌ Removed: Version detection logic
- ❌ Removed: Auto-update based on version
- ✅ Kept: All chaincode features
- ✅ Kept: Sequence-based updates
- ✅ Kept: `--update-chaincode` flag

### Result
**One chaincode, no version tracking, simpler deployment!**

---

## Commands Reference

```bash
# Normal startup
./start-system.sh

# Force chaincode update
./start-system.sh --update-chaincode

# Clean start
./start-system.sh --clean

# Standalone update
./update-chaincode.sh

# Help
./start-system.sh --help
```

---

**All version numbers removed! Single chaincode version maintained.** ✅
