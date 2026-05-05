import { useAuthStore } from "../store/useAuthStore";
import { API_BASE } from "../api";

const API_URL = API_BASE;

export type CreateSlotPayload = {
  subject_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  grade_from: number;
  grade_to: number;
  max_students: number;
  description?: string;
};

function getAuthHeaders() {
  const { accessToken } = useAuthStore.getState();
  return {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export const slotService = {
  async getSubjects() {
    const res = await fetch(`${API_URL}/academic/subjects`, { headers: getAuthHeaders() });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result.data as Array<{ subject_id: number; name: string }>;
  },

  async getMySlots() {
    const res = await fetch(`${API_URL}/slots/my`, { headers: getAuthHeaders() });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result.data;
  },

  async createSlot(payload: CreateSlotPayload) {
    const res = await fetch(`${API_URL}/slots`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || JSON.stringify(result));
    return result.data;
  },

  async deleteSlot(slotId: number) {
    const res = await fetch(`${API_URL}/slots/${slotId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result.data;
  },

  async updateSlot(slotId: number, payload: {
    slot_date?: string;
    start_time?: string;
    end_time?: string;
    description?: string;
  }) {
    const res = await fetch(`${API_URL}/slots/${slotId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result.data;
  },

  async getMyAvailability(): Promise<{
    available_days: string[];
    available_times: string[];
    default_max_students: number;
    hourly_rate: number;
    existing_slots: { slot_date: string; start_time: string; end_time: string }[];
  }> {
    const res = await fetch(`${API_URL}/tutors/my-availability`, { headers: getAuthHeaders() });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result.data;
  },
};
