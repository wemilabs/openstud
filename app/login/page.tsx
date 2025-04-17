import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UserAuthForm } from "@/components/auth/user-auth-form";
import { BackButton } from "@/components/layout/back-button";

export const metadata: Metadata = {
  title: "Login - OpenStud",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4">
        <BackButton
          variant="ghost"
          text="Back to Home"
          className="font-semibold"
        />
      </div>
      <div className="mx-auto flex flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            You're just one step behind!
          </h1>
          <p className="text-sm text-muted-foreground">Sign in below</p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <UserAuthForm />
        </Suspense>

        <p className="sm:px-0 px-8 text-center text-sm text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link
            href="/legal/terms-of-service"
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
