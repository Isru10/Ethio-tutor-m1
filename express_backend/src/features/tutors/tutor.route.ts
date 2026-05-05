import { Router } from "express";
import { tutorController } from "./tutor.controller";
import { verificationController } from "./verification.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/",           tutorController.getAll);
router.patch("/profile",  requireRole("TUTOR"), tutorController.updateProfile);

// Tutor's own availability preferences (days + times from signup + existing slots)
router.get("/my-availability", requireRole("TUTOR"), tutorController.getMyAvailability);

// Tutor's own full profile (for the profile edit page)
router.get("/my-profile",      requireRole("TUTOR"), tutorController.getMyProfile);

// Verification queue — accessible by ADMIN, SUPER_ADMIN, MODERATOR
router.get("/pending",              requireRole("ADMIN", "SUPER_ADMIN", "MODERATOR"), verificationController.getPending);
router.post("/:id/claim",           requireRole("ADMIN", "SUPER_ADMIN", "MODERATOR"), verificationController.claim);
router.post("/:id/release",         requireRole("ADMIN", "SUPER_ADMIN", "MODERATOR"), verificationController.release);
router.post("/:id/decide",          requireRole("ADMIN", "SUPER_ADMIN", "MODERATOR"), verificationController.decide);

// Tutor resubmits their own profile — TUTOR only
router.post("/resubmit",            requireRole("TUTOR"), verificationController.resubmit);

router.get("/:id",        tutorController.getById);
router.get("/:id/slots",  tutorController.getSlots);

export default router;
