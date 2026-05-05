import type { Request, Response, NextFunction } from "express";
import { reviewService } from "./review.service";
import { CreateReviewSchema } from "./review.model";

export const reviewController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = CreateReviewSchema.parse(req.body);
      const review = await reviewService.create(input, req.user!.user_id, req.user!.tenant_id);
      res.status(201).json({ status: "success", data: review });
    } catch (err) { next(err); }
  },
  getForTutor: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await reviewService.getForTutor(Number(req.params.tutorId), req.user!.tenant_id) }); }
    catch (err) { next(err); }
  },

  // Tutor views their own reviews — no tier gate needed
  getMyReviews: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Review.teacher_id = TeacherProfile.teacher_profile_id, not User.user_id
      // Resolve the profile ID first
      const { prisma } = await import("../../models/prisma.client");
      const profile = await prisma.teacherProfile.findUnique({
        where: { user_id: req.user!.user_id },
        select: { teacher_profile_id: true },
      });
      if (!profile) { res.json({ status: "success", data: [] }); return; }
      res.json({ status: "success", data: await reviewService.getForTutor(profile.teacher_profile_id, req.user!.tenant_id) });
    } catch (err) { next(err); }
  },
};
