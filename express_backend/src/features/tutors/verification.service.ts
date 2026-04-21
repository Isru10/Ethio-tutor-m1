import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";

const LOCK_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const verificationService = {
  /** List all tutors pending verification (or all, for admin overview) */
  getPendingTutors: (tenantId: number) =>
    prisma.teacherProfile.findMany({
      where: {
        tenant_id: tenantId,
        verification_status: { in: ["pending", "pending_info"] },
      },
      include: {
        user: { select: { user_id: true, name: true, email: true, phone: true, created_at: true } },
        teacherSubjects: { include: { subject: true } },
      },
      orderBy: { user: { created_at: "asc" } }, // oldest first
    }),

  /** Reviewer claims a profile — sets a 10-min lock */
  claimProfile: async (profileId: number, reviewerUserId: number, tenantId: number) => {
    const profile = await prisma.teacherProfile.findFirst({
      where: { teacher_profile_id: profileId, tenant_id: tenantId },
      include: { user: { select: { name: true } } },
    });
    if (!profile) throw new AppError("Profile not found.", 404);

    // Check if locked by someone else and lock is still valid
    if (
      profile.locked_by &&
      profile.locked_by !== reviewerUserId &&
      profile.locked_at &&
      Date.now() - profile.locked_at.getTime() < LOCK_TTL_MS
    ) {
      throw new AppError("This profile is currently being reviewed by another reviewer.", 409);
    }

    return prisma.teacherProfile.update({
      where: { teacher_profile_id: profileId },
      data: { locked_by: reviewerUserId, locked_at: new Date() },
      include: {
        user: { select: { user_id: true, name: true, email: true, phone: true, created_at: true } },
        teacherSubjects: { include: { subject: true } },
      },
    });
  },

  /** Release a claim (reviewer closes the panel) */
  releaseClaim: async (profileId: number, reviewerUserId: number) => {
    const profile = await prisma.teacherProfile.findUnique({
      where: { teacher_profile_id: profileId },
    });
    if (!profile) throw new AppError("Profile not found.", 404);
    if (profile.locked_by !== reviewerUserId) throw new AppError("You don't hold the lock on this profile.", 403);

    return prisma.teacherProfile.update({
      where: { teacher_profile_id: profileId },
      data: { locked_by: null, locked_at: null },
    });
  },

  /** Submit a verification decision */
  submitDecision: async (
    profileId: number,
    reviewerUserId: number,
    tenantId: number,
    decision: "approved" | "rejected" | "pending_info",
    note?: string,
  ) => {
    const profile = await prisma.teacherProfile.findFirst({
      where: { teacher_profile_id: profileId, tenant_id: tenantId },
      include: { user: true },
    });
    if (!profile) throw new AppError("Profile not found.", 404);

    // Verify the reviewer holds the lock (or lock expired — allow anyway)
    const lockValid =
      profile.locked_by === reviewerUserId &&
      profile.locked_at &&
      Date.now() - profile.locked_at.getTime() < LOCK_TTL_MS;

    if (profile.locked_by && profile.locked_by !== reviewerUserId && lockValid) {
      throw new AppError("Another reviewer is currently reviewing this profile.", 409);
    }

    // Update profile
    const updated = await prisma.teacherProfile.update({
      where: { teacher_profile_id: profileId },
      data: {
        verification_status: decision,
        verification_note:   note ?? null,
        reviewed_by:         reviewerUserId,
        reviewed_at:         new Date(),
        locked_by:           null,
        locked_at:           null,
      },
    });

    // If approved → activate the tutor's user account
    if (decision === "approved") {
      await prisma.user.update({
        where: { user_id: profile.user_id },
        data:  { status: "active" },
      });
    }

    // Create a notification for the tutor
    const messages: Record<string, string> = {
      approved:     "Congratulations! Your tutor profile has been approved. You can now create sessions.",
      rejected:     `Your tutor profile was not approved. Reason: ${note ?? "No reason provided."}`,
      pending_info: `Your profile needs more information before it can be approved: ${note ?? "Please update your profile."}`,
    };

    await prisma.notification.create({
      data: {
        tenant_id:    tenantId,
        recipient_id: profile.user_id,
        title:        decision === "approved" ? "Profile Approved ✅" : decision === "rejected" ? "Profile Rejected ❌" : "More Info Required ⚠️",
        message:      messages[decision],
      },
    });

    return updated;
  },
};
