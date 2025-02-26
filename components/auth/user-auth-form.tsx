"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GoogleIcon, Icons } from "../icons";

export function UserAuthForm() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  async function loginWithGoogle() {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={loginWithGoogle}
        className="w-full"
      >
        {isLoading ? (
          <Icons.spinner className="mr-2 size-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 size-4" />
        )}{" "}
        Continue with Google
      </Button>
    </div>
  );
}
