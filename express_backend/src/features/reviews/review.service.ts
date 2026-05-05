import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";

import type { CreateReviewInput } from "./review.model";

export const reviewService = {
  async create({ bookingId, teacherId, rating, comment }: CreateReviewInput, studentId: number, tenantId: number) {
    const booking = await prisma.booking.findUnique({ where: { booking_id: bookingId }, include: { review: true } });
    if (!booking)                       throw new AppError("Booking not found.", 404);
    if (booking.status !== "completed") throw new AppError("You can only review a completed session.", 400);
    if (booking.review)                 throw new AppError("You already reviewed this session.", 409);

    // teacherId from the frontend is Session.teacher_id = User.user_id
    // Review.teacher_id expects TeacherProfile.teacher_profile_id — resolve it
    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { user_id: teacherId } });
    if (!teacherProfile) throw new AppError("Tutor profile not found.", 404);
    const teacherProfileId = teacherProfile.teacher_profile_id;

    // student_id on Review also expects StudentProfile.student_profile_id
    const studentProfile = await prisma.studentProfile.findUnique({ where: { user_id: studentId } });
    if (!studentProfile) throw new AppError("Student profile not found.", 404);
    const studentProfileId = studentProfile.student_profile_id;

    const review = await prisma.review.create({
      data: {
        tenant_id:  tenantId,
        booking_id: bookingId,
        student_id: studentProfileId,
        teacher_id: teacherProfileId,
        rating,
        comment,
      },
    });

    // Auto-recalculate tutor's average_rating
    const { _avg } = await prisma.review.aggregate({ where: { teacher_id: teacherProfileId }, _avg: { rating: true } });
    await prisma.teacherProfile.update({ where: { teacher_profile_id: teacherProfileId }, data: { average_rating: _avg.rating ?? 0 } });

    return review;
  },

  getForTutor: (teacherId: number, tenantId: number) =>
    prisma.review.findMany({
      where:   { teacher_id: teacherId, tenant_id: tenantId },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { created_at: "desc" },
    }),
};
