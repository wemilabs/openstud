import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.NEXTAUTH_CLIENT_ID!,
      clientSecret: process.env.NEXTAUTH_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.sub ?? "";
        session.user.name = token.name ?? "";
        session.user.email = token.email ?? "";
        session.user.image = token.picture ?? "";
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (account && user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        
        // First time sign in
        await prisma.user.upsert({
          where: { email: token.email! },
          create: {
            email: token.email!,
            name: token.name ?? null,
            image: token.picture ?? null,
          },
          update: {
            name: token.name ?? null,
            image: token.picture ?? null,
          },
        });
      }
      return token;
    },
  },
});
