# Blockchain Deployment - Quick Start Guide

Choose your deployment approach based on your needs.

---

## 🚀 Quick Start: All-in-One (Recommended for Most Users)

### First-Time Setup
```bash
# Windows
scripts\install-blockchain.bat

# Linux/Mac
bash scripts/install-blockchain.sh
```

### Deploy Updates
```bash
# Windows
scripts\deploy-chaincode.bat

# Linux/Mac
bash scripts/deploy-chaincode.sh
```

### Verify
```bash
scripts\verify-chaincode-status.bat
```

**Done!** Your chaincode is deployed with 140+ functions ready to use.

---

## 🎯 Advanced: Modular Step-by-Step

### When to Use
- Learning the deployment process
- Troubleshooting specific issues
- Need to pause between steps
- Multi-environment deployments

### 4-Step Process

#### Step 1: Package
```bash
scripts\1-package-chaincode.bat
```
**Output**: Package created

#### Step 2: Install
```bash
scripts\2-install-chaincode.bat
```
**Output**: Package ID (SAVE THIS!)

#### Step 3: Approve
```bash
scripts\3-approve-chaincode.bat
```
**Output**: All orgs approved

#### Step 4: Commit
```bash
scripts\4-commit-chaincode.bat
```
**Output**: Deployment complete!

#### Verify
```bash
scripts\verify-chaincode-status.bat
```

---

## 🆘 Troubleshooting

### All-in-One Failed?
Switch to modular approach to isolate the issue:
```bash
scripts\1-package-chaincode.bat  # Test packaging
scripts\2-install-chaincode.bat  # Test installation
scripts\3-approve-chaincode.bat  # Test approval
scripts\4-commit-chaincode.bat   # Test commit
```

### Specific Step Failed?
Retry just that step:
```bash
# If install failed:
scripts\2-install-chaincode.bat

# If approve failed:
scripts\3-approve-chaincode.bat

# etc.
```

---

## 📚 Full Documentation

See `scripts/README.md` for complete documentation including:
- Detailed usage examples
- Troubleshooting guide
- Configuration options
- All 140+ blockchain functions

---

## ✅ Quick Checklist

Before deployment:
- [ ] Docker containers running (`docker ps`)
- [ ] Chaincode source exists (`chaincode/ecta/`)
- [ ] No syntax errors in chaincode

After deployment:
- [ ] Run verification script
- [ ] Check chaincode containers (`docker ps | grep dev-peer`)
- [ ] Test with: `node test-workflow-from-registration.js`

---

**Need Help?** Check `scripts/README.md` for detailed troubleshooting.
