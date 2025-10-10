import { Request, Response, NextFunction } from "express";

interface HttpError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env['NODE_ENV'] === "development" ? err.stack : undefined,
  });
};
