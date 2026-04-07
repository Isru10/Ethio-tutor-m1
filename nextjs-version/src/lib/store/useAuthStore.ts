import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Types ───────────────────────────────────────────────────
export type UserRole = "STUDENT" | "TUTOR" | "ADMIN" | "MODERATOR" | "SUPER_ADMIN";
export type UserTier = "BASIC" | "PRO" | "PREMIUM";
export type UserPlan = "basic" | "pro";

export interface AuthUser {
  user_id: number;
  tenant_id: number;
  name: string;
  email: string;
  role: UserRole;
  tier: UserTier;
  /** Derived from tier: BASIC→"basic", PRO/PREMIUM→"pro" */
  plan: UserPlan;
  phone?: string;
  status: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (rawUser: Record<string, any>, accessToken: string, refreshToken: string) => void;
  logout: () => void;

  // Computed helpers (used by sidebars)
  isStudent: () => boolean;
  isTutor:   () => boolean;
  isAdmin:   () => boolean;
  isPro:     () => boolean;
}

function tierToPlan(tier: string): UserPlan {
  return tier === "BASIC" ? "basic" : "pro";
}

/** Set a cookie that survives browser restarts (7 days) */
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (rawUser, accessToken, refreshToken) => {
        const user: AuthUser = {
          user_id:   rawUser.user_id,
          tenant_id: rawUser.tenant_id,
          name:      rawUser.name,
          email:     rawUser.email,
          role:      rawUser.role,
          tier:      rawUser.tier ?? "BASIC",
          plan:      tierToPlan(rawUser.tier ?? "BASIC"),
          phone:     rawUser.phone,
          status:    rawUser.status ?? "active",
        };
        // Persist token in cookie for middleware/SSR access
        setCookie("ethiotutor_token", accessToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        deleteCookie("ethiotutor_token");
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      isStudent: () => get().user?.role === "STUDENT",
      isTutor:   () => get().user?.role === "TUTOR",
      isAdmin:   () => ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(get().user?.role ?? ""),
      isPro:     () => get().user?.plan === "pro",
    }),
    {
      name: "ethiotutor-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user:            s.user,
        accessToken:     s.accessToken,
        refreshToken:    s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
