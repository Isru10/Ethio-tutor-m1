// booking.model.ts — Types and Zod schemas for the bookings feature
import { z } from "zod";

export const CreateBookingSchema = z.object({
  slotId:       z.coerce.number().int().positive(),
  studentGrade: z.coerce.number().int().min(1).max(12).optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface BookingRow {
  booking_id:    number;
  status:        BookingStatus;
  created_at:    Date;
  slot: {
    slot_date: Date;
    start_time: Date;
    end_time:   Date;
    subject:    { name: string };
    teacher:    { user: { name: string } };
  };
  transaction: { total_amount: number; payment_status: string } | null;
}
