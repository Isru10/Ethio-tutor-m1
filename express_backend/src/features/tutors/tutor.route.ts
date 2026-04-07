import { Router } from "express";
import { tutorController } from "./tutor.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/",           tutorController.getAll);
router.get("/:id",        tutorController.getById);
router.patch("/profile",  requireRole("TUTOR"), tutorController.updateProfile);
router.get("/:id/slots",  tutorController.getSlots);

export default router;
