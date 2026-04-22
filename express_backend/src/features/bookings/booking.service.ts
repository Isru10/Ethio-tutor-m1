import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";
import { MAX_BASIC_ACTIVE_BOOKINGS } from "../../config/constants";
import type { CreateBookingInput } from "./booking.model";

// Auto-resolve or create StudentProfile if missing
async function resolveStudentProfileId(userId: number, tenantId: number): Promise<number> {
  let profile = await prisma.studentProfile.findFirst({ where: { user_id: userId } });
  if (!profile) {
    profile = await prisma.studentProfile.create({
      data: { user_id: userId, tenant_id: tenantId }
    });
  }
  return profile.student_profile_id;
}

export const bookingService = {
  /** STUDENT: get own bookings (where I am the student) */
  getMyBookings: async (userId: number, tenantId: number) => {
    const profileId = await resolveStudentProfileId(userId, tenantId);
    return prisma.booking.findMany({
      where: { student: { student_profile_id: profileId }, tenant_id: tenantId },
      include: {
        slot: {
          include: {
            subject: true,
            teacher: { include: { user: { select: { name: true } } } },
            session: { select: { session_id: true, status: true, room_name: true } },
            bookings: {
              where:   { status: { in: ["confirmed", "completed", "pending"] } },
              include: { student: { include: { user: { select: { name: true } } } } },
              orderBy: { created_at: "asc" },
            },
          },
        },
        transaction: true,
      },
      orderBy: { created_at: "desc" },
    });
  },

  /** TUTOR: get all bookings on my slots */
  getTutorBookings: async (tutorUserId: number, tenantId: number) => {
    return prisma.booking.findMany({
      where: {
        tenant_id: tenantId,
        slot: { teacher: { user_id: tutorUserId } },
      },
      include: {
        slot: {
          include: {
            subject: true,
            session: { select: { session_id: true, status: true } },
          },
        },
        student: { include: { user: { select: { name: true } } } },
      },
      orderBy: { created_at: "desc" },
    });
  },

  async create(userId: number, tenantId: number, tier: string, input: CreateBookingInput) {
    const profileId = await resolveStudentProfileId(userId, tenantId);

    if (tier === "BASIC") {
      const active = await prisma.booking.count({
        where: { student: { student_profile_id: profileId }, status: { in: ["pending", "confirmed"] } },
      });
      if (active >= MAX_BASIC_ACTIVE_BOOKINGS) {
        throw new AppError(`Basic plan allows max ${MAX_BASIC_ACTIVE_BOOKINGS} active bookings. Upgrade to Pro.`, 403);
      }
    }

    // Prevent duplicate: student cannot book the same slot twice (unless cancelled)
    const existing = await prisma.booking.findFirst({
      where: {
        slot_id:    input.slotId,
        student_id: profileId,
        status:     { in: ["pending", "confirmed"] },
      },
    });
    if (existing) throw new AppError("You have already booked this session.", 409);

    const slot = await prisma.timeSlot.findUnique({ where: { slot_id: input.slotId } });
    if (!slot)                     throw new AppError("Slot not found.", 404);
    if (slot.remaining_seats <= 0) throw new AppError("Slot is fully booked.", 409);

    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: { tenant_id: tenantId, slot_id: input.slotId, student_id: profileId, student_grade: input.studentGrade ?? null },
      }),
      prisma.timeSlot.update({ where: { slot_id: input.slotId }, data: { remaining_seats: { decrement: 1 } } }),
    ]);
    return booking;
  },

  async cancel(bookingId: number, userId: number) {
    const booking = await prisma.booking.findFirst({
      where: { booking_id: bookingId, student: { user_id: userId }, status: { in: ["pending", "confirmed"] } },
    });
    if (!booking) throw new AppError("Booking not found or already cancelled.", 404);

    await prisma.$transaction([
      prisma.booking.update({ where: { booking_id: bookingId }, data: { status: "cancelled" } }),
      prisma.timeSlot.update({ where: { slot_id: booking.slot_id }, data: { remaining_seats: { increment: 1 } } }),
    ]);
    return { message: "Booking cancelled." };
  },

  async confirm(bookingId: number, tutorUserId: number) {
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: { slot: { include: { teacher: true } } },
    });
    if (!booking) throw new AppError("Booking not found.", 404);
    if (booking.slot.teacher.user_id !== tutorUserId) throw new AppError("Not your booking.", 403);
    if (booking.status !== "pending") throw new AppError("Only pending bookings can be confirmed.", 409);

    return prisma.booking.update({
      where: { booking_id: bookingId },
      data:  { status: "confirmed" },
    });
  },

  /** Tutor removes a pending (unpaid) student from their slot */
  async removeStudent(bookingId: number, tutorUserId: number) {
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: { slot: { include: { teacher: true } } },
    });
    if (!booking) throw new AppError("Booking not found.", 404);
    if (booking.slot.teacher.user_id !== tutorUserId) throw new AppError("Not your slot.", 403);
    if (booking.status !== "pending") throw new AppError("Only pending (unpaid) bookings can be removed.", 409);

    await prisma.$transaction([
      prisma.booking.update({ where: { booking_id: bookingId }, data: { status: "cancelled" } }),
      prisma.timeSlot.update({ where: { slot_id: booking.slot_id }, data: { remaining_seats: { increment: 1 } } }),
    ]);
    return { message: "Student removed from slot." };
  },
};
