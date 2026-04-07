// transaction.model.ts — Types and Zod schemas for the transactions feature
import { z } from "zod";

export const InitiatePaymentSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  amount:    z.coerce.number().positive(),
});

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>;
export type PaymentStatus        = "pending" | "paid" | "refunded" | "failed";

export interface TransactionRow {
  transaction_id:      number;
  total_amount:        number;
  platform_commission: number;
  teacher_earnings:    number;
  payment_status:      PaymentStatus;
  created_at:          Date;
  booking: {
    slot: { subject: { name: string }; slot_date: Date };
  };
}
