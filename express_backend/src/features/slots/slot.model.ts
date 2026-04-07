// slot.model.ts — Types and Zod schemas for the slots feature
import { z } from "zod";

export const CreateSlotSchema = z.object({
  subject_id:   z.coerce.number().int().positive(),
  slot_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  start_time:   z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:mm"),
  end_time:     z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:mm"),
  grade_from:   z.coerce.number().int().min(1).max(12).default(1),
  grade_to:     z.coerce.number().int().min(1).max(12).default(12),
  max_students: z.coerce.number().int().min(1).max(10).default(5),
});

export type CreateSlotInput = z.infer<typeof CreateSlotSchema>;
export type SlotStatus      = "available" | "full" | "completed" | "cancelled";
