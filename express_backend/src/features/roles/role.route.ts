import { Router } from "express";
import { roleController } from "./role.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

const router = Router();
router.use(authMiddleware);

// Any authenticated user can fetch their own permissions
router.get("/my-permissions",        roleController.myPermissions);
router.get("/permissions",           roleController.listPermissions);

// Admin-only role management
router.get("/",                      requireRole("ADMIN", "SUPER_ADMIN"), roleController.getAll);
router.post("/",                     requireRole("ADMIN", "SUPER_ADMIN"), roleController.create);
router.patch("/:id",                 requireRole("ADMIN", "SUPER_ADMIN"), roleController.update);
router.delete("/:id",                requireRole("ADMIN", "SUPER_ADMIN"), roleController.delete);
router.patch("/assign/:userId",      requireRole("ADMIN", "SUPER_ADMIN"), roleController.assignToUser);

export default router;
