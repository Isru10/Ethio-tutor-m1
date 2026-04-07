import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV:           z.enum(["development", "production", "test"]).default("development"),
  PORT:               z.coerce.number().default(5000),
  DATABASE_URL:       z.string().min(1),
  JWT_SECRET:         z.string().min(32),
  JWT_EXPIRES_IN:     z.string().default("7d"),
  REFRESH_SECRET:     z.string().min(32),
  REFRESH_EXPIRES_IN: z.string().default("30d"),
  ALLOWED_ORIGINS:    z.string().optional(),
  FRONTEND_URL:       z.string().optional(),
  BACKEND_URL:        z.string().optional(),
  CHAPA_SECRET_KEY:   z.string().optional(),
  CHAPA_PUBLIC_KEY:   z.string().optional(),
  CHAPA_WEBHOOK_SECRET: z.string().optional(),
  CHAPA_BASE_URL:     z.string().default("https://api.chapa.co/v1"),
  LIVEKIT_API_KEY:    z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  LIVEKIT_URL:        z.string().optional(),
  AWS_BUCKET_NAME:    z.string().optional(),
  AWS_REGION:         z.string().default("us-east-1"),
  AWS_ACCESS_KEY:     z.string().optional(),
  AWS_SECRET_KEY:     z.string().optional(),
  PLATFORM_FEE_RATE:  z.coerce.number().default(0.15),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌  Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
