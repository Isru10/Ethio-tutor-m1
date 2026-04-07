/**
 * Re-exports the unified auth store.
 * All sidebar/component imports of "@/store/authStore" continue to work.
 */
export { useAuthStore } from "@/lib/store/useAuthStore";
export type { AuthUser, UserRole, UserPlan } from "@/lib/store/useAuthStore";

// MOCK_USERS kept only for the dev persona switcher in NavUser.
// In production these are never used for real auth.
export const MOCK_USERS = {} as Record<string, never>;
