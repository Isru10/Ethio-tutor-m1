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
  browse: (tenantId: number, subjectId?: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today — slots on today are still visible
    return prisma.timeSlot.findMany({
      where: {
        tenant_id: tenantId,
        status:    "available",
        slot_date: { gte: today }, // never show past slots to students
        ...(subjectId && { subject_id: subjectId }),
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: { select: { user_id: true, name: true } },
          },
        },
      },
      orderBy: { slot_date: "asc" },
    });
  },

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

    // Prevent creating slots in the past
    const slotDate = new Date(data.slot_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (slotDate < today) {
      throw new AppError("Cannot create a slot for a past date.", 400);
    }

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
    const slot = await prisma.timeSlot.findUnique({
      where: { slot_id: slotId },
      include: { bookings: { where: { status: { in: ["pending", "confirmed"] } } } },
    });
    if (!slot)                         throw new AppError("Slot not found.", 404);
    if (slot.teacher_id !== profileId) throw new AppError("You can only delete your own slots.", 403);
    if (slot.status === "completed")   throw new AppError("Cannot delete a completed slot.", 409);

    // Block delete if there are active (paid/confirmed) bookings — money is involved
    const confirmedBookings = slot.bookings.filter(b => b.status === "confirmed");
    if (confirmedBookings.length > 0) {
      throw new AppError(
        `Cannot delete this slot — ${confirmedBookings.length} student(s) have confirmed (paid) bookings. Cancel those bookings first or contact support.`,
        409
      );
    }

    // Cancel any pending (unpaid) bookings and restore seats before deleting
    if (slot.bookings.length > 0) {
      await prisma.booking.updateMany({
        where: { slot_id: slotId, status: "pending" },
        data:  { status: "cancelled" },
      });
    }

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
    if (slot.status === "cancelled")   throw new AppError("Cannot edit a cancelled slot.", 409);

    // Prevent rescheduling to a past date
    if (data.slot_date) {
      const newDate = new Date(data.slot_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate < today) {
        throw new AppError("Cannot reschedule a slot to a past date.", 400);
      }
    }

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
