import type { Request, Response, NextFunction } from "express";

/**
 * requireTier("PRO", "PREMIUM")
 * Blocks request if user.tier is not in the allowed list.
 * Must run AFTER authMiddleware.
 */
export function requireTier(...tiers: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !tiers.includes(req.user.tier)) {
      res.status(403).json({ status: "error", message: `Feature requires ${tiers.join(" or ")} subscription.` });
      return;
    }
    next();
  };
}
