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
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name ?? "";
        session.user.email = token.email ?? "";
        session.user.image = token.picture ?? "";
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        const existingUser = await prisma.user.findUnique({
          where: { email: token.email! },
        });

        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: token.email!,
              name: token.name ?? null,
              image: token.picture ?? null,
            },
          });
          token.id = newUser.id;
        } else {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: token.name ?? existingUser.name,
              image: token.picture ?? existingUser.image,
            },
          });
          token.id = existingUser.id;
        }
      }
      return token;
    },
  },
});
