import type { Request, Response, NextFunction } from "express";
import { tutorService } from "./tutor.service";
import { UpdateTutorProfileSchema } from "./tutor.model";

export const tutorController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // includeAll=true returns all tutors for admin/reviewer history
      if (req.query.includeAll === "true") {
        res.json({ status: "success", data: await tutorService.getAllForAdmin(req.user!.tenant_id) });
        return;
      }
      res.json({ status: "success", data: await tutorService.getAll(req.user!.tenant_id) });
    } catch (err) { next(err); }
  },
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await tutorService.getById(Number(req.params.id), req.user!.tenant_id) }); }
    catch (err) { next(err); }
  },
  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = UpdateTutorProfileSchema.parse(req.body);
      res.json({ status: "success", data: await tutorService.updateProfile(req.user!.user_id, input) });
    } catch (err) { next(err); }
  },
  getSlots: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await tutorService.getSlots(Number(req.params.id), req.user!.tenant_id) }); }
    catch (err) { next(err); }
  },

  getMyAvailability: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tutorService.getMyAvailability(req.user!.user_id, req.user!.tenant_id);
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  getMyProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tutorService.getMyProfile(req.user!.user_id, req.user!.tenant_id);
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },
};
