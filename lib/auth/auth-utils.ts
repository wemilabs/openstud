import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Get the current authenticated user's session
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

/**
 * Require authentication for a route
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Get user's subscription plan
 */
export async function getUserPlan() {
  const user = await getCurrentUser();
  if (!user?.email) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { plan: true },
  });

  return dbUser?.plan ?? "FREE";
}

/**
 * Check if user is on team plan
 */
export async function isTeamPlan() {
  const plan = await getUserPlan();
  return plan === "TEAM";
}

/**
 * Check if user is on pro plan or higher
 */
export async function isProOrHigher() {
  const plan = await getUserPlan();
  return plan === "PRO" || plan === "TEAM";
}
