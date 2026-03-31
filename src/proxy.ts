import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  const isPublicRoute = pathname.startsWith("/pricing");

  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isStripeWebhook = pathname.startsWith("/api/stripe/webhook");

  // Always allow API auth routes, public routes, and Stripe webhooks
  if (isApiAuthRoute || isPublicRoute || isStripeWebhook) {
    return NextResponse.next();
  }

  // Check for session token (set by NextAuth)
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!token;

  // Redirect logged-in users away from auth pages to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect dashboard and app routes
  const protectedPaths = [
    "/dashboard",
    "/properties",
    "/tenants",
    "/finances",
    "/maintenance",
    "/reports",
    "/settings",
  ];

  if (protectedPaths.some((p) => pathname.startsWith(p)) && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
