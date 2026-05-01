import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/login",    authController.login);
router.post("/refres1h",  authController.refresh);
router.post("/logout",   authMiddleware, authController.logout);
router.get("/me",        authMiddleware, authController.getMe);

export default router;
