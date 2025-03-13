"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  validateInvitationToken,
  acceptWorkspaceInvitation,
} from "@/actions/workspace-invitations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export function InvitationClient({ token }: { token: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [validatedInvitation, setValidatedInvitation] = useState(false);

  // Check if we're returning from login
  const fromLogin = searchParams.get("fromLogin") === "true";

  // Handle the authentication flow
  useEffect(() => {
    // If user is not authenticated, redirect to login page
    if (status === "unauthenticated") {
      // Encode the callback URL for the login page to redirect back to this invitation
      const callbackUrl = encodeURIComponent(
        `/workspaces/invite/${token}?fromLogin=true`
      );
      router.push(`/api/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }

    // If authenticated, validate the token
    if (status === "authenticated") {
      const validateToken = async () => {
        setIsLoading(true);
        try {
          const result = await validateInvitationToken(token);
          if (result.error) {
            setError(result.error);
          } else if (result.data) {
            setInvitation(result.data);
          }
        } catch (err) {
          setError("An unexpected error occurred");
          console.error(err);
        } finally {
          setIsLoading(false);
          setValidatedInvitation(true);
        }
      };

      validateToken();
    }
  }, [status, token, router, fromLogin]);

  // Handle accepting the invitation
  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await acceptWorkspaceInvitation(token);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`You've been added to ${result.teamName}`);
        // Redirect to the workspace
        router.push(`/dashboard?workspace=${result.teamId}`);
      }
    } catch (err) {
      toast.error("Failed to accept invitation");
      console.error(err);
    } finally {
      setIsAccepting(false);
    }
  };

  // If still checking authentication status or still loading invitation data, show loading
  if (
    status === "loading" ||
    (status === "authenticated" && !validatedInvitation)
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Workspace Invitation</CardTitle>
            <CardDescription>Checking authentication...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Only show the acceptance UI when we have validated invitation data
  if (invitation && !isLoading && validatedInvitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="mt-4">Join Workspace</CardTitle>
            <CardDescription>
              You've been invited to join{" "}
              <span className="font-medium">{invitation?.team?.name}</span> as a{" "}
              {invitation?.invitation?.role.charAt(0) +
                invitation?.invitation?.role.slice(1).toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Decline
            </Button>
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  Accept Invitation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Fallback loader - this should only appear briefly during transitions
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Workspace Invitation</CardTitle>
          <CardDescription>Loading invitation details...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}
