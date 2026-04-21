import type { Request, Response, NextFunction } from "express";
import { roleService, ALL_PERMISSIONS } from "./role.service";

export const roleController = {
  // GET /roles/permissions — list all available permission keys
  listPermissions: (_req: Request, res: Response) => {
    res.json({ status: "success", data: ALL_PERMISSIONS });
  },

  // GET /roles
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ status: "success", data: await roleService.getAll(req.user!.tenant_id) });
    } catch (err) { next(err); }
  },

  // POST /roles
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, permissions } = req.body;
      if (!name || !Array.isArray(permissions)) {
        res.status(400).json({ status: "error", message: "name and permissions[] required" });
        return;
      }
      res.status(201).json({ status: "success", data: await roleService.create(req.user!.tenant_id, name, description, permissions) });
    } catch (err) { next(err); }
  },

  // PATCH /roles/:id
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, permissions } = req.body;
      res.json({ status: "success", data: await roleService.update(Number(req.params.id), req.user!.tenant_id, name, description, permissions) });
    } catch (err) { next(err); }
  },

  // DELETE /roles/:id
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ status: "success", data: await roleService.delete(Number(req.params.id), req.user!.tenant_id) });
    } catch (err) { next(err); }
  },

  // PATCH /roles/assign/:userId
  assignToUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId } = req.body; // null to remove
      res.json({ status: "success", data: await roleService.assignToUser(Number(req.params.userId), roleId ?? null, req.user!.tenant_id) });
    } catch (err) { next(err); }
  },

  // GET /roles/my-permissions — current user's resolved permissions
  myPermissions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ status: "success", data: await roleService.getUserPermissions(req.user!.user_id) });
    } catch (err) { next(err); }
  },
};
