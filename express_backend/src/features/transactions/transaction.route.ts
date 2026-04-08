import { Router } from "express";
import { transactionController } from "./transaction.controller";
import { payoutController } from "./payout.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

const router = Router();

// Webhook — unauthenticated (called by Chapa servers)
router.post("/webhook", transactionController.webhook);

router.use(authMiddleware);

// Student routes
router.get("/",          transactionController.getMyTransactions);
router.post("/initiate", transactionController.initiatePayment);
router.get("/verify",    transactionController.verifyPayment);

// Admin — transaction overview & refunds
router.get("/admin/all",          requireRole("ADMIN", "SUPER_ADMIN"), transactionController.getAllTransactions);
router.get("/admin/stats",        requireRole("ADMIN", "SUPER_ADMIN"), transactionController.getPlatformStats);
router.patch("/admin/:id/refund", requireRole("ADMIN", "SUPER_ADMIN"), transactionController.refundTransaction);

// Admin — payout management
router.get("/admin/payouts/eligible",              requireRole("ADMIN", "SUPER_ADMIN"), payoutController.getEligible);
router.post("/admin/payouts/:id/release",          requireRole("ADMIN", "SUPER_ADMIN"), payoutController.release);
router.post("/admin/payouts/:id/dispute",          requireRole("ADMIN", "SUPER_ADMIN"), payoutController.dispute);
router.post("/admin/payouts/:id/resolve-tutor",    requireRole("ADMIN", "SUPER_ADMIN"), payoutController.resolveTutor);
router.post("/admin/payouts/:id/resolve-student",  requireRole("ADMIN", "SUPER_ADMIN"), payoutController.resolveStudent);

export default router;
