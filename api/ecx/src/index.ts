/**
 * ECX API Server
 * Ethiopian Commodity Exchange API for Coffee Export
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import ecxRoutes from './routes/ecx.routes';
import lotVerificationRoutes from './routes/lot-verification.routes';
<<<<<<< HEAD
import { createLogger } from '@shared/logger';
import { getPool } from '@shared/database/pool';
=======
import { createLogger } from '../../shared/logger';
import { getPool } from '../../shared/database/pool';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

// Load environment variables
dotenv.config();

const logger = createLogger('ECXAPI');
const app: Application = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ECX API',
      version: '1.0.0',
      description: 'Ethiopian Commodity Exchange API for Coffee Export',
      contact: {
        name: 'ECX Support',
        email: 'support@ecx.com.et'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'ECX',
        description: 'ECX lot verification and export creation'
      }
    ]
  },
  apis: ['./src/routes/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    const dbStatus = result.rows.length > 0 ? "connected" : "disconnected";

    res.status(200).json({
      success: true,
      service: 'ECX API',
      status: 'healthy',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      success: false,
      service: 'ECX API',
      status: 'unhealthy',
      database: 'disconnected'
    });
  }
});

app.get('/ready', async (_req: Request, res: Response) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    const isReady = result.rows.length > 0;
    if (isReady) res.status(200).json({ status: "ready" });
    else res.status(503).json({ status: "not ready" });
  } catch (error) {
    res.status(503).json({ status: "not ready" });
  }
});

app.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: "alive" });
});

// API Routes
app.use('/api/ecx', ecxRoutes);
app.use('/api/lot-verification', lotVerificationRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    logger.info('Testing PostgreSQL database connection...');
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    logger.info('Connected to PostgreSQL database successfully', {
      timestamp: result.rows[0].now
    });

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
  const pool = getPool();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  const pool = getPool();
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();

export default app;
