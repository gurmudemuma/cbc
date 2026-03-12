# Chaincode Version Management

## Current Version
The current chaincode version is stored in `chaincode/VERSION` file.

**Current Version:** 1.8 ✅ DEPLOYED

**Deployment Status:**
- Version: 1.8
- Sequence: 15
- Status: COMMITTED
- Deployed: March 9, 2026
- All Orgs Approved: ✅ ECTA, Bank, NBE, Customs, Shipping

## Version History

| Version | Sequence | Date | Description | Status |
|---------|----------|------|-------------|--------|
| 1.0 | 1 | Initial | Basic export workflow | Deployed |
| 1.1-1.7 | 2-13 | Various | Incremental improvements | Deployed |
| 1.8 | 15 | 2026-03-09 | Sales Contract Enhancements | ✅ DEPLOYED |

## Version 1.8 Features (Latest)

### New Functions (11 total)
1. **ValidateIncoterms** - All 11 Incoterms 2020 terms
2. **RecordLegalFramework** - CISG, ICC, UNCITRAL support
3. **RegisterForceMajeureEvent** - Event tracking
4. **SuspendContract** - Force majeure suspension
5. **ResumeContract** - Resume after resolution
6. **RecordDispute** - Dispute creation
7. **ResolveDispute** - Dispute resolution
8. **RecordExchangeRate** - Multi-currency support
9. **GetExchangeRate** - Rate retrieval
10. **AmendContract** - Contract amendments
11. **FinalizeContractFromDraft** - Off-chain to on-chain

### Supported Incoterms 2020
- **Any Mode:** EXW, FCA, CPT, CIP, DAP, DPU, DDP
- **Sea/Inland:** FAS, FOB, CFR, CIF

### Legal Frameworks
- CISG (UN Convention on Contracts for International Sale of Goods)
- ICC (International Chamber of Commerce)
- UNCITRAL (UN Commission on International Trade Law)
- Custom frameworks

## How to Deploy New Version

### Step 1: Update Chaincode
Edit `chaincode/ecta/index.js` with your changes.

### Step 2: Update Version Number
Edit `chaincode/VERSION` file:
```
1.9
```

### Step 3: Deploy
Run the auto-versioned deployment script:
```bash
scripts\deploy-chaincode-latest.bat
```

The script will:
- Read version from `chaincode/VERSION`
- Auto-calculate sequence number
- Package and deploy to all peers
- Approve for all organizations
- Commit to channel

## Version Numbering Convention

Format: `MAJOR.MINOR`

- **MAJOR**: Breaking changes (e.g., 1.x → 2.x)
- **MINOR**: New features, enhancements (e.g., 1.7 → 1.8)

Sequence number = MINOR version number (e.g., v1.8 = sequence 8)

## Testing New Version

After deployment, test with:
```bash
node coffee-export-gateway/test-sales-contract-functions.js
```

## Rollback

To rollback to a previous version:
1. Update `chaincode/VERSION` to previous version
2. Run `scripts\deploy-chaincode-latest.bat`
3. Note: Sequence number must be higher than current

## Best Practices

1. **Always test locally first** before deploying to production
2. **Document changes** in this file
3. **Update VERSION file** before deployment
4. **Run diagnostics** on chaincode before packaging:
   ```bash
   # Check for syntax errors
   node -c chaincode/ecta/index.js
   ```
5. **Backup current version** before upgrading
6. **Test new functions** thoroughly after deployment

## Deployment Scripts

- `scripts/deploy-chaincode-latest.bat` - Auto-versioned (recommended)
- `scripts/deploy-chaincode-corrected.bat` - Uses VERSION file
- `scripts/deploy-chaincode-v1.8.bat` - Fixed v1.8 (legacy)

## Future Versions

### Planned for v1.9
- Enhanced buyer verification
- Automated contract matching
- AI-powered risk assessment

### Planned for v2.0
- Multi-chain support
- Advanced analytics
- Real-time price feeds
