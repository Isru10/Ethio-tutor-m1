import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util";
import { prisma } from "../models/prisma.client";

/**
 * Verifies the Bearer JWT and attaches the user to req.user.
 * Must be used before any role or tier middleware.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ status: "error", message: "No token provided." });
      return;
    }

    const token = authHeader.split(" ")[1];
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      res.status(401).json({ status: "error", message: "Invalid or expired token." });
      return;
    }

    const user = await prisma.user.findUnique({
      where:  { user_id: payload.userId },
      select: { user_id: true, tenant_id: true, role: true, tier: true, status: true, email: true, name: true },
    });

    if (!user) {
      res.status(401).json({ status: "error", message: "User not found." });
      return;
    }
    if (user.status === "suspended") {
      res.status(403).json({ status: "error", message: "Account suspended." });
      return;
    }

    req.user = { ...user, role: user.role.toString(), tier: user.tier.toString() };
    next();
  } catch (err) {
    next(err);
  }
}
