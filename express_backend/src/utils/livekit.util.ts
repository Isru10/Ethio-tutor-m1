/**
 * livekit.util.ts
 *
 * Wrapper around the LiveKit Server SDK.
 * Used exclusively by the sessions feature.
 *
 * LiveKit free tier: 10,000 minutes/month at cloud.livekit.io
 * Whiteboard: uses LiveKit's built-in DataChannel — zero extra cost.
 */
import {
  RoomServiceClient,
  AccessToken,
  type VideoGrant,
} from "livekit-server-sdk";
import { env } from "../config/env.config";

// ── Singleton Room Service Client ────────────────────────────
// Used to create/delete rooms and list participants server-side
let _roomService: RoomServiceClient | null = null;

function getRoomService(): RoomServiceClient {
  if (!_roomService) {
    if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      throw new Error("LiveKit env vars are not configured.");
    }
    // Convert wss:// to https:// for the REST API client
    const httpUrl = env.LIVEKIT_URL.replace(/^wss?:\/\//, "https://");
    _roomService = new RoomServiceClient(
      httpUrl,
      env.LIVEKIT_API_KEY,
      env.LIVEKIT_API_SECRET
    );
  }
  return _roomService;
}

// ── Generate a unique room name for a session ─────────────────
export function generateRoomName(sessionId: number): string {
  return `et-session-${sessionId}-${Date.now()}`;
}

// ── Create a LiveKit room (called when tutor starts session) ──
export async function createRoom(roomName: string): Promise<void> {
  await getRoomService().createRoom({
    name:                  roomName,
    emptyTimeout:          300,     // auto-close after 5 min if empty
    maxParticipants:       20,
    departureTimeout:      20,
  });
}

// ── Close a LiveKit room (called when tutor ends session) ──────
export async function deleteRoom(roomName: string): Promise<void> {
  try {
    await getRoomService().deleteRoom(roomName);
  } catch {
    // Room may already be closed — not a fatal error
  }
}

// ── Generate an access token for a participant ─────────────────
// canPublish:     true for tutor (can share video/audio)
// canSubscribe:   true for everyone (receive video/audio)
// canPublishData: true for EVERYONE — this is how the whiteboard works:
//                 both parties can broadcast JSON draw events over
//                 LiveKit's data channel at zero extra cost.
export async function generateToken(params: {
  identity:      string;
  name:          string;
  roomName:      string;
  isTeacher:     boolean;
  canPublish?:   boolean;  // override — defaults to isTeacher value
}): Promise<string> {
  if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
    throw new Error("LiveKit credentials not configured.");
  }

  const grant: VideoGrant = {
    roomJoin:       true,
    room:           params.roomName,
    canPublish:     params.canPublish ?? params.isTeacher,
    canSubscribe:   true,
    canPublishData: true,
  };

  const token = new AccessToken(
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
    {
      identity: params.identity,
      name:     params.name,
      ttl:      "4h",                  // token valid for 4 hours
    }
  );
  token.addGrant(grant);
  return await token.toJwt();
}

// ── List active participants in a room (optional, admin use) ──
export async function listParticipants(roomName: string) {
  return getRoomService().listParticipants(roomName);
}
