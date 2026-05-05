/**
 * useRefreshUser
 *
 * Polls GET /auth/me every 30 seconds to sync user state from the DB.
 *
 * Critical case: when an admin approves a tutor, the tutor's JWT cookie
 * still has status="pending_verification". This hook detects the change,
 * fetches a fresh token from GET /auth/fresh-token, updates the cookie,
 * and then redirects the tutor to their dashboard automatically.
 *
 * Used in all layout files so it runs on every page.
 */
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { API_BASE } from "@/lib/api";

const POLL_INTERVAL_MS = 15_000; // 15 seconds — faster detection of approval

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function useRefreshUser() {
  const { isAuthenticated, updateUser, accessToken } = useAuthStore();
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const fresh = data.data;
      if (!fresh) return;

      const currentUser = useAuthStore.getState().user;
      const statusChanged = currentUser?.status !== fresh.status;
      const roleChanged   = currentUser?.role   !== fresh.role;

      // Update the Zustand store with latest values
      updateUser({
        status: fresh.status,
        role:   fresh.role,
        tier:   fresh.tier,
        name:   fresh.name,
        phone:  fresh.phone,
      });

      // If status or role changed, we MUST get a fresh JWT so the middleware
      // cookie reflects the new state — otherwise the middleware keeps
      // redirecting based on the stale token
      if (statusChanged || roleChanged) {
        try {
          const tokenRes = await fetch(`${API_BASE}/auth/fresh-token`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            const newToken: string = tokenData.data?.accessToken;
            if (newToken) {
              // Update the cookie the middleware reads
              setCookie("ethiotutor_token", newToken);
              // Update the Zustand store so all API calls use the new token
              useAuthStore.setState({ accessToken: newToken });
            }
          }
        } catch { /* non-fatal — redirect will still work via store */ }

        // Now redirect based on the fresh state
        const newStatus = fresh.status;
        const newRole   = fresh.role;

        if (newRole === "TUTOR" && newStatus === "active") {
          router.replace("/tutor/tutor-dashboard");
        } else if (newRole === "TUTOR" && newStatus !== "active") {
          router.replace("/onboarding");
        } else if (["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(newRole)) {
          router.replace("/admin/admin-dashboard");
        } else if (newRole === "STUDENT") {
          router.replace("/dashboard");
        }
      }
    } catch {
      // Network error — silently ignore
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch immediately on mount
    refresh();

    // Poll every 15 seconds
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);

    // Also refresh when tab becomes visible (user switches back)
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
