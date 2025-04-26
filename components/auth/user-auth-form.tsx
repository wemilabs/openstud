"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GoogleIcon, Icons } from "@/components/icons";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export function UserAuthForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  async function loginWithGoogle() {
    setIsLoading(true);
    try {
      await signIn("google", {
        callbackUrl: callbackUrl || "/dashboard",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 px-8 md:px-0">
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
