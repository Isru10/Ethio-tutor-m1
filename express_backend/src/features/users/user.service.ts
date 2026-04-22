import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";
import { hashPassword } from "../../utils/password.util";
import type { UpdateUserInput } from "./user.model";

export const userService = {
  getAll: (tenantId: number) =>
    prisma.user.findMany({
      where:   { tenant_id: tenantId },
      select:  {
        user_id:    true,
        name:       true,
        email:      true,
        role:       true,
        tier:       true,
        status:     true,
        created_at: true,
        customRole: { select: { id: true, name: true, permissions: true } },
      },
      orderBy: { created_at: "desc" },
    }),

  async getById(userId: number) {
    const user = await prisma.user.findUnique({
      where:  { user_id: userId },
      select: { user_id: true, name: true, email: true, role: true, tier: true, status: true, phone: true },
    });
    if (!user) throw new AppError("User not found.", 404);
    return user;
  },

  update: (userId: number, data: UpdateUserInput) =>
    prisma.user.update({ where: { user_id: userId }, data, select: { user_id: true, name: true, email: true, phone: true } }),

  async suspend(actorRole: string, userId: number) {
    if (!["ADMIN", "SUPER_ADMIN"].includes(actorRole)) throw new AppError("Admins only.", 403);
    return prisma.user.update({ where: { user_id: userId }, data: { status: "suspended" }, select: { user_id: true, status: true } });
  },

  async delete(actorRole: string, userId: number) {
    if (actorRole !== "SUPER_ADMIN") throw new AppError("SUPER_ADMIN only.", 403);
    await prisma.user.delete({ where: { user_id: userId } });
    return { message: "User deleted." };
  },

  /**
   * Admin resets a MODERATOR (staff) password.
   * Returns the new plain-text password once — admin copies and sends manually.
   * Only works on MODERATOR accounts — students/tutors must use self-service forgot-password.
   */
  async resetStaffPassword(actorRole: string, userId: number) {
    if (!["ADMIN", "SUPER_ADMIN"].includes(actorRole)) {
      throw new AppError("Admins only.", 403);
    }
    const user = await prisma.user.findUnique({
      where:  { user_id: userId },
      select: { role: true, name: true, email: true },
    });
    if (!user) throw new AppError("User not found.", 404);
    if (user.role !== "MODERATOR") {
      throw new AppError("Password reset is only available for staff accounts. Students and tutors must use self-service.", 403);
    }

    // Generate a secure temporary password
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
    const newPassword = Array.from(
      { length: 12 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");

    await prisma.user.update({
      where: { user_id: userId },
      data:  { password: await hashPassword(newPassword) },
    });

    return { name: user.name, email: user.email, newPassword };
  },
};
