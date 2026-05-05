/**
 * session.service.ts
 *
 * Full lifecycle management for live tutoring sessions:
 *  1. Tutor starts session   → creates LiveKit room, generates tutor token
 *  2. Student joins session  → validates booking, generates student token
 *  3. Tutor ends session     → updates records, closes LiveKit room
 *  4. Get session details    → for polling/reconnect on frontend
 *
 * WHITEBOARD: handled entirely on the frontend via LiveKit DataChannel.
 * This service only ensures canPublishData = true on ALL tokens.
 * No extra server, no extra cost.
 */
import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";
import {
  createRoom,
  deleteRoom,
  generateRoomName,
  generateToken,
} from "../../utils/livekit.util";
import { env } from "../../config/env.config";
import { logger } from "../../utils/logger";
import type { StartSessionResponse, JoinSessionResponse } from "./session.model";

/**
 * STALE SESSION CLEANUP
 *
 * Finds all sessions that are still "live" but whose slot date has passed.
 * This handles the case where a tutor closed their browser without ending
 * the session, or the server restarted mid-session.
 *
 * Called on server startup and lazily on every session read/join/start.
 */
export async function cleanupStaleSessions(): Promise<void> {
  try {
    // Find sessions that are still "live" but the slot date is in the past
    // We use end_of_day of slot_date as the cutoff — a session on April 16
    // is stale if it's now April 17 or later.
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    const staleSessions = await prisma.session.findMany({
      where: {
        status: "live",
        slot: {
          slot_date: { lt: today }, // slot date is before today
        },
      },
      include: {
        slot: true,
      },
    });

    if (staleSessions.length === 0) return;

    logger.info(`[cleanup] Found ${staleSessions.length} stale session(s) — auto-closing.`);

    for (const session of staleSessions) {
      try {
        // 1. Mark session completed
        await prisma.session.update({
          where: { session_id: session.session_id },
          data:  { status: "completed", end_time: new Date() },
        });

        // 2. Complete all confirmed bookings on this slot
        await prisma.booking.updateMany({
          where: { slot_id: session.slot_id, status: "confirmed" },
          data:  { status: "completed" },
        });

        // 3. Mark the slot as completed
        await prisma.timeSlot.update({
          where: { slot_id: session.slot_id },
          data:  { status: "completed" },
        });

        // 4. Mark paid transactions as eligible for payout
        await prisma.transaction.updateMany({
          where: {
            booking: { slot_id: session.slot_id },
            payment_status: "paid",
            payout_status:  "pending",
          },
          data: {
            payout_status: "eligible",
            eligible_at:   new Date(),
          },
        });

        // 5. Try to destroy the LiveKit room (may already be gone — ignore errors)
        if (session.room_name) {
          try { await deleteRoom(session.room_name); } catch { /* room already gone */ }
        }

        logger.info(`[cleanup] Session ${session.session_id} (slot ${session.slot_id}) auto-closed.`);
      } catch (err) {
        logger.error(`[cleanup] Failed to close session ${session.session_id}:`, err);
      }
    }
  } catch (err) {
    logger.error("[cleanup] cleanupStaleSessions error:", err);
  }
}

/**
 * EXPIRED SLOT CLEANUP
 *
 * Finds slots that are still "available" or "full" but whose date has passed
 * without a session ever being started. Cancels them and their pending bookings.
 * Students with pending (unpaid) bookings get them cancelled automatically.
 * Students with confirmed (paid) bookings get their transactions marked eligible
 * for refund review by admin.
 */
export async function cleanupExpiredSlots(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredSlots = await prisma.timeSlot.findMany({
      where: {
        status:    { in: ["available", "full"] },
        slot_date: { lt: today },
        // Only slots that never had a session started
        session:   null,
      },
    });

    if (expiredSlots.length === 0) return;

    logger.info(`[cleanup] Found ${expiredSlots.length} expired slot(s) — auto-cancelling.`);

    for (const slot of expiredSlots) {
      try {
        // Cancel pending (unpaid) bookings — no money involved
        await prisma.booking.updateMany({
          where: { slot_id: slot.slot_id, status: "pending" },
          data:  { status: "cancelled" },
        });

        // For confirmed (paid) bookings — mark as cancelled and flag transactions
        // for admin review (payout_status: "disputed" so admin can decide refund)
        const confirmedBookings = await prisma.booking.findMany({
          where: { slot_id: slot.slot_id, status: "confirmed" },
        });

        for (const booking of confirmedBookings) {
          await prisma.booking.update({
            where: { booking_id: booking.booking_id },
            data:  { status: "cancelled" },
          });
          // Flag the transaction for admin review — tutor never showed up
          await prisma.transaction.updateMany({
            where: { booking_id: booking.booking_id, payment_status: "paid" },
            data:  { payout_status: "disputed" },
          });
        }

        // Mark slot as cancelled
        await prisma.timeSlot.update({
          where: { slot_id: slot.slot_id },
          data:  { status: "cancelled" },
        });

        logger.info(`[cleanup] Slot ${slot.slot_id} expired and auto-cancelled.`);
      } catch (err) {
        logger.error(`[cleanup] Failed to cancel slot ${slot.slot_id}:`, err);
      }
    }
  } catch (err) {
    logger.error("[cleanup] cleanupExpiredSlots error:", err);
  }
}

export const sessionService = {
  /**
   * START SESSION (Tutor only)
   * - Validates the booking is confirmed and belongs to this tutor
   * - Creates or reuses a Session DB record
   * - Creates a LiveKit room
   * - Returns a tutor token (canPublish + canPublishData)
   */
  async startSession(
    bookingId: number,
    tutorUserId: number,
    tenantId: number
  ): Promise<StartSessionResponse> {
    // Run stale cleanup lazily on every session action
    await cleanupStaleSessions();
    await cleanupExpiredSlots();

    // 1. Load booking and validate ownership
    const booking = await prisma.booking.findFirst({
      where: { booking_id: bookingId, tenant_id: tenantId },
      include: {
        slot:    { include: { teacher: { include: { user: true } }, subject: true } },
        student: { include: { user: true } },
      },
    });

    if (!booking) throw new AppError("Booking not found.", 404);
    if (booking.slot.teacher.user_id !== tutorUserId) {
      throw new AppError("You can only start sessions for your own bookings.", 403);
    }
    if (booking.status !== "confirmed") {
      throw new AppError("Only confirmed bookings can start a session.", 400);
    }

    // 2. Check for existing session on this slot
    let session = await prisma.session.findUnique({
      where: { slot_id: booking.slot_id },
    });

    if (session && session.status === "live") {
      // Already live — just re-generate a token (reconnect scenario)
      const token = await generateToken({
        identity:  `user-${tutorUserId}`,
        name:      booking.slot.teacher.user.name,
        roomName:  session.room_name!,
        isTeacher: true,
      });
      return {
        sessionId:   session.session_id,
        roomName:    session.room_name!,
        liveKitUrl:  env.LIVEKIT_URL!,
        token,
        meetingLink: session.meeting_link!,
      };
    }

    // 3. Create a new session
    const roomName    = generateRoomName(booking.slot_id);
    const meetingLink = `${env.ALLOWED_ORIGINS?.split(",")[0] ?? "http://localhost:3000"}/session/${roomName}`;

    await createRoom(roomName);

    session = await prisma.session.upsert({
      where: { slot_id: booking.slot_id },
      update: {
        status:       "live",
        start_time:   new Date(),
        room_name:    roomName,
        meeting_link: meetingLink,
      },
      create: {
        tenant_id:    tenantId,
        slot_id:      booking.slot_id,
        teacher_id:   tutorUserId,
        start_time:   new Date(),
        status:       "live",
        room_name:    roomName,
        meeting_link: meetingLink,
      },
    });

    // 4. Mark booking as confirmed→in-progress (stays confirmed until end)
    // 5. Generate tutor token (canPublish: true for video/audio)
    const token = await generateToken({
      identity:  `user-${tutorUserId}`,
      name:      booking.slot.teacher.user.name,
      roomName,
      isTeacher: true,
    });

    return {
      sessionId:   session.session_id,
      roomName,
      liveKitUrl:  env.LIVEKIT_URL!,
      token,
      meetingLink,
    };
  },

  /**
   * JOIN SESSION (Student)
   * - Validates student has a confirmed booking for this slot
   * - Returns a student token (canPublish: false, canPublishData: true for whiteboard)
   */
  async joinSession(
    sessionId: number,
    studentUserId: number,
    tenantId: number
  ): Promise<JoinSessionResponse> {
    // Run stale cleanup before join — prevents joining a ghost session
    await cleanupStaleSessions();

    // 1. Load the session
    const session = await prisma.session.findFirst({
      where: { session_id: sessionId, tenant_id: tenantId },
    });

    if (!session)             throw new AppError("Session not found.", 404);
    if (session.status !== "live") throw new AppError("This session is not currently live.", 400);
    if (!session.room_name)   throw new AppError("Session room not initialized.", 500);

    // 2. Validate the student has a confirmed OR completed booking on this slot
    // "completed" covers the case where student left and is rejoining before session ends
    const booking = await prisma.booking.findFirst({
      where: {
        slot_id:   session.slot_id,
        tenant_id: tenantId,
        status:    { in: ["confirmed", "completed"] },
        student:   { user_id: studentUserId },
      },
      include: { student: { include: { user: true } } },
    });

    if (!booking) {
      throw new AppError("You do not have a booking for this session.", 403);
    }

    // 3. Generate student token — canPublish: true so students can use camera/mic
    const token = await generateToken({
      identity:   `user-${studentUserId}`,
      name:       booking.student.user.name,
      roomName:   session.room_name,
      isTeacher:  false,
      canPublish: true,
    });

    return {
      sessionId,
      roomName:   session.room_name,
      liveKitUrl: env.LIVEKIT_URL!,
      token,
    };
  },

  /**
   * END SESSION (Tutor only)
   * - Sets session status → completed + records end_time
   * - Sets all confirmed bookings on this slot → completed
   * - Destroys LiveKit room (stops all video/audio/data flows)
   */
  async endSession(
    sessionId: number,
    tutorUserId: number,
    tenantId: number
  ): Promise<{ message: string }> {
    const session = await prisma.session.findFirst({
      where: { session_id: sessionId, tenant_id: tenantId },
    });

    if (!session)                             throw new AppError("Session not found.", 404);
    if (session.teacher_id !== tutorUserId)   throw new AppError("Only the session host can end it.", 403);
    if (session.status !== "live")            throw new AppError("Session is not live.", 400);

    // 1. Calculate actual duration in minutes
    const endTime = new Date();
    const durationMinutes = Math.round(
      (endTime.getTime() - session.start_time.getTime()) / 60000
    );

    // 2. Update session record with end time and duration
    await prisma.session.update({
      where: { session_id: sessionId },
      data:  { status: "completed", end_time: endTime },
    });

    // 2. Complete all confirmed bookings on this slot
    await prisma.booking.updateMany({
      where: { slot_id: session.slot_id, status: "confirmed" },
      data:  { status: "completed" },
    });

    // 3. Mark the time slot as completed
    await prisma.timeSlot.update({
      where: { slot_id: session.slot_id },
      data:  { status: "completed" },
    });

    // 4. Mark transactions as eligible for payout immediately
    await prisma.transaction.updateMany({
      where: {
        booking: { slot_id: session.slot_id },
        payment_status: "paid",
        payout_status:  "pending",
      },
      data: {
        payout_status: "eligible",
        eligible_at:   new Date(),
      },
    });

    // 5. Close the LiveKit room (ends all streams)
    if (session.room_name) {
      await deleteRoom(session.room_name);
    }

    return { message: "Session ended successfully.", durationMinutes } as any;
  },

  async getSession(sessionId: number, tenantId: number) {
    // Run stale cleanup on every read — fixes ghost sessions on frontend polling
    await cleanupStaleSessions();

    const session = await prisma.session.findFirst({
      where:   { session_id: sessionId, tenant_id: tenantId },
      include: {
        slot: {
          include: {
            subject: true,
            teacher: { include: { user: { select: { name: true } } } },
            bookings: {
              where: { status: "completed" },
              include: { student: { include: { user: { select: { user_id: true } } } } },
            },
          },
        },
      },
    });
    if (!session) throw new AppError("Session not found.", 404);
    return session;
  },

  /**
   * GET MY SESSIONS — tutor views their session history
   */
  async getMySessions(tutorUserId: number, tenantId: number) {
    return prisma.session.findMany({
      where: {
        teacher_id: tutorUserId,
        tenant_id:  tenantId,
      },
      include: {
        slot: {
          include: {
            subject:  true,
            bookings: { include: { student: { include: { user: { select: { name: true } } } } } },
          },
        },
      },
      orderBy: { start_time: "desc" },
    });
  },
};
