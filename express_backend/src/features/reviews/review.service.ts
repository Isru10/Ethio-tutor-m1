import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";

import type { CreateReviewInput } from "./review.model";

export const reviewService = {
  async create({ bookingId, teacherId, rating, comment }: CreateReviewInput, studentId: number, tenantId: number) {
    const booking = await prisma.booking.findUnique({ where: { booking_id: bookingId }, include: { review: true } });
    if (!booking)                       throw new AppError("Booking not found.", 404);
    if (booking.status !== "completed") throw new AppError("You can only review a completed session.", 400);
    if (booking.review)                 throw new AppError("You already reviewed this session.", 409);

    const review = await prisma.review.create({
      data: { tenant_id: tenantId, booking_id: bookingId, student_id: studentId, teacher_id: teacherId, rating, comment },
    });

    // Auto-recalculate tutor's average_rating
    const { _avg } = await prisma.review.aggregate({ where: { teacher_id: teacherId }, _avg: { rating: true } });
    await prisma.teacherProfile.update({ where: { user_id: teacherId }, data: { average_rating: _avg.rating ?? 0 } });

    return review;
  },

  getForTutor: (teacherId: number, tenantId: number) =>
    prisma.review.findMany({
      where:   { teacher_id: teacherId, tenant_id: tenantId },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { created_at: "desc" },
    }),
};
