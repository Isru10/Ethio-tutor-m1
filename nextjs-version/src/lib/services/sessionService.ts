import { useAuthStore } from "../store/useAuthStore";
import { API_BASE } from "../api";

const API = API_BASE;
function authHeaders() {
  const token = useAuthStore.getState().accessToken;
  return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function joinSessionApi(sessionId: string, customToken?: string) {
  const token = customToken || useAuthStore.getState().accessToken;
  
  const res = await fetch(`${API}/sessions/${sessionId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    }
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || "Failed to join session");
  }

  const result = await res.json();
  return result.data; // { sessionId, roomName, liveKitUrl, token }
}

export async function startSessionApi(bookingId: number, customToken?: string) {
  const token = customToken || useAuthStore.getState().accessToken;

  const res = await fetch(`${API}/sessions/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ bookingId })
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || "Failed to start session");
  }

  const result = await res.json();
  return result.data; // { sessionId, roomName, liveKitUrl, token, meetingLink }
}

/** Tutor: get all own sessions from backend */
export async function getTutorSessionsApi() {
  const res = await fetch(`${API}/sessions/my`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to fetch sessions");
  }
  const result = await res.json();
  return result.data as TutorSession[];
}

/** Shape returned by GET /sessions/my */
export type TutorSession = {
  session_id: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  start_time: string;
  end_time: string | null;
  room_name: string | null;
  meeting_link: string | null;
  slot: {
    slot_date: string;
    start_time: string;
    end_time: string;
    subject: { name: string };
    bookings: { student: { user: { name: string } } }[];
  };
};
