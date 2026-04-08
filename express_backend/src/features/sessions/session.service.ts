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
import type { StartSessionResponse, JoinSessionResponse } from "./session.model";

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
    // 1. Load the session
    const session = await prisma.session.findFirst({
      where: { session_id: sessionId, tenant_id: tenantId },
    });

    if (!session)             throw new AppError("Session not found.", 404);
    if (session.status !== "live") throw new AppError("This session is not currently live.", 400);
    if (!session.room_name)   throw new AppError("Session room not initialized.", 500);

    // 2. Validate the student has a confirmed booking on this slot
    const booking = await prisma.booking.findFirst({
      where: {
        slot_id:   session.slot_id,
        tenant_id: tenantId,
        status:    "confirmed",
        student:   { user_id: studentUserId },
      },
      include: { student: { include: { user: true } } },
    });

    if (!booking) {
      throw new AppError("You do not have a confirmed booking for this session.", 403);
    }

    // 3. Generate student token (canPublish: false — student only receives video)
    //    canPublishData: true — student CAN send whiteboard events
    const token = await generateToken({
      identity:  `user-${studentUserId}`,
      name:      booking.student.user.name,
      roomName:  session.room_name,
      isTeacher: false,
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

    // 1. Update session record
    await prisma.session.update({
      where: { session_id: sessionId },
      data:  { status: "completed", end_time: new Date() },
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

    // 4. Set payout eligible_at = now + 24h on all paid transactions for this slot
    const eligibleAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.transaction.updateMany({
      where: {
        booking: { slot_id: session.slot_id },
        payment_status: "paid",
        payout_status:  "pending",
      },
      data: {
        payout_status: "eligible",
        eligible_at:   eligibleAt,
      },
    });

    // 5. Close the LiveKit room (ends all streams)
    if (session.room_name) {
      await deleteRoom(session.room_name);
    }

    return { message: "Session ended successfully." };
  },

  /**
   * GET SESSION — for frontend reconnect / status polling
   */
  async getSession(sessionId: number, tenantId: number) {
    const session = await prisma.session.findFirst({
      where:   { session_id: sessionId, tenant_id: tenantId },
      include: { slot: { include: { subject: true } } },
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
