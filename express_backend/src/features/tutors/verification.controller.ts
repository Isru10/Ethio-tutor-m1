import type { Request, Response, NextFunction } from "express";
import { verificationService } from "./verification.service";

export const verificationController = {
  getPending: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ status: "success", data: await verificationService.getPendingTutors(req.user!.tenant_id) });
    } catch (err) { next(err); }
  },

  claim: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await verificationService.claimProfile(
        Number(req.params.id), req.user!.user_id, req.user!.tenant_id
      );
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  release: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await verificationService.releaseClaim(Number(req.params.id), req.user!.user_id);
      res.json({ status: "success", message: "Lock released." });
    } catch (err) { next(err); }
  },

  decide: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { decision, note } = req.body;
      if (!["approved", "rejected", "pending_info"].includes(decision)) {
        res.status(400).json({ status: "error", message: "Invalid decision." });
        return;
      }
      const data = await verificationService.submitDecision(
        Number(req.params.id), req.user!.user_id, req.user!.tenant_id, decision, note
      );
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },
};
