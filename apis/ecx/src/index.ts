/**
 * ECX API Server
 * Ethiopian Commodity Exchange API for Coffee Export Blockchain
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports
dotenv.config();

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import ecxRoutes from './routes/ecx.routes';
import lotVerificationRoutes from './routes/lot-verification.routes';
import { fabricService } from './services/fabric.service';
import { logger as customLogger } from './utils/logger';
import { envValidator } from '../../shared/env.validator';
import { applySecurityMiddleware, createRateLimiters } from '../../shared/security.best-practices';

// Initialize logger (using the shared logger would be better)
const logger = customLogger;

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
const PORT = config.PORT || 3006;

// Apply security middleware (Helmet, CORS, custom headers)
applySecurityMiddleware(app, {
  corsOrigins: config.CORS_ORIGIN,
  enableHelmet: true,
  enableRateLimiting: true,
  isProduction: config.NODE_ENV === 'production',
});

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Rate limiting
const { apiLimiter } = createRateLimiters();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ECX API',
      version: '1.0.0',
      description: 'Ethiopian Commodity Exchange API for Coffee Export Blockchain',
      contact: {
        name: 'ECX Support',
        email: 'support@ecx.com.et',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'ECX',
        description: 'ECX lot verification and export creation',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'ECX API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes with standardized RESTful prefixes and rate limiting
app.use('/api/warehouse', apiLimiter, ecxRoutes); // For warehouse-related operations
app.use('/api/lots', apiLimiter, lotVerificationRoutes); // For lot verification operations

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
async function startServer() {
  try {
    // Connect to Fabric network
    logger.info('Connecting to Fabric network...');
    await fabricService.connect();
    logger.info('Connected to Fabric network successfully');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`ECX API server running on port ${PORT}`);
      logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await fabricService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await fabricService.disconnect();
  process.exit(0);
});

// Start the server
startServer();

export default app;
