import { prisma } from "../../models/prisma.client";
import { calcCommission, calcTeacherNet } from "../../utils/currency.util";
import { env } from "../../config/env.config";
import { AppError } from "../../middlewares/error.middleware";
import crypto from "crypto";

// ─── Typed Chapa responses ────────────────────────────────────
interface ChapaInitResponse {
  status: string;
  message?: string;
  data?: { checkout_url: string };
}

interface ChapaVerifyResponse {
  status: string;
  data?: { status: string };
}

// ─── Chapa API helpers ────────────────────────────────────────
async function chapaInitialize(payload: {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization: { title: string; description: string };
}): Promise<{ checkout_url: string }> {
  const res = await fetch(`${env.CHAPA_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.CHAPA_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json() as ChapaInitResponse;
  if (!res.ok || data.status !== "success" || !data.data?.checkout_url) {
    throw new AppError(`Chapa error: ${data.message ?? JSON.stringify(data)}`, 502);
  }
  return { checkout_url: data.data.checkout_url };
}

async function chapaVerify(txRef: string): Promise<ChapaVerifyResponse> {
  const res = await fetch(`${env.CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
    headers: { "Authorization": `Bearer ${env.CHAPA_SECRET_KEY}` },
  });
  return res.json() as Promise<ChapaVerifyResponse>;
}

/** Verify Chapa webhook signature using HMAC-SHA256 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.CHAPA_WEBHOOK_SECRET) return true;
  const expected = crypto
    .createHmac("sha256", env.CHAPA_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ─── Service ─────────────────────────────────────────────────
export const transactionService = {
  getMyTransactions: (userId: number, tenantId: number) =>
    prisma.transaction.findMany({
      where:   { student: { user_id: userId }, tenant_id: tenantId },
      include: { booking: { include: { slot: { include: { subject: true } } } } },
      orderBy: { created_at: "desc" },
    }),

  async initiatePayment(bookingId: number, _studentUserId: number, tenantId: number) {
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        slot: {
          include: {
            subject: true,
            teacher: { include: { user: { select: { name: true, email: true } } } },
          },
        },
        student: { include: { user: { select: { name: true, email: true } } } },
      },
    });
    if (!booking) throw new AppError("Booking not found.", 404);

    const gross = Number(booking.slot.teacher.hourly_rate);

    // Guard: Chapa rejects amount = 0
    if (!gross || gross <= 0) {
      throw new AppError("This slot has no price set. Contact the tutor.", 422);
    }

    const txRef = `ET-${bookingId}-${Date.now()}`;

    let txn = await prisma.transaction.findUnique({ where: { booking_id: bookingId } });
    if (!txn) {
      txn = await prisma.transaction.create({
        data: {
          tenant_id:           tenantId,
          booking_id:          bookingId,
          student_id:          booking.student_id,
          teacher_id:          booking.slot.teacher_id,
          total_amount:        gross,
          platform_commission: calcCommission(gross),
          teacher_earnings:    calcTeacherNet(gross),
          payment_status:      "pending",
          chapa_ref:           txRef,
        },
      });
    }

    const studentName = booking.student.user.name.split(" ");
    const frontendBase = env.FRONTEND_URL ?? env.ALLOWED_ORIGINS?.split(",")[0] ?? "http://localhost:3000";
    const backendBase  = env.BACKEND_URL  ?? `http://localhost:${env.PORT}`;

    let checkout_url: string;
    try {
      const result = await chapaInitialize({
        amount:       gross,
        currency:     "ETB",
        email:        booking.student.user.email,
        first_name:   studentName[0] ?? "Student",
        last_name:    studentName[1] ?? "",
        tx_ref:       txRef,
        callback_url: `${backendBase}/api/v1/transactions/webhook`,
        return_url:   `${frontendBase}/payment/verify?tx_ref=${txRef}`,
        customization: {
          title:       "Tutoring Session",
          description: `Booking ${bookingId} ${booking.slot.subject.name}`,
        },
      });
      checkout_url = result.checkout_url;
    } catch (err) {
      // Payment init failed — cancel the booking and restore the seat
      await prisma.booking.update({
        where: { booking_id: bookingId },
        data:  { status: "cancelled" },
      });
      await prisma.timeSlot.update({
        where: { slot_id: booking.slot_id },
        data:  { remaining_seats: { increment: 1 } },
      });
      await prisma.transaction.update({
        where: { transaction_id: txn.transaction_id },
        data:  { payment_status: "failed" },
      });
      throw err;
    }

    return { checkout_url, txRef, bookingId };
  },

  async verifyPayment(txRef: string) {
    const txn = await prisma.transaction.findFirst({ where: { chapa_ref: txRef } });
    if (!txn) throw new AppError("Transaction not found.", 404);

    if (txn.payment_status === "paid") {
      return { status: "paid", bookingId: txn.booking_id };
    }

    const chapaData = await chapaVerify(txRef);

    if (chapaData.status === "success" && chapaData.data?.status === "success") {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { transaction_id: txn.transaction_id },
          data:  { payment_status: "paid" },
        }),
        prisma.booking.update({
          where: { booking_id: txn.booking_id },
          data:  { status: "confirmed" },
        }),
      ]);
      return { status: "paid", bookingId: txn.booking_id };
    }

    await prisma.transaction.update({
      where: { transaction_id: txn.transaction_id },
      data:  { payment_status: "failed" },
    });
    await prisma.booking.update({
      where: { booking_id: txn.booking_id },
      data:  { status: "cancelled" },
    });
    return { status: "failed", bookingId: txn.booking_id };
  },

  async handleWebhook(txRef: string) {
    return this.verifyPayment(txRef);
  },

  // ─── Admin endpoints ───────────────────────────────────────

  getAllTransactions: (tenantId: number, status?: string) =>
    prisma.transaction.findMany({
      where: {
        tenant_id: tenantId,
        ...(status ? { payment_status: status as "pending" | "paid" | "refunded" | "failed" } : {}),
      },
      include: {
        booking: { include: { slot: { include: { subject: true } } } },
        student: { include: { user: { select: { name: true, email: true } } } },
        teacher: { include: { user: { select: { name: true } } } },
      },
      orderBy: { created_at: "desc" },
    }),

  async refundTransaction(transactionId: number, tenantId: number) {
    const txn = await prisma.transaction.findFirst({
      where: { transaction_id: transactionId, tenant_id: tenantId },
    });
    if (!txn) throw new AppError("Transaction not found.", 404);
    if (txn.payment_status !== "paid") throw new AppError("Only paid transactions can be refunded.", 409);

    return prisma.$transaction([
      prisma.transaction.update({
        where: { transaction_id: transactionId },
        data:  { payment_status: "refunded" },
      }),
      prisma.booking.update({
        where: { booking_id: txn.booking_id },
        data:  { status: "cancelled" },
      }),
    ]);
  },

  getPlatformStats: async (tenantId: number) => {
    const [total, paid, refunded] = await Promise.all([
      prisma.transaction.aggregate({ where: { tenant_id: tenantId }, _sum: { total_amount: true }, _count: true }),
      prisma.transaction.aggregate({ where: { tenant_id: tenantId, payment_status: "paid" }, _sum: { total_amount: true, platform_commission: true, teacher_earnings: true }, _count: true }),
      prisma.transaction.aggregate({ where: { tenant_id: tenantId, payment_status: "refunded" }, _sum: { total_amount: true }, _count: true }),
    ]);
    return {
      total_transactions:   total._count,
      paid_transactions:    paid._count,
      refunded_transactions: refunded._count,
      gross_revenue:        Number(paid._sum.total_amount ?? 0),
      platform_commission:  Number(paid._sum.platform_commission ?? 0),
      teacher_earnings:     Number(paid._sum.teacher_earnings ?? 0),
      refunded_amount:      Number(refunded._sum.total_amount ?? 0),
    };
  },
};
