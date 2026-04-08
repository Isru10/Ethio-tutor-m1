import { prisma } from "../../models/prisma.client";
import { AppError } from "../../middlewares/error.middleware";
import { env } from "../../config/env.config";

interface ChapaTransferResponse {
  status:  string;
  message?: string;
  data?:   { transfer_reference: string };
}

async function chapaTransfer(payload: {
  account_name:  string;
  account_number: string;
  amount:        number;
  currency:      string;
  reference:     string;
  bank_code?:    string;
}): Promise<string> {
  const res = await fetch(`${env.CHAPA_BASE_URL}/transfers`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${env.CHAPA_SECRET_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json() as ChapaTransferResponse;
  if (!res.ok || data.status !== "success") {
    throw new AppError(data.message ?? "Chapa transfer failed.", 502);
  }
  return data.data!.transfer_reference;
}

export const payoutService = {
  /**
   * Admin or system triggers payout for a single transaction.
   * Calls Chapa Transfer API → sends teacher_earnings to tutor's registered account.
   */
  async releasePayout(transactionId: number, tenantId: number) {
    const txn = await prisma.transaction.findFirst({
      where: { transaction_id: transactionId, tenant_id: tenantId },
      include: {
        teacher: true,
        booking: { include: { slot: { include: { subject: true } } } },
      },
    });

    if (!txn) throw new AppError("Transaction not found.", 404);
    if (txn.payment_status !== "paid") throw new AppError("Transaction is not paid.", 409);
    if (txn.payout_status === "paid_out") throw new AppError("Already paid out.", 409);
    if (txn.payout_status === "disputed") throw new AppError("Transaction is under dispute.", 409);

    const teacher = txn.teacher;
    if (!teacher.payout_phone) {
      throw new AppError("Tutor has not set up a Telebirr payout number.", 422);
    }

    const amount    = Number(txn.teacher_earnings);
    const reference = `PAYOUT-${transactionId}-${Date.now()}`;

    const transferPayload = {
      account_name:   teacher.user_id.toString(),
      account_number: teacher.payout_phone,
      amount,
      currency:       "ETB",
      reference,
    };

    const payoutRef = await chapaTransfer(transferPayload);

    await prisma.transaction.update({
      where: { transaction_id: transactionId },
      data: {
        payout_status: "paid_out",
        payout_ref:    payoutRef,
        payout_at:     new Date(),
      },
    });

    return { message: "Payout sent successfully.", payoutRef, amount };
  },

  /** Admin: flag a transaction as disputed (freezes payout) */
  async disputeTransaction(transactionId: number, tenantId: number) {
    const txn = await prisma.transaction.findFirst({
      where: { transaction_id: transactionId, tenant_id: tenantId },
    });
    if (!txn) throw new AppError("Transaction not found.", 404);
    if (!["eligible", "pending"].includes(txn.payout_status)) {
      throw new AppError("Can only dispute eligible or pending payouts.", 409);
    }
    return prisma.transaction.update({
      where: { transaction_id: transactionId },
      data:  { payout_status: "disputed" },
    });
  },

  /** Admin: resolve dispute in tutor's favour → release payout */
  async resolveDisputeForTutor(transactionId: number, tenantId: number) {
    const txn = await prisma.transaction.findFirst({
      where: { transaction_id: transactionId, tenant_id: tenantId },
    });
    if (!txn) throw new AppError("Transaction not found.", 404);
    if (txn.payout_status !== "disputed") throw new AppError("Transaction is not disputed.", 409);

    await prisma.transaction.update({
      where: { transaction_id: transactionId },
      data:  { payout_status: "eligible" },
    });

    return this.releasePayout(transactionId, tenantId);
  },

  /** Admin: resolve dispute in student's favour → refund */
  async resolveDisputeForStudent(transactionId: number, tenantId: number) {
    const txn = await prisma.transaction.findFirst({
      where: { transaction_id: transactionId, tenant_id: tenantId },
    });
    if (!txn) throw new AppError("Transaction not found.", 404);
    if (txn.payout_status !== "disputed") throw new AppError("Transaction is not disputed.", 409);

    return prisma.$transaction([
      prisma.transaction.update({
        where: { transaction_id: transactionId },
        data:  { payout_status: "refunded", payment_status: "refunded" },
      }),
      prisma.booking.update({
        where: { booking_id: txn.booking_id },
        data:  { status: "cancelled" },
      }),
    ]);
  },

  /** Get all eligible payouts (session done, 24h passed, not yet paid out) */
  getEligiblePayouts: (tenantId: number) =>
    prisma.transaction.findMany({
      where: {
        tenant_id:      tenantId,
        payment_status: "paid",
        payout_status:  "eligible",
        eligible_at:    { lte: new Date() },
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        booking: { include: { slot: { include: { subject: true } } } },
      },
    }),
};
