import type { Request, Response, NextFunction } from "express";
import { userService } from "./user.service";
import { UpdateUserSchema } from "./user.model";

export const userController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await userService.getAll(req.user!.tenant_id) }); }
    catch (err) { next(err); }
  },
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await userService.getById(Number(req.params.id)) }); }
    catch (err) { next(err); }
  },
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = UpdateUserSchema.parse(req.body);
      res.json({ status: "success", data: await userService.update(Number(req.params.id), input) });
    } catch (err) { next(err); }
  },
  suspend: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await userService.suspend(req.user!.role, Number(req.params.id)) }); }
    catch (err) { next(err); }
  },
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: "success", data: await userService.delete(req.user!.role, Number(req.params.id)) }); }
    catch (err) { next(err); }
  },
};
