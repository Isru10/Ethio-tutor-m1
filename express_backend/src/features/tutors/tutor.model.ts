// tutor.model.ts — Types and Zod schemas for the tutors feature
import { z } from "zod";

export const UpdateTutorProfileSchema = z.object({
  bio:              z.string().max(1000).optional(),
  qualifications:   z.string().max(500).optional(),
  experience_years: z.coerce.number().int().min(0).max(50).optional(),
  hourly_rate:      z.coerce.number().min(0).optional(),
  languages:        z.string().optional(),
  // Payout info
  payout_method:    z.enum(["telebirr", "bank"]).optional(),
  payout_phone:     z.string().max(20).optional(),
  payout_bank:      z.string().max(100).optional(),
  payout_account:   z.string().max(50).optional(),
});

export type UpdateTutorInput = z.infer<typeof UpdateTutorProfileSchema>;

export interface TutorListItem {
  teacher_profile_id: number;
  user_id:            number;
  average_rating:     number;
  hourly_rate:        number;
  experience_years:   number;
  user: { name: string; email: string; status: string };
}
