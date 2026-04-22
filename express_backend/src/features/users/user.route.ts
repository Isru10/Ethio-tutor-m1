import { Router } from "express";
import { userController } from "./user.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/",              requireRole("ADMIN", "SUPER_ADMIN", "MODERATOR"), userController.getAll);
router.post("/staff",        requireRole("ADMIN", "SUPER_ADMIN"),              userController.createStaff);
router.get("/:id",           userController.getById);
router.patch("/:id",         userController.update);
router.patch("/:id/suspend", requireRole("ADMIN", "SUPER_ADMIN"), userController.suspend);
router.delete("/:id",        requireRole("SUPER_ADMIN"),          userController.delete);
router.post("/:id/reset-password", requireRole("ADMIN", "SUPER_ADMIN"), userController.resetStaffPassword);

export default router;
