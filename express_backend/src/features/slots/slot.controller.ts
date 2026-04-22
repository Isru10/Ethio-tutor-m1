import type { Request, Response, NextFunction } from "express";
import { slotService } from "./slot.service";
import { CreateSlotSchema } from "./slot.model";

export const slotController = {
  browse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
      res.json({ status: "success", data: await slotService.browse(req.user!.tenant_id, subjectId) });
    } catch (err) { next(err); }
  },
  getMy: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ status: "success", data: await slotService.getMy(req.user!.user_id, req.user!.tenant_id) });
    } catch (err) { next(err); }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = CreateSlotSchema.parse(req.body);
      res.status(201).json({ status: "success", data: await slotService.create(req.user!.user_id, req.user!.tenant_id, input) });
    } catch (err) { next(err); }
  },
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await slotService.delete(Number(req.params.id), req.user!.user_id, req.user!.tenant_id) }); }
    catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slot_date, start_time, end_time, description } = req.body;
      res.json({ status: "success", data: await slotService.updateSchedule(
        Number(req.params.id), req.user!.user_id, req.user!.tenant_id,
        { slot_date, start_time, end_time, description }
      )});
    } catch (err) { next(err); }
  },
};
