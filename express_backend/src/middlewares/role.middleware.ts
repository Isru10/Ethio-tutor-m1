import type { Request, Response, NextFunction } from "express";

/**
 * requireRole("ADMIN", "SUPER_ADMIN")
 * Blocks request if user.role is not in the allowed list.
 * Must run AFTER authMiddleware.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ status: "error", message: `Access restricted to: ${roles.join(", ")}` });
      return;
    }
    next();
  };
}
