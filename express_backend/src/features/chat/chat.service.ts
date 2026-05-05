import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";

export const chatService = {
  /**
   * Get or create a direct conversation between two users.
   * Returns existing conversation if one already exists.
   */
  async getOrCreateDirect(userAId: number, userBId: number, tenantId: number) {
    // Find existing direct conversation between these two users
    const existing = await prisma.conversation.findFirst({
      where: {
        tenant_id: tenantId,
        type: "direct",
        participants: {
          every: { user_id: { in: [userAId, userBId] } },
        },
      },
      include: {
        participants: { include: { user: { select: { user_id: true, name: true, role: true } } } },
        messages: { orderBy: { created_at: "desc" }, take: 1 },
      },
    });

    if (existing) {
      // Verify both users are actually participants (the "every" filter above can be tricky)
      const participantIds = existing.participants.map(p => p.user_id);
      if (participantIds.includes(userAId) && participantIds.includes(userBId)) {
        return existing;
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        tenant_id: tenantId,
        type: "direct",
        participants: {
          create: [
            { user_id: userAId },
            { user_id: userBId },
          ],
        },
      },
      include: {
        participants: { include: { user: { select: { user_id: true, name: true, role: true } } } },
        messages: { orderBy: { created_at: "desc" }, take: 1 },
      },
    });

    return conversation;
  },

  /**
   * Get all conversations for a user, with last message and unread count.
   */
  async getMyConversations(userId: number, tenantId: number) {
    const participations = await prisma.conversationParticipant.findMany({
      where: { user_id: userId, conversation: { tenant_id: tenantId } },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { select: { user_id: true, name: true, role: true } } },
            },
            messages: {
              orderBy: { created_at: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { created_at: "desc" } },
    });

    return participations.map(p => {
      const conv = p.conversation;
      const lastMessage = conv.messages[0] ?? null;
      return {
        conversation_id: conv.conversation_id,
        type: conv.type,
        name: conv.name,
        participants: conv.participants.map(cp => cp.user),
        last_message: lastMessage ? {
          content: lastMessage.content,
          sender_id: lastMessage.sender_id,
          created_at: lastMessage.created_at,
        } : null,
        last_read_at: p.last_read_at,
        created_at: conv.created_at,
      };
    });
  },

  /**
   * Get messages for a conversation. Validates user is a participant.
   */
  async getMessages(conversationId: number, userId: number, tenantId: number, cursor?: number) {
    // Validate participant
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });
    if (!participation) throw new AppError("You are not a participant in this conversation.", 403);

    const messages = await prisma.chatMessage.findMany({
      where: { conversation_id: conversationId },
      include: { sender: { select: { user_id: true, name: true, role: true } } },
      orderBy: { created_at: "asc" },
      take: 50,
      ...(cursor ? { cursor: { message_id: cursor }, skip: 1 } : {}),
    });

    return messages;
  },

  /**
   * Send a message to a conversation.
   * Also creates a Notification for each recipient (not the sender).
   */
  async sendMessage(conversationId: number, senderId: number, content: string, type: string, tenantId: number) {
    // Validate participant
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: senderId } },
    });
    if (!participation) throw new AppError("You are not a participant in this conversation.", 403);

    const message = await prisma.chatMessage.create({
      data: {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type: type ?? "text",
      },
      include: { sender: { select: { user_id: true, name: true, role: true } } },
    });

    // Create a notification for every other participant in the conversation
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: { conversation_id: conversationId, user_id: { not: senderId } },
    });

    if (otherParticipants.length > 0) {
      const preview = content.length > 60 ? content.slice(0, 60) + "…" : content;
      await prisma.notification.createMany({
        data: otherParticipants.map(p => ({
          tenant_id:    tenantId,
          recipient_id: p.user_id,
          title:        `New message from ${message.sender.name}`,
          message:      preview,
        })),
      });
    }

    return message;
  },

  /**
   * Mark all messages in a conversation as read for a user.
   */
  async markRead(conversationId: number, userId: number) {
    await prisma.conversationParticipant.updateMany({
      where: { conversation_id: conversationId, user_id: userId },
      data: { last_read_at: new Date() },
    });
    return { message: "Marked as read." };
  },

  /**
   * Get unread message counts per conversation for a user.
   */
  async getUnreadCounts(userId: number, tenantId: number) {
    const participations = await prisma.conversationParticipant.findMany({
      where: { user_id: userId, conversation: { tenant_id: tenantId } },
    });

    const counts: Record<number, number> = {};
    for (const p of participations) {
      const count = await prisma.chatMessage.count({
        where: {
          conversation_id: p.conversation_id,
          created_at: { gt: p.last_read_at },
          sender_id: { not: userId },
        },
      });
      counts[p.conversation_id] = count;
    }
    return counts;
  },

  /**
   * Broadcast a message to multiple users at once (admin only).
   * Creates a separate direct conversation with each target user and sends the message.
   * Also creates a Notification for each recipient.
   */
  async broadcastMessage(senderId: number, tenantId: number, targetUserIds: number[], content: string) {
    const sender = await prisma.user.findUnique({
      where: { user_id: senderId },
      select: { name: true },
    });
    const senderName = sender?.name ?? "Admin";
    const preview = content.length > 60 ? content.slice(0, 60) + "…" : content;

    const results: { userId: number; conversationId: number }[] = [];

    for (const targetId of targetUserIds) {
      // Get or create a direct conversation
      const conv = await this.getOrCreateDirect(senderId, targetId, tenantId);

      // Send the message
      await prisma.chatMessage.create({
        data: {
          conversation_id: conv.conversation_id,
          sender_id: senderId,
          content,
          type: "text",
        },
      });

      // Create notification for the recipient
      await prisma.notification.create({
        data: {
          tenant_id:    tenantId,
          recipient_id: targetId,
          title:        `Message from ${senderName}`,
          message:      preview,
        },
      });

      results.push({ userId: targetId, conversationId: conv.conversation_id });
    }

    return { sent: results.length, results };
  },

  /**
   * Get list of users this user can chat with.
   * Students: their tutors (from bookings) + admins
   * Tutors: their students (from bookings) + admins
   * Admins: everyone
   */
  async getChatableUsers(userId: number, tenantId: number, role: string) {
    if (["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(role)) {
      // Admins can chat with everyone
      return prisma.user.findMany({
        where: { tenant_id: tenantId, user_id: { not: userId } },
        select: { user_id: true, name: true, role: true, email: true },
        orderBy: { name: "asc" },
      });
    }

    if (role === "STUDENT") {
      // Students can chat with tutors they have bookings with + admins
      const bookings = await prisma.booking.findMany({
        where: { student: { user_id: userId }, tenant_id: tenantId },
        include: { slot: { include: { teacher: { include: { user: true } } } } },
      });
      const tutorUserIds = [...new Set(bookings.map(b => b.slot.teacher.user_id))];
      const admins = await prisma.user.findMany({
        where: { tenant_id: tenantId, role: { in: ["ADMIN", "SUPER_ADMIN", "MODERATOR"] } },
        select: { user_id: true, name: true, role: true, email: true },
      });
      const tutors = await prisma.user.findMany({
        where: { user_id: { in: tutorUserIds } },
        select: { user_id: true, name: true, role: true, email: true },
      });
      return [...tutors, ...admins];
    }

    if (role === "TUTOR") {
      // Tutors can chat with their students + admins
      const profile = await prisma.teacherProfile.findUnique({ where: { user_id: userId } });
      if (!profile) return [];
      const bookings = await prisma.booking.findMany({
        where: { slot: { teacher_id: profile.teacher_profile_id }, tenant_id: tenantId },
        include: { student: { include: { user: true } } },
      });
      const studentUserIds = [...new Set(bookings.map(b => b.student.user_id))];
      const admins = await prisma.user.findMany({
        where: { tenant_id: tenantId, role: { in: ["ADMIN", "SUPER_ADMIN", "MODERATOR"] } },
        select: { user_id: true, name: true, role: true, email: true },
      });
      const students = await prisma.user.findMany({
        where: { user_id: { in: studentUserIds } },
        select: { user_id: true, name: true, role: true, email: true },
      });
      return [...students, ...admins];
    }

    return [];
  },
};
