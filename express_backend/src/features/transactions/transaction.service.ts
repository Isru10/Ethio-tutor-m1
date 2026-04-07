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
    throw new AppError(data.message ?? "Chapa initialization failed.", 502);
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

    const { checkout_url } = await chapaInitialize({
      amount:       gross,
      currency:     "ETB",
      email:        booking.student.user.email,
      first_name:   studentName[0] ?? "Student",
      last_name:    studentName[1] ?? "",
      tx_ref:       txRef,
      callback_url: `${backendBase}/api/v1/transactions/webhook`,
      return_url:   `${frontendBase}/payment/verify?tx_ref=${txRef}`,
      customization: {
        title:       `EthioTutor — ${booking.slot.subject.name} Session`,
        description: `Booking #${bookingId} with ${booking.slot.teacher.user.name}`,
      },
    });

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
};
