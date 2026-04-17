# Hybrid Data Service - Quick Start Guide

## What is it?
A service that automatically writes data to both PostgreSQL (primary) and Blockchain (audit trail) while handling failures gracefully.

## When to use it?
Use the hybrid service for ANY operation that needs to be recorded in both systems:
- User registration
- Contract finalization
- Document issuance
- Status updates
- Any critical business transaction

## Basic Usage

### 1. Import the Service
```javascript
const hybridDataService = require('../services/hybrid-data-service');
```

### 2. Write User Data
```javascript
const userData = {
  username: 'exporter1',
  passwordHash: hashedPassword,
  email: 'user@example.com',
  phone: '+251911234567',
  companyName: 'Coffee Co',
  tin: '1234567890',
  capitalETB: 20000000,
  role: 'exporter',
  status: 'approved'
};

const results = await hybridDataService.writeUser(userData);

// Check results
if (!results.postgres) {
  // PostgreSQL write failed - this is critical
  return res.status(500).json({ error: 'Registration failed' });
}

// PostgreSQL succeeded, blockchain may or may not have succeeded
console.log('PostgreSQL:', results.postgres ? 'SUCCESS' : 'FAILED');
console.log('Blockchain:', results.blockchain ? 'SUCCESS' : 'FAILED');
console.log('Errors:', results.errors);
```

### 3. Write Contract Data
```javascript
const contractData = {
  draftId: 'draft-123',
  contractId: 'contract-456',
  ectaReferenceNumber: 'ECTA-SC-20260416-12345',
  exporterId: 'exp-uuid',
  buyerId: 'buyer-uuid',
  coffeeType: 'Arabica',
  quantity: 1000,
  unitPrice: 5.50,
  totalValue: 5500,
  currency: 'USD',
  status: 'FINALIZED'
};

const results = await hybridDataService.writeContract(contractData);

// Always check PostgreSQL result
if (!results.postgres) {
  return res.status(500).json({ error: 'Contract finalization failed' });
}
```

### 4. Read User Data
```javascript
// Fast read from PostgreSQL
const user = await hybridDataService.readUser('exporter1');

// Read with blockchain verification (slower but verified)
hybridDataService.readSource = 'both';
const verifiedUser = await hybridDataService.readUser('exporter1');
hybridDataService.readSource = 'postgres'; // Reset
```

### 5. Background Sync
```javascript
// Sync missing users to blockchain
const results = await hybridDataService.syncMissingRecords('users');
console.log(`Synced: ${results.synced}, Skipped: ${results.skipped}, Failed: ${results.failed}`);

// Sync missing contracts
const contractResults = await hybridDataService.syncMissingRecords('contracts');
```

## Response Format

### Write Operations
```javascript
{
  postgres: <result object or null>,
  blockchain: <transaction ID or null>,
  errors: [
    { source: 'postgres', error: 'error message' },
    { source: 'blockchain', error: 'error message' }
  ]
}
```

### Read Operations
```javascript
// Returns the data object or null
{
  username: 'exporter1',
  email: 'user@example.com',
  // ... other fields
}
```

### Sync Operations
```javascript
{
  synced: 10,    // Successfully synced to blockchain
  skipped: 140,  // Already on blockchain
  failed: 0      // Failed to sync
}
```

## Error Handling

### Pattern 1: Critical PostgreSQL Write
```javascript
const results = await hybridDataService.writeUser(userData);

if (!results.postgres) {
  // PostgreSQL failed - operation failed
  console.error('PostgreSQL write failed:', results.errors);
  return res.status(500).json({ error: 'Operation failed' });
}

// PostgreSQL succeeded - operation succeeded
// Blockchain failure is logged but not critical
if (!results.blockchain) {
  console.warn('Blockchain sync failed, will retry later');
}

return res.json({ success: true, syncStatus: results });
```

### Pattern 2: Best Effort Blockchain
```javascript
try {
  const results = await hybridDataService.writeContract(contractData);
  
  return res.json({
    success: true,
    message: results.blockchain 
      ? 'Contract finalized and synced to blockchain'
      : 'Contract finalized, blockchain sync pending',
    syncStatus: {
      postgres: !!results.postgres,
      blockchain: !!results.blockchain
    }
  });
} catch (error) {
  console.error('Hybrid write error:', error);
  return res.status(500).json({ error: error.message });
}
```

## Configuration

### Environment Variables
```bash
# .env file
HYBRID_WRITE_MODE=dual              # dual, postgres-only, blockchain-only
HYBRID_READ_SOURCE=postgres         # postgres, blockchain, both
HYBRID_SYNC_ENABLED=true            # true, false
```

### Runtime Configuration
```javascript
// Change write mode (not recommended in production)
hybridDataService.writeMode = 'postgres-only';

// Change read source temporarily
const original = hybridDataService.readSource;
hybridDataService.readSource = 'both';
const data = await hybridDataService.readUser('user1');
hybridDataService.readSource = original;
```

## Monitoring

### Get Statistics
```javascript
const stats = hybridDataService.getStats();
console.log('Dual writes:', stats.dualWrites);
console.log('Errors:', stats.errors);
console.log('Error rate:', stats.errors / stats.dualWrites);
```

### API Endpoint (Admin Only)
```bash
GET /api/hybrid/stats
Authorization: Bearer <admin-token>
```

## Common Patterns

### Pattern: User Registration
```javascript
router.post('/register', async (req, res) => {
  const { username, password, email, companyName } = req.body;
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Prepare user data
  const userData = {
    username,
    passwordHash,
    email,
    companyName,
    role: 'exporter',
    status: 'approved'
  };
  
  // Hybrid write
  const results = await hybridDataService.writeUser(userData);
  
  // Check critical result
  if (!results.postgres) {
    return res.status(500).json({ error: 'Registration failed' });
  }
  
  // Return success with sync status
  res.json({
    success: true,
    user: { username, email },
    syncStatus: {
      postgres: true,
      blockchain: !!results.blockchain,
      errors: results.errors
    }
  });
});
```

### Pattern: Contract Finalization
```javascript
router.post('/:id/finalize', async (req, res) => {
  const { id } = req.params;
  
  // Get contract from database
  const contract = await getContract(id);
  
  // Prepare contract data
  const contractData = {
    contractId: contract.id,
    exporterId: contract.exporter_id,
    buyerId: contract.buyer_id,
    status: 'FINALIZED',
    // ... other fields
  };
  
  // Hybrid write
  const results = await hybridDataService.writeContract(contractData);
  
  // Check result
  if (!results.postgres) {
    return res.status(500).json({ error: 'Finalization failed' });
  }
  
  // Update database with blockchain TX ID if available
  if (results.blockchain) {
    await updateBlockchainTxId(id, results.blockchain);
  }
  
  res.json({
    success: true,
    contract: contractData,
    blockchainTxId: results.blockchain
  });
});
```

## Testing

### Test Blockchain Failure
```bash
# Set environment to postgres-only mode
HYBRID_WRITE_MODE=postgres-only npm start

# Or stop blockchain network
docker stop peer0.ecta.coffee.com
```

### Test PostgreSQL Failure
```bash
# Stop PostgreSQL
docker stop coffee-postgres

# Verify system returns proper errors
```

### Test Dual-Write Success
```bash
# Normal mode
HYBRID_WRITE_MODE=dual npm start

# Register user and check both systems
curl -X POST http://localhost:3000/api/auth/register -d '{...}'

# Verify in PostgreSQL
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT * FROM users WHERE username='test';"

# Verify on blockchain
docker exec coffee-cli peer chaincode query -C coffeechannel -n ecta -c '{"Args":["GetUser","test"]}'
```

## Troubleshooting

### Issue: Blockchain writes always fail
**Check:**
1. Is blockchain network running? `docker ps | grep peer`
2. Is chaincode installed? `docker exec coffee-cli peer chaincode list --installed`
3. Check logs: `docker logs coffee-gateway`

### Issue: High error rate
**Check:**
1. View stats: `GET /api/hybrid/stats`
2. Check error details in logs
3. Run manual sync: `POST /api/hybrid/sync/users`

### Issue: Data inconsistency
**Check:**
1. Read with verification: `GET /api/hybrid/user/:username?verify=true`
2. Check sync status: `GET /api/hybrid/stats`
3. Run manual sync for entity type

## Best Practices

1. ✅ **Always check `results.postgres`** - It's your primary data store
2. ✅ **Log blockchain failures** - But don't fail the operation
3. ✅ **Include sync status in responses** - Helps with debugging
4. ✅ **Run periodic syncs** - Schedule daily sync operations
5. ✅ **Monitor statistics** - Watch error rates and sync operations
6. ❌ **Don't bypass the service** - Always use hybrid service for writes
7. ❌ **Don't wait for blockchain** - It's async by design
8. ❌ **Don't fail on blockchain errors** - PostgreSQL is primary

## Summary

The hybrid service makes it easy to maintain data in both PostgreSQL and Blockchain:
- **Simple API**: Just call `writeUser()` or `writeContract()`
- **Automatic handling**: Writes to both systems automatically
- **Graceful failures**: System works even if blockchain fails
- **Full observability**: Statistics and monitoring built-in

**Remember**: PostgreSQL is primary, Blockchain is audit trail. System must work even if blockchain is down.
