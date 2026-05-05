import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { RegisterSchema, LoginSchema, RefreshSchema } from "./auth.model";

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = RegisterSchema.parse(req.body);
      res.status(201).json({ status: "success", data: await authService.register(input) });
    } catch (err) { next(err); }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = LoginSchema.parse(req.body);
      res.json({ status: "success", data: await authService.login(input) });
    } catch (err) { next(err); }
  },

  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = RefreshSchema.parse(req.body);
      res.json({ status: "success", data: await authService.refresh(token) });
    } catch (err) { next(err); }
  },

  logout: (_req: Request, res: Response) => {
    res.json({ status: "success", message: "Logged out." });
  },

  getMe: (req: Request, res: Response) => {
    res.json({ status: "success", data: req.user });
  },

  /**
   * GET /auth/fresh-token
   * Issues a brand-new access token based on current DB state.
   * Called by the frontend when user status changes (e.g. tutor gets approved).
   * This ensures the JWT cookie reflects the latest role/status.
   */
  freshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.freshTokenForUser(req.user!.user_id);
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },
};
