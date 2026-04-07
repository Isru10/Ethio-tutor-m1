import type { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service";

export const notificationController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await notificationService.getAll(req.user!.user_id, req.user!.tenant_id) }); }
    catch (err) { next(err); }
  },
  markRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await notificationService.markRead(Number(req.params.id), req.user!.user_id);
      res.json({ status: "success", message: "Marked as read." });
    } catch (err) { next(err); }
  },
};
