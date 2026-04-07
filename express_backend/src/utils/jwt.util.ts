import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.config";

export interface JwtPayload {
  userId:   number;
  tenantId: number;
  role:     string;
  tier:     string;
}

export const signAccessToken  = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as SignOptions);

export const signRefreshToken = (userId: number) =>
  jwt.sign({ userId }, env.REFRESH_SECRET, { expiresIn: env.REFRESH_EXPIRES_IN } as SignOptions);

export const verifyAccessToken = (token: string): JwtPayload => {
  try { return jwt.verify(token, env.JWT_SECRET) as JwtPayload; }
  catch { throw new Error("INVALID_TOKEN"); }
};

export const verifyRefreshToken = (token: string): { userId: number } => {
  try { return jwt.verify(token, env.REFRESH_SECRET) as { userId: number }; }
  catch { throw new Error("INVALID_REFRESH_TOKEN"); }
};
