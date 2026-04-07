import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";
import type { UpdateTutorInput } from "./tutor.model";

export const tutorService = {
  getAll: (tenantId: number) =>
    prisma.teacherProfile.findMany({
      where:   { tenant_id: tenantId },
      include: {
        user:            { select: { user_id: true, name: true, email: true, status: true } },
        teacherSubjects: { include: { subject: true } },
        reviews:         { select: { rating: true } },
        timeSlots:       {
          where:   { status: "available" },
          select:  { slot_id: true, slot_date: true, start_time: true, end_time: true, remaining_seats: true, max_students: true, status: true },
          orderBy: { slot_date: "asc" },
          take:    3,
        },
      },
      orderBy: { average_rating: "desc" },
    }),

  async getById(userId: number, tenantId: number) {
    const profile = await prisma.teacherProfile.findFirst({
      where:   { user_id: userId, tenant_id: tenantId },
      include: {
        user:            { select: { user_id: true, name: true, email: true, status: true } },
        teacherSubjects: { include: { subject: true } },
        reviews: {
          take: 10,
          orderBy: { created_at: "desc" },
          include: {
            student: { include: { user: { select: { name: true } } } },
          },
        },
        timeSlots: {
          where:   { status: "available" },
          include: { subject: true },
          take:    5,
          orderBy: { slot_date: "asc" },
        },
      },
    });
    if (!profile) throw new AppError("Tutor not found.", 404);
    return profile;
  },

  updateProfile: (userId: number, data: UpdateTutorInput) =>
    prisma.teacherProfile.update({ where: { user_id: userId }, data }),

  getSlots: (tutorId: number, tenantId: number) =>
    prisma.timeSlot.findMany({
      where:   { teacher_id: tutorId, tenant_id: tenantId },
      include: { subject: true },
      orderBy: { slot_date: "asc" },
    }),
};
