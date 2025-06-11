import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET!,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_CLIENT_ID!,
      clientSecret: process.env.AUTH_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      console.log("[Auth JWT Callback] Trigger:", trigger);

      if (account && user) {
        console.log(
          "[Auth JWT Callback] Initial sign-in/link account detected."
        );
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        const initialUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { role: true, onboardingCompleted: true },
        });
        token.role = initialUser?.role ?? undefined;
        token.onboardingCompleted = initialUser?.onboardingCompleted ?? false;
        console.log("[Auth JWT Callback] Initial data fetched:", {
          role: token.role,
          onboardingCompleted: token.onboardingCompleted,
        });
      }

      // Re-fetch if role or onboarding status is missing (e.g., after DB update)
      if (
        token.id &&
        (typeof token.role === "undefined" ||
          typeof token.onboardingCompleted === "undefined")
      ) {
        console.log(
          "[Auth JWT Callback] Token might be missing data. Fetching..."
        );
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, onboardingCompleted: true },
        });
        if (dbUser) {
          token.role = dbUser.role ?? undefined;
          token.onboardingCompleted = dbUser.onboardingCompleted ?? false;
          console.log("[Auth JWT Callback] Fetched latest data:", {
            role: token.role,
            onboardingCompleted: token.onboardingCompleted,
          });
        } else {
          console.log(
            "[Auth JWT Callback] User not found in DB for token ID:",
            token.id
          );
        }
      }

      // Handle explicit session updates (e.g., from useSession().update())
      if (trigger === "update" && session) {
        console.log(
          "[Auth JWT Callback] Update trigger detected. Updating token from session:",
          session
        );
        if (session.user?.role) {
          token.role = session.user.role;
        }
        // Assuming onboardingCompleted would be set in the update call if needed
        if (typeof session.onboardingCompleted === "boolean") {
          token.onboardingCompleted = session.onboardingCompleted;
        }
      }

      console.log("[Auth JWT Callback] Returning token:", {
        id: token.id,
        email: token.email,
        role: token.role,
        onboardingCompleted: token.onboardingCompleted,
      });
      return token;
    },

    async session({ token, session }) {
      console.log("[Auth Session Callback] Token received:", {
        id: token.id,
        email: token.email,
        role: token.role,
        onboardingCompleted: token.onboardingCompleted,
      });
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        // Add onboardingCompleted to the session object available client-side
        (session as any).onboardingCompleted = token.onboardingCompleted;
      }
      console.log("[Auth Session Callback] Returning session:", session);
      return session;
    },
  },
});
