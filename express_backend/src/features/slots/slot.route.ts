import { Router } from "express";
import { slotController } from "./slot.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/",       slotController.browse);
router.get("/my",     requireRole("TUTOR"), slotController.getMy);
router.post("/",      requireRole("TUTOR"), slotController.create);
router.patch("/:id",  requireRole("TUTOR"), slotController.update);
router.delete("/:id", requireRole("TUTOR"), slotController.delete);

export default router;
