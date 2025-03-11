import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
// import { auth } from "@/lib/auth";

// export default async (req: NextRequest) => ({
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  const isLoggedIn = !!token;

  // const session = await auth();
  // const isLoggedIn = !!session;

  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard");

  // Handle authentication redirects
  if (!isLoggedIn && isDashboardPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Apply security headers
  const headers = new Headers(req.headers);
  headers.set("X-DNS-Prefetch-Control", "on");
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:;"
  );
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  const response = NextResponse.next({
    request: {
      headers,
    },
  });

  return response;
}

// Protect dashboard and auth routes while applying security headers to all routes
export const config = {
  matcher: [
    // Auth and dashboard routes that need protection
    "/dashboard/:path*",
    "/login",
    // All routes for security headers
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
