import { useAuthStore } from "../store/useAuthStore";
import { API_BASE } from "../api";

const API = API_BASE;

function authHeaders() {
  // Primary: Zustand store (in-memory after hydration)
  let token = useAuthStore.getState().accessToken;

  // Fallback: read directly from cookie (handles SSR/hydration timing)
  if (!token && typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|;\s*)ethiotutor_token=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }

  return { "Authorization": `Bearer ${token ?? ""}`, "Content-Type": "application/json" };
}

export const paymentService = {
  /**
   * Initiate Chapa payment for a booking.
   * Returns { checkout_url, txRef, bookingId }
   */
  async initiate(bookingId: number) {
    const res = await fetch(`${API}/transactions/initiate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ bookingId }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Payment initiation failed");
    return result.data as { checkout_url: string; txRef: string; bookingId: number };
  },

  /**
   * Verify payment after Chapa redirect.
   * Returns { status: "paid" | "failed", bookingId }
   */
  async verify(txRef: string) {
    const res = await fetch(`${API}/transactions/verify?tx_ref=${encodeURIComponent(txRef)}`, {
      headers: authHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Verification failed");
    return result.data as { status: "paid" | "failed"; bookingId: number };
  },
};
