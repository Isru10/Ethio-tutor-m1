import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// ─── Role → home route mapping ────────────────────────────────
const ROLE_HOME: Record<string, string> = {
  STUDENT:     "/dashboard",
  TUTOR:       "/tutor/tutor-dashboard",
  ADMIN:       "/admin/admin-dashboard",
  SUPER_ADMIN: "/admin/admin-dashboard",
  MODERATOR:   "/admin/admin-dashboard",
}

// ─── Route prefix → allowed roles ────────────────────────────
// Any route starting with these prefixes is restricted to the listed roles only.
const ROLE_RESTRICTED_PREFIXES: { prefix: string; roles: string[] }[] = [
  // Student-only area
  { prefix: "/dashboard",    roles: ["STUDENT"] },
  { prefix: "/browse",       roles: ["STUDENT"] },
  { prefix: "/bookings",     roles: ["STUDENT"] },
  { prefix: "/transactions", roles: ["STUDENT"] },
  { prefix: "/recordings",   roles: ["STUDENT"] },
  { prefix: "/review",       roles: ["STUDENT"] },
  { prefix: "/student-dashboard", roles: ["STUDENT"] },
  { prefix: "/tutors",       roles: ["STUDENT"] },
  { prefix: "/chat",         roles: ["STUDENT"] },

  // Tutor-only area
  { prefix: "/tutor",        roles: ["TUTOR"] },
  { prefix: "/onboarding",   roles: ["TUTOR"] },

  // Admin-only area
  { prefix: "/admin",        roles: ["ADMIN", "SUPER_ADMIN", "MODERATOR"] },

  // Shared — any authenticated user (session room)
  // /room is accessible to both STUDENT and TUTOR
  { prefix: "/room",         roles: ["STUDENT", "TUTOR", "ADMIN", "SUPER_ADMIN", "MODERATOR"] },
  // /review is the post-session rating page — students only
  { prefix: "/review",       roles: ["STUDENT"] },

  // Shared pages accessible to both students and tutors
  { prefix: "/notifications", roles: ["STUDENT", "TUTOR", "ADMIN", "SUPER_ADMIN", "MODERATOR"] },
  { prefix: "/profile",       roles: ["STUDENT", "TUTOR", "ADMIN", "SUPER_ADMIN", "MODERATOR"] },
  { prefix: "/settings",      roles: ["STUDENT", "TUTOR", "ADMIN", "SUPER_ADMIN", "MODERATOR"] },
  { prefix: "/sessions",      roles: ["STUDENT", "TUTOR"] },
]

// Routes only for unauthenticated users
const AUTH_ROUTES = ["/sign-in", "/sign-up", "/sign-in-2", "/sign-up-2", "/sign-in-3", "/sign-up-3"]

/**
 * Decode JWT payload without verifying signature.
 * Safe for routing decisions — the backend still verifies the signature on every API call.
 * We only need the role claim here to decide where to redirect.
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    // Base64url → base64 → decode
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded  = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=")
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("ethiotutor_token")?.value

  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p))

  // ── Unauthenticated user trying to access a protected route ──
  if (!token) {
    // Check if this path is under any restricted prefix
    const isRestricted = ROLE_RESTRICTED_PREFIXES.some(({ prefix }) => pathname.startsWith(prefix))
    if (isRestricted) {
      const url = request.nextUrl.clone()
      url.pathname = "/sign-in"
      url.searchParams.set("from", pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── Authenticated user ────────────────────────────────────────
  const payload = decodeJwtPayload(token)
  const role: string = payload?.role ?? ""

  // Already logged in → trying to access auth pages → redirect to their home
  if (isAuthRoute) {
    const home = ROLE_HOME[role] ?? "/dashboard"
    return NextResponse.redirect(new URL(home, request.url))
  }

  // Find which restricted prefix this path falls under
  const match = ROLE_RESTRICTED_PREFIXES.find(({ prefix }) => pathname.startsWith(prefix))

  if (match) {
    const allowed = match.roles.includes(role)
    if (!allowed) {
      // Redirect to the user's correct home — no 403 page, just silent redirect
      const home = ROLE_HOME[role] ?? "/sign-in"
      return NextResponse.redirect(new URL(home, request.url))
    }
  }

  // ── Pending tutor trying to access tutor dashboard ────────────
  // Tutors with status !== "active" must stay in /onboarding
  if (role === "TUTOR" && pathname.startsWith("/tutor") && !pathname.startsWith("/onboarding")) {
    const status: string = payload?.status ?? ""
    if (status !== "active") {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, static files, and the landing page
    "/((?!api|_next/static|_next/image|favicon.ico|landing).*)",
  ],
}
