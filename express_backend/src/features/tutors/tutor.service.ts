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

  updateProfile: (userId: number, data: UpdateTutorInput) => {
    const { available_days, available_times, ...rest } = data as any;
    return prisma.teacherProfile.update({
      where: { user_id: userId },
      data: {
        ...rest,
        ...(available_days  !== undefined ? { available_days:  JSON.stringify(available_days)  } : {}),
        ...(available_times !== undefined ? { available_times: JSON.stringify(available_times) } : {}),
      },
    });
  },

  /** Full profile for the logged-in tutor — includes all editable fields */
  async getMyProfile(userId: number, tenantId: number) {
    const profile = await prisma.teacherProfile.findFirst({
      where: { user_id: userId, tenant_id: tenantId },
      include: {
        user:            { select: { user_id: true, name: true, email: true, phone: true } },
        teacherSubjects: { include: { subject: true } },
      },
    });
    if (!profile) throw new AppError("Profile not found.", 404);
    return {
      ...profile,
      available_days:  profile.available_days  ? JSON.parse(profile.available_days)  : [],
      available_times: profile.available_times ? JSON.parse(profile.available_times) : [],
    };
  },

  getAllForAdmin: (tenantId: number) =>
    prisma.teacherProfile.findMany({
      where:   { tenant_id: tenantId },
      include: {
        user:            { select: { user_id: true, name: true, email: true, created_at: true } },
        teacherSubjects: { include: { subject: true } },
      },
      orderBy: { user: { created_at: "desc" } },
    }),

  getSlots: (tutorId: number, tenantId: number) =>
    prisma.timeSlot.findMany({
      where:   { teacher_id: tutorId, tenant_id: tenantId },
      include: { subject: true },
      orderBy: { slot_date: "asc" },
    }),

  /**
   * Returns the tutor's availability preferences (days + times from signup)
   * plus their existing future slots so the frontend can grey out occupied times.
   */
  async getMyAvailability(userId: number, tenantId: number) {
    const profile = await prisma.teacherProfile.findUnique({
      where: { user_id: userId },
      select: {
        available_days:       true,
        available_times:      true,
        default_max_students: true,
        hourly_rate:          true,
      },
    });
    if (!profile) throw new AppError("Profile not found.", 404);

    // Parse JSON strings back to arrays
    const availableDays: string[]  = profile.available_days  ? JSON.parse(profile.available_days)  : [];
    const availableTimes: string[] = profile.available_times ? JSON.parse(profile.available_times) : [];

    // Fetch future slots so the frontend can mark occupied time ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { user_id: userId } });
    const existingSlots = teacherProfile ? await prisma.timeSlot.findMany({
      where: {
        teacher_id: teacherProfile.teacher_profile_id,
        tenant_id:  tenantId,
        slot_date:  { gte: today },
        status:     { in: ["available", "full"] },
      },
      select: { slot_date: true, start_time: true, end_time: true, status: true },
    }) : [];

    return {
      available_days:       availableDays,
      available_times:      availableTimes,
      default_max_students: profile.default_max_students,
      hourly_rate:          Number(profile.hourly_rate),
      existing_slots:       existingSlots.map(s => ({
        slot_date:  s.slot_date instanceof Date
          ? s.slot_date.toISOString().split("T")[0]
          : String(s.slot_date).split("T")[0],
        start_time: s.start_time,
        end_time:   s.end_time,
      })),
    };
  },
};
