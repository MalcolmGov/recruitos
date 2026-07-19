import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

/**
 * Optimistic auth gate: checks only for the presence of the session cookie
 * (fast, no DB hit). Real session validation happens server-side in
 * requireSession/requireTenant — this just keeps anonymous traffic out of the
 * app shell.
 */
export default function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/:path*",
    "/candidates/:path*",
    "/clients/:path*",
    "/pipeline/:path*",
    "/placements/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/onboarding",
  ],
};
