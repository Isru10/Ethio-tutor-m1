/**
 * useRefreshUser
 *
 * Fetches the current user's live status from GET /auth/me on mount
 * and every 30 seconds while the tab is active.
 *
 * This solves the stale-status problem: when an admin approves a tutor,
 * the tutor's browser will pick up the new status within 30 seconds
 * without requiring a logout/login.
 *
 * Used in root layouts so it runs on every page.
 */
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { API_BASE } from "@/lib/api";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useRefreshUser() {
  const { accessToken, isAuthenticated, updateUser } = useAuthStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return; // token expired or network error — don't logout, just skip
      const data = await res.json();
      const fresh = data.data;
      if (!fresh) return;
      // Only update fields that can change server-side
      updateUser({
        status: fresh.status,
        role:   fresh.role,
        tier:   fresh.tier,
        name:   fresh.name,
        phone:  fresh.phone,
      });
    } catch {
      // Network error — silently ignore, don't disrupt the user
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch immediately on mount
    refresh();

    // Then poll every 30 seconds
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);

    // Also refresh when the tab becomes visible again (user switches back)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps
}
