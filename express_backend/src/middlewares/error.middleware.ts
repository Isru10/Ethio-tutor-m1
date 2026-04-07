import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { env } from "../config/env.config";

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // AppError (operational — known error thrown intentionally)
  if (err.isOperational) {
    res.status(err.statusCode ?? 400).json({
      status:  "error",
      message: err.message,
    });
    return;
  }

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    res.status(409).json({ status: "error", message: "A record with this value already exists." });
    return;
  }

  // Prisma record-not-found
  if (err.code === "P2025") {
    res.status(404).json({ status: "error", message: "Record not found." });
    return;
  }

  // Unknown / programming error
  logger.error("UNHANDLED:", err);
  res.status(500).json({
    status:  "error",
    message: "An unexpected error occurred.",
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

// Simple operational error class used throughout the app
export class AppError extends Error {
  isOperational = true;
  constructor(public message: string, public statusCode = 400) {
    super(message);
  }
}
