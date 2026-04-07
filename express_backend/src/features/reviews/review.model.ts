// review.model.ts — Types and Zod schemas for the reviews feature
import { z } from "zod";

export const CreateReviewSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  teacherId: z.coerce.number().int().positive(),
  rating:    z.coerce.number().int().min(1).max(5),
  comment:   z.string().max(1000).optional().default(""),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

export interface ReviewRow {
  review_id:  number;
  rating:     number;
  comment:    string;
  created_at: Date;
  student:    { user: { name: string } };
}
