# Sales Contract Workflow - Database Utilities

This directory contains database connection, transaction management, and query utilities for the Sales Contract Workflow feature.

## Overview

The database utilities provide:
- **Connection Management**: Database pool configuration and health monitoring
- **Transaction Management**: Transaction wrappers for multi-step operations
- **Query Utilities**: Common query functions for contract operations
- **Error Handling**: Comprehensive error handling with retry logic

## Architecture

```
database/
├── connection.ts           # Connection pool management
├── contract-transaction.ts # Transaction wrappers
├── contract-queries.ts     # Common query functions
├── init-schema.ts          # Schema initialization
├── index.ts                # Module exports
└── README.md               # This file
```

## Connection Management

### Initialize Database Pool

```typescript
import { initializeContractPool } from './database';

// Initialize the connection pool
const pool = initializeContractPool();
```

### Get Database Pool

```typescript
import { getContractPool } from './database';

// Get the existing pool
const pool = getContractPool();
```

### Test Database Connection

```typescript
import { testDatabaseConnection } from './database';

// Test the connection
const isConnected = await testDatabaseConnection();
```

### Check Database Health

```typescript
import { checkDatabaseHealth } from './database';

// Get detailed health information
const health = await checkDatabaseHealth();
console.log(health);
// {
//   healthy: true,
//   responseTime: 15,
//   poolStats: { totalConnections: 2, idleConnections: 2, waitingRequests: 0 }
// }
```

### Wait for Database Ready

```typescript
import { waitForDatabaseReady } from './database';

// Wait for database to be ready (useful during startup)
await waitForDatabaseReady(10, 1000); // 10 attempts, 1 second delay
```

### Monitor Connection Pool

```typescript
import { startPoolMonitoring, stopPoolMonitoring } from './database';

// Start monitoring (logs stats every 60 seconds)
const monitoringInterval = startPoolMonitoring(60000);

// Stop monitoring
stopPoolMonitoring(monitoringInterval);
```

## Transaction Management

### Basic Transaction

```typescript
import { executeContractTransaction } from './database';

const result = await executeContractTransaction(async (client) => {
  // Your database operations here
  const result = await client.query('SELECT * FROM contract_drafts WHERE draft_id = $1', [draftId]);
  return result.rows[0];
});
```

### Contract Creation Transaction

```typescript
import { executeContractCreationTransaction } from './database';

const contract = await executeContractCreationTransaction(async (client) => {
  // Create contract
  const contractResult = await client.query(
    'INSERT INTO contract_drafts (...) VALUES (...) RETURNING *',
    [...]
  );
  
  // Create history entry
  await client.query(
    'INSERT INTO contract_history (...) VALUES (...)',
    [...]
  );
  
  return contractResult.rows[0];
});
```

### Contract Update Transaction

```typescript
import { executeContractUpdateTransaction } from './database';

const updatedContract = await executeContractUpdateTransaction(async (client) => {
  // Update contract
  const result = await client.query(
    'UPDATE contract_drafts SET ... WHERE draft_id = $1 RETURNING *',
    [draftId, ...]
  );
  
  // Create history entry
  await client.query(
    'INSERT INTO contract_history (...) VALUES (...)',
    [...]
  );
  
  return result.rows[0];
});
```

### Contract Finalization Transaction

```typescript
import { executeContractFinalizationTransaction } from './database';

const finalizedContract = await executeContractFinalizationTransaction(async (client) => {
  // Lock contract for update
  const contract = await lockContractForUpdate(client, draftId);
  
  // Update status and blockchain hash
  const result = await client.query(
    'UPDATE contract_drafts SET status = $1, blockchain_tx_hash = $2 WHERE draft_id = $3 RETURNING *',
    ['FINALIZED', txHash, draftId]
  );
  
  // Create history entry
  await client.query(
    'INSERT INTO contract_history (...) VALUES (...)',
    [...]
  );
  
  return result.rows[0];
});
```

### Transaction with Savepoints

```typescript
import { executeContractTransaction, executeWithSavepoint } from './database';

await executeContractTransaction(async (client) => {
  // Main operation
  await client.query('UPDATE contract_drafts SET ... WHERE draft_id = $1', [draftId]);
  
  // Operation with savepoint (can be rolled back independently)
  try {
    await executeWithSavepoint(client, 'notification_savepoint', async () => {
      await client.query('INSERT INTO contract_notifications (...) VALUES (...)', [...]);
    });
  } catch (error) {
    // Notification failed, but main operation continues
    console.error('Notification failed:', error);
  }
});
```

### Lock Contract for Update

```typescript
import { executeContractTransaction, lockContractForUpdate } from './database';

await executeContractTransaction(async (client) => {
  // Lock the contract to prevent concurrent modifications
  const contract = await lockContractForUpdate(client, draftId);
  
  if (!contract) {
    throw new Error('Contract not found');
  }
  
  // Perform updates
  await client.query('UPDATE contract_drafts SET ... WHERE draft_id = $1', [draftId]);
});
```

### Check if Contract is Locked

```typescript
import { executeContractTransaction, isContractLocked } from './database';

await executeContractTransaction(async (client) => {
  const locked = await isContractLocked(client, draftId);
  
  if (locked) {
    throw new Error('Contract is locked by another transaction');
  }
  
  // Proceed with operation
});
```

## Query Utilities

### Query Contract by ID

```typescript
import { queryContractById } from './database';

const contract = await queryContractById(draftId);
```

### Query Contracts by Exporter

```typescript
import { queryContractsByExporter } from './database';

const result = await queryContractsByExporter(
  exporterId,
  'DRAFT', // Optional status filter
  { page: 1, limit: 10 } // Pagination
);

console.log(result);
// {
//   data: [...],
//   total: 25,
//   page: 1,
//   limit: 10,
//   totalPages: 3
// }
```

### Query Contracts by Buyer

```typescript
import { queryContractsByBuyer } from './database';

const result = await queryContractsByBuyer(
  'buyer@example.com',
  undefined, // No status filter
  { page: 1, limit: 10 }
);
```

### Query Contract History

```typescript
import { queryContractHistory } from './database';

const history = await queryContractHistory(draftId);
```

### Query User Notifications

```typescript
import { queryUserNotifications } from './database';

const result = await queryUserNotifications(
  userId,
  true, // Unread only
  { page: 1, limit: 20 }
);
```

### Count Contracts by Status

```typescript
import { countContractsByStatus } from './database';

const counts = await countContractsByStatus(exporterId);
console.log(counts);
// {
//   DRAFT: 5,
//   COUNTERED: 3,
//   ACCEPTED: 2,
//   FINALIZED: 10,
//   REJECTED: 1
// }
```

### Search Contracts

```typescript
import { searchContracts } from './database';

const result = await searchContracts(
  {
    exporterId: 'exporter-123',
    status: 'FINALIZED',
    coffeeType: 'Arabica',
    minQuantity: 100,
    dateFrom: new Date('2024-01-01'),
  },
  { page: 1, limit: 10 }
);
```

### Get Contract Statistics

```typescript
import { getContractStatistics } from './database';

const stats = await getContractStatistics(exporterId);
console.log(stats);
// {
//   totalContracts: 25,
//   draftContracts: 5,
//   negotiationContracts: 8,
//   finalizedContracts: 10,
//   rejectedContracts: 2,
//   totalValue: 1500000,
//   averageValue: 60000
// }
```

## Error Handling

### Handle Database Errors

```typescript
import { handleDatabaseError, formatErrorResponse } from './database';

try {
  await executeContractTransaction(async (client) => {
    // Database operations
  });
} catch (error) {
  const dbError = handleDatabaseError(error);
  const errorResponse = formatErrorResponse(dbError);
  
  res.status(errorResponse.status).json({
    error: errorResponse.code,
    message: errorResponse.message,
  });
}
```

### Retry on Connection Errors

```typescript
import { executeWithRetry } from './database';

const result = await executeWithRetry(
  async () => {
    const pool = getContractPool();
    const result = await pool.query('SELECT * FROM contract_drafts WHERE draft_id = $1', [draftId]);
    return result.rows[0];
  },
  {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
  }
);
```

## Configuration

### Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Docker Setup

The database is configured in `docker-compose-hybrid.yml`:

```yaml
postgres:
  image: postgres:14-alpine
  container_name: coffee-postgres
  environment:
    POSTGRES_DB: coffee_export_db
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  ports:
    - "5432:5432"
  volumes:
    - postgres-data:/var/lib/postgresql/data
```

## Best Practices

### 1. Always Use Transactions for Multi-Step Operations

```typescript
// ✅ Good
await executeContractCreationTransaction(async (client) => {
  await client.query('INSERT INTO contract_drafts ...');
  await client.query('INSERT INTO contract_history ...');
});

// ❌ Bad
const pool = getContractPool();
await pool.query('INSERT INTO contract_drafts ...');
await pool.query('INSERT INTO contract_history ...'); // Not atomic!
```

### 2. Use Appropriate Isolation Levels

```typescript
// For critical operations (finalization)
await executeContractFinalizationTransaction(async (client) => {
  // Uses SERIALIZABLE isolation
});

// For regular operations (updates)
await executeContractUpdateTransaction(async (client) => {
  // Uses READ COMMITTED isolation
});
```

### 3. Lock Contracts to Prevent Concurrent Modifications

```typescript
await executeContractTransaction(async (client) => {
  const contract = await lockContractForUpdate(client, draftId);
  // Contract is now locked until transaction completes
});
```

### 4. Use Retry Logic for Connection Errors

```typescript
// Transactions automatically retry on connection errors
await executeContractTransaction(async (client) => {
  // Operations here will be retried on connection errors
}, {
  retryOnFailure: true,
  retryConfig: { maxAttempts: 3 }
});
```

### 5. Monitor Connection Pool Health

```typescript
// Start monitoring during application startup
const monitoringInterval = startPoolMonitoring(60000);

// Stop monitoring during shutdown
process.on('SIGTERM', () => {
  stopPoolMonitoring(monitoringInterval);
});
```

### 6. Handle Errors Gracefully

```typescript
try {
  await executeContractTransaction(async (client) => {
    // Operations
  });
} catch (error) {
  const dbError = handleDatabaseError(error);
  
  if (dbError instanceof DuplicateKeyError) {
    // Handle duplicate key
  } else if (dbError instanceof ConnectionError) {
    // Handle connection error
  } else {
    // Handle other errors
  }
}
```

## Testing

### Test Database Connection

```typescript
import { testDatabaseConnection } from './database';

describe('Database Connection', () => {
  it('should connect to database', async () => {
    const isConnected = await testDatabaseConnection();
    expect(isConnected).toBe(true);
  });
});
```

### Test Transactions

```typescript
import { executeContractTransaction } from './database';

describe('Contract Transactions', () => {
  it('should rollback on error', async () => {
    await expect(
      executeContractTransaction(async (client) => {
        await client.query('INSERT INTO contract_drafts ...');
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');
    
    // Verify rollback
    const contract = await queryContractById(draftId);
    expect(contract).toBeNull();
  });
});
```

## Troubleshooting

### Connection Pool Exhausted

If you see "Connection pool exhausted" errors:

1. Check for connection leaks (unreleased clients)
2. Increase `DB_POOL_MAX` in environment variables
3. Monitor pool statistics with `startPoolMonitoring()`

### Transaction Deadlocks

If you see deadlock errors:

1. Ensure consistent lock ordering
2. Use `lockContractForUpdate()` to prevent concurrent modifications
3. Consider using `SERIALIZABLE` isolation level

### Slow Queries

If queries are slow:

1. Check database indexes (see `init-schema.ts`)
2. Use `EXPLAIN ANALYZE` to analyze query plans
3. Consider adding additional indexes for common queries

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg) Documentation](https://node-postgres.com/)
- [Database Transaction Best Practices](https://www.postgresql.org/docs/current/tutorial-transactions.html)
