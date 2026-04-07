/**
 * session.model.ts
 * Zod validation schemas and TypeScript types for the sessions feature.
 */
import { z } from "zod";

// ── Request schemas ───────────────────────────────────────────
export const StartSessionSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
});

export const JoinSessionSchema = z.object({
  // Passed as route param, not body
});

// ── Response types ────────────────────────────────────────────
export interface StartSessionResponse {
  sessionId:   number;
  roomName:    string;
  liveKitUrl:  string;
  token:       string;           // JWT for tutor to connect to LiveKit
  meetingLink: string;           // Share-able link for the frontend
}

export interface JoinSessionResponse {
  sessionId:   number;
  roomName:    string;
  liveKitUrl:  string;
  token:       string;           // JWT for student to connect to LiveKit
}

// ── Whiteboard event types (used on the frontend, documented here) ─
// These are the JSON payloads sent via LiveKit DataChannel.
// Backend does NOT process these — they flow P2P through LiveKit.
//
// DRAW event: { type: "draw", x: number, y: number, prevX: number, prevY: number,
//               color: string, width: number, tool: "pen"|"eraser" }
// CLEAR event: { type: "clear" }
// SYNC  event: { type: "sync", strokes: Stroke[] }   // sent on new participant join
