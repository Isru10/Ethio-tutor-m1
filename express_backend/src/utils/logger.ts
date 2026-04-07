import winston from "winston";
import type { Request, Response, NextFunction } from "express";

const fmt = winston.format;

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  format: process.env.NODE_ENV === "production"
    ? fmt.combine(fmt.timestamp(), fmt.errors({ stack: true }), fmt.json())
    : fmt.combine(fmt.colorize(), fmt.timestamp({ format: "HH:mm:ss" }), fmt.errors({ stack: true }),
        fmt.printf(({ level, message, timestamp, stack }) =>
          stack ? `${timestamp} [${level}]: ${message}\n${stack}` : `${timestamp} [${level}]: ${message}`
        )),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  logger.debug(`→ ${req.method} ${req.originalUrl}`);
  next();
}
