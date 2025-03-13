import { Metadata } from "next";
import Link from "next/link";
import { UserAuthForm } from "@/components/auth/user-auth-form";
import { Logo } from "@/components/layout/logo";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login - OpenStud",
  description: "Login to your account",
};

function AuthFormSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="h-10 bg-muted rounded animate-pulse"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="flex flex-col space-y-2 text-center mb-8">
        <Logo />
      </div>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            You're just one step behind!
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>
        <Suspense fallback={<AuthFormSkeleton />}>
          <UserAuthForm />
        </Suspense>
        <p className="px-8 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <Link
            href="/legal/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy-policy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
