import { Router } from "express";
import { reviewController } from "./review.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireTier } from "../../middlewares/tier.middleware";

const router = Router();
router.use(authMiddleware);

router.post("/",               reviewController.create);
router.get("/tutor/:tutorId",  requireTier("PRO", "PREMIUM"), reviewController.getForTutor);

export default router;
