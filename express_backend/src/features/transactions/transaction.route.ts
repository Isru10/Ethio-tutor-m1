import { Router } from "express";
import { transactionController } from "./transaction.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

// Webhook is unauthenticated (called by Chapa servers)
router.post("/webhook", transactionController.webhook);

// All other routes require auth
router.use(authMiddleware);
router.get("/",          transactionController.getMyTransactions);
router.post("/initiate", transactionController.initiatePayment);
router.get("/verify",    transactionController.verifyPayment);

export default router;
