import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { API_BASE } from "@/lib/api";

export type Permission =
  | "view_dashboard" | "view_users" | "view_tutors" | "verify_tutors"
  | "view_bookings"  | "view_sessions" | "view_transactions"
  | "view_payouts"   | "manage_disputes" | "view_reports";

export function usePermissions() {
  const { user, accessToken } = useAuthStore();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !accessToken) { setLoading(false); return; }
    // Full admins get all permissions without a round-trip
    if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      setPermissions([
        "view_dashboard","view_users","view_tutors","verify_tutors",
        "view_bookings","view_sessions","view_transactions",
        "view_payouts","manage_disputes","view_reports",
      ]);
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/roles/my-permissions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(res => setPermissions(res.data ?? []))
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, [user, accessToken]);

  const can = (p: Permission) => permissions.includes(p);
  return { permissions, loading, can };
}
