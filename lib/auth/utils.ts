import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { cache } from "react";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function getCurrentUserRole() {
  const user = await getCurrentUser();
  return user?.role;
}

export const requireAuth = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

export async function getUserPlan() {
  const user = await getCurrentUser();
  if (!user?.email) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { plan: true },
    cacheStrategy: { ttl: 60 },
  });

  return dbUser?.plan ?? "FREE";
}
