import type { Request, Response, NextFunction } from "express";
import { academicService } from "./academic.service";

export const academicController = {
  getSubjects: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await academicService.getSubjects(req.user!.tenant_id) }); }
    catch (err) { next(err); }
  },
  getGrades: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await academicService.getGrades(req.user!.tenant_id) }); }
    catch (err) { next(err); }
  },
};
