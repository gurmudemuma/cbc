import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import authRoutes from './routes/auth.routes';
import exportRoutes from './routes/export.routes';
import shipmentRoutes from './routes/shipment.routes';
import bookingsRoutes from './routes/bookings.routes';
import { errorHandler } from '../../shared/middleware/error.middleware';
import { FabricGateway } from './fabric/gateway';
import { initializeWebSocket } from '../../shared/websocket.service';
import { envValidator } from '../../shared/env.validator';
import { createLogger, httpLogger } from '../../shared/logger';
import {
  applySecurityMiddleware,
  createRateLimiters,
  getCorsConfig,
} from '../../shared/security.best-practices';
import { monitoringService } from '../../shared/monitoring.service';
import {
  monitoringMiddleware,
  errorMonitoringMiddleware,
} from '../../shared/middleware/monitoring.middleware';

// Initialize logger
const logger = createLogger('ShippingLineAPI');

// Validate environment variables before starting
try {
  envValidator.validate();
  envValidator.printSummary();
} catch (error) {
  logger.error('Environment validation failed', { error });
  process.exit(1);
}

const app: Application = express();
const config = envValidator.getConfig();
const PORT = config.PORT;

// Apply security middleware (Helmet, CORS, custom headers)
applySecurityMiddleware(app, {
  corsOrigins: config.CORS_ORIGIN,
  enableHelmet: true,
  enableRateLimiting: true,
  isProduction: config.NODE_ENV === 'production',
});

// CORS configuration
app.use(cors(getCorsConfig(config.CORS_ORIGIN)));

// Request logging
app.use(httpLogger('ShippingLineAPI'));

// Monitoring middleware
app.use(monitoringMiddleware as any);

// Body parsing with size limits
const maxSize = `${config.MAX_FILE_SIZE_MB}mb`;
app.use(express.json({ limit: maxSize }));
app.use(express.urlencoded({ extended: true, limit: maxSize }));

// Rate limiting
const { authLimiter, apiLimiter } = createRateLimiters();

// Initialize Fabric Gateway
const fabricGateway = FabricGateway.getInstance();

// Routes with rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/exports', apiLimiter, exportRoutes);
app.use('/api/shipments', apiLimiter, shipmentRoutes);
app.use('/api/bookings', apiLimiter, bookingsRoutes);

// Health check with detailed status
app.get('/health', async (_req: Request, res: Response) => {
  const fabricStatus = fabricGateway.isConnected() ? 'connected' : 'disconnected';

  res.json({
    status: 'ok',
    service: 'Shipping Line API',
    version: '1.0.0',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    fabric: fabricStatus,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  const isReady = fabricGateway.isConnected();
  if (isReady) res.status(200).json({ status: 'ready' });
  else res.status(503).json({ status: 'not ready' });
});

app.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

// Error monitoring middleware (before error handler)
app.use(errorMonitoringMiddleware);

// Error handling
app.use(errorHandler);

// Create HTTP server and initialize WebSocket
const httpServer = createServer(app);
const websocketService = initializeWebSocket(httpServer);

// Start server
httpServer.listen(PORT, async () => {
  logger.info('Shipping Line API server starting', {
    port: PORT,
    environment: config.NODE_ENV,
    organization: config.ORGANIZATION_NAME,
    websocket: config.WEBSOCKET_ENABLED ? 'Enabled' : 'Disabled',
  });

  try {
    logger.info('Connecting to Hyperledger Fabric network');
    await fabricGateway.connect();
    logger.info('Connected to Hyperledger Fabric network', {
      channel: config.CHANNEL_NAME,
      chaincode: config.CHAINCODE_NAME_EXPORT,
    });
    monitoringService.recordSystemHealth('blockchain', true);
  } catch (error) {
    logger.error('Failed to connect to Fabric network', { error });
    logger.warn('⚠️  Fabric network connection failed - API will start in degraded mode');
    logger.warn('⚠️  Blockchain operations will not be available');
    monitoringService.recordSystemHealth('blockchain', false);
  }

  logger.info('Server is ready to accept requests');
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info('Shutdown signal received', { signal });

  // Stop accepting new requests
  httpServer.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close WebSocket connections
      if (websocketService) {
        websocketService.close();
      }
      logger.info('WebSocket service closed');

      // Disconnect from Fabric
      await fabricGateway.disconnect();
      logger.info('Fabric gateway disconnected');

      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  gracefulShutdown('unhandledRejection');
});

export default app;
