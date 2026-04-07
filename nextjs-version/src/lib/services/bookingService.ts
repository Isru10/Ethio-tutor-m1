import { useAuthStore } from "../store/useAuthStore";
import { API_BASE } from "../api";

const API_URL = API_BASE;

function getAuthHeaders() {
  const { accessToken } = useAuthStore.getState();
  return { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" };
}

export const bookingService = {
  /** Student: get my own bookings */
  async getMyBookings() {
    const res = await fetch(`${API_URL}/bookings`, { headers: getAuthHeaders() });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result.data;
  },

  /** Tutor: get all bookings on my slots */
  async getTutorBookings() {
    const res = await fetch(`${API_URL}/bookings/tutor`, { headers: getAuthHeaders() });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result.data;
  },

  async createBooking(slotId: number) {
    const res = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ slotId }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result.data;
  },

  async confirmBooking(bookingId: number) {
    const res = await fetch(`${API_URL}/bookings/${bookingId}/confirm`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result.data;
  },

  async cancelBooking(bookingId: number) {
    const res = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result.data;
  },
};

