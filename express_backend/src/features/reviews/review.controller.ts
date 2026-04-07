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
};
