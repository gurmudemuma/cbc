import dotenv from "dotenv";
// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import fxRoutes from "./routes/fx.routes";
import portalUsersRoutes from "./routes/portal.users.routes";
import portalAuthRoutes from "./routes/portal.auth.routes";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middleware/error.middleware";
import { FabricGateway } from "./fabric/gateway";
import { initializeWebSocket } from "../../shared/websocket.service";
import { envValidator } from "../../shared/env.validator";
import {
  applySecurityMiddleware,
  createRateLimiters,
  getCorsConfig,
} from "../../shared/security.best-practices";

// Validate environment variables before starting
try {
  envValidator.validate();
  envValidator.printSummary();
} catch (error) {
  console.error("❌ Environment validation failed:", error);
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
  isProduction: config.NODE_ENV === "production",
});

// CORS configuration
app.use(cors(getCorsConfig(config.CORS_ORIGIN)));

// Request logging
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing with size limits
const maxSize = `${config.MAX_FILE_SIZE_MB}mb`;
app.use(express.json({ limit: maxSize }));
app.use(express.urlencoded({ extended: true, limit: maxSize }));

// Rate limiting
const { authLimiter, apiLimiter } = createRateLimiters();

// Initialize Fabric Gateway
const fabricGateway = FabricGateway.getInstance();

// Routes with rate limiting
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/fx", apiLimiter, fxRoutes);
// Exporter Portal (managed by National Bank)
app.use("/api/portal/users", apiLimiter, portalUsersRoutes);
app.use("/api/portal/auth", portalAuthRoutes);
// User management for exporter portal (managed by National Bank)
import usersRoutes from "./routes/users.routes";
app.use("/api/users", apiLimiter, usersRoutes);

// Health check with detailed status
app.get("/health", async (_req: Request, res: Response) => {
  const fabricStatus = fabricGateway.isConnected()
    ? "connected"
    : "disconnected";

  res.json({
    status: "ok",
    service: "National Bank API",
    version: "1.0.0",
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    fabric: fabricStatus,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: "MB",
    },
  });
});

// Ready check (for Kubernetes)
app.get("/ready", async (_req: Request, res: Response) => {
  const isReady = fabricGateway.isConnected();

  if (isReady) {
    res.status(200).json({ status: "ready" });
  } else {
    res.status(503).json({ status: "not ready" });
  }
});

// Liveness check (for Kubernetes)
app.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "alive" });
});

// Error handling
app.use(errorHandler);

// Create HTTP server and initialize WebSocket
const httpServer = createServer(app);
const websocketService = initializeWebSocket(httpServer);

// Start server
httpServer.listen(PORT, async () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  National Bank API server running`);
  console.log(`${"=".repeat(60)}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Organization: ${config.ORGANIZATION_NAME}`);
  console.log(
    `   WebSocket: ${config.WEBSOCKET_ENABLED ? "Enabled" : "Disabled"}`,
  );
  console.log(`${"=".repeat(60)}\n`);

  try {
    console.log("  Connecting to Hyperledger Fabric network...");
    await fabricGateway.connect();
    console.log("  Connected to Hyperledger Fabric network");
    console.log(`   Channel: ${config.CHANNEL_NAME}`);
    console.log(`   Chaincode: ${config.CHAINCODE_NAME_EXPORT}`);
  } catch (error) {
    console.error("  Failed to connect to Fabric network:", error);
    console.error("   Please ensure the Fabric network is running");
    process.exit(1);
  }

  console.log("\n  Server is ready to accept requests\n");
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);

  // Stop accepting new requests
  httpServer.close(async () => {
    console.log("HTTP server closed");

    try {
      // Close WebSocket connections
      if (websocketService) {
        websocketService.close();
      }
      console.log("WebSocket service closed");

      // Disconnect from Fabric
      await fabricGateway.disconnect();
      console.log("Fabric gateway disconnected");

      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error("⚠️  Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

export default app;
