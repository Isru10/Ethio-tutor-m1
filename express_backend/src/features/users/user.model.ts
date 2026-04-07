// user.model.ts — Types and Zod schemas for the users feature
import { z } from "zod";

export const UpdateUserSchema = z.object({
  name:  z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// Shape returned by the API for a safe (no-password) user record
export interface SafeUser {
  user_id:    number;
  name:       string;
  email:      string;
  role:       string;
  tier:       string;
  status:     string;
  phone?:     string | null;
  created_at: Date;
}
