import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/browse", "/bookings", "/sessions", "/transactions", "/notifications", "/profile", "/recordings", "/tutor/"]

// Routes only for unauthenticated users
const AUTH_ROUTES = ["/sign-in", "/sign-up", "/sign-in-2", "/sign-up-2"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("ethiotutor_token")?.value

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p))

  // Not logged in → trying to access protected page → redirect to sign-in
  if (isProtected && !token) {
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  // Already logged in → trying to access auth pages → redirect to dashboard
  // (We can't know the role from middleware without decoding JWT, so just go to /dashboard;
  //  the dashboard layout will handle tutor redirect if needed)
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|landing).*)"],
}
