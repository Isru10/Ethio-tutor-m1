import { Router } from "express";
import { bookingController } from "./booking.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/",              bookingController.getMyBookings);
router.get("/tutor",         requireRole("TUTOR"), bookingController.getTutorBookings);
router.post("/",             bookingController.create);
router.patch("/:id/cancel",  bookingController.cancel);
router.patch("/:id/confirm", requireRole("TUTOR"), bookingController.confirm);

export default router;
