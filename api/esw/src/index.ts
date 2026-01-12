/**
 * ESW (Electronic Single Window) API Server
 * Port: 3008
 */

import dotenv from "dotenv";
// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import { createServer } from "http";
import eswRoutes from "./routes/esw.routes";
import { errorHandler } from "@shared/middleware/error.middleware";
import { createLogger, httpLogger } from "@shared/logger";
import {
  applySecurityMiddleware,
  createRateLimiters,
  getCorsConfig,
} from "@shared/security.best-practices";
import { getPool, closePool } from "@shared/database/pool";

// Initialize logger
const logger = createLogger('ESW-API');

const app: Application = express();
const PORT = process.env.ESW_API_PORT || 3008;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '50mb';

// Apply security middleware (Helmet, CORS, custom headers)
applySecurityMiddleware(app, {
  corsOrigins: CORS_ORIGIN,
  enableHelmet: true,
  enableRateLimiting: true,
  isProduction: NODE_ENV === "production",
});

// CORS configuration
app.use(cors(getCorsConfig(CORS_ORIGIN)));

// Request logging
app.use(httpLogger('ESW-API'));

// Body parsing with size limits
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_FILE_SIZE }));

// Rate limiting
const { apiLimiter } = createRateLimiters();

// Routes with rate limiting
app.use("/api/esw", apiLimiter, eswRoutes);

// Health check with detailed status
app.get("/health", async (_req: Request, res: Response) => {
  try {
    // Test database connection
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    const dbStatus = result.rows.length > 0 ? "connected" : "disconnected";

    res.json({
      status: "ok",
      service: "ESW API",
      version: "1.0.0",
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: "MB",
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: "error",
      service: "ESW API",
      database: "disconnected",
    });
  }
});

// Ready check (for Kubernetes)
app.get("/ready", async (_req: Request, res: Response) => {
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

// Liveness check (for Kubernetes)
app.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "alive" });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: _req.path,
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Start server
httpServer.listen(PORT, async () => {
  logger.info('ESW API server starting', {
    port: PORT,
    environment: NODE_ENV
  });

  try {
    logger.info('Testing PostgreSQL database connection');
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    logger.info('Connected to PostgreSQL database', {
      timestamp: result.rows[0].now
    });
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL database', { error });
    logger.warn('⚠️  Database connection failed - API will start in degraded mode');
  }

  logger.info('Server is ready to accept requests');
  console.log(`🚀 ESW API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info('Shutdown signal received', { signal });

  // Stop accepting new requests
  httpServer.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database pool
      await closePool();
      logger.info('Database pool closed');

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
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("uncaughtException", (error) => {
  logger.error('Uncaught Exception', { error });
  gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  gracefulShutdown("unhandledRejection");
});

export default app;

