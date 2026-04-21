import type { Request, Response, NextFunction } from "express";
import { transactionService, verifyWebhookSignature } from "./transaction.service";

export const transactionController = {

 

  getMyTransactions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ status: "success", data: await transactionService.getMyTransactions(req.user!.user_id, req.user!.tenant_id) });
    } catch (err) { next(err); }
  },

  getMyEarnings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ status: "success", data: await transactionService.getMyEarnings(req.user!.user_id, req.user!.tenant_id) });
    } catch (err) { next(err); }
  },

  initiatePayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = req.body;
      if (!bookingId) { res.status(400).json({ status: "error", message: "bookingId required" }); return; }
      const result = await transactionService.initiatePayment(
        Number(bookingId),
        req.user!.user_id,
        req.user!.tenant_id,
      );
      res.json({ status: "success", data: result });
    } catch (err) { next(err); }
  },

  verifyPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const txRef = req.query.tx_ref as string;
      if (!txRef) { res.status(400).json({ status: "error", message: "tx_ref required" }); return; }
      const result = await transactionService.verifyPayment(txRef);
      res.json({ status: "success", data: result });
    } catch (err) { next(err); }
  },

  /** POST /transactions/webhook — Chapa server-to-server callback */
  webhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers["x-chapa-signature"] as string | undefined;
      if (signature) {
        const rawBody = JSON.stringify(req.body);
        if (!verifyWebhookSignature(rawBody, signature)) {
          res.status(401).json({ status: "error", message: "Invalid webhook signature" });
          return;
        }
      }
      const txRef = req.body?.trx_ref ?? req.body?.tx_ref;
      if (!txRef) { res.status(400).json({ status: "error", message: "tx_ref missing" }); return; }
      await transactionService.handleWebhook(txRef);
      res.json({ status: "success" });
    } catch (err) { next(err); }
  },

  // ─── Admin ────────────────────────────────────────────────
  getAllTransactions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string | undefined;
      res.json({ status: "success", data: await transactionService.getAllTransactions(req.user!.tenant_id, status) });
    } catch (err) { next(err); }
  },

  refundTransaction: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      await transactionService.refundTransaction(id, req.user!.tenant_id);
      res.json({ status: "success", message: "Transaction refunded and booking cancelled." });
    } catch (err) { next(err); }
  },

  getPlatformStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ status: "success", data: await transactionService.getPlatformStats(req.user!.tenant_id) });
    } catch (err) { next(err); }
  },
};
