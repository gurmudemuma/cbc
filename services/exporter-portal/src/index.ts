/**
 * Exporter Portal API - Main Entry Point
 *
 * PostgreSQL-Only Version
 *
 * This API serves coffee exporters who are external to the consortium.
 * They use REST API to submit export requests and manage their exports.
 *
 * Key Characteristics:
 * - REST API client
 * - Submit and manage export requests
 * - Read-only queries for own exports
 * - PostgreSQL database backend
 * - Follows REST API best practices
 */

import dotenv from "dotenv";
// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/index";
<<<<<<< HEAD
import { createLogger, httpLogger } from "@shared/logger";
import authRoutes from "./routes/auth.routes";
import exportRoutes from "./routes/export.routes";
import exporterRoutes from "./routes/exporter.routes";
import { getPool } from "@shared/database/pool";
import { errorHandler } from "@shared/middleware/error.middleware";
import { monitoringMiddleware, errorMonitoringMiddleware } from "@shared/middleware/monitoring.middleware";
import {
  applySecurityMiddleware,
  createRateLimiters,
  getCorsConfig,
} from "@shared/security.best-practices";
import { monitoringService } from "@shared/monitoring.service";
=======
import { createLogger, httpLogger } from "../../shared/logger";
import authRoutes from "./routes/auth.routes";
import exportRoutes from "./routes/export.routes";
import exporterRoutes from "./routes/exporter.routes";
import { getPool } from "../../shared/database/pool";
import { errorHandler } from "../../shared/middleware/error.middleware";
import { monitoringMiddleware, errorMonitoringMiddleware } from "../../shared/middleware/monitoring.middleware";
import { monitoringService } from "../../shared/monitoring.service";
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const logger = createLogger('ExporterPortalAPI');
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN.split(","), credentials: true }));

// Body parsing
app.use(express.json({ limit: `${config.MAX_FILE_SIZE_MB}mb` }));
app.use(
  express.urlencoded({ extended: true, limit: `${config.MAX_FILE_SIZE_MB}mb` }),
);

// Logging
app.use(httpLogger('ExporterPortalAPI'));

// Monitoring middleware
app.use(monitoringMiddleware);

// Rate limiting
const authLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.AUTH_RATE_LIMIT_MAX,
  message: "Too many authentication attempts, please try again later",
});

const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests, please try again later",
});

// Routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/exporter", apiLimiter, exporterRoutes);
app.use("/api/exports", apiLimiter, exportRoutes);

// Health check
app.get("/health", async (_req: Request, res: Response) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    const dbStatus = result.rows.length > 0 ? "connected" : "disconnected";

    res.json({
      status: "ok",
      service: "Exporter Portal API",
      version: "1.0.0",
      environment: config.NODE_ENV,
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
      service: "Exporter Portal API",
      database: "disconnected",
    });
  }
});

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

app.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "alive" });
});

// Error monitoring middleware (before error handler)
app.use(errorMonitoringMiddleware);

// Error handling
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  try {
    const pool = getPool();
    await pool.end();
    logger.info("✅ Database pool closed");

    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
const startServer = async () => {
  try {
    logger.info("🚀 Starting Exporter Portal API...");

    // Test database connection
    logger.info('Testing PostgreSQL database connection');
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    logger.info('Connected to PostgreSQL database', {
      timestamp: result.rows[0].now
    });
    monitoringService.recordSystemHealth('database', true);

    // Start Express server
    app.listen(config.PORT, () => {
      logger.info(`✅ Exporter Portal API running on port ${config.PORT}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      logger.info(`📡 Health check: http://localhost:${config.PORT}/health`);
      logger.info(`🎯 Ready for exporter requests!`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    monitoringService.recordSystemHealth('database', false);
    process.exit(1);
  }
};

startServer();
