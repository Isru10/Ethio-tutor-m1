import type { Request, Response, NextFunction } from "express";
import { userService } from "./user.service";
import { UpdateUserSchema } from "./user.model";
import { z } from "zod";
import { hashPassword } from "../../utils/password.util";
import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";

const CreateStaffSchema = z.object({
  name:         z.string().min(2),
  email:        z.string().email(),
  password:     z.string().min(6),
  customRoleId: z.number().int().positive().optional(),
});

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

  resetStaffPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await userService.resetStaffPassword(req.user!.role, Number(req.params.id));
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  /**
   * POST /users/staff
   * Admin creates an internal staff account (base role = MODERATOR).
   * Optionally assigns a custom role in the same request.
   * Returns the created user + a one-time display password (admin copies & sends manually).
   */
  createStaff: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, customRoleId } = CreateStaffSchema.parse(req.body);

      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) throw new AppError("Email already registered.", 409);

      if (customRoleId) {
        const role = await prisma.customRole.findFirst({
          where: { id: customRoleId, tenant_id: req.user!.tenant_id },
        });
        if (!role) throw new AppError("Custom role not found.", 404);
      }

      const hashed = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          tenant_id:      req.user!.tenant_id,
          name,
          email,
          password:       hashed,
          role:           "MODERATOR",
          custom_role_id: customRoleId ?? null,
        },
        select: {
          user_id:    true,
          name:       true,
          email:      true,
          role:       true,
          created_at: true,
          customRole: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({ status: "success", data: { user } });
    } catch (err) { next(err); }
  },
};
