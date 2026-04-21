import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";

export const ALL_PERMISSIONS = [
  "view_dashboard",
  "view_users",
  "view_tutors",
  "verify_tutors",
  "view_bookings",
  "view_sessions",
  "view_transactions",
  "view_payouts",
  "manage_disputes",
  "view_reports",
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

export const roleService = {
  getAll: (tenantId: number) =>
    prisma.customRole.findMany({
      where:   { tenant_id: tenantId },
      include: { _count: { select: { users: true } } },
      orderBy: { created_at: "desc" },
    }),

  async create(tenantId: number, name: string, description: string | undefined, permissions: string[]) {
    const invalid = permissions.filter(p => !ALL_PERMISSIONS.includes(p as Permission));
    if (invalid.length) throw new AppError(`Invalid permissions: ${invalid.join(", ")}`, 400);
    return prisma.customRole.create({
      data: { tenant_id: tenantId, name, description, permissions: JSON.stringify(permissions) },
    });
  },

  async update(id: number, tenantId: number, name?: string, description?: string, permissions?: string[]) {
    const role = await prisma.customRole.findFirst({ where: { id, tenant_id: tenantId } });
    if (!role) throw new AppError("Role not found.", 404);
    if (permissions) {
      const invalid = permissions.filter(p => !ALL_PERMISSIONS.includes(p as Permission));
      if (invalid.length) throw new AppError(`Invalid permissions: ${invalid.join(", ")}`, 400);
    }
    return prisma.customRole.update({
      where: { id },
      data: {
        ...(name        ? { name }                              : {}),
        ...(description ? { description }                      : {}),
        ...(permissions ? { permissions: JSON.stringify(permissions) } : {}),
      },
    });
  },

  async delete(id: number, tenantId: number) {
    const role = await prisma.customRole.findFirst({ where: { id, tenant_id: tenantId } });
    if (!role) throw new AppError("Role not found.", 404);
    // Unassign from users first
    await prisma.user.updateMany({ where: { custom_role_id: id }, data: { custom_role_id: null } });
    await prisma.customRole.delete({ where: { id } });
    return { message: "Role deleted." };
  },

  // Assign a custom role to a user (admin action)
  async assignToUser(userId: number, roleId: number | null, tenantId: number) {
    if (roleId !== null) {
      const role = await prisma.customRole.findFirst({ where: { id: roleId, tenant_id: tenantId } });
      if (!role) throw new AppError("Role not found.", 404);
    }
    return prisma.user.update({
      where: { user_id: userId },
      data:  { custom_role_id: roleId },
      select: { user_id: true, name: true, custom_role_id: true },
    });
  },

  // Get a user's resolved permissions (custom role overrides base role)
  async getUserPermissions(userId: number): Promise<Permission[]> {
    const user = await prisma.user.findUnique({
      where:   { user_id: userId },
      include: { customRole: true },
    });
    if (!user) return [];
    if (!user.customRole) {
      // Base role gets all permissions
      if (["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
        return [...ALL_PERMISSIONS];
      }
      return [];
    }
    return JSON.parse(user.customRole.permissions) as Permission[];
  },
};
