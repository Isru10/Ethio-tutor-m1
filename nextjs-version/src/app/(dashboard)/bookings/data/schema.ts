import { z } from "zod"

export const bookingSchema = z.object({
  booking_id:    z.number(),
  subject:       z.string(),
  teacher_name:  z.string(),
  date:          z.string(), // "YYYY-MM-DD"
  time:          z.string(), // "HH:MM AM – HH:MM AM"
  grade:         z.string(),
  amount:        z.number(),
  status:        z.enum(["confirmed", "pending", "completed", "cancelled"]),
  created_at:    z.string(),
})

export type BookingRow = z.infer<typeof bookingSchema>
