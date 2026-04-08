import type { Request, Response, NextFunction } from "express";
import { payoutService } from "./payout.service";

export const payoutController = {
  /** GET /transactions/admin/payouts/eligible */
  getEligible: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ status: "success", data: await payoutService.getEligiblePayouts(req.user!.tenant_id) });
    } catch (err) { next(err); }
  },

  /** POST /transactions/admin/payouts/:id/release */
  release: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await payoutService.releasePayout(Number(req.params.id), req.user!.tenant_id);
      res.json({ status: "success", data: result });
    } catch (err) { next(err); }
  },

  /** POST /transactions/admin/payouts/:id/dispute */
  dispute: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await payoutService.disputeTransaction(Number(req.params.id), req.user!.tenant_id);
      res.json({ status: "success", message: "Transaction flagged as disputed." });
    } catch (err) { next(err); }
  },

  /** POST /transactions/admin/payouts/:id/resolve-tutor */
  resolveTutor: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await payoutService.resolveDisputeForTutor(Number(req.params.id), req.user!.tenant_id);
      res.json({ status: "success", data: result });
    } catch (err) { next(err); }
  },

  /** POST /transactions/admin/payouts/:id/resolve-student */
  resolveStudent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await payoutService.resolveDisputeForStudent(Number(req.params.id), req.user!.tenant_id);
      res.json({ status: "success", message: "Refund issued to student, booking cancelled." });
    } catch (err) { next(err); }
  },
};
