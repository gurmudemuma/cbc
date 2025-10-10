import dotenv from "dotenv";
// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import fxRoutes from "./routes/fx.routes";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middleware/error.middleware";
import { FabricGateway } from "./fabric/gateway";
import { initializeWebSocket } from "../../shared/websocket.service";

const app: Application = express();
const PORT = process.env['PORT'] || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize Fabric Gateway
const fabricGateway = FabricGateway.getInstance();

// Routes with rate limiting
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/fx", apiLimiter, fxRoutes);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "National Bank API",
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(errorHandler);

// Create HTTP server and initialize WebSocket
const httpServer = createServer(app);
const websocketService = initializeWebSocket(httpServer);

// Start server
httpServer.listen(PORT, async () => {
  console.log(`🚀 National Bank API server running on port ${PORT}`);
  console.log(`🔌 WebSocket service initialized`);

  try {
    await fabricGateway.connect();
    console.log("✅ Connected to Hyperledger Fabric network");
  } catch (error) {
    console.error("❌ Failed to connect to Fabric network:", error);
    process.exit(1);
  }
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