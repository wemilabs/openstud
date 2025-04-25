import type { UserRole } from "@prisma/client";
import type { DefaultSession, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      role?: UserRole;
    } & DefaultSession["user"];
    onboardingCompleted?: boolean;
  }
}

// Extend the built-in JWT type
declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    onboardingCompleted?: boolean;
  }
}
