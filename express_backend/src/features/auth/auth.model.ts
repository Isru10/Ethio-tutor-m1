// auth.model.ts — Types and Zod validation schemas for the auth feature
import { z } from "zod";

export const RegisterSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(6),
  role:     z.enum(["STUDENT", "TUTOR", "ADMIN", "MODERATOR", "SUPER_ADMIN"]).default("STUDENT"),
  tenantId: z.coerce.number().int().positive(),
  phone:    z.string().optional(),

  // Student profile fields
  grade_name:     z.string().optional(),
  learning_goals: z.string().optional(),

  // Tutor profile fields
  bio:              z.string().optional(),
  qualifications:   z.string().optional(),
  experience_years: z.coerce.number().int().min(0).optional(),
  hourly_rate:      z.coerce.number().min(0).optional(),
  languages:        z.string().optional(),
  subjects:         z.array(z.string()).optional(),
  grade_from:       z.coerce.number().int().optional(),
  grade_to:         z.coerce.number().int().optional(),
});

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const RefreshSchema = z.object({
  token: z.string().min(1),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput    = z.infer<typeof LoginSchema>;
