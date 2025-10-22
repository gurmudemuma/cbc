import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Create uploads directory
import fs from "fs";
const uploadDir = process.env.UPLOAD_PATH || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Exporter Portal API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API Routes (to be implemented)
app.get("/api", (_req, res) => {
  res.json({
    success: true,
    message: "Welcome to Exporter Portal API",
    description:
      "External exporter interface for creating coffee export requests",
    endpoints: {
      health: "/health",
      auth: "/api/auth (handled by National Bank)",
      exports: "/api/exports",
      documents: "/api/documents",
      profile: "/api/profile",
    },
  });
});

// Import routes
import exportRoutes from "./routes/export.routes";
// TODO: Add other route imports when created
// import documentRoutes from './routes/document.routes';
// import profileRoutes from './routes/profile.routes';

// Mount routes
// Note: Authentication is handled by National Bank's portal auth
app.use("/api/exports", exportRoutes);
// app.use('/api/documents', documentRoutes);
// app.use('/api/profile', profileRoutes);

// Error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  },
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Exporter Portal API server running on port ${PORT}`);
  console.log(`📖 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API info: http://localhost:${PORT}/api`);

  if (process.env.ENABLE_API_DOCS === "true") {
    console.log(
      `📚 API docs will be available at: http://localhost:${PORT}/api-docs`,
    );
  }
});

export default app;
