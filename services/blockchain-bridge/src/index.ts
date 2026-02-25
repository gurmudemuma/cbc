/**
 * Blockchain Bridge Service
 * Synchronizes data between Hyperledger Fabric and CBC PostgreSQL
 */

import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { FabricEventListener } from './services/fabric-event-listener';
import { DataSyncService } from './services/data-sync-service';
import { ReconciliationService } from './services/reconciliation-service';
import { KafkaProducer } from './services/kafka-producer';
import { KafkaConsumer } from './services/kafka-consumer';
import { HealthCheckService } from './services/health-check';
import { UserSyncService } from './services/user-sync-service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = await HealthCheckService.check();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  const metrics = await HealthCheckService.getMetrics();
  res.json(metrics);
});

// Sync status endpoint
app.get('/sync/status', async (req, res) => {
  const status = await DataSyncService.getStatus();
  res.json(status);
});

// Manual reconciliation trigger
app.post('/reconcile/trigger', async (req, res) => {
  try {
    logger.info('Manual reconciliation triggered');
    await ReconciliationService.runReconciliation();
    res.json({ success: true, message: 'Reconciliation started' });
  } catch (error: any) {
    logger.error('Manual reconciliation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Retry failed syncs
app.post('/sync/retry', async (req, res) => {
  try {
    const { syncId } = req.body;
    await DataSyncService.retryFailedSync(syncId);
    res.json({ success: true, message: 'Retry initiated' });
  } catch (error: any) {
    logger.error('Retry failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// User sync endpoints
app.post('/users/sync', async (req, res) => {
  try {
    const { username } = req.body;
    if (username) {
      await UserSyncService.syncUserToBlockchain(username);
      res.json({ success: true, message: `User ${username} synced` });
    } else {
      await UserSyncService.syncAllUsers();
      res.json({ success: true, message: 'All users synced' });
    }
  } catch (error: any) {
    logger.error('User sync failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/users/initialize', async (req, res) => {
  try {
    await UserSyncService.initializeTestUsers();
    res.json({ success: true, message: 'Test users initialized' });
  } catch (error: any) {
    logger.error('User initialization failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize services with retry logic
async function initialize() {
  const MAX_RETRIES = 10;
  const INITIAL_DELAY = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Initializing Blockchain Bridge Service... (Attempt ${attempt}/${MAX_RETRIES})`);

      // Initialize Redis
      logger.info('Initializing Redis...');
      const { RedisClient } = await import('./clients/redis-client');
      await RedisClient.connect();

      // Initialize Kafka
      logger.info('Initializing Kafka...');
      await KafkaProducer.connect();
      await KafkaConsumer.connect();

      // Initialize Fabric Event Listener
      logger.info('Initializing Fabric Event Listener...');
      await FabricEventListener.start();

      // Initialize Data Sync Service
      logger.info('Initializing Data Sync Service...');
      await DataSyncService.start();

      // Initialize Reconciliation Service
      logger.info('Initializing Reconciliation Service...');
      await ReconciliationService.start();

      // Initialize test users
      logger.info('Initializing test users...');
      await UserSyncService.initializeTestUsers();

      logger.info('All services initialized successfully');
      return; // Success, exit retry loop
    } catch (error) {
      logger.error(`Initialization failed (Attempt ${attempt}/${MAX_RETRIES}):`, error);
      
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_DELAY * Math.pow(1.5, attempt - 1);
        logger.info(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error('Max retries reached. Exiting...');
        process.exit(1);
      }
    }
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down Blockchain Bridge Service...');

  try {
    await FabricEventListener.stop();
    await DataSyncService.stop();
    await ReconciliationService.stop();
    await KafkaProducer.disconnect();
    await KafkaConsumer.disconnect();

    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Shutdown error:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(PORT, async () => {
  logger.info(`Blockchain Bridge Service running on port ${PORT}`);
  await initialize();
});

export default app;
