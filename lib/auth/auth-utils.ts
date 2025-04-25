import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function getCurrentUserRole() {
  const user = await getCurrentUser();
  return user?.role;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getUserPlan() {
  const user = await getCurrentUser();
  if (!user?.email) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { plan: true },
  });

  return dbUser?.plan ?? "FREE";
}
