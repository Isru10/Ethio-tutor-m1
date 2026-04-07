import { prisma } from "../../models/prisma.client";

export const notificationService = {
  getAll: (userId: number, tenantId: number) =>
    prisma.notification.findMany({
      where:   { recipient_id: userId, tenant_id: tenantId },
      orderBy: { created_at: "desc" },
    }),

  markRead: (notificationId: number, userId: number) =>
    prisma.notification.updateMany({
      where: { notification_id: notificationId, recipient_id: userId },
      data:  { is_read: true },
    }),
};
