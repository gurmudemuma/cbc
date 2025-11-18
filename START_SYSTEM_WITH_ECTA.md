# 🚀 Start System with ECTA Standardization

## Quick Start (5 minutes)

### Step 1: Regenerate ECTA Crypto Material
```bash
cd /home/gu-da/cbc/network
./regenerate-ncat-complete.sh
```

**What this does:**
- Stops the network
- Removes old ECTA directories
- Fixes permissions
- Regenerates ECTA crypto material
- Regenerates connection profiles

**Expected output:**
```
✅ NCAT Crypto Regeneration Complete!
```

### Step 2: Start the System
```bash
cd /home/gu-da/cbc
npm start --clean
```

**Expected output:**
```
✅ System Started Successfully! 🎉
```

### Step 3: Verify All Services
```bash
# Check all 5 peers
docker ps | grep "peer0.*coffee-export.com" | wc -l
# Should show: 5

# Check all 5 APIs
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health  # ECTA API
curl http://localhost:3004/health
curl http://localhost:3005/health
```

## System Architecture (ECTA Standardized)

```
Coffee Export Consortium Blockchain
├── 5 Organizations
│   ├── commercialbank (Port 7051)
│   ├── NationalBank (Port 8051)
│   ├── ECTA (Port 9051) ← Quality Certification Authority
│   ├── ShippingLine (Port 10051)
│   └── CustomAuthorities (Port 11051)
├── 5 API Services
│   ├── commercialbank API (Port 3001)
│   ├── National Bank API (Port 3002)
│   ├── ECTA API (Port 3003)
│   ├── Shipping Line API (Port 3004)
│   └── Custom Authorities API (Port 3005)
├── Blockchain Network
│   ├── Channel: coffeechannel
│   ├── Chaincodes: coffee-export, user-management
│   └── Orderer: orderer.coffee-export.com
└── Supporting Services
    ├── IPFS (Port 5001)
    └── CouchDB (Ports 5984, 6984, 7984, 8984, 9984)
```

## Test User Credentials

After system startup, use these credentials to login:

| Organization | Username | Password | Role |
|--------------|----------|----------|------|
| commercialbank | exporter1 | Exporter123!@# | exporter |
| National Bank | banker1 | Banker123!@# | bank |
| ECTA | inspector1 | Inspector123!@# | user |
| Shipping Line | shipper1 | Shipper123!@# | shipper |
| Custom Authorities | custom1 | Custom123!@# | customs |

## Troubleshooting

### Issue: "ECTA crypto material not found"

**Solution:**
```bash
cd /home/gu-da/cbc/network
./regenerate-ncat-complete.sh
```

### Issue: "Port already in use"

**Solution:**
```bash
# Kill existing processes
pkill -f 'npm run dev'
pkill -f 'ipfs daemon'

# Restart
npm start --clean
```

### Issue: "Channel creation failed"

**Solution:**
```bash
# Full reset
cd /home/gu-da/cbc/network
./network.sh down
sleep 10
./network.sh up
sleep 30
./network.sh createChannel
```

## Verification Checklist

After startup, verify:

- [ ] All 5 peer containers running
- [ ] Channel 'coffeechannel' created
- [ ] Chaincodes deployed
- [ ] All 5 APIs responding to health checks
- [ ] IPFS daemon running
- [ ] Test users can login
- [ ] Blockchain transactions working

## Key Changes from NCAT to ECTA

| Item | Old | New |
|------|-----|-----|
| Organization Name | NCAT | ECTA |
| MSP ID | NCATMSP | ECTAMSP |
| Domain | ncat.coffee-export.com | ecta.coffee-export.com |
| Peer Name | peer0.ncat.coffee-export.com | peer0.ecta.coffee-export.com |
| Crypto Config | crypto-config-ncat.yaml | crypto-config-ecta.yaml |
| API Port | 3003 | 3003 (same) |

## System Status

After successful startup, you should see:

```
Services Running:
• Blockchain Network: ✓
• Channel: coffeechannel
• Chaincodes: coffee-export, user-management
• commercialbank API: http://localhost:3001
• National Bank API: http://localhost:3002
• ECTA API: http://localhost:3003
• Shipping Line API: http://localhost:3004
• Custom Authorities API: http://localhost:3005
• IPFS API: http://localhost:5001
```

## Next Steps

1. **Access the Application:**
   ```
   http://localhost:5173
   ```

2. **Login with Test Credentials:**
   - Use any of the test user credentials above

3. **Test Blockchain Operations:**
   - Create export records
   - Submit for quality certification (ECTA)
   - Process customs clearance
   - Track shipments

## Support

For detailed information, see:
- `ECTA_STANDARDIZATION_COMPLETE.md` - Standardization details
- `SYSTEM_STATUS_AND_FIXES.md` - System status overview
- `QUICK_FABRIC_RECOVERY.md` - Recovery procedures

---

**Ready to start? Run:**
```bash
cd /home/gu-da/cbc && npm start --clean
```
