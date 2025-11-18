# Fabric Network Recovery Checklist

## Error Encountered
```
Error: can't read the block: &{NOT_FOUND}
Client TLS handshake failed
error getting endorser client for channel
```

---

## Pre-Recovery Checklist

- [ ] Verify Docker is running: `docker ps`
- [ ] Verify you're in the correct directory: `pwd` (should end with `/cbc`)
- [ ] Check available disk space: `df -h`
- [ ] Note current time for reference

---

## Recovery Steps

### Step 1: Diagnose Network Status (2 minutes)

```bash
cd network
chmod +x diagnose-network.sh
./diagnose-network.sh
```

**Expected output:**
- [ ] All 7 containers running
- [ ] Network 'coffee-export-network' exists
- [ ] Orderer initialized
- [ ] All peers running
- [ ] All CouchDBs running

**If failures found:**
- [ ] Note which components failed
- [ ] Check container logs: `docker logs <container-name>`
- [ ] Proceed to Step 2

---

### Step 2: Automated Recovery (3 minutes)

```bash
cd network
chmod +x recover-network.sh
./recover-network.sh coffeechannel
```

**Monitor output for:**
- [ ] "Prerequisites check passed"
- [ ] "All containers are running"
- [ ] "Orderer is ready"
- [ ] "Artifacts cleaned"
- [ ] "Genesis block created"
- [ ] "Channel created on orderer"
- [ ] "Peer joining completed"
- [ ] "Network recovery completed!"

**If script fails:**
- [ ] Check error message
- [ ] Review logs: `cat channel-creation.log`
- [ ] Proceed to Step 3

---

### Step 3: Manual Recovery (If Automated Fails)

#### 3a. Stop Network
```bash
cd network
./network.sh down
```

**Verify:**
- [ ] All containers stopped: `docker ps | grep hyperledger` (should be empty)
- [ ] Wait 10 seconds

#### 3b. Start Network
```bash
./network.sh up
```

**Verify:**
- [ ] All containers starting: `docker ps | grep hyperledger`
- [ ] Wait 30 seconds for orderer initialization

#### 3c. Create Channel
```bash
./network.sh createChannel
```

**Verify:**
- [ ] No errors in output
- [ ] Channel block created: `ls -la channel-artifacts/coffeechannel.block`

#### 3d. Deploy Chaincode
```bash
./network.sh deployCC
```

**Verify:**
- [ ] Chaincode deployed successfully
- [ ] No errors in output

---

### Step 4: Verify Recovery

#### 4a. Check Channel on Orderer
```bash
docker exec cli osnadmin channel list \
  -o orderer.coffee-export.com:7053 \
  --ca-file organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem \
  --client-cert organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.crt \
  --client-key organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.key
```

**Expected:**
- [ ] Output contains "Channel ID: coffeechannel"

#### 4b. Check Peers Joined Channel
```bash
export CORE_PEER_LOCALMSPID=ExporterBankMSP
export CORE_PEER_TLS_ROOTCERT_FILE=organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer channel list
```

**Expected:**
- [ ] Output contains "coffeechannel"

#### 4c. Run Diagnostic Again
```bash
./diagnose-network.sh
```

**Expected:**
- [ ] All tests pass
- [ ] No failures reported

---

## Post-Recovery Steps

### Step 5: Start API Server

```bash
cd ../api
npm install
npm start
```

**Verify:**
- [ ] No errors in console
- [ ] Server listening on port 3000 (or configured port)
- [ ] Message: "Server running on..."

### Step 6: Start Frontend

```bash
# In new terminal
cd ../frontend
npm install
npm run dev
```

**Verify:**
- [ ] No errors in console
- [ ] Server listening on port 5173
- [ ] Message: "Local: http://localhost:5173"

### Step 7: Test Application

```bash
# Open browser
http://localhost:5173
```

**Verify:**
- [ ] Application loads without errors
- [ ] No console errors (F12 → Console)
- [ ] Can navigate between pages
- [ ] Can login with test credentials

---

## Troubleshooting If Recovery Fails

### Issue: "NOT_FOUND" Error Persists

**Checklist:**
- [ ] Orderer fully initialized? `docker logs orderer.coffee-export.com | grep "Starting orderer"`
- [ ] Wait 60 seconds and retry
- [ ] Check orderer port: `docker exec orderer.coffee-export.com netstat -tlnp | grep 7053`

**Action:**
```bash
docker restart orderer.coffee-export.com
sleep 30
cd network
./recover-network.sh
```

### Issue: TLS Handshake Failed

**Checklist:**
- [ ] Certificates exist? `ls -la network/organizations/ordererOrganizations/`
- [ ] Certificates mounted? `docker inspect orderer.coffee-export.com | grep -A 20 "Mounts"`
- [ ] Correct paths in docker-compose? `grep -A 5 "volumes:" network/docker/docker-compose.yaml`

**Action:**
```bash
cd network
./network.sh down
sleep 10
./network.sh up
sleep 30
./recover-network.sh
```

### Issue: Connection Refused

**Checklist:**
- [ ] All containers running? `docker ps | grep hyperledger`
- [ ] Network exists? `docker network inspect coffee-export-network`
- [ ] DNS working? `docker exec cli ping orderer.coffee-export.com`

**Action:**
```bash
docker network inspect coffee-export-network
# Check all containers are connected
docker exec cli ping orderer.coffee-export.com
```

### Issue: Peer Not Joining

**Checklist:**
- [ ] Peer running? `docker ps | grep peer0.commercialbank`
- [ ] Peer logs? `docker logs peer0.commercialbank.coffee-export.com | tail -50`
- [ ] Channel exists? `docker exec cli osnadmin channel list ...`

**Action:**
```bash
docker logs peer0.commercialbank.coffee-export.com -f
# Look for errors, then:
cd network
./recover-network.sh
```

---

## Success Criteria

✓ **All Checks Passed:**
- [ ] All 7 containers running
- [ ] Channel 'coffeechannel' exists on orderer
- [ ] All 5 peers joined channel
- [ ] No TLS errors in logs
- [ ] Chaincode deployed
- [ ] API server running
- [ ] Frontend accessible
- [ ] Application loads without errors

---

## Quick Reference Commands

```bash
# Check network status
docker ps | grep hyperledger

# View orderer logs
docker logs orderer.coffee-export.com -f

# View peer logs
docker logs peer0.commercialbank.coffee-export.com -f

# List channels on orderer
docker exec cli osnadmin channel list -o orderer.coffee-export.com:7053 ...

# List channels on peer
peer channel list

# Check network connectivity
docker exec cli ping orderer.coffee-export.com

# Restart orderer
docker restart orderer.coffee-export.com

# Full network reset
cd network && ./network.sh down && sleep 10 && ./network.sh up

# Run diagnostics
cd network && ./diagnose-network.sh

# Run recovery
cd network && ./recover-network.sh
```

---

## Time Estimates

| Step | Time | Notes |
|------|------|-------|
| Diagnose | 2 min | Quick health check |
| Automated Recovery | 3 min | Recommended approach |
| Manual Recovery | 5-10 min | If automated fails |
| Verification | 2 min | Confirm success |
| Start Services | 2 min | API + Frontend |
| **Total** | **~15 min** | Full recovery |

---

## When to Escalate

If after completing all steps you still have issues:

1. **Collect diagnostics:**
   ```bash
   cd network
   ./diagnose-network.sh > diagnostic-report.txt
   docker logs orderer.coffee-export.com > orderer-logs.txt
   docker logs peer0.commercialbank.coffee-export.com > peer-logs.txt
   ```

2. **Review logs:**
   - Check for specific error messages
   - Note timestamps of errors
   - Look for patterns

3. **Consult documentation:**
   - `FABRIC_CHANNEL_CREATION_FIX.md` - Comprehensive guide
   - `QUICK_FABRIC_RECOVERY.md` - Quick reference
   - `FABRIC_ERROR_RESOLUTION_SUMMARY.md` - Overview

4. **Manual investigation:**
   - Check certificate paths
   - Verify docker-compose configuration
   - Test network connectivity manually

---

## Notes

- **Timing is critical:** Always wait 30+ seconds after starting network
- **Logs are helpful:** Check logs early when troubleshooting
- **Network reset works:** If all else fails, full reset usually resolves issues
- **Automation helps:** Use provided scripts for reliable recovery

---

## Completion

- [ ] Recovery completed successfully
- [ ] All verification checks passed
- [ ] Application running and accessible
- [ ] Ready for development/testing

**Date Completed:** _______________
**Time Taken:** _______________
**Notes:** _______________________________________________
