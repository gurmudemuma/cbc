import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { logger } from '../../shared/logger';
import qualityRoutes from './routes/quality.routes';
import licenseRoutes from './routes/license.routes';
import contractRoutes from './routes/contract.routes';
import authRoutes from './routes/auth.routes';
import exportRoutes from './routes/export.routes';
import preregistrationRoutes from './routes/preregistration.routes';
import exporterRoutes from './routes/exporter.routes';
import notificationsRoutes from './routes/notifications.routes';
import { createAuditRoutes } from './routes/audit.routes';
import { createStateMachineRoutes } from './routes/stateMachine.routes';
import { errorHandler } from './middleware/error.middleware';
import { FabricGateway } from './fabric/gateway';
import { initializeWebSocket } from '../../shared/websocket.service';
import { envValidator } from '../../shared/env.validator';
import { AuditService } from '../../shared/auditService';
import {
  applySecurityMiddleware,
  createRateLimiters,
  getCorsConfig,
} from '../../shared/security.best-practices';

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
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing with size limits
const maxSize = `${config.MAX_FILE_SIZE_MB}mb`;
app.use(express.json({ limit: maxSize }));
app.use(express.urlencoded({ extended: true, limit: maxSize }));

// Rate limiting
const { authLimiter, apiLimiter } = createRateLimiters();

// Initialize Fabric Gateway
const fabricGateway = FabricGateway.getInstance();

// Initialize services
const auditService = new AuditService();

// Create route instances
const auditRoutesInstance = createAuditRoutes(auditService);
const stateMachineRoutesInstance = createStateMachineRoutes();

// Routes with rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/licenses', apiLimiter, licenseRoutes);
app.use('/api/quality', apiLimiter, qualityRoutes);
app.use('/api/contracts', apiLimiter, contractRoutes);
app.use('/api/preregistration', apiLimiter, preregistrationRoutes);
app.use('/api/exports', apiLimiter, exportRoutes);
app.use('/api/exporter', apiLimiter, exporterRoutes);
app.use('/api/notifications', apiLimiter, notificationsRoutes);
app.use('/api/audit', apiLimiter, auditRoutesInstance);
app.use('/api/state-machine', apiLimiter, stateMachineRoutesInstance);

// Health check with detailed status
app.get('/health', async (_req: Request, res: Response) => {
  const fabricStatus = fabricGateway.isConnected() ? 'connected' : 'disconnected';

  res.json({
    status: 'ok',
    service: 'ECTA API',
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

// Ready check (for Kubernetes)
app.get('/ready', async (_req: Request, res: Response) => {
  const isReady = fabricGateway.isConnected();

  if (isReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

// Liveness check (for Kubernetes)
app.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

// Error handling
app.use(errorHandler);

// Create HTTP server and initialize WebSocket
const httpServer = createServer(app);
const websocketService = initializeWebSocket(httpServer);

// Start server
httpServer.listen(PORT, async () => {
  logger.info('ECTA API server running', {
    port: PORT,
    environment: config.NODE_ENV,
    organization: config.ORGANIZATION_NAME,
    websocket: config.WEBSOCKET_ENABLED ? 'Enabled' : 'Disabled'
  });

  try {
    logger.info('Connecting to Hyperledger Fabric network...');
    await fabricGateway.connect();
    logger.info('Connected to Hyperledger Fabric network', {
      channel: config.CHANNEL_NAME,
      chaincode: config.CHAINCODE_NAME_EXPORT
    });
  } catch (error) {
    logger.error('Failed to connect to Hyperledger Fabric network', { error });
    logger.error('Please ensure the Fabric network is running');
    process.exit(1);
  }

  logger.info('Server is ready to accept requests');
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  // Stop accepting new requests
  httpServer.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close WebSocket connections
      websocketService.close();
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
  logger.error('Unhandled Rejection', { promise, reason });
  gracefulShutdown('unhandledRejection');
});

export default app;
