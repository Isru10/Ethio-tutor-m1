// Routes barrel — mounts all feature routers under /api/v1
import { Router } from "express";
import authRoute         from "../features/auth/auth.route";
import userRoute         from "../features/users/user.route";
import tutorRoute        from "../features/tutors/tutor.route";
import bookingRoute      from "../features/bookings/booking.route";
import slotRoute         from "../features/slots/slot.route";
import reviewRoute       from "../features/reviews/review.route";
import transactionRoute  from "../features/transactions/transaction.route";
import notificationRoute from "../features/notifications/notification.route";
import academicRoute     from "../features/academic/academic.route";
import sessionRoute      from "../features/sessions/session.route";
import roleRoute         from "../features/roles/role.route";

const router = Router();

router.use("/auth",          authRoute);
router.use("/users",         userRoute);
router.use("/tutors",        tutorRoute);
router.use("/bookings",      bookingRoute);
router.use("/slots",         slotRoute);
router.use("/reviews",       reviewRoute);
router.use("/transactions",  transactionRoute);
router.use("/notifications", notificationRoute);
router.use("/academic",      academicRoute);
router.use("/sessions",      sessionRoute);
router.use("/roles",         roleRoute);

export default router;
