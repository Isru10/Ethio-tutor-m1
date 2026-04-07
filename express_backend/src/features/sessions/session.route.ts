import { Router } from "express";
import { sessionController } from "./session.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

const router = Router();
router.use(authMiddleware);

// Tutor starts a session for a confirmed booking
// POST /api/v1/sessions/start  { bookingId }
router.post("/start", requireRole("TUTOR"), sessionController.start);

// Tutor views their session history
// GET /api/v1/sessions/my
router.get("/my", requireRole("TUTOR"), sessionController.getMy);

// Get session details by ID (for reconnect or status check)
// GET /api/v1/sessions/:id
router.get("/:id", sessionController.getOne);

// Student joins a live session
// POST /api/v1/sessions/:id/join
router.post("/:id/join", sessionController.join);

// Tutor ends the session
// POST /api/v1/sessions/:id/end
router.post("/:id/end", requireRole("TUTOR"), sessionController.end);

export default router;
