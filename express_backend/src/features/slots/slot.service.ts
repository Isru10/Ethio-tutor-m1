import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";
import type { CreateSlotInput } from "./slot.model";

// Helper: resolve TeacherProfile.teacher_profile_id from User.user_id, auto-creating if missing
async function resolveTeacherProfileId(userId: number, tenantId: number): Promise<number> {
  let profile = await prisma.teacherProfile.findUnique({ where: { user_id: userId } });
  if (!profile) {
    profile = await prisma.teacherProfile.create({
      data: { user_id: userId, tenant_id: tenantId, bio: "", hourly_rate: 0 }
    });
  }
  return profile.teacher_profile_id;
}

export const slotService = {
  browse: (tenantId: number, subjectId?: number) =>
    prisma.timeSlot.findMany({
      where:   { tenant_id: tenantId, status: "available", ...(subjectId && { subject_id: subjectId }) },
      include: {
        subject: true,
        teacher: {
          include: {
            user: { select: { user_id: true, name: true } },
          },
        },
      },
      orderBy: { slot_date: "asc" },
    }),

  async getMy(tutorUserId: number, tenantId: number) {
    const profileId = await resolveTeacherProfileId(tutorUserId, tenantId);
    return prisma.timeSlot.findMany({
      where:   { teacher_id: profileId, tenant_id: tenantId },
      include: { subject: true, bookings: { select: { booking_id: true, status: true } } },
      orderBy: { slot_date: "asc" },
    });
  },

  async create(tutorUserId: number, tenantId: number, data: CreateSlotInput) {
    const profileId = await resolveTeacherProfileId(tutorUserId, tenantId);
    return prisma.timeSlot.create({
      data: {
        tenant_id:       tenantId,
        teacher_id:      profileId,
        subject_id:      data.subject_id,
        slot_date:       new Date(data.slot_date),
        start_time:      data.start_time,
        end_time:        data.end_time,
        grade_from:      data.grade_from,
        grade_to:        data.grade_to,
        max_students:    data.max_students,
        remaining_seats: data.max_students,
        ...(data.description ? { description: data.description } : {}),
      } as any,
    });
  },

  async delete(slotId: number, tutorUserId: number, tenantId: number) {
    const profileId = await resolveTeacherProfileId(tutorUserId, tenantId);
    const slot = await prisma.timeSlot.findUnique({ where: { slot_id: slotId } });
    if (!slot)                       throw new AppError("Slot not found.", 404);
    if (slot.teacher_id !== profileId) throw new AppError("You can only delete your own slots.", 403);
    await prisma.timeSlot.delete({ where: { slot_id: slotId } });
    return { message: "Slot deleted." };
  },

  async updateSchedule(slotId: number, tutorUserId: number, tenantId: number, data: {
    slot_date?: string; start_time?: string; end_time?: string; description?: string;
  }) {
    const profileId = await resolveTeacherProfileId(tutorUserId, tenantId);
    const slot = await prisma.timeSlot.findUnique({ where: { slot_id: slotId } });
    if (!slot)                         throw new AppError("Slot not found.", 404);
    if (slot.teacher_id !== profileId) throw new AppError("You can only edit your own slots.", 403);
    if (slot.status === "completed")   throw new AppError("Cannot edit a completed slot.", 409);

    return prisma.timeSlot.update({
      where: { slot_id: slotId },
      data: {
        ...(data.slot_date   ? { slot_date:   new Date(data.slot_date) } : {}),
        ...(data.start_time  ? { start_time:  data.start_time }          : {}),
        ...(data.end_time    ? { end_time:    data.end_time }             : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      } as any,
      include: { subject: true },
    });
  },
};
