import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register",    authController.register);
router.post("/login",       authController.login);
router.post("/refresh",     authController.refresh);
router.post("/logout",      authMiddleware, authController.logout);
router.get("/me",           authMiddleware, authController.getMe);
// Issues a fresh JWT reflecting current DB state (role, status, tier)
// Used when tutor gets approved — no logout/login needed
router.get("/fresh-token",  authMiddleware, authController.freshToken);

export default router;
