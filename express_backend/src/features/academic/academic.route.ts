import { Router } from "express";
import { academicController } from "./academic.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/subjects", academicController.getSubjects);
router.get("/grades",   academicController.getGrades);

export default router;
