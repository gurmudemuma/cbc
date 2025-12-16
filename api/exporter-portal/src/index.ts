/**
 * Exporter Portal API - Main Entry Point
 *
 * EXTERNAL ENTITY - Uses Fabric SDK (No Peer Node)
 *
 * This API serves coffee exporters who are external to the consortium.
 * They use the Fabric SDK to submit transactions to the blockchain network
 * through the Commercial Bank's peer as a gateway.
 *
 * Key Characteristics:
 * - SDK-based client (no peer node running)
 * - Submit-only access for creating export requests
 * - Read-only queries for own exports
 * - Connects via Commercial Bank's peer
 * - Follows Hyperledger Fabric best practices for external entities
 */

import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { logger } from "./config/logger";
import { FabricSDKGateway } from "./fabric/sdk-gateway";
import authRoutes from "./routes/auth.routes";
import exportRoutes from "./routes/export.routes";
import exporterRoutes from "./routes/exporter.routes";

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
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

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

// Initialize Fabric SDK Gateway
const fabricGateway = FabricSDKGateway.getInstance();

// Routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
// Preregistration compatibility mount removed — exporter routes now fully replace preregistration
app.use("/api/exporter", apiLimiter, exporterRoutes);
app.use("/api/exports", apiLimiter, exportRoutes);

// Health check
app.get("/health", async (_req: Request, res: Response) => {
  const sdkStatus = fabricGateway.isGatewayConnected()
    ? "connected"
    : "disconnected";

  res.json({
    status: "ok",
    service: "Exporter Portal API (SDK Client)",
    version: "1.0.0",
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    sdk: sdkStatus,
    mode: "External Entity - No Peer Node",
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: "MB",
    },
  });
});

app.get("/ready", async (_req: Request, res: Response) => {
  const isReady = fabricGateway.isGatewayConnected();
  if (isReady) res.status(200).json({ status: "ready" });
  else res.status(503).json({ status: "not ready" });
});

app.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "alive" });
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: any) => {
  logger.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: config.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  try {
    await fabricGateway.shutdown();
    logger.info("✅ Fabric SDK Gateway disconnected");

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
    logger.info(
      "🚀 Starting Exporter Portal API (SDK-based External Client)...",
    );
    logger.info(`📍 Mode: External Entity - No Peer Node`);
    logger.info(`🔗 Gateway: Commercial Bank Peer`);

    // Initialize Fabric SDK Gateway
    await fabricGateway.initialize();

    // Start Express server
    app.listen(config.PORT, () => {
      logger.info(`✅ Exporter Portal API running on port ${config.PORT}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      logger.info(`📡 Health check: http://localhost:${config.PORT}/health`);
      logger.info(`🎯 Ready for exporter requests!`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
