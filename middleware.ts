import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@auth/core/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  const isLoggedIn = !!token;
  const userRole = token?.role as string | undefined;
  const onboardingCompleted = token?.onboardingCompleted as boolean | undefined;
  const { pathname } = req.nextUrl;

  console.log(
    `[Middleware] Path: ${pathname}, LoggedIn: ${isLoggedIn}, Role: ${userRole}, OnboardingCompleted: ${onboardingCompleted}`
  );

  const isAuthPage = pathname.startsWith("/login");
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isOnboardingPage = pathname === "/login/onboarding";

  // --- Redirect Logic --- //

  // 1. Not logged in, trying to access protected routes (dashboard)
  if (!isLoggedIn && isDashboardPage) {
    console.log("[Middleware] Redirecting: Not logged in -> /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2. Logged in, but onboarding not complete, trying to access dashboard
  if (isLoggedIn && !onboardingCompleted && isDashboardPage) {
    console.log(
      "[Middleware] Redirecting: Logged in, onboarding incomplete -> /login/onboarding"
    );
    return NextResponse.redirect(new URL("/login/onboarding", req.url));
  }

  // 3. Logged in, onboarding complete, trying to access onboarding page
  if (isLoggedIn && onboardingCompleted && isOnboardingPage) {
    console.log(
      "[Middleware] Redirecting: Logged in, onboarding complete, accessing onboarding -> /dashboard"
    );
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4. Logged in, trying to access general auth pages (like /login) after login
  //    If onboarding is done, redirect to dashboard.
  //    If onboarding is NOT done, redirect TO onboarding.
  if (isLoggedIn && isAuthPage && !isOnboardingPage) {
    if (onboardingCompleted) {
      console.log(
        "[Middleware] Redirecting: Logged in, onboarding complete, accessing auth page -> /dashboard"
      );
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      console.log(
        "[Middleware] Redirecting: Logged in, onboarding incomplete, accessing auth page -> /login/onboarding"
      );
      return NextResponse.redirect(new URL("/login/onboarding", req.url));
    }
  }

  // --- Allow access if none of the above conditions met ---
  console.log("[Middleware] Allowing access.");
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/login/onboarding"],
};
